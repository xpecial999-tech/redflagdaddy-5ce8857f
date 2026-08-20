import * as React from 'react'
import { render } from '@react-email/render'
import { TEMPLATES } from '@/lib/email-templates/registry'

const SITE_NAME = 'RedFlagDaddy'
const SENDER_DOMAIN = 'notify.redflagdaddy.com'
const FROM_DOMAIN = 'redflagdaddy.com'

function generateToken(): string {
  const bytes = new Uint8Array(32)
  crypto.getRandomValues(bytes)
  return Array.from(bytes)
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('')
}

function redactEmail(email?: string | null): string {
  if (!email) return '***'
  const [local, domain] = email.split('@')
  if (!local || !domain) return '***'
  return `${local[0]}***@${domain}`
}

/**
 * Server-internal app email sender. Renders a registered template and enqueues
 * it on the shared email queue (retries, rate limiting and logging are handled
 * by the queue processor). Never throws — email failures must not break flows.
 */
export async function sendAppEmail(opts: {
  templateName: string
  to: string
  templateData?: Record<string, unknown>
  idempotencyKey?: string
}): Promise<{ ok: boolean; reason?: string }> {
  try {
    const template = TEMPLATES[opts.templateName]
    if (!template) return { ok: false, reason: 'template_not_found' }

    const recipient = (template.to || opts.to || '').trim()
    if (!recipient) return { ok: false, reason: 'no_recipient' }
    const normalized = recipient.toLowerCase()

    const { supabaseAdmin } = await import('@/integrations/supabase/client.server')
    const messageId = crypto.randomUUID()

    const { data: suppressed, error: suppressionError } = await supabaseAdmin
      .from('suppressed_emails')
      .select('id')
      .eq('email', normalized)
      .maybeSingle()

    if (suppressionError) return { ok: false, reason: 'suppression_check_failed' }
    if (suppressed) {
      await supabaseAdmin.from('email_send_log').insert({
        message_id: messageId,
        template_name: opts.templateName,
        recipient_email: recipient,
        status: 'suppressed',
      })
      return { ok: false, reason: 'email_suppressed' }
    }

    // Get or create an unsubscribe token for this address.
    let unsubscribeToken: string | null = null
    const { data: existing } = await supabaseAdmin
      .from('email_unsubscribe_tokens')
      .select('token, used_at')
      .eq('email', normalized)
      .maybeSingle()

    if (existing && !existing.used_at) {
      unsubscribeToken = existing.token
    } else if (!existing) {
      const token = generateToken()
      await supabaseAdmin
        .from('email_unsubscribe_tokens')
        .upsert({ token, email: normalized }, { onConflict: 'email', ignoreDuplicates: true })
      const { data: stored } = await supabaseAdmin
        .from('email_unsubscribe_tokens')
        .select('token')
        .eq('email', normalized)
        .maybeSingle()
      unsubscribeToken = stored?.token ?? token
    } else {
      return { ok: false, reason: 'email_suppressed' }
    }

    const data = (opts.templateData ?? {}) as Record<string, any>
    const element = React.createElement(template.component, data)
    const html = await render(element)
    const text = await render(element, { plainText: true })
    const subject =
      typeof template.subject === 'function' ? template.subject(data) : template.subject

    await supabaseAdmin.from('email_send_log').insert({
      message_id: messageId,
      template_name: opts.templateName,
      recipient_email: recipient,
      status: 'pending',
    })

    const { error: enqueueError } = await supabaseAdmin.rpc('enqueue_email', {
      queue_name: 'transactional_emails',
      payload: {
        message_id: messageId,
        to: recipient,
        from: `${SITE_NAME} <noreply@${FROM_DOMAIN}>`,
        sender_domain: SENDER_DOMAIN,
        subject,
        html,
        text,
        purpose: 'transactional',
        label: opts.templateName,
        idempotency_key: opts.idempotencyKey ?? messageId,
        unsubscribe_token: unsubscribeToken,
        queued_at: new Date().toISOString(),
      },
    })

    if (enqueueError) {
      console.error('[email] enqueue failed', {
        template: opts.templateName,
        recipient: redactEmail(recipient),
        message: enqueueError.message,
      })
      await supabaseAdmin.from('email_send_log').insert({
        message_id: messageId,
        template_name: opts.templateName,
        recipient_email: recipient,
        status: 'failed',
        error_message: 'Failed to enqueue email',
      })
      return { ok: false, reason: 'enqueue_failed' }
    }

    return { ok: true }
  } catch (e) {
    console.error('[email] send failed', e)
    return { ok: false, reason: 'exception' }
  }
}
