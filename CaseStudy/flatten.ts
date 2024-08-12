function flatten<T extends object>(obj: T, result: any = {}): Flattened<T> {
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      if (typeof obj[key] === "object" && obj[key]) {
        flatten(obj[key], result);
      } else {
        result[key] = obj[key];
      }
    }
  }
  return result;
}

const obj = {
  a: 1,
  b: {
    c: 2,
    d: {
      e: 3,
      f: {
        g: 4,
      },
    },
  },
  h: [1, 2, 3, 4, 5],
  i: {
    j: "jay",
    k: ["k1", "k2"],
  },
};

/**
 * "FilterObject" filters out the keys that have object values.
 * "ObjectFilteredByPrimitiveValue" returns the object with keys that have primitive, array values or never.
 *  */
type FilterObject<T> = T extends object ? (T extends unknown[] ? T : never) : T;
type ObjectFilteredByPrimitiveValue<T extends object> = {
  [K in keyof T]: FilterObject<T[K]>;
};
/**
 * const objFilteredByValue: {
 *   a: number;
 *   b: never;
 * }
 *
 * notice that objFilteredByValue.b is still accessible even though it is never
 *  */
declare const objFilteredByValue: ObjectFilteredByPrimitiveValue<typeof obj>;
objFilteredByValue.b; // ??? <-- we do not want key "b" to be accessible.

/**
 * "FilterPrmitiveKeys" filters out the keys that have object values.
 * So, the keys that have primitive or array values are returned.
 *  */
type FilterPrmitiveKeys<T, K> = K extends keyof T
  ? T[K] extends object
    ? T[K] extends unknown[]
      ? K
      : never
    : K
  : never;

type ObjectFilteredByPrimitiveKey<T extends object> = {
  [K in FilterPrmitiveKeys<T, keyof T>]: T[K];
};

declare const objFilteredByPrimitiveKey: ObjectFilteredByPrimitiveKey<
  typeof obj
>;
/**
 * const objFilteredByPrimitiveKey: {
 *   a: number;
 *   h: number[];
 * }
 * */
objFilteredByPrimitiveKey.b; // now "b" is not accessible and this is what we want.

/**
 * "FilterObjectKeys" filters out the keys that have primitive values.
 * So, the keys that have object values are returned.
 *  */
type FilterObjectKeys<T, K> = K extends keyof T
  ? T[K] extends object
    ? T[K] extends unknown[]
      ? never
      : K
    : never
  : K;

type ObjectFilteredByObjectKey<T extends object> = {
  [K in FilterObjectKeys<T, keyof T>]: T[K];
};

/**
 * const objFilteredByObjectKey: {
 *   b: {
 *       c: number;
 *       d: {
 *           e: number;
 *           f: {
 *               g: number;
 *           };
 *       };
 *   };
 *   i: {
 *       j: string;
 *       k: string[];
 *   };
 * }
 *
 * objFilteredByObjectKey now only has keys that have object values.
 * */
declare const objFilteredByObjectKey: ObjectFilteredByObjectKey<typeof obj>;

/**
 * From this point, we want to flatten the nested object such that
 * keys "b" and "i" are not necessary.
 *
 * For example, any key that has object values should be removed and keys
 * of the object values should be lifted to the parent object.
 *
 * So, the object should look like this:
 * {
 *    c: number;
 *    e: number;
 *    g: number;
 *    j: string;
 *    k: string[];
 * }
 *  */
type valueof<T extends object> = T[keyof T];
type LiftedObject<T extends object> = valueof<ObjectFilteredByObjectKey<T>>;
/**
 * const liftedObj: {
 *   c: number;
 *   d: {
 *       e: number;
 *       f: {
 *           g: number;
 *       };
 *   };
 * } | {
 *    j: string;
 *    k: string[];
 * }
 *
 * notice that liftedObj now does not have keys "a", "b", "h" and "i".
 * liftedObj is expressed as a union type ("|") because it can be either of the two objects.
 * However, we want to flatten the object such that it is a single (intersection (&)) object.
 * like below:
 * {
 *    c: number;
 *    e: number;
 *    g: number;
 *    j: string;
 *    k: string[];
 * }
 * */
declare const liftedObj: LiftedObject<typeof obj>;

