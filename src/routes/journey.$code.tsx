import { createFileRoute } from "@tanstack/react-router";
import { JourneyInvitePage } from "@/components/JourneyInvite";

export const Route = createFileRoute("/journey/$code")({
  head: () => ({ meta: [{ name: "robots", content: "noindex,nofollow,noarchive" }] }),
  component: JourneyInviteRoute,
});

function JourneyInviteRoute() {
  const { code } = Route.useParams();
  return <JourneyInvitePage code={code} />;
}
