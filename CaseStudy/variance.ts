type Job = {
  enqueuedAt: Date;
  transactionId: string;
  name: string;
};

type PriorityJob = Job & { priority: 1 | 2 | 3 };

/**
 * typical "inheritance"-like relationship
 * "priorityJob" is a subtype of "job" because it has all the properties of "job" and some more
 * and therefore is assignable to the variable j2 (of type Job).
 * */
declare const job: Job;
declare const priorityJob: PriorityJob;
const j1: Job = job;
const j2: Job = priorityJob;

/**
 * COVARIANCE
 * "priorityJobArray" is a type of "Array<PriorityJob>" and is a subtype of "Array<Job>"
 * because it has all the properties of "Array<Job>" and some more.
 * This illustrates the typical and familiar covariance of arrays in TypeScript.
 * */
declare const jobArray: Array<Job>;
declare const priorityJobArray: Array<PriorityJob>;
const j3: Array<Job> = jobArray;
const j4: Array<Job> = priorityJobArray;

/**
 * CONTRAVARIANCE
 * "priorityJobExecutor" is a type of "Executor<PriorityJob>"; however, is not a subtype of "Executor<Job>"
 * This illustrates the contravariance of functions in TypeScript.
 * */
type Executor<T> = (arg: T) => "success" | "failure";

declare const jobExecutor: Executor<Job>;
declare const priorityJobExecutor: Executor<PriorityJob>;

const e1: Executor<Job> = jobExecutor;
/**
 * Error: Type 'Executor<PriorityJob>' is not assignable to type 'Executor<Job>'
 * because the function type 'Executor<Job>' expects an argument of type 'Job',
 * whereas 'Executor<PriorityJob>' expects an argument of type 'PriorityJob'.
 * This means that if we assign 'priorityJobExecutor' to 'e2', we could potentially pass
 * a 'Job' (which lacks the 'priority' property) to 'priorityJobExecutor', leading to a type error.
 * */
const e2: Executor<Job> = priorityJobExecutor;

/**
 * The following assignments are valid:
 *
 * 1. `e3: Executor<PriorityJob> = jobExecutor;`
 * This is valid because `jobExecutor` (an `Executor<Job>`) can handle any `PriorityJob` argument.
 * Since every `PriorityJob` is a `Job`, passing a `PriorityJob` to `jobExecutor` (which expects a `Job`) is safe.
 * The function `jobExecutor` can work with any subtype of `Job`, including `PriorityJob`.
 * */
const e3: Executor<PriorityJob> = jobExecutor;
/**
 * 2. `e4: Executor<PriorityJob> = priorityJobExecutor;`
 * This is valid because `priorityJobExecutor` is an `Executor<PriorityJob>`, and assigning it to another
 * `Executor<PriorityJob>` is straightforward and type-compatible since they are exactly the same type.
 */
const e4: Executor<PriorityJob> = priorityJobExecutor;

/**
 * InvariantQueue<T> is a generic type that is invariant in T.
 * Invariance means that InvariantQueue<A> is neither a subtype nor a supertype of InvariantQueue<B>,
 * even if A is a subtype or supertype of B.
 *
 * For example, InvariantQueue<PriorityJob> is not assignable to InvariantQueue<Job> and vice versa,
 * regardless of the relationship between PriorityJob and Job.
 * */
type InvariantQueue<in out T> = {
  enqueue: (item: T) => void;
  dequeue: () => T;
};
declare const jobInvariantQueue: InvariantQueue<Job>;
declare const priorityJobInvariantQueue: InvariantQueue<PriorityJob>;
const q3: InvariantQueue<Job> = jobInvariantQueue;
/**
 * Error: Type 'InvariantQueue<PriorityJob>' is not assignable to type 'InvariantQueue<Job>'
 * because `InvariantQueue` is invariant. This means `InvariantQueue<PriorityJob>` is not a subtype of `InvariantQueue<Job>`,
 * nor is `InvariantQueue<Job>` a subtype of `InvariantQueue<PriorityJob>`.
 *
 * If `priorityJobInvariantQueue` (an `InvariantQueue<PriorityJob>`) were assigned to `q4`, it would mean that
 * you could enqueue a `Job` (which lacks the `priority` property) into a queue that expects only `PriorityJob`,
 * causing a type safety issue.
 * */
