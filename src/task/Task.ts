
/**
 * Represents the lifecycle state of a task.
 *
 * Each member denotes a distinct phase in the task's execution:
 * - Created: The task has been instantiated but not yet started.
 * - Running: The task is currently executing.
 * - Faulted: The task has completed due to an error/exception.
 * - Canceled: The task was canceled before it could complete.
 * - RanToCompletion: The task finished successfully.
 *
 * Use this enum to track task progress and handle control flow based on the task's outcome.
 *
 * @public
 */
export enum TaskStatus {
    Created = "Created",
    Running = "Running",
    Faulted = "Faulted",
    Canceled = "Canceled",
    RanToCompletion = "RanToCompletion",
}

/**
 * Represents a Task that encapsulates asynchronous operations, similar to .NET's Task class.
 * Provides methods for handling task completion, continuation, and status tracking.
 * Implements PromiseLike interface for compatibility with Promise-based APIs and async/await.
 * 
 * @template T The type of the result produced by this Task.
 * 
 * @example
 * ```typescript
 * const task = new Task<string>((resolve) => {
 *   setTimeout(() => resolve("Hello"), 1000);
 * });
 * 
 * // Using with async/await
 * const result = await task;
 * 
 * // Using continuation
 * task.continueWith(completedTask => {
 *   console.log(completedTask.result);
 * });
 * ```
 * 
 * @implements {PromiseLike<T>}
 */
export class Task<T> implements PromiseLike<T> {
    private readonly internalPromise: Promise<T>;
    private currentStatus: TaskStatus = TaskStatus.Created;
    private resultValue: T | undefined;
    private error: any | undefined;

    /**
     * Gets the current execution status of the Task.
     * @returns {TaskStatus} The current status.
     */
    public get status(): TaskStatus {
        return this.currentStatus;
    }

    /**
     * Gets the result of the Task.
     * * Throws an error if the Task has not completed successfully.
     * @returns {T} The result value.
     * @throws {Error} If the Task status is not RanToCompletion.
     */
    public get result(): T {
        if (this.currentStatus !== TaskStatus.RanToCompletion) {
            throw new Error(`Task has not completed successfully. Current status: ${this.currentStatus}`);
        }
        return this.resultValue as T;
    }

    /**
     * Creates a new Task that will execute the provided asynchronous operation.
     * @param {function(resolve: (value: T) => void, reject: (reason?: any) => void): void} executor 
     * The function to be executed by the Task.
     */
    constructor(
        executor: (resolve: (value: T) => void, reject: (reason?: any) => void) => void
    ) {
        this.currentStatus = TaskStatus.Running;
        this.internalPromise = new Promise<T>((resolve, reject) => {
            try {
                executor(
                    (value) => {
                        this.resultValue = value;
                        this.currentStatus = TaskStatus.RanToCompletion;
                        resolve(value);
                    },
                    (reason) => {
                        this.error = reason;
                        this.currentStatus = TaskStatus.Faulted;
                        reject(reason);
                    }
                );
            } catch (e) {
                this.error = e;
                this.currentStatus = TaskStatus.Faulted;
                reject(e);
            }
        });
    }


    /**
     * Creates a continuation that executes when the task completes.
     * The continuation will run regardless of the task's final state (success or failure).
     * 
     * @param continuation - A function to run after the task completes. 
     * The function receives the completed task and returns either a value or a Promise.
     * 
     * @typeparam TNew - The type of the value that the continuation returns
     * 
     * @returns A new Task that represents the continuation operation.
     * The returned task will complete with the result of the continuation,
     * or fail with any error thrown during the continuation's execution.
     * 
     * @example
     * ```typescript
     * const task = new Task<number>(...);
     * const continuation = task.continueWith(t => t.result * 2);
     * ```
     */
    public continueWith<TNew>(continuation: (task: Task<T>) => TNew | PromiseLike<TNew>): Task<TNew> {
        return new Task<TNew>((resolve, reject) => {
            this.internalPromise.then(
                () => { // Task resolved
                    try {
                        // Ensure the return value (TNew) is treated as a promise/value
                        Promise.resolve(continuation(this)).then(resolve, reject);
                    } catch (e) {
                        reject(e);
                    }
                },
                () => { // Task rejected/faulted
                    try {
                        // Continuation runs even on failure (default ContinueWith behavior)
                        Promise.resolve(continuation(this)).then(resolve, reject);
                    } catch (e) {
                        reject(e);
                    }
                }
            );
        });
    }


    /**
     * Attaches callbacks for the resolution and/or rejection of the Task.
     * @param onfulfilled The callback to execute when the Task is resolved.
     * @param onrejected The callback to execute when the Task is rejected.
     * @returns A Promise for the completion of which ever callback is executed.
     * @typeParam TResult1 The type of the value returned by the fulfilled promise.
     * @typeParam TResult2 The type of the value returned by the rejected promise.
     */
    public then<TResult1 = T, TResult2 = never>(
        onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | null | undefined,
        onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | null | undefined
    ): Promise<TResult1 | TResult2> {
        return this.internalPromise.then(onfulfilled, onrejected);
    }
}

/**
 * Represents a token that is observed by an operation (like TaskScheduler.delay) to 
 * check for cancellation requests.
 */
export class CancellationToken {
    private isCancellationRequestedInternal: boolean = false;
    private listeners: (() => void)[] = [];

    /**
     * Creates a CancellationToken.
     * @param {boolean} [initialState=false] Optional initial state for cancellation.
     */
    constructor(initialState: boolean = false) {
        this.isCancellationRequestedInternal = initialState;
    }

    /**
     * Gets a value that indicates whether cancellation has been requested for this token.
     * @returns {boolean} True if cancellation has been requested; otherwise, false.
     */
    public get isCancellationRequested(): boolean {
        return this.isCancellationRequestedInternal;
    }

    /** * Registers a callback that will be invoked when cancellation is requested. 
     * If cancellation has already been requested, the callback is invoked immediately.
     * @param {() => void} callback The delegate to be called when cancellation is requested.
     */
    public register(callback: () => void): void {
        if (this.isCancellationRequestedInternal) {
            callback();
            return;
        }
        this.listeners.push(callback);
    }

    // Internal method used by CancellationTokenSource to signal cancellation
    _signalCancel(): void {
        if (this.isCancellationRequestedInternal) return;
        this.isCancellationRequestedInternal = true;

        this.listeners.forEach(listener => {
            try {
                listener();
            } catch (e) {
                console.error("Error executing cancellation listener:", e);
            }
        });
        this.listeners = [];
    }
}

/**
 * The source of a cancellation token. Allows external components to request cancellation
 * and provides the associated CancellationToken.
 * (Equivalent to .NET's CancellationTokenSource)
 */
export class CancellationTokenSource {
    /** The token associated with this CancellationTokenSource. */
    public readonly token: CancellationToken;

    constructor() {
        this.token = new CancellationToken();
    }

    /** * Signals a request for cancellation to the associated CancellationToken. 
     */
    public cancel(): void {
        this.token._signalCancel();
    }
}
