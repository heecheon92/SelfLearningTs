import React from "react";

function MyFunctionalComponent(props: { enabled: boolean }) {
  return null;
}

const MyConstFunctionalComponent = (props: { enabled: boolean }) => null;

class MyClassComponent extends React.Component<{ enabled: boolean }> {
  render() {
    return null;
  }
}

type PropsFrom<TReactComponent> = TReactComponent extends React.FC<infer TProps>
  ? TProps
  : TReactComponent extends React.Component<infer TProps>
  ? TProps
  : never;

const fprops = {
  enabled: true,
} satisfies PropsFrom<typeof MyFunctionalComponent>;

const cfprops = {
  enabled: true,
} satisfies PropsFrom<typeof MyConstFunctionalComponent>;

const cprops = {
  enabled: true,
} satisfies PropsFrom<typeof MyClassComponent>;
