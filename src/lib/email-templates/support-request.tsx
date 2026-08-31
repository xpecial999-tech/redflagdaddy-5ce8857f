import * as React from "react";
import { Body, Container, Head, Heading, Hr, Html, Preview, Text } from "@react-email/components";

export type SupportRequestEmailProps = {
  reference?: string;
  category?: string;
  replyEmail?: string;
  concerns?: string;
  journeyReference?: string | null;
  message?: string;
};

export function SupportRequestEmail({
  reference = "RFD-UNKNOWN",
  category = "Other",
  replyEmail = "Not supplied",
  concerns = "General question",
  journeyReference = null,
  message = "No message supplied.",
}: SupportRequestEmailProps) {
  return (
    <Html lang="en" dir="ltr">
      <Head />
      <Preview>New RedFlagDaddy support request {reference}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={heading}>New support request</Heading>
          <Text style={referenceStyle}>{reference}</Text>
          <Hr style={rule} />
          <Text style={label}>Category</Text>
          <Text style={value}>{category}</Text>
          <Text style={label}>Reply to</Text>
          <Text style={value}>{replyEmail}</Text>
          <Text style={label}>This concerns</Text>
          <Text style={value}>{concerns}</Text>
          {journeyReference ? (
            <>
              <Text style={label}>Optional journey reference</Text>
              <Text style={value}>{journeyReference}</Text>
            </>
          ) : null}
          <Text style={label}>Message</Text>
          <Text style={messageStyle}>{message}</Text>
          <Hr style={rule} />
          <Text style={notice}>
            Do not request passwords, one-time codes, private report links, intimate images,
            identity documents or another person&apos;s contact details. Verify account control
            before disclosing or deleting data.
          </Text>
        </Container>
      </Body>
    </Html>
  );
}

export const template = {
  component: SupportRequestEmail,
  subject: (data: Record<string, unknown>) =>
    `[${String(data.reference ?? "RFD support")}] ${String(data.category ?? "Support request")}`,
  displayName: "Support request notification",
  previewData: {
    reference: "RFD-20260828-A1B2C3",
    category: "Product or account help",
    replyEmail: "person@example.com",
    concerns: "My own account",
    journeyReference: "Optional non-secret journey ID",
    message: "A short support message appears here.",
  },
};

const main = {
  backgroundColor: "#08070e",
  color: "#f7f2ff",
  fontFamily: "Arial, sans-serif",
  padding: "28px 12px",
};
const container = {
  backgroundColor: "#17121f",
  border: "1px solid #332543",
  borderRadius: "16px",
  margin: "0 auto",
  maxWidth: "620px",
  padding: "28px",
};
const heading = { color: "#ffffff", fontSize: "24px", margin: "0 0 8px" };
const referenceStyle = { color: "#ff4fb8", fontSize: "16px", fontWeight: "bold" };
const rule = { borderColor: "#332543", margin: "22px 0" };
const label = {
  color: "#b8a9c8",
  fontSize: "11px",
  fontWeight: "bold",
  margin: "18px 0 3px",
  textTransform: "uppercase" as const,
};
const value = { color: "#ffffff", fontSize: "14px", margin: "0" };
const messageStyle = {
  color: "#ffffff",
  fontSize: "14px",
  lineHeight: "1.6",
  margin: "4px 0 0",
  whiteSpace: "pre-wrap" as const,
};
const notice = { color: "#b8a9c8", fontSize: "12px", lineHeight: "1.5" };