/**
 * Intersection type converts a union type to an intersection type.
 * Although the type signature is counter-intuitive, it is useful in this case.
 * Following is the breakdown of the type signature:
 *
 * Full Signature: (T extends any ? (_: T) => void : never) extends (_: infer S) => void ? S : never
 * 1. (T extends any ? (_: T) => void : never)
 *  - This part is a conditional type that checks if T extends any (which always succeeds).
 *  - If T extends any, it returns a function that takes T as an argument and returns void.
 *
 *  Why is this part necessary? What is the difference between
 *  "T extends any ? (_: T) => void : never" vs "(_: T) => void"?
 *
 *  Consider T is "number | string".
 *  "(_: T) => void" can be interpreted as "(number | string) => void".
 *
 *  However, if we apply "number | string" to the conditional clause,
 *  "T extends any ? (_: T) => void : never" gets evaluated as "(number) => void | (string) => void".
 *  This is because the compiler applies "distributive law" when the conditional clause is applied to each type in the union type.
 *
 * 2. { ... } extends (_: infer S) => void ? S : never
 *  - This part is another conditional type that checks if the function signature extends (_: infer S) => void.
 *
 *  This part is somewhat tricky and what really makes an intersection type.
 *
 *  Again, consider T is "number | string".
 *  Now the signature of the function can be re-written as:
 *  ((number) => void | (string) => void) extends (_: infer S) => void ? S : never
 *
 *  In order for the compiler to evaluate this conditional type, compiler assumes the
 *  inferred type S to be the "subtype" of the union type (number | string).
 *
 *  Usually, the typescript compiler evaluates the inferred type to be the "supertype" of the union type.
 *  However, in this case, the compiler evaluates the inferred type to be the "subtype" of the union type
 *  because the function signature is a "contravariant" position.
 *
 *  For example, if the function signature is (_: number) => void, the inferred type S would be "number".
 *  If the function signature is (_: string) => void, the inferred type S would be "string".
 *  Therefore, if the function signature is (_: number) => void | (_: string) => void, the inferred type S would be "number & string".
 * */
type Intersection<T> = (T extends any ? (_: T) => void : never) extends (
  _: infer S
) => void
  ? S
  : never;

/**
 * const flattenedIntersection: {
 *   c: number;
 *   d: {
 *       e: number;
 *       f: {
 *           g: number;
 *       };
 *   };
 * } & {
 *   j: string;
 *   k: string[];
 * }
 *  */
type UnwrappedObject<T extends object> = Intersection<LiftedObject<T>>;
declare const flattenedIntersection: UnwrappedObject<typeof obj>;

type SingleDepthFlattened<T extends object> = ObjectFilteredByPrimitiveKey<T> &
  UnwrappedObject<T>;

/**
 * const singleDepthFlattened: {
 *    a: number;
 *    h: number[];
 *    c: number;
 *    d: {
 *        e: number;
 *        f: {
 *            g: number;
 *        };
 *    };
 *    j: string;
 *    k: string[];
 * }
 *  */
declare const singleDepthFlattened: SingleDepthFlattened<typeof obj>;

type MultiDepthFlattened<T extends object> = ObjectFilteredByPrimitiveKey<T> &
  RecursivelyUnwrappedObject<T>;
type RecursiveFlattener<T> = T extends object ? MultiDepthFlattened<T> : never;
type RecursivelyUnwrappedObject<T extends object> = Intersection<
  RecursiveFlattener<LiftedObject<T>>
>;
type Flattened<T extends object> = ObjectFilteredByPrimitiveKey<T> &
  RecursivelyUnwrappedObject<T>;

declare const f0: typeof obj & {};
declare const f1: ObjectFilteredByPrimitiveKey<typeof obj> & {};
declare const f2: ObjectFilteredByObjectKey<typeof obj> & {};
declare const f3: LiftedObject<typeof obj> & {};
declare const f4: Intersection<LiftedObject<typeof obj>> & {};
declare const f5: SingleDepthFlattened<typeof obj> & {};
declare const f6: RecursiveFlattener<typeof obj> & {};
declare const f7: Intersection<RecursiveFlattener<typeof obj>> & {};
declare const f8: RecursiveFlattener<LiftedObject<typeof obj>> & {};
declare const f9: Intersection<
  RecursiveFlattener<LiftedObject<typeof obj>>
> & {};
declare const f10: Flattened<typeof obj> & {};
const flattenedObj = flatten(obj);
