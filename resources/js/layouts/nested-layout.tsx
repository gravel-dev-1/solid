import type { ParentProps } from "solid-js";

export default function NestedLayout(props: ParentProps) {
  return (
    <div>
      <p>This layout is nested </p>
      <div>{props.children}</div>
    </div>
  );
}
