import { createStart, createMiddleware, createCsrfMiddleware } from "@tanstack/react-start";

import { renderErrorPage } from "./lib/error-page";
import { attachSupabaseAuth } from "@/integrations/supabase/auth-attacher";
import { withSecurityHeaders } from "./lib/security-headers";

const securityHeadersMiddleware = createMiddleware().server(
  async ({ next, pathname, serverFnMeta }) => {
    const result = await next();
    if (result instanceof Response) {
      return withSecurityHeaders(result, {
        pathname,
        serverFunction: serverFnMeta !== undefined,
      });
    }
    return {
      ...result,
      response: withSecurityHeaders(result.response, {
        pathname,
        serverFunction: serverFnMeta !== undefined,
      }),
    };
  },
);

const errorMiddleware = createMiddleware().server(async ({ next, request }) => {
  const pathname = new URL(request.url).pathname;
  if (pathname.startsWith("/lovable/") || pathname === "/email/unsubscribe") {
    return next();
  }
  try {
    return await next();
  } catch (error) {
    if (error != null && typeof error === "object" && "statusCode" in error) {
      throw error;
    }
    console.error(error);
    return new Response(renderErrorPage(), {
      status: 500,
      headers: { "content-type": "text/html; charset=utf-8" },
    });
  }
});

const csrfMiddleware = createCsrfMiddleware({
  filter: (context) => context.handlerType === "serverFn",
});

export const startInstance = createStart(() => ({
  functionMiddleware: [attachSupabaseAuth],
  requestMiddleware: [securityHeadersMiddleware, csrfMiddleware, errorMiddleware],
}));
