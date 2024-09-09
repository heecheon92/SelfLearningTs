/**
 * Simulates an asynchronous thread execution context.
 * The provided asynchronous function is executed after a random delay to simulate concurrent execution.
 */
function thread(fn: () => Promise<void>) {
  setTimeout(fn, Math.floor(Math.random() * 1000));
}

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
class Continuation<
  T,
  in TResolveParam extends T = T,
  in URejectParam extends Error = Error
> extends Promise<T> {
  private readonly $_resolve: (
    value: TResolveParam | PromiseLike<TResolveParam>
  ) => void;
  private readonly $_reject: (reason: URejectParam | unknown) => void;
  public initialCallStack: Error["stack"];

  constructor(
    executor: ConstructorParameters<typeof Promise<T>>[0] = () => {}
  ) {
    let resolver: (value: TResolveParam | PromiseLike<TResolveParam>) => void;
    let rejector: (reason: URejectParam | unknown) => void;

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

  public resumeByReturning<TReturn extends TResolveParam>(
    value: TReturn | PromiseLike<TReturn>
  ): void {
    this.$_resolve(value);
  }

  public resumeByThrowing<TError extends URejectParam>(
    error: TError | unknown
  ): void {
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
  private lock: boolean = false;
  private continuationQueue: Continuation<T>[] = [];

  private coalesce(): Continuation<T> {
    const cont = new Continuation<T>();
    this.continuationQueue.push(cont);
    return cont;
  }

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

  public resumeByReturning(result: T): void {
    this.continuationQueue.forEach((cont) => cont.resumeByReturning(result));
    this.continuationQueue = [];
  }

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
