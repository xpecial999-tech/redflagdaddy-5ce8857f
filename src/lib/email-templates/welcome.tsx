import * as React from "react";
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
} from "@react-email/components";
import type { TemplateEntry } from "./registry";

type WelcomeEmailProps = {
  dashboardUrl?: string;
};

export function WelcomeEmail({ dashboardUrl = "https://redflagdaddy.com/dashboard" }: WelcomeEmailProps) {
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>Welcome to RedFlagDaddy</Preview>
      <Body style={main}>
        <Container style={container}>
          <Text style={brand}>RedFlagDaddy</Text>
          <Heading style={heading}>Welcome — your private dashboard is ready</Heading>
          <Text style={text}>
            Thanks for creating a RedFlagDaddy profile. Your dashboard lets you keep track of
            journeys, return to reports, and create new partner assessments when you need them.
          </Text>
          <Text style={text}>
            RedFlagDaddy is designed as a structured conversation aid: consent, compatibility,
            safety and red flags in one place, without public profiles or dating-app noise.
          </Text>
          <Section style={{ margin: "0 0 24px" }}>
            <Button style={button} href={dashboardUrl}>
              Open your dashboard
            </Button>
          </Section>
          <Text style={footer}>
            If you did not create this account, you can safely ignore this email. Account access
            still requires a sign-in code sent to this inbox.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export const template = {
  component: WelcomeEmail,
  subject: "Welcome to RedFlagDaddy",
  displayName: "Welcome email",
  previewData: {
    dashboardUrl: "https://redflagdaddy.com/dashboard",
  },
} satisfies TemplateEntry;

export default WelcomeEmail;

const main = {
  backgroundColor: "#08070e",
  color: "#f7f2ff",
  fontFamily: "Arial, sans-serif",
  padding: "28px 12px",
};
const container = {
  backgroundColor: "#17121f",
  border: "1px solid #332543",
  borderRadius: "18px",
  margin: "0 auto",
  maxWidth: "580px",
  padding: "28px",
};
const brand = {
  color: "#ff4fb8",
  fontSize: "12px",
  fontWeight: "bold" as const,
  letterSpacing: "1.4px",
  margin: "0 0 16px",
  textTransform: "uppercase" as const,
};
const heading = {
  color: "#ffffff",
  fontSize: "26px",
  lineHeight: "1.18",
  margin: "0 0 16px",
};
const text = {
  color: "#c8bfd6",
  fontSize: "14px",
  lineHeight: "1.65",
  margin: "0 0 18px",
};
const button = {
  backgroundColor: "#ec3ca5",
  borderRadius: "12px",
  color: "#08070e",
  display: "inline-block",
  fontSize: "14px",
  fontWeight: "bold" as const,
  padding: "13px 22px",
  textDecoration: "none",
};
const footer = {
  borderTop: "1px solid #332543",
  color: "#9f91b3",
  fontSize: "12px",
  lineHeight: "1.5",
  margin: "28px 0 0",
  paddingTop: "18px",
};
