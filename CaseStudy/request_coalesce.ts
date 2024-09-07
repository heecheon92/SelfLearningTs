/**
 * Simulates an asynchronous thread execution context.
 * The provided asynchronous function is executed after a random delay to simulate concurrent execution.
 *
 * @param {() => Promise<void>} fn The asynchronous function to be executed.
 */
function thread(fn: () => Promise<void>) {
  setTimeout(fn, Math.floor(Math.random() * 1000));
}

/**
 * Simulates a network request by fetching a resource and delaying the response.
 *
 * @returns {Promise<Response>} A promise that resolves with the fetch response after a delay.
 */
async function someFetchRequest() {
  console.log("Making request...");
  await new Promise((resolve) => setTimeout(resolve, 2000));
  return await fetch("https://jsonplaceholder.typicode.com/todos/1");
}

/**
 * Continuation represents a point in a program where execution can be paused and resumed at a later time.
 * In computer science, continuations are a concept related to control flow, where a continuation represents
 * the future of a computation (i.e., what should happen next). In this implementation, `Continuation` allows
 * a promise to be explicitly resumed by either resolving it with a value or rejecting it with an error.
 *
 * @template T The type of value that the continuation will resolve to.
 * @template U The type of error that the continuation may reject with.
 * @extends {Promise<T>}
 */
class Continuation<T, U extends Error> extends Promise<T> {
  /**
   * Internal resolve function to resume the continuation by returning a value.
   * @private
   * @type {(value: T | PromiseLike<T>) => void}
   */
  private readonly $_resolve: (value: T | PromiseLike<T>) => void;

  /**
   * Internal reject function to resume the continuation by throwing an error.
   * @private
   * @type {(reason: U | unknown) => void}
   */
  private readonly $_reject: (reason: U | unknown) => void;

  /**
   * The stack trace from when the continuation was created, used for debugging purposes.
   * @type {string | undefined}
   */
  public initialCallStack: Error["stack"];

  /**
   * Creates a new continuation, which is a promise that can be manually resumed or rejected.
   *
   * @param {ConstructorParameters<typeof Promise<T>>[0]} executor Optional executor function for the promise.
   */
  constructor(
    executor: ConstructorParameters<typeof Promise<T>>[0] = () => {}
  ) {
    let resolver: (value: T | PromiseLike<T>) => void;
    let rejector: (reason: U | unknown) => void;

    super((resolve, reject) => {
      resolver = resolve;
      rejector = reject;
      return executor(resolve, reject);
    });

    this.$_resolve = resolver!;
    this.$_reject = rejector!;

    // Capture the initial call stack to preserve context in case of an error
    this.initialCallStack = Error().stack?.split("\n").slice(2).join("\n");
  }

  /**
   * Resumes the continuation by resolving it with the given value.
   *
   * @param {T | PromiseLike<T>} value The value to resolve the promise with.
   */
  public resumeByReturning(value: T | PromiseLike<T>): void {
    this.$_resolve(value);
  }

  /**
   * Resumes the continuation by rejecting it with the given error.
   * It also modifies the error stack to include the original stack trace.
   *
   * @param {U | unknown} error The error to reject the promise with.
   */
  public resumeByThrowing<UError extends U>(error: UError | unknown): void {
    if (error instanceof Error) {
      error.stack = [error.stack?.split("\n")[0], this.initialCallStack].join(
        "\n"
      );
    }
    this.$_reject(error);
  }
}

/**
 * A class that coalesces concurrent requests and returns a shared result once
 * the first request completes. Prevents duplicate network requests by queuing
 * subsequent requests and resolving them with the result of the first request.
 *
 * @template T The type of the result returned by the request.
 */
class RequestCoalescer<T> {
  /**
   * Lock to ensure only one request is active at a time.
   *
   * @private
   * @type {boolean}
   */
  private lock: boolean = false;

  /**
   * Queue of continuations that will be resumed once the request completes.
   *
   * @private
   * @type {Continuation<T, Error>[]}
   */
  private continuationQueue: Continuation<T, Error>[] = [];

  /**
   * Coalesces requests by creating a new continuation and adding it to the queue.
   *
   * @private
   * @returns {Continuation<T, Error>} The continuation that will be resumed when the request completes.
   */
  private coalesce(): Continuation<T, Error> {
    const cont = new Continuation<T, Error>();
    this.continuationQueue.push(cont);
    return cont;
  }

  /**
   * Initiates a request if none is in progress. If a request is in progress,
   * it queues the current request and resolves it once the first request completes.
   *
   * @returns {Promise<T>} A promise that resolves with the result of the request.
   */
  public async request(): Promise<T> {
    if (this.lock) return this.coalesce();
    this.lock = true;
    try {
      const result = await someFetchRequest();
      const payload = await result.json();
      this.resumeByReturning(payload);
      return payload;
    } catch (e) {
      this.resumeByThrowing(e);
      throw e;
    } finally {
      this.lock = false;
    }
  }

  /**
   * Resolves all queued continuations with the result of the request.
   *
   * @param {T} result The result of the completed request.
   */
  public resumeByReturning(result: T): void {
    this.continuationQueue.forEach((cont) => cont.resumeByReturning(result));
    this.continuationQueue = [];
  }

  /**
   * Rejects all queued continuations with the error encountered during the request.
   *
   * @param {Error | unknown} e The error that occurred during the request.
   */
  public resumeByThrowing(e: Error | unknown): void {
    this.continuationQueue.forEach((cont) => cont.resumeByThrowing(e));
    this.continuationQueue = [];
  }
}

// Example usage of RequestCoalescer with threads
const coalescer = new RequestCoalescer();
const t1 = thread;
const t2 = thread;
const t3 = thread;
const t4 = thread;

t1(async () => {
  console.log(`Thread 1 begins`);
  const result = await coalescer.request();
  console.log(`Thread 1: ${JSON.stringify(result)}`);
});

t2(async () => {
  console.log(`Thread 2 begins`);
  const result = await coalescer.request();
  console.log(`Thread 2: ${JSON.stringify(result)}`);
});

t3(async () => {
  console.log(`Thread 3 begins`);
  const result = await coalescer.request();
  console.log(`Thread 3: ${JSON.stringify(result)}`);
});

t4(async () => {
  console.log(`Thread 4 begins`);
  const result = await coalescer.request();
  console.log(`Thread 4: ${JSON.stringify(result)}`);
});
