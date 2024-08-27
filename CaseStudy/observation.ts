function UUID() {
  return crypto.randomUUID();
}
type ObservationID = ReturnType<typeof UUID>;
type ObjectIdentifier = ObservationID;
type Maybe<T> = T | null | undefined;
type KeyPath<T> = {
  [K in keyof T]: K extends string ? K : never;
}[keyof T];

var GLOBAL_ACCESS_LIST: Maybe<AccessList>;

interface Observable {}
class Observation {
  id: ObservationID = UUID();
  keyPaths: Set<string>;
  closure: () => void;

  constructor(keyPaths: Set<string>, closure: () => void) {
    this.keyPaths = keyPaths;
    this.closure = closure;
  }
}
class ObservationRegistrar {
  lookups: Record<string, Set<ObservationID>> = {};
  observations: Record<ObservationID, Observation> = {};

  access<TSubject extends Observable>(
    subject: TSubject,
    keyPath: KeyPath<TSubject>
  ) {
    if (GLOBAL_ACCESS_LIST) GLOBAL_ACCESS_LIST.trackAccess(this, keyPath);
    console.log(`access(${keyPath})`);
  }

  withMutation<TSubject, TMutated>(
    subject: TSubject,
    keyPath: KeyPath<TSubject>,
    mutate: () => TMutated
  ): Maybe<TMutated> {
    console.log(`withMutation(${keyPath})`);
    const observationIds = this.lookups[keyPath];
    if (observationIds) {
      for (const observationId of observationIds) {
        const observation = this.observations[observationId];
        if (observation) {
          observation.closure();
          for (const eachKeyPath of observation.keyPaths) {
            // this.lookups[eachKeyPath]?.delete(observation.id);
          }
        } else console.log("withMutation no observation");
      }
    } else {
      // console.log(`withMutation no observationIds ${JSON.stringify(this.lookups, null, 2)}`)
      console.log(`withMutation no observationIds ${this.lookups}`);
    }

    try {
      return mutate();
    } catch {
      return null;
    }
  }

  cancel(observationId: ObservationID) {
    const observation = this.observations[observationId];
    if (observation) {
      for (const keyPath of observation.keyPaths) {
        // this.lookups[keyPath].delete(observation.id);
        // if (!this.lookups[keyPath].size) delete this.lookups[keyPath];
      }
      // delete this.observations[observationId];
    }
  }

  registerOnChange(keyPaths: Set<string>, onChange: () => void): ObservationID {
    const observation = new Observation(keyPaths, onChange);
    this.observations[observation.id] = observation;
    for (const keyPath of keyPaths) {
      console.log(`keyPath: ${keyPath}`);
      if (this.lookups[keyPath]) {
        this.lookups[keyPath].add(observation.id);
        console.log(
          `registerOnChange on ObservationRegistrar called ${Array.from(
            this.lookups[keyPath]
          )}`
        );
      } else {
        console.log(`lookups missing`);
        for (const key in this.lookups) {
          console.log(`lookups missing: ${key}`);
        }
      }
    }
    return observation.id;
  }
}

class Entry {
  registrar: ObservationRegistrar;
  keyPaths: Set<string> = new Set();
  constructor(r: ObservationRegistrar) {
    this.registrar = r;
  }
}

class AccessList {
  entries: Record<ObjectIdentifier, Entry> = {};
  trackAccess(r: ObservationRegistrar, kp: string) {
    let id = UUID();
    if (!this.entries[id]) this.entries[id] = new Entry(r);
    this.entries[id].keyPaths.add(kp);
    console.log(`AccessList entries ${Array.from(this.entries[id].keyPaths)}`);
  }
  registerOnChange(thunk: () => void) {
    console.log("registerOnChange on AccessList called");
    const observationIds: Record<ObjectIdentifier, ObservationID> = {};
    const processThunk = () => {
      thunk();
      for (const [key, value] of Object.entries(observationIds)) {
        const registrarId = key as ObjectIdentifier;
        const observationId = value as ObservationID;
        this.entries[registrarId]?.registrar.cancel(observationId);
      }
    };
    for (const [key, entry] of Object.entries(this.entries)) {
      const registrar = entry.registrar;
      const keyPaths = entry.keyPaths;
      console.log(`AccessList keypaths ${Array.from(keyPaths)}`);
      const observationId = registrar.registerOnChange(keyPaths, processThunk);
      observationIds[key as ObjectIdentifier] = observationId;
    }
  }
}

function Observable<T extends { new (...args: any[]): object }>(
  constructor: T
) {
  return class extends constructor {
    _$observationRegistrar = new ObservationRegistrar();
    access(keyPath: KeyPath<typeof this>) {
      this._$observationRegistrar.access(this, keyPath);
    }
    withMutation(keyPath: KeyPath<typeof this>, mutate: () => unknown) {
      this._$observationRegistrar.withMutation(this, keyPath, mutate);
    }

    constructor(...args: any[]) {
      super(...args);

      Object.keys(this).forEach((key) => {
        if (
          key === "_$observationRegistrar" ||
          key === "access" ||
          key === "withMutation"
        )
          return;

        const privateKey = `__$${key}`;
        (this as any)[privateKey] = (this as any)[key];
        Object.defineProperty(this, key, {
          get() {
            this.access(key);
            return (this as any)[privateKey];
          },
          set(value: any) {
            this.withMutation(key, () => {
              (this as any)[privateKey] = value;
            });
          },
          configurable: true,
          enumerable: true,
        });
      });
    }
  };
}

function withObservationTracking<T>(apply: () => T, onChange: () => void): T {
  GLOBAL_ACCESS_LIST = new AccessList();
  const result = apply();
  if (GLOBAL_ACCESS_LIST) GLOBAL_ACCESS_LIST.registerOnChange(onChange);
  return result;
}

@Observable
class Test {
  a: number = 1;
  b: string = "b";
  c: number;
  constructor(c: number) {
    this.c = c;
  }
  setC(c: number) {
    this.c = c;
  }
}

const t = new Test(9);
withObservationTracking(
  () => {
    console.log(`Observing property of ${t.c}`);
  },
  () => {
    console.log("A property has changed");
  }
);

t.c = 10;
t.a;
