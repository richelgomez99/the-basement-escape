import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { useEffect } from "react";

import appCss from "../styles.css?url";
import { loadOverridesFromCloud } from "@/game/content";
import { installSessionUnloadHook } from "@/game/state";

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

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "The Basement Escape" },
      { name: "description", content: "A 60-minute virtual escape room by Glorious Church of God in Christ." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { property: "og:title", content: "The Basement Escape" },
      { name: "twitter:title", content: "The Basement Escape" },
      { property: "og:description", content: "A 60-minute virtual escape room by Glorious Church of God in Christ." },
      { name: "twitter:description", content: "A 60-minute virtual escape room by Glorious Church of God in Christ." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/e5ec3c92-e72c-4e10-b11f-1fb18807ad76/id-preview-e1b9f572--c1939247-1545-4a86-a64c-3c7ca01d6718.lovable.app-1776829815154.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/e5ec3c92-e72c-4e10-b11f-1fb18807ad76/id-preview-e1b9f572--c1939247-1545-4a86-a64c-3c7ca01d6718.lovable.app-1776829815154.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Cinzel:wght@500;700&family=Inter:wght@400;500;600&display=swap",
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  useEffect(() => {
    void loadOverridesFromCloud();
    installSessionUnloadHook();
  }, []);
  return <Outlet />;
}
