import type { ElementType } from 'react'
import { template as journeyInviteTemplate } from './journey-invite'
import { template as assessmentCompleteTemplate } from './assessment-complete'
import { template as supportRequestTemplate } from './support-request'

export interface TemplateEntry {
  component: ElementType
  subject: string | ((data: Record<string, unknown>) => string)
  displayName?: string
  previewData?: Record<string, unknown>
  /** Fixed recipient — overrides caller-provided recipientEmail when set. */
  to?: string
}

/**
 * Template registry — maps template names to their React Email components.
 * Import and register new templates here after creating them in this directory.
 */
export const TEMPLATES: Record<string, TemplateEntry> = {
  'journey-invite': journeyInviteTemplate,
  'assessment-complete': assessmentCompleteTemplate,
  'support-request': supportRequestTemplate,
}
