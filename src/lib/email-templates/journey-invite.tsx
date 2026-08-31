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

interface JourneyInviteProps {
  inviterName?: string
  journeyTitle?: string
  inviteUrl?: string
  inviteCode?: string
}

const JourneyInviteEmail = ({
  inviterName,
  journeyTitle,
  inviteUrl,
  inviteCode,
}: JourneyInviteProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>You've been invited to a private RedFlagDaddy check-in</Preview>
    <Body style={main}>
      <Container style={container}>
        <Text style={brand}>RedFlagDaddy</Text>
        <Heading style={h1}>A partner invited you</Heading>
        <Text style={text}>
          {inviterName ? `${inviterName} has` : 'Someone has'} invited you to
          a private check-in about compatibility, boundaries and safety
          {journeyTitle ? `: “${journeyTitle}”` : ''}.
        </Text>
        <Text style={text}>
          It's consent-first, confidential, and takes about 10–15 minutes. Your
          answers are only used to build the shared report.
        </Text>
        {inviteUrl ? (
          <Section style={{ margin: '0 0 24px' }}>
            <Button style={button} href={inviteUrl}>
              Start your check-in
            </Button>
          </Section>
        ) : null}
        {inviteCode ? (
          <Text style={codeBox}>Invite code: {inviteCode}</Text>
        ) : null}
        <Text style={footer}>
          If you weren't expecting this, you can safely ignore this email — no
          account is created until you start.
        </Text>
      </Container>
    </Body>
  </Html>
)

export const template = {
  component: JourneyInviteEmail,
  subject: 'You have been invited to a private RedFlagDaddy check-in',
  displayName: 'Journey invite',
  previewData: {
    inviterName: 'Alex',
    journeyTitle: 'Getting to know each other',
    inviteUrl: 'https://redflagdaddy.com/j/ABC123',
    inviteCode: 'ABC123',
  },
} satisfies TemplateEntry

export default JourneyInviteEmail

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
const codeBox = {
  fontSize: '13px',
  color: '#111111',
  backgroundColor: '#f5f5f5',
  borderRadius: '8px',
  padding: '10px 14px',
  margin: '0 0 18px',
}
const footer = { fontSize: '12px', color: '#999999', margin: '28px 0 0' }
