// Copyright (c) 2023 Jorge González

import { type Page, type PageResolver, router } from "@inertiajs/core";
import { MetaProvider } from "@solidjs/meta";
import {
  type Component,
  type ParentComponent,
  type ParentProps,
  type ResolvedJSXElement,
  children,
  createComponent,
  createMemo,
  mergeProps,
} from "solid-js";
import { createStore, reconcile } from "solid-js/store";
import PageContext from "./PageContext";

type InertiaLayoutComponent = ParentComponent<Page["props"]>;

type InertiaComponent = Component<Page["props"]> & {
  layout?: InertiaLayoutComponent | InertiaLayoutComponent[];
};

export type InertiaAppProps = {
  initialPage: Page;
  initialComponent?: InertiaComponent;
  resolveComponent: PageResolver;
};

type InertiaAppState = {
  component: InertiaAppProps["initialComponent"] | null;
  page: InertiaAppProps["initialPage"];
  // key: unknown;
};

export default function App(props: ParentProps<InertiaAppProps>) {
  const [current, setCurrent] = createStore<InertiaAppState>({
    component: props.initialComponent || null,
    page: props.initialPage,
    // key: null,
  });

  router.init<InertiaComponent>({
    initialPage: props.initialPage,
    resolveComponent: props.resolveComponent,
    async swapComponent({ component, page /*, preserveState */ }) {
      setCurrent(
        reconcile({
          component,
          page,
          // key: preserveState ? current.key : Date.now(),
        }),
      );
    },
  });

  const layouts = createMemo(() => {
    if (typeof current.component?.layout === "function") {
      return [current.component.layout];
    }

    if (Array.isArray(current.component?.layout)) {
      return current.component.layout;
    }

    return [];
  });

  const renderChildren = (i = 0): ResolvedJSXElement[] => {
    const layout = createMemo(() => layouts()[i]);

    return children(() => {
      if (!layout()) {
        return createComponent(
          current.component!,
          /* mergeProps({ key: current.key }, () => */ current.page.props /*)*/,
        );
      }

      return createComponent(
        layout(),
        mergeProps(() => current.page.props, {
          get children() {
            return renderChildren(i + 1);
          },
        }),
      );
    }).toArray();
  };

  return createComponent(MetaProvider, {
    get children() {
      return createComponent(PageContext.Provider, {
        get value() {
          return current.page;
        },
        get children() {
          return renderChildren();
        },
      });
    },
  });
}
