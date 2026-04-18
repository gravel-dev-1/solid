// Copyright (c) 2023 Jorge González

import {
  getInitialPageFromDOM,
  router,
  setupProgress,
  type Page,
  type PageProps,
  type PageResolver,
  type SharedPageProps,
} from "@inertiajs/core";
import App, { type InertiaAppProps } from "./App";
import type { Component } from "solid-js";

type InertiaAppOptions = {
  id?: string;
  page?: Page;
  resolve: PageResolver;
  setup: (props: {
    el: Element;
    App: typeof App;
    props: InertiaAppProps;
  }) => void;
  progress?:
    | false
    | {
        delay?: number;
        color?: string;
        includeCSS?: boolean;
        showSpinner?: boolean;
      };
};

export default async function createInertiaApp<
  SharedProps extends PageProps = PageProps & SharedPageProps,
>({ id = "app", page, resolve, setup, progress }: InertiaAppOptions) {
  const el = document.getElementById(id)!;
  const initialPage = page || getInitialPageFromDOM<Page<SharedProps>>(id)!;

  const resolveComponent = (name: string) =>
    Promise.resolve(resolve(name)).then(
      (module) => (module as { default: Component }).default || module,
    );

  const props: InertiaAppProps = {
    initialPage,
    initialComponent: await Promise.all([
      resolveComponent(initialPage.component),
      await router.decryptHistory().catch(() => {}),
    ]).then(([initialComponent]) => initialComponent),
    resolveComponent,
  };

  if (progress) {
    setupProgress(progress);
  }

  setup({
    el,
    App,
    props,
  });
}
