import { createFileRoute } from "@tanstack/react-router";

/**
 * Retired legacy client-send endpoint.
 *
 * Application email is queued from trusted server code through sendAppEmail.
 * Keeping the former authenticated-user endpoint would allow an ordinary
 * account to select arbitrary recipients and registered templates.
 */
export const Route = createFileRoute("/lovable/email/transactional/send")({
  server: {
    handlers: {
      POST: async () =>
        Response.json(
          { error: "Not found" },
          { status: 404, headers: { "cache-control": "no-store" } },
        ),
    },
  },
});
