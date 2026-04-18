import AppLayout from "@/layouts/app-layout";
import NestedLayout from "@/layouts/nested-layout";
import { Meta, Title } from "@solidjs/meta";

function About(props: unknown) {
  return (
    <>
      <Title>About</Title>
      <Meta name="description" content="Golang @inertia/solid-js Demo" />
      <Meta name="author" content="John Doe" />
      <div>About</div>
      <pre>{JSON.stringify(props)}</pre>
    </>
  );
}

About.layout = [AppLayout, NestedLayout];

export default About;
