import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { type ReactNode } from "react";
import { ThemeToggle } from "../components/ThemeToggle";
import { themeScript } from "../lib/theme";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Fantasy FiM" },
      { name: "description", content: "Fantasy FIRST Robotics Competition in Michigan." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap",
      },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

const nav = [
  { to: "/leagues", label: "Leagues" },
  { to: "/offseasons", label: "Offseasons" },
  { to: "/teams", label: "Teams" },
  { to: "/events", label: "Events" },
] as const;

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const isDraftPage = useRouterState({
    select: (state) => state.location.pathname.startsWith("/drafts/"),
  });

  return (
    <QueryClientProvider client={queryClient}>
      <div className="flex min-h-screen flex-col">
        <header className="sticky top-0 z-10 border-b bg-background/80 backdrop-blur-lg">
          <div className="mx-auto flex min-h-16 max-w-6xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
            <Link to="/" className="flex items-center gap-2 text-lg font-extrabold tracking-tight">
              <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary text-primary-foreground">
                F
              </span>
              Fantasy <span className="text-primary">FiM</span>
            </Link>
            <nav aria-label="Main navigation" className="flex flex-wrap items-center gap-1">
              {nav.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  className="rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-secondary hover:text-foreground"
                  activeProps={{ className: "bg-accent text-accent-foreground" }}
                >
                  {n.label}
                </Link>
              ))}
              <a
                href="https://fantasyfim.com/api/apidocs"
                className="rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              >
                API
              </a>
              <a
                href="https://github.com/anthonycgalea/fantasy-fim"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full px-4 py-2 text-sm font-semibold text-muted-foreground transition hover:bg-secondary hover:text-foreground"
              >
                GitHub
              </a>
              <ThemeToggle />
              <button className="ml-3 rounded-full bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition hover:opacity-90">
                Sign in
              </button>
            </nav>
          </div>
        </header>
        <main
          className={`mx-auto w-full min-w-0 flex-1 ${isDraftPage ? "px-4 py-6 sm:px-6" : "max-w-6xl px-6 py-10"}`}
        >
          <Outlet />
        </main>
        <footer className="space-y-2 border-t px-4 py-6 text-center text-xs text-muted-foreground">
          <p>
            Powered by{" "}
            <a
              href="https://www.thebluealliance.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-primary hover:underline"
            >
              The Blue Alliance
            </a>
          </p>
          <p>Fantasy FiM · Not affiliated with FIRST® or FIRST in Michigan</p>
        </footer>
      </div>
    </QueryClientProvider>
  );
}
