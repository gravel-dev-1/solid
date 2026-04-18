// Copyright (c) 2023 Jorge González

import {
  isUrlMethodPair,
  mergeDataIntoQueryString,
  router,
  shouldIntercept,
  shouldNavigate,
  type ActiveVisit,
  type LinkComponentBaseProps,
  type LinkPrefetchOption,
  type Method,
  type PendingVisit,
  type VisitOptions,
} from "@inertiajs/core";
import {
  createSignal,
  splitProps,
  mergeProps,
  type Accessor,
  type Component,
  type JSX,
  createMemo,
  onMount,
  onCleanup,
} from "solid-js";
import { createDynamic } from "solid-js/web";

const noop = () => undefined;

type ElementType = keyof JSX.IntrinsicElements | Component<any>;

interface BaseInertiaLinkProps extends LinkComponentBaseProps {
  as?: ElementType;
  onClick?: (event: MouseEvent) => void;
}

export type InertiaLinkProps = BaseInertiaLinkProps &
  Omit<JSX.HTMLAttributes<HTMLElement>, keyof BaseInertiaLinkProps>;

const defaults: InertiaLinkProps = {
  as: "a",
  data: {},
  href: "",
  method: "get",
  preserveScroll: false,
  preserveState: false,
  preserveUrl: false,
  replace: false,
  only: [],
  except: [],
  headers: {},
  queryStringArrayFormat: "brackets",
  async: false,
  prefetch: false,
  cacheFor: 0,
  cacheTags: [],
};

export default function Link(props: InertiaLinkProps) {
  let [local, others] = splitProps(props, [
    "children",
    "as",
    "data",
    "href",
    "method",
    "preserveScroll",
    "preserveState",
    "preserveUrl",
    "replace",
    "only",
    "except",
    "headers",
    "queryStringArrayFormat",
    "async",
    "onClick",
    "onCancelToken",
    "onBefore",
    "onStart",
    "onProgress",
    "onFinish",
    "onCancel",
    "onSuccess",
    "onError",
    "onPrefetching",
    "onPrefetched",
    "prefetch",
    "cacheFor",
    "cacheTags",
  ]);

  local = mergeProps(defaults, local);

  const [inFlightCount, setInFlightCount] = createSignal(0);
  let hoverTimeout: ReturnType<typeof setTimeout>;

  const method: Accessor<Method> = () =>
    isUrlMethodPair(local.href)
      ? local.href.method
      : (local.method!.toLowerCase() as Method);

  const as = () => {
    if (typeof local.as !== "string" || local.as.toLowerCase() !== "a") {
      // Custom component or element
      return local.as ?? "a";
    }

    return method() !== "get"
      ? "button"
      : (local.as.toLowerCase() as ElementType);
  };

  const mergeDataArray = () =>
    mergeDataIntoQueryString(
      method(),
      isUrlMethodPair(local.href) ? local.href!.url : local.href!,
      local.data!,
      local.queryStringArrayFormat,
    );

  const url = createMemo(() => mergeDataArray()[0]);
  const data = createMemo(() => mergeDataArray()[1]);

  const baseParams = createMemo<VisitOptions>(() => ({
    data: data(),
    method: method(),
    preserveScroll: local.preserveScroll,
    preserveState: local.preserveState ?? method() !== "get",
    preserveUrl: local.preserveUrl,
    replace: local.replace,
    only: local.only,
    except: local.except,
    headers: local.headers,
    async: local.async,
  }));

  const visitParams = createMemo<VisitOptions>(() => ({
    ...baseParams(),
    onCancelToken: local.onCancelToken ?? noop,
    onBefore: local.onBefore ?? noop,
    onStart(visit: PendingVisit) {
      setInFlightCount((count) => count + 1);
      local.onStart?.(visit);
    },
    onProgress: local.onProgress ?? noop,
    onFinish(visit: ActiveVisit) {
      setInFlightCount((count) => count - 1);
      local.onFinish?.(visit);
    },
    onCancel: local.onCancel ?? noop,
    onSuccess: local.onSuccess ?? noop,
    onError: local.onError ?? noop,
  }));

  const prefetchModes = createMemo<LinkPrefetchOption[]>(() => {
    if (local.prefetch === true) return ["hover"];
    if (local.prefetch === false) return [];
    if (Array.isArray(local.prefetch)) return local.prefetch;
    return [local.prefetch!];
  });

  const cacheForValue = createMemo(() => {
    if (local.cacheFor !== 0) {
      // If they've provided a value, respect it
      return local.cacheFor;
    }

    if (prefetchModes().length === 1 && prefetchModes()[0] === "click") {
      // If they've only provided a prefetch mode of 'click',
      // we should only prefetch for the next request but not keep it around
      return 0;
    }

    // Otherwise, default to 30 seconds
    return 30_000;
  });

  const prefetch = () =>
    router.prefetch(
      url(),
      {
        ...baseParams(),
        onPrefetching: local.onPrefetching ?? noop,
        onPrefetched: local.onPrefetched ?? noop,
      },
      { cacheFor: cacheForValue(), cacheTags: local.cacheTags },
    );

  onMount(() => {
    if (prefetchModes().includes("mount")) prefetch();
  });

  onCleanup(() => clearTimeout(hoverTimeout));

  const regularEvents = {
    onClick(event: MouseEvent) {
      local.onClick?.(event);

      if (shouldIntercept(event)) {
        event.preventDefault();
        router.visit(url(), visitParams());
      }
    },
  };

  const prefetchHoverEvents = {
    onMouseEnter() {
      hoverTimeout = setTimeout(prefetch, 75);
    },
    onMouseLeave() {
      clearTimeout(hoverTimeout);
    },
    onClick: regularEvents.onClick,
  };

  const prefetchClickEvents = {
    onMouseDown(event: MouseEvent) {
      if (shouldIntercept(event)) {
        event.preventDefault();
        prefetch();
      }
    },
    onKeyDown(event: KeyboardEvent) {
      if (shouldNavigate(event)) {
        event.preventDefault();
        prefetch();
      }
    },
    onMouseUp(event: MouseEvent) {
      event.preventDefault();
      router.visit(url(), visitParams());
    },
    onKeyUp(event: KeyboardEvent) {
      if (shouldNavigate(event)) {
        event.preventDefault();
        router.visit(url(), visitParams());
      }
    },
    onClick(event: MouseEvent) {
      props.onClick?.(event);

      if (shouldIntercept(event)) {
        // Let the mouseup/keyup event handle the visit
        event.preventDefault();
      }
    },
  };

  const elProps = () => {
    if (as() === "button") return { type: "button" };
    if (as() === "a" || typeof as() !== "string") return { href: url() };
    return {};
  };

  return createDynamic(
    as,
    mergeProps(
      others,
      elProps,
      {
        get dataLoading() {
          return inFlightCount() > 0 ? "" : undefined;
        },
        get children() {
          return props.children;
        },
      },
      () => {
        if (prefetchModes().includes("hover")) return prefetchHoverEvents;
        if (prefetchModes().includes("click")) return prefetchClickEvents;
        return regularEvents;
      },
    ),
  );
}
