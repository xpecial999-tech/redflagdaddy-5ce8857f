import * as React from 'react'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import type { TemplateEntry } from './registry'

interface AssessmentCompleteProps {
  journeyTitle?: string
  resultsUrl?: string
}

const AssessmentCompleteEmail = ({
  journeyTitle,
  resultsUrl,
}: AssessmentCompleteProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Your RedFlagDaddy report is ready</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>RedFlagDaddy</Text>
        <Heading style={h1}>Your partner has finished</Heading>
        <Text style={text}>
          The partner check-in{journeyTitle ? ` for “${journeyTitle}”` : ''} is
          complete. Your compatibility, safety and red-flag scores — plus the
          conversation summary — are ready to review.
        </Text>
        {resultsUrl ? (
          <Section style={{ margin: '0 0 24px' }}>
            <Button style={button} href={resultsUrl}>
              View the report
            </Button>
          </Section>
        ) : null}
        <Text style={footer}>
          Reports are private to you. Share them only with people you trust.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: AssessmentCompleteEmail,
  subject: 'Your RedFlagDaddy report is ready',
  displayName: 'Assessment complete',
  previewData: {
    journeyTitle: 'Getting to know each other',
    resultsUrl: 'https://redflagdaddy.com/dashboard',
  },
} satisfies TemplateEntry

export default AssessmentCompleteEmail

const main = { backgroundColor: '#ffffff', fontFamily: 'Arial, sans-serif' }
const container = { padding: '24px 25px', maxWidth: '560px' }
const brand = {
  fontSize: '13px',
  letterSpacing: '1px',
  textTransform: 'uppercase' as const,
  color: '#e11d48',
  fontWeight: 'bold' as const,
  margin: '0 0 16px',
}
const h1 = {
  fontSize: '22px',
  fontWeight: 'bold' as const,
  color: '#111111',
  margin: '0 0 16px',
}
const text = {
  fontSize: '14px',
  color: '#55575d',
  lineHeight: '1.6',
  margin: '0 0 18px',
}
const button = {
  backgroundColor: '#e11d48',
  color: '#ffffff',
  fontSize: '14px',
  borderRadius: '10px',
  padding: '12px 22px',
  textDecoration: 'none',
  display: 'inline-block',
}
const footer = { fontSize: '12px', color: '#999999', margin: '28px 0 0' }
