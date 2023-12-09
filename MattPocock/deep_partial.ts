export interface DeepPartialArray<T> extends Array<DeepPartial<T>> {}
export type DeepPartialObject<T> = {
  [K in keyof T]?: DeepPartial<T[K]>;
};
export type DeepPartial<T> = T extends Function
  ? T
  : T extends Array<infer U>
  ? DeepPartialArray<U>
  : T extends object
  ? DeepPartialObject<T>
  : T | undefined;

interface Post {
  id: string;
  comments: { value: string }[];
  meta: {
    name: string;
    description: string;
  };
}

const post: Post = {
  id: "123",
  comments: [{ value: "hello" }],
  meta: {
    name: "name",
    description: "description",
  },
};

const partialPost: Partial<Post> = {
  id: "123",
  // comments: [{ value: 'hello' }],  << "comments" is optional

  // "meta" is optional but if it exists Partial<Post> requires "meta" to be complete including "description"
  meta: {
    name: "name",
  },
};

const deepPartialPost: DeepPartial<Post> = {
  id: "123",
  comments: [{ value: "hello" }],
  // "meta" is optional and if it exists DeepPartial<Post> does not require "meta" to be complete
  meta: {
    name: "name",
  },
};