const q4: InvariantQueue<Job> = priorityJobInvariantQueue;
/**
 * Error: Type 'InvariantQueue<Job>' is not assignable to type 'InvariantQueue<PriorityJob>'
 * because `InvariantQueue` is invariant. This means `InvariantQueue<Job>` is not a subtype of `InvariantQueue<PriorityJob>`,
 * nor is `InvariantQueue<PriorityJob>` a subtype of `InvariantQueue<Job>`.
 *
 * If `jobInvariantQueue` (an `InvariantQueue<Job>`) were assigned to `q5`, it would mean that
 * you could dequeue a `Job` from a queue that expects only `PriorityJob`, resulting in a `Job`
 * (which lacks the `priority` property) being treated as a `PriorityJob`, causing a type safety issue.
 * */
const q5: InvariantQueue<PriorityJob> = jobInvariantQueue;
const q6: InvariantQueue<PriorityJob> = priorityJobInvariantQueue;

/**
 * CovariantQueue<T> is a generic type that is covariant in T.
 * Covariance means that if A is a subtype of B, then CovariantQueue<A> is a subtype of CovariantQueue<B>.
 *
 * For example, CovariantQueue<PriorityJob> is assignable to CovariantQueue<Job>.
 *
 * However, including an `enqueue` method in a covariant type causes issues
 * because covariance only works safely with output (i.e., methods that return T, like `dequeue`).
 * With the `enqueue` method, you are trying to accept inputs of type T, which requires contravariance.
 * This creates a conflict because covariance and contravariance cannot be applied to the same type parameter in this way.
 * */
type CovariantQueue<out T> = {
  // enqueue: (item: T) => void;
  dequeue: () => T;
};

declare const jobCovariantQueue: CovariantQueue<Job>;
declare const priorityJobCovariantQueue: CovariantQueue<PriorityJob>;

const cq1: CovariantQueue<Job> = jobCovariantQueue;
const cq2: CovariantQueue<Job> = priorityJobCovariantQueue;
/**
 * Error: Type 'CovariantQueue<Job>' is not assignable to type 'CovariantQueue<PriorityJob>'
 * because `CovariantQueue<Job>` is not a subtype of `CovariantQueue<PriorityJob>`.
 * Covariance only works in one direction - from more specific to less specific.
 * */
const cq3: CovariantQueue<PriorityJob> = jobCovariantQueue;
const cq4: CovariantQueue<PriorityJob> = priorityJobCovariantQueue;

/**
 * ContravariantQueue<T> is a generic type that is contravariant in T.
 * Contravariance means that if B is a subtype of A, then ContravariantQueue<A> is a subtype of ContravariantQueue<B>.
 *
 * For example, ContravariantQueue<Job> is assignable to ContravariantQueue<PriorityJob>.
 *
 * However, including a `dequeue` method in a contravariant type causes issues because contravariance only works safely with input (i.e., methods that accept T, like `enqueue`).
 * With the `dequeue` method, you are trying to produce outputs of type T, which requires covariance.
 * This creates a conflict because covariance and contravariance cannot be applied to the same type parameter in this way.
 * */
type ContravariantQueue<in T> = {
  enqueue: (item: T) => void;
  // dequeue: () => T;
};

