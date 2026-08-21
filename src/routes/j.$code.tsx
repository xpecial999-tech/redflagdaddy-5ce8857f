import { createFileRoute } from "@tanstack/react-router";
import { JourneyInvitePage } from "@/components/JourneyInvite";

export const Route = createFileRoute("/j/$code")({
  head: () => ({ meta: [{ name: "robots", content: "noindex,nofollow,noarchive" }] }),
  component: ShortInviteRoute,
});

function ShortInviteRoute() {
  const { code } = Route.useParams();
  return <JourneyInvitePage code={code} />;
}
