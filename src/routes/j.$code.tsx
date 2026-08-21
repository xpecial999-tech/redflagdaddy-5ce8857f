import { createFileRoute } from "@tanstack/react-router";
import { JourneyInvitePage } from "@/components/JourneyInvite";

export const Route = createFileRoute("/j/$code")({
  component: ShortInviteRoute,
});

function ShortInviteRoute() {
  const { code } = Route.useParams();
  return <JourneyInvitePage code={code} />;
}
