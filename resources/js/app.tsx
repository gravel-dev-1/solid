import { render } from "solid-js/web";
import createInertiaApp from "@/inertia/solid-js/createInertiaApp";
import "../css/index.css";

export async function resolvePageComponent<T>(
  path: string | string[],
  pages: Record<string, Promise<T> | (() => Promise<T>)>,
): Promise<T> {
  for (const p of Array.isArray(path) ? path : [path]) {
    const page = pages[p];

    if (typeof page === "undefined") {
      continue;
    }

    return typeof page === "function" ? page() : page;
  }

  throw new Error(`Page not found: ${path}`);
}

createInertiaApp({
  resolve: (name) =>
    resolvePageComponent(
      `./pages/${name}.tsx`,
      import.meta.glob("./pages/**/*.tsx"),
    ),
  setup: ({ el, App, props }) => render(() => <App {...props} />, el),
});
