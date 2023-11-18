export type Letters = "a" | "b" | "c";

type RemoveC<T> = T extends "c" ? never : T;
type RemoveMemberOfUnion<T, U> = T extends U ? never : T;

type TypeWithoutC = RemoveC<Letters>;
type TypeWithoutC2 = Exclude<Letters, "c">;
type TypeWithoutC3 = RemoveMemberOfUnion<Letters, "c">;
