import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    // Jump to the top of a new page instead of gliding there (the site uses smooth scrolling
    // for in-page links). A glide starts the new page hidden under the sticky header and can
    // stop short, e.g. the thank-you check mark ended up behind the header.
    scrollRestorationBehavior: "instant",
    defaultPreloadStaleTime: 0,
  });

  return router;
};
