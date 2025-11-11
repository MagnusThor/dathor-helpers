
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
     * * @template T The type of the result produced by this Task.
     * * @implements {PromiseLike<T>}
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
         * Provides access to the internal Promise for coordination by TaskFactory.
         * This is generally discouraged for external consumption, but required for Promise.race/all.
         */
        public get promise(): Promise<T> { // Changed to public access
            return this.internalPromise;
        }

        /**
         * Gets the result of the Task.
         * Throws the underlying exception if the Task is Faulted.
         * Throws an error if the Task is not yet completed.
         * @returns {T} The result value.
         * @throws {Error | OperationCanceledError} 
         * If the Task status is not RanToCompletion, or the underlying error if Faulted.
         */
        public get result(): T {
            if (this.currentStatus === TaskStatus.RanToCompletion) {
                return this.resultValue as T;
            }
            if (this.currentStatus === TaskStatus.Faulted) {
                // Throw the actual error captured during rejection/synchronous fault
                throw this.error;
            }
            if (this.currentStatus === TaskStatus.Canceled) {
                // Throw the specific cancellation error if canceled
                throw new OperationCanceledError("Cannot access result of a Canceled Task.");
            }
            
            throw new Error(`Task has not completed successfully. Current status: ${this.currentStatus}`);
        }

        /**
         * Creates a new Task that will execute the provided asynchronous operation.
         * @param {function(resolve: (value: T) => void, reject: (reason?: any) => void): void} executor 
         * The function to be executed by the Task.
         */
        constructor(
            executor: (resolve: (value: T) => void, reject: (reason?: any) => void) => void
        ) {
            // Task starts in 'Running' state immediately upon constructor execution
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
                            // Distinction between Faulted and Canceled
                            if (reason instanceof OperationCanceledError) {
                                this.currentStatus = TaskStatus.Canceled;
                            } else {
                                this.currentStatus = TaskStatus.Faulted;
                            }
                            reject(reason);
                        }
                    );
                } catch (e) {
                    // Catch synchronous errors thrown by the executor itself
                    this.error = e;
                    if (e instanceof OperationCanceledError) {
                        this.currentStatus = TaskStatus.Canceled;
                    } else {
                        this.currentStatus = TaskStatus.Faulted;
                    }
                    reject(e);
                }
            });
        }

        /**
         * Creates a continuation that executes when the task completes (regardless of success or failure).
         * @param continuation - A function to run after the task completes. 
         * @typeparam TNew - The type of the value that the continuation returns
         * @returns A new Task that represents the continuation operation.
         */
        public continueWith<TNew>(continuation: (task: Task<T>) => TNew | PromiseLike<TNew>): Task<TNew> {
            return new Task<TNew>((resolve, reject) => {
                // Use .finally equivalent behavior to run continuation on settlement (resolve or reject)
                this.internalPromise.then(
                    () => {
                        try {
                            Promise.resolve(continuation(this)).then(resolve, reject);
                        } catch (e) {
                            reject(e);
                        }
                    },
                    () => {
                        // Task rejected/faulted/canceled - run continuation anyway
                        try {
                            Promise.resolve(continuation(this)).then(resolve, reject);
                        } catch (e) {
                            reject(e);
                        }
                    }
                );
            });
        }

        /**
         * Attaches callbacks for the resolution and/or rejection of the Task (PromiseLike implementation).
         * @param onfulfilled The callback to execute when the Task is resolved.
         * @param onrejected The callback to execute when the Task is rejected.
         * @returns A Promise for the completion of which ever callback is executed.
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
    private _isCancellationRequested: boolean = false;
    private _callbacks: (() => void)[] = [];

    /**
     * Gets a value indicating whether cancellation has been requested for this token.
     */
    public get isCancellationRequested(): boolean {
        return this._isCancellationRequested;
    }

    /**
     * Internal method called by CancellationTokenSource to signal cancellation.
     * @internal
     */
    public _signalCancel(): void {
        if (!this._isCancellationRequested) {
            this._isCancellationRequested = true;
            // Execute all registered callbacks
            this._callbacks.forEach(callback => {
                try {
                    callback();
                } catch (e) {
                    console.error("Error executing cancellation callback:", e);
                }
            });
            // Clear callbacks after execution
            this._callbacks = [];
        }
    }

    /**
     * Registers a callback function to be executed when cancellation is requested.
     * If cancellation has already been requested, the callback is executed immediately.
     * @param callback The function to execute.
     */
    public register(callback: () => void): void {
        if (this._isCancellationRequested) {
            // If already canceled, run immediately
            callback();
        } else {
            this._callbacks.push(callback);
        }
    }

    /**
     * Throws an OperationCanceledError if cancellation has been requested.
     * This is the core cooperative check used by cancellable operations (like delay or GPU tasks).
     * @throws {OperationCanceledError} if cancellation has been requested.
     */
    public throwIfCancellationRequested(): void {
        if (this._isCancellationRequested) {
            throw new OperationCanceledError("The operation was canceled.");
        }
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


    /**
     * Custom error thrown when a Task is canceled via a CancellationToken.
     * This helps distinguish between a task that 'Faulted' (threw an exception)
     * and one that was 'Canceled' (stopped cooperatively).
     */
    export class OperationCanceledError extends Error {
        constructor(message: string = "The operation was canceled.") {
            super(message);
            this.name = "OperationCanceledError";
            // Set the prototype explicitly.
            Object.setPrototypeOf(this, OperationCanceledError.prototype);
        }
    }