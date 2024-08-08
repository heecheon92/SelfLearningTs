// this file requires `--experimentalDecorator` flag to compile correctly.

// method decorator
export function bound_method(
  _target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const originalMethod = descriptor.value;
  const adjDescriptor: PropertyDescriptor = {
    configurable: true,
    enumerable: false,
    get() {
      return originalMethod.bind(this);
    },
    set(value) {
      Object.defineProperty(this, propertyKey, {
        value,
        configurable: true,
        writable: true,
      });
    },
  };
  return adjDescriptor;
}

// class decorator
export function autobind<T extends { new (...args: any[]): object }>(
  constructor: T
): T {
  const keys = Object.getOwnPropertyNames(constructor.prototype);

  keys.forEach((key) => {
    if (key === "constructor") {
      return;
    }

    const descriptor = Object.getOwnPropertyDescriptor(
      constructor.prototype,
      key
    );

    if (descriptor && typeof descriptor.value === "function") {
      Object.defineProperty(
        constructor.prototype,
        key,
        bound_method(constructor.prototype, key, descriptor)
      );
    }
  });

  return constructor;
}

// Example
class NormalClass {
  constructor(public name: string) {}

  printName() {
    console.log(this.name);
  }
}

class AutobindMethod {
  constructor(public name: string) {}

  /**
   * same as this.printName = this.printName.bind(this);
   *  */
  @bound_method
  printName() {
    console.log(this.name);
  }
}

/**
 * applies @bound_method decorator to all methods in the class
 *  */
@autobind
class AutobindClass {
  constructor(public name: string) {}

  printName() {
    console.log(this.name);
  }
}

const na = new NormalClass("Normal A");
const nb = new NormalClass("Normal B");

na.printName = nb.printName;
na.printName(); // Normal A

const aa = new AutobindMethod("AutobindMethod A");
const ab = new AutobindMethod("AutobindMethod B");

aa.printName = ab.printName;
aa.printName(); // AutobindMethod B

const ca = new AutobindClass("AutobindClass A");
const cb = new AutobindClass("AutobindClass B");

ca.printName = cb.printName;
ca.printName(); // AutobindClass A
