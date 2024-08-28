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
    _subject: TSubject,
    keyPath: KeyPath<TSubject>
  ) {
    if (GLOBAL_ACCESS_LIST) GLOBAL_ACCESS_LIST.trackAccess(this, keyPath);
    console.log(`access(${keyPath}) [${Object.keys(this.lookups)}]`);
  }

  withMutation<TSubject, TMutated>(
    _subject: TSubject,
    keyPath: KeyPath<TSubject>,
    mutate: () => TMutated
  ): Maybe<TMutated> {
    console.log(`withMutation(${keyPath}) [${Object.keys(this.lookups)}]`);
    const observationIds = this.lookups[keyPath];
    if (observationIds) {
      for (const observationId of observationIds) {
        const observation = this.observations[observationId];
        if (observation) {
          observation.closure();
          for (const eachKeyPath of observation.keyPaths) {
            this.lookups[eachKeyPath]?.delete(observation.id);
          }
        }
      }
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
        this.lookups[keyPath].delete(observation.id);
        if (!this.lookups[keyPath].size) delete this.lookups[keyPath];
      }
      delete this.observations[observationId];
    }
  }

  registerOnChange(keyPaths: Set<string>, onChange: () => void): ObservationID {
    const observation = new Observation(keyPaths, onChange);
    this.observations[observation.id] = observation;
    for (const keyPath of keyPaths) {
      if (!this.lookups[keyPath]) {
        this.lookups[keyPath] = new Set();
      }
      this.lookups[keyPath].add(observation.id);
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
  }
  registerOnChange(thunk: () => void) {
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
      const observationId = registrar.registerOnChange(keyPaths, processThunk);
      observationIds[key as ObjectIdentifier] = observationId;
    }
  }
}

function withObservationTracking<T>(apply: () => T, onChange: () => void): T {
  GLOBAL_ACCESS_LIST = new AccessList();
  const result = apply();
  GLOBAL_ACCESS_LIST?.registerOnChange(onChange);
  return result;
}

/**
 * A decorator function that simulates SwiftUI's @Observable macro in TypeScript.
 * It wraps a class to automatically observe property changes and notify
 * the `ObservationRegistrar`. This is designed to closely mimic the behavior of
 * SwiftUI's `@Observable` macro.
 *
 * @template T - The type of the class being decorated.
 * @param {T} constructor - The constructor of the class being decorated.
 * @returns {T} A new class that extends the original class with observation functionality.
 */
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

@Observable
class Suspect {
  name: string = "";
  suspciousness: number = 0;
  constructor(name: string, suspiciousness: number) {
    this.name = name;
    this.suspciousness = suspiciousness;
  }
}

const suspect = new Suspect("Glib Butler", 33);
const suspect2 = new Suspect("Jimmy the Shrimp", 10);
withObservationTracking(
  () => {
    console.log(`Observing property of ${suspect.suspciousness}`); // <-- Only observing property of suspect.suspciousness
  },
  () => {
    console.log("A property has changed");
  }
);

/**
 * "suspect.name = "Glib Garlic";" does not trigger onChange callback of withObservationTracking
 * because "apply" block does NOT contain "suspect.name"
 * */
suspect.name = "Glib Garlic";
console.log(suspect2.name);
/**
 * "suspect.suspciousness = 30;" triggers onChange callback of withObservationTracking
 * because "apply" block contains "suspect.suspciousness"
 * */
suspect.suspciousness = 30;
