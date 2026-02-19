/* @refresh reload */
import { render } from "solid-js/web";
import { routeTree } from "./routeTree.gen";
import { createRouter, RouterProvider } from "@tanstack/solid-router";

const router = createRouter({ routeTree });

declare module "@tanstack/solid-router" {
  interface Register {
    router: typeof router;
  }
}

render(
  () => <RouterProvider router={router} />,
  document.getElementById("root")!,
);
