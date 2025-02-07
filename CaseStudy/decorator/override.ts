/**
 * A decorator to indicate that a method overrides a method from its parent class.
 * This decorator must be used only on inherited methods.
 *
 * @param target The prototype of the class to which the decorator is applied.
 * @param propertyKey The name of the method to which the decorator is applied.
 * @param descriptor The property descriptor of the decorated method.
 *
 *  예시:
 *
 * ```ts
 * class Parent {
 *    hi() { console.log("hi"); }
 * }
 *
 * class Child extends Parent {
 *    @override hi() { console.log("hello"); } // Ok
 *    @override bye() { console.log("bye"); } // Error: Method "bye" does not override any method of the parent class.
 * }
 * ```
 */
export function override<T extends object>(
  target: T,
  propertyKey: string,
  descriptor?: PropertyDescriptor
): void {
  let parentProto = Object.getPrototypeOf(target);
  if (!parentProto) {
    throw new Error(
      `@override decorator can only be used in classes that extend a parent class.`
    );
  }

  let found = false;
  while (parentProto) {
    if (Object.prototype.hasOwnProperty.call(parentProto, propertyKey)) {
      found = true;
      break;
    }
    parentProto = Object.getPrototypeOf(parentProto);
  }

  if (!found) {
    throw new Error(
      `Method "${propertyKey}" does not override any method of the parent class.`
    );
  }
}
