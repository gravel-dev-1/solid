import type { ParentProps } from "solid-js";

export default function AppLayout(props: ParentProps) {
  return (
    <>
      <header>Header</header>
      <main>{props.children}</main>
      <footer>Footer</footer>
    </>
  );
}
