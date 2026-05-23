import { Container, getContainer, switchPort } from "@cloudflare/containers";

/**
 * BlogContainer orchestrates the combined backend+frontend container.
 *
 * Port layout inside the container:
 *   3000 — Next.js frontend
 *   4000 — NestJS backend API
 *
 * The Worker routes by path:
 *   /api/*  and /uploads/*  → backend (port 4000)
 *   everything else          → frontend (port 3000)
 */
export class BlogContainer extends Container {
  // Frontend is the default — most requests go there
  static defaultPort = 3000;

  // Both ports must be listening before the container is marked healthy
  static requiredPorts = [3000, 4000];

  // Keep the container warm for 10 minutes after the last request
  static sleepAfter = "10m";

  // Passed to the container process on every start
  static envVars = {
    NODE_ENV: "production",
    PORT: "4000",
    // Internal API URL — Next.js server-side fetch uses this
    INTERNAL_API_URL: "http://localhost:4000/api",
  };
}

// ---------------------------------------------------------------------------
// Worker entrypoint
// ---------------------------------------------------------------------------

type Env = {
  BLOG_CONTAINER: DurableObjectNamespace<BlogContainer>;
};

export default {
  async fetch(request: Request, env: Env) {
    const url = new URL(request.url);
    const container = getContainer(env.BLOG_CONTAINER, "singleton");

    // API and upload requests → backend (port 4000)
    if (
      url.pathname.startsWith("/api/") ||
      url.pathname.startsWith("/uploads/")
    ) {
      return container.fetch(switchPort(request, 4000));
    }

    // Everything else → frontend (port 3000, the defaultPort)
    return container.fetch(request);
  },
};
