// TaskFactory.ts (Requires Task type)
import { CancellationToken, Task } from "./Task";
import { WorkerTask } from "./WorkerTask";


/**
 * A factory class for creating and managing Task instances.
 * Provides utility methods for task creation, parallel execution, and task coordination.
 * 
 * @remarks
 * This class contains static methods only and should not be instantiated.
 * 
 * @example
 * ```typescript
 * // Create a task from a result
 * const task = TaskFactory.fromResult(42);
 * 
 * // Wait for multiple tasks to complete
 * const tasks = [task1, task2, task3];
 * const results = await TaskFactory.whenAll(tasks);
 * 
 * // Execute tasks in parallel
 * await TaskFactory.parallelFor(0, 10, async (i) => {
 *     await someAsyncOperation(i);
 * });
 * ```
 */
export class TaskFactory {

    /**
       * Creates a Task<TResult> that has already completed successfully with the specified result.
       * * This is useful for returning a Task from an asynchronous method that already has its result.
       * (Equivalent to .NET's Task.FromResult<TResult>(result)).
       * * @template TResult The type of the result value.
       * @param {TResult} result The result value with which to complete the Task.
       * @returns {Task<TResult>} A Task that is immediately in the RanToCompletion state.
       */
    public static fromResult<TResult>(result: TResult): Task<TResult> {
        return new Task<TResult>((resolve) => resolve(result));
    }

    /**
     * Creates a Task that will complete when all of the Task objects in an enumerable 
     * collection have completed.
     * * If any of the input tasks fault, the returned Task will immediately fault.
     * (Equivalent to .NET's Task.WhenAll(tasks)).
     * * @template TResult The type of the result value of each Task in the collection.
     * @param {Task<TResult>[]} tasks An array of Task objects to wait on.
     * @returns {Task<TResult[]>} A Task that completes when all input Tasks complete. 
     * The result is an array containing the results of all input Tasks.
     */
    public static whenAll<TResult>(tasks: Task<TResult>[]): Task<TResult[]> {
        // Leverages native Promise.all, then wraps the result in our custom Task
        const promiseAll = Promise.all(tasks);

        return new Task<TResult[]>((resolve, reject) => {
            promiseAll.then(resolve, reject);
        });
    }

    /**
     * Returns a Task that completes when any of the supplied tasks completes.
     * The returned Task's result is the first Task that completed.
     * 
     * @typeParam TResult - The type of result the tasks produce
     * @param tasks - An array of Task instances to wait on
     * @returns A Task that will complete when any of the supplied tasks completes
     * 
     * @example
     * ```typescript
     * const tasks = [task1, task2, task3];
     * const winner = await TaskFactory.whenAny(tasks);
     * const result = await winner;
     * ```
     */
    public static parallelFor(
        fromInclusive: number,
        toExclusive: number,
        body: (index: number) => Task<void> | void,
        token?: CancellationToken
    ): Task<void> {
        const tasks: Task<void>[] = [];

        // Check for immediate cancellation
        if (token?.isCancellationRequested) {
            return new Task<void>((_resolve, reject) => reject(new Error("Parallel.For canceled immediately.")));
        }

        for (let i = fromInclusive; i < toExclusive; i++) {
            // Check for cancellation before starting the next iteration
            if (token?.isCancellationRequested) {
                break; // Stop queuing new tasks
            }

            // Execute the body and handle the result
            const result = body(i);

            if (result instanceof Task) {
                tasks.push(result);
            } else if (result !== undefined) {
                // The body returned a synchronous result that wasn't a Task. 
                // We wrap synchronous execution in an already completed Task<void>.
                tasks.push(TaskFactory.fromResult(undefined));
            }
            // If body returns void (undefined), no task is pushed, assuming it was synchronous and finished.
        }

        // Wait for all queued tasks to complete (concurrent execution)
        return new Task<void>((resolve, reject) => {
            TaskFactory.whenAll(tasks)
                .then(() => {
                    // If the cancellation occurred while tasks were running, throw the error here
                    if (token?.isCancellationRequested) {
                        reject(new Error("Parallel.For completed, but was canceled during execution."));
                    } else {
                        resolve();
                    }
                })
                .catch(reject);
        });
    }

    /**
     * Executes a for loop in which iterations are run concurrently via the event loop, 
     * and the loop body itself is asynchronous (returns a Task).
     * * (Equivalent to .NET's Parallel.ForAsync).
     * * @param {number} fromInclusive The starting loop index (inclusive).
     * @param {number} toExclusive The ending loop index (exclusive).
     * @param {(index: number) => Task<void>} body The action to be executed for each index. 
     * Must return a `Task<void>`.
     * @param {CancellationToken} [token] An optional CancellationToken.
     * @returns {Task<void>} A Task that completes when all asynchronous iterations have finished 
     * or when cancellation is finalized.
     */
    public static ForAsync(
        fromInclusive: number,
        toExclusive: number,
        body: (index: number) => Task<void>,
        token?: CancellationToken
    ): Task<void> {
        const tasks: Task<void>[] = [];

        if (token?.isCancellationRequested) {
            return new Task<void>((_resolve, reject) => reject(new Error("ForAsync canceled immediately.")));
        }

        for (let i = fromInclusive; i < toExclusive; i++) {
            if (token?.isCancellationRequested) {
                break;
            }

            // The body must return a Task, which we collect to await later
            const result = body(i);
            tasks.push(result);
        }

        // Wait for all collected tasks to complete (concurrent execution)
        return new Task<void>((resolve, reject) => {
            TaskFactory.whenAll(tasks)
                .then(() => {
                    if (token?.isCancellationRequested) {
                        reject(new Error("ForAsync completed, but was canceled during execution."));
                    } else {
                        resolve();
                    }
                })
                .catch(reject);
        });
    }

    /**
     * Executes an array of arbitrary asynchronous actions concurrently and waits for 
     * all of them to complete.
     * * (Equivalent to .NET's Parallel.Invoke, but for asynchronous actions).
     * * @param {(() => Task<void>)[]} actions An array of functions, each returning a Task<void> 
     * (an asynchronous action).
     * @returns {Task<void>} A Task that completes when all specified actions have completed.
     */
    public static Invoke(actions: (() => Task<void>)[]): Task<void> {
        const tasks = actions.map(action => action());

        // Use whenAll to wait for the completion of all returned Tasks
        return new Task<void>((resolve, reject) => {
            TaskFactory.whenAll(tasks)
                .then(() => resolve())
                .catch(reject);
        });
    }


    /**
     * Executes a pre-defined CPU-bound function on a dedicated Web Worker thread
     * managed by the provided WorkerTask instance.
     * * This method is the primary way to achieve true CPU parallelism in the Task library.
     * @template T The expected return type from the worker function.
     * @param {WorkerTask} manager The initialized instance of the WorkerTask managing the target Web Worker.
     * @param {string} functionName The name of the function to execute (must be defined in the worker script).
     * @param {any} args The structured data object/payload to pass to the worker function.
     * @returns {Task<T>} A Task that completes when the worker returns the result.
     */
    public static RunWebWorkerTask<T>(manager: WorkerTask, functionName: string, args: any): Task<T> {
        // Delegate the action using the provided manager instance
        return manager.dispatchWorkerAction<T>(functionName, args);
    }

}