declare const jobContravariantQueue: ContravariantQueue<Job>;
declare const priorityJobContravariantQueue: ContravariantQueue<PriorityJob>;
const cq5: ContravariantQueue<Job> = jobContravariantQueue;
/**
 * Error: Type 'ContravariantQueue<PriorityJob>' is not assignable to type 'ContravariantQueue<Job>'
 * because `ContravariantQueue<PriorityJob>` is not a subtype of `ContravariantQueue<Job>`.
 * Contravariance only works in one direction - from less specific to more specific.
 *
 * Allowing this assignment would mean you could enqueue a `Job` (which lacks the `priority` property)
 * into a queue that expects only `PriorityJob`, causing a type safety issue.
 * Additionally, it would mean you could dequeue a `PriorityJob` from a queue that expects only `Job`,
 * resulting in treating a `PriorityJob` (more specific) as a `Job` (less specific), causing a type safety issue.
 * */
const cq6: ContravariantQueue<Job> = priorityJobContravariantQueue;
/**
 * Error: Type 'ContravariantQueue<Job>' is not assignable to type 'ContravariantQueue<PriorityJob>'
 * because `ContravariantQueue<Job>` is not a subtype of `ContravariantQueue<PriorityJob>`.
 * Contravariance only works in one direction - from less specific to more specific.
 *
 * Allowing this assignment would mean you could dequeue a `Job` from a queue that expects only `PriorityJob`,
 * resulting in treating a `Job` (less specific) as a `PriorityJob` (more specific), causing a type safety issue.
 * */
const cq7: ContravariantQueue<PriorityJob> = jobContravariantQueue;
const cq8: ContravariantQueue<PriorityJob> = priorityJobContravariantQueue;

/**
 * Attempting to define BivariantQueue<T> as an intersection type:
 *
 * type BivariantQueue<T> = CovariantQueue<T> & ContravariantQueue<T>;
 *
 * This approach does not work because TypeScript cannot safely combine
 * both covariance and contravariance for the same type parameter T in a type intersection.
 * TypeScript enforces strict type safety, and combining these conflicting variances
 * in a single type definition leads to type safety issues.
 *
 * For instance, `BivariantQueue<PriorityJob>` cannot be safely assigned to `BivariantQueue<Job>`
 * and vice versa due to the conflicting nature of covariance and contravariance.
 * */

// type BivariantQueue<T> = CovariantQueue<T> & ContravariantQueue<T>

/**
 * Defining BivariantQueue<T> as a class works because:
 *
 * 1. The class can implement both covariant and contravariant behaviors through its methods.
 * 2. TypeScript allows methods within a class to handle input (contravariant) and output (covariant)
 *    separately, thus maintaining type safety.
 * 3. The class-based approach encapsulates the logic, ensuring that type operations are handled safely,
 *    and the class can be instantiated and used with specific type arguments without violating type safety.
 * */
class BivariantQueue<T> implements CovariantQueue<T>, ContravariantQueue<T> {
  private items: T[] = [];

  enqueue(item: T): void {
    this.items.push(item);
  }

  dequeue(): T {
    if (this.items.length === 0) {
      throw new Error("Queue is empty");
    }
    return this.items.shift()!;
  }
}

declare const jobBivariantQueue: BivariantQueue<Job>;
declare const priorityJobBivariantQueue: BivariantQueue<PriorityJob>;

const bq1: BivariantQueue<Job> = jobBivariantQueue;
const bq2: BivariantQueue<Job> = priorityJobBivariantQueue;
/**
 * Error: Type 'BivariantQueue<Job>' is not assignable to type 'BivariantQueue<PriorityJob>'.
 * CovariantQueue<Job> cannot be assigned to CovariantQueue<PriorityJob> because Job is not a subtype of PriorityJob.
 * ContravariantQueue<PriorityJob> cannot be assigned to ContravariantQueue<Job> because PriorityJob is not a supertype of Job.
 * This assignment would break type safety by allowing incorrect enqueuing and dequeuing operations.
 * */
const bq3: BivariantQueue<PriorityJob> = jobBivariantQueue;
const bq4: BivariantQueue<PriorityJob> = priorityJobBivariantQueue;
