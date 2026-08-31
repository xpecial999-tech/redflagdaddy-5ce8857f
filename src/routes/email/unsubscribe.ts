import { createClient } from '@supabase/supabase-js'
import { createFileRoute } from '@tanstack/react-router'
import { normalizeUnsubscribeToken } from '@/lib/unsubscribe-token'

const MAX_UNSUBSCRIBE_BODY_BYTES = 4096

async function readSmallBody(request: Request): Promise<string | null> {
  const declared = Number(request.headers.get('content-length'))
  if (Number.isFinite(declared) && declared > MAX_UNSUBSCRIBE_BODY_BYTES) return null
  const body = await request.text()
  return new TextEncoder().encode(body).byteLength <= MAX_UNSUBSCRIBE_BODY_BYTES ? body : null
}

function redactEmail(email: string | null | undefined): string {
  if (!email) return '***'
  const [localPart, domain] = email.split('@')
  if (!localPart || !domain) return '***'
  return `${localPart[0]}***@${domain}`
}

export const Route = createFileRoute("/email/unsubscribe")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const supabaseUrl = import.meta.env['VITE_SUPABASE_URL']
        const supabaseServiceKey = process.env['SUPABASE_SERVICE_ROLE_KEY']

        if (!supabaseUrl || !supabaseServiceKey) {
          return Response.json({ error: 'Server configuration error' }, { status: 500 })
        }

        // Extract token from query params
        const url = new URL(request.url)
        const token = normalizeUnsubscribeToken(url.searchParams.get('token'))

        if (!token) {
          return Response.json({ error: 'Token is required' }, { status: 400 })
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // Look up the token
        const { data: tokenRecord, error: lookupError } = await supabase
          .from('email_unsubscribe_tokens')
          .select('id, email, used_at')
          .eq('token', token)
          .maybeSingle()

        if (lookupError || !tokenRecord) {
          return Response.json({ error: 'Invalid or expired token' }, { status: 404 })
        }

        if (tokenRecord.used_at) {
          return Response.json({ valid: false, reason: 'already_unsubscribed' })
        }

        return Response.json({ valid: true })
      },

      POST: async ({ request }) => {
        const supabaseUrl = import.meta.env['VITE_SUPABASE_URL']
        const supabaseServiceKey = process.env['SUPABASE_SERVICE_ROLE_KEY']

        if (!supabaseUrl || !supabaseServiceKey) {
          return Response.json({ error: 'Server configuration error' }, { status: 500 })
        }

        // Extract token from query params (always present for RFC 8058 one-click)
        const url = new URL(request.url)
        let token: string | null = normalizeUnsubscribeToken(url.searchParams.get('token'))

        // Detect RFC 8058 one-click unsubscribe: POST with form-encoded body
        // containing "List-Unsubscribe=One-Click". Email clients (Gmail, Apple Mail,
        // etc.) send this when the user clicks "Unsubscribe" in the mail UI.
        const contentType = request.headers.get('content-type') ?? ''
        const bodyText = await readSmallBody(request)
        if (bodyText === null) {
          return Response.json({ error: 'Request body is too large' }, { status: 413 })
        }
        if (contentType.includes('application/x-www-form-urlencoded')) {
          const params = new URLSearchParams(bodyText)
          // For one-click, token comes from query param (already set above).
          // Otherwise, token may be in the form body.
          if (!params.get('List-Unsubscribe')) {
            const formToken = normalizeUnsubscribeToken(params.get('token'))
            if (formToken) {
              token = formToken
            }
          }
        } else {
          // JSON body (from the app's unsubscribe page)
          try {
            const body = JSON.parse(bodyText) as { token?: unknown }
            token = normalizeUnsubscribeToken(body?.token) ?? token
          } catch {
            // Fall through — token stays from query param
          }
        }

        if (!token) {
          return Response.json({ error: 'Token is required' }, { status: 400 })
        }

        const supabase = createClient(supabaseUrl, supabaseServiceKey)

        // Look up the token
        const { data: tokenRecord, error: lookupError } = await supabase
          .from('email_unsubscribe_tokens')
          .select('id, email, used_at')
          .eq('token', token)
          .maybeSingle()

        if (lookupError || !tokenRecord) {
          return Response.json({ error: 'Invalid or expired token' }, { status: 404 })
        }

        if (tokenRecord.used_at) {
          return Response.json({ success: false, reason: 'already_unsubscribed' })
        }

        // Suppress first. This upsert is idempotent, so a later token-update
        // failure remains safely retryable instead of losing the unsubscribe.
        const { error: suppressError } = await supabase
          .from('suppressed_emails')
          .upsert(
            { email: tokenRecord.email.toLowerCase(), reason: 'unsubscribe' },
            { onConflict: 'email' },
          )

        if (suppressError) {
          console.error('Failed to suppress email', {
            code: suppressError.code,
            email_redacted: redactEmail(tokenRecord.email),
          })
          return Response.json({ error: 'Failed to process unsubscribe' }, { status: 500 })
        }

        // Atomically consume the token after suppression is safely stored.
        const { data: updated, error: updateError } = await supabase
          .from('email_unsubscribe_tokens')
          .update({ used_at: new Date().toISOString() })
          .eq('token', token)
          .is('used_at', null)
          .select('id')
          .maybeSingle()

        if (updateError) {
          console.error('Failed to mark token as used', {
            code: updateError.code,
            email_redacted: redactEmail(tokenRecord.email),
          })
          return Response.json({ error: 'Failed to process unsubscribe' }, { status: 500 })
        }

        if (!updated) {
          return Response.json({ success: false, reason: 'already_unsubscribed' })
        }

        console.log('Email unsubscribed', {
          email_redacted: redactEmail(tokenRecord.email),
        })

        return Response.json({ success: true })
      },
    },
  },
})
