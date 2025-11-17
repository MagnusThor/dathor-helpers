// Assuming imports for Task, CancellationToken, CancellationTokenSource, 
// TaskStatus, and OperationCanceledError are handled from the previous code blocks.

import { Task, CancellationToken, OperationCanceledError } from "./Task";
import { WorkerTask } from "./WorkerTask";

/**
 * A factory class for creating and managing Task instances.
 * Provides utility methods for task creation, parallel execution, and task coordination.
 * * @remarks
 * This class contains static methods only and should not be instantiated.
 */
export class TaskFactory {

    /**
     * Creates a Task<TResult> that has already completed successfully with the specified result.
     * @template TResult The type of the result value.
     * @param {TResult} result The result value with which to complete the Task.
     * @returns {Task<TResult>} A Task that is immediately in the RanToCompletion state.
     */
    public static fromResult<TResult>(result: TResult): Task<TResult> {
        return new Task<TResult>((resolve) => resolve(result));
    }

    /**
     * Creates a Task that will complete when all of the Task objects in an enumerable 
     * collection have completed.
     * @template TResult The type of the result value of each Task in the collection.
     * @param {Task<TResult>[]} tasks An array of Task objects to wait on.
     * @returns {Task<TResult[]>} A Task that completes when all input Tasks complete. 
     */
    public static whenAll<TResult>(tasks: Task<TResult>[]): Task<TResult[]> {
        // Since Task<T> implements PromiseLike<T>, Promise.all works directly.
        const promiseAll = Promise.all(tasks);

        return new Task<TResult[]>((resolve, reject) => {
            promiseAll.then(resolve, reject);
        });
    }

    /**
     * Returns a Task that completes when any of the supplied tasks completes.
     * The result of the returned Task is the actual Task<TResult> that completed first.
     * @typeParam TResult - The type of result the tasks produce
     * @param tasks - An array of Task instances to wait on
     * @returns A Task<Task<TResult>> that resolves with the winning task.
     * * NOTE: This implementation requires Task<T> to have a public 'promise' getter 
     * that returns its internal Promise<T>.
     */
    public static whenAny<TResult>(tasks: Task<TResult>[]): Task<Task<TResult>> {
        const promisesToRace = tasks.map(t =>
            // t.promise.then(() => t, () => t) ensures the result is the Task object 't'.
            // The 'as Promise<Task<TResult>>' assertion forces correct type inference.
            (t as any).promise.then(() => t, () => t) as Promise<Task<TResult>>
        );

        // Explicitly specifying the generic type for Promise.race resolves ambiguity.
        const promiseRace = Promise.race<Task<TResult>>(promisesToRace);

        return new Task<Task<TResult>>((taskResolve, taskReject) => {
            promiseRace
                .then(
                    (winningTask) => taskResolve(winningTask as Task<TResult>),
                    (reason) => taskReject(reason)
                )
                .catch(taskReject);

        });
    }


    /**
     * Executes a for loop concurrently, where the body returns a Task<void> or void.
     * @param fromInclusive The starting loop index (inclusive).
     * @param toExclusive The ending loop index (exclusive).
     * @param body The action to be executed for each index.
     * @param token An optional CancellationToken.
     * @returns A Task that completes when all iterations have finished or on cancellation.
     */
    public static parallelFor(
        fromInclusive: number,
        toExclusive: number,
        body: (index: number) => Task<void> | void,
        token?: CancellationToken
    ): Task<void> {
        const tasks: Task<void>[] = [];

        // Check for immediate cancellation and reject with OperationCanceledError
        if (token?.isCancellationRequested) {
            return new Task<void>((_resolve, reject) => reject(new OperationCanceledError("Parallel.For canceled immediately.")));
        }

        for (let i = fromInclusive; i < toExclusive; i++) {
            if (token?.isCancellationRequested) {
                break; // Stop queuing new tasks
            }

            const result = body(i);

            if (result instanceof Task) {
                tasks.push(result);
            } else if (result !== undefined) {
                tasks.push(TaskFactory.fromResult(undefined));
            }
        }

        return new Task<void>((resolve, reject) => {
            TaskFactory.whenAll(tasks)
                .then(() => {
                    // Final check to reject with OperationCanceledError if requested
                    if (token?.isCancellationRequested) {
                        reject(new OperationCanceledError("Parallel.For completed, but was canceled during execution."));
                    } else {
                        resolve();
                    }
                })
                .catch(reject);
        });
    }

    /**
     * Executes a for loop in which asynchronous iterations are run concurrently.
     * @param {number} fromInclusive The starting loop index (inclusive).
     * @param {number} toExclusive The ending loop index (exclusive).
     * @param {(index: number) => Task<void>} body The action to be executed for each index. 
     * @param {CancellationToken} [token] An optional CancellationToken.
     * @returns {Task<void>} A Task that completes when all asynchronous iterations have finished.
     */
    public static ForAsync(
        fromInclusive: number,
        toExclusive: number,
        body: (index: number) => Task<void>,
        token?: CancellationToken
    ): Task<void> {
        const tasks: Task<void>[] = [];

        if (token?.isCancellationRequested) {
            return new Task<void>((_resolve, reject) => reject(new OperationCanceledError("ForAsync canceled immediately.")));
        }

        for (let i = fromInclusive; i < toExclusive; i++) {
            if (token?.isCancellationRequested) {
                break;
            }

            const result = body(i);
            tasks.push(result);
        }

        return new Task<void>((resolve, reject) => {
            TaskFactory.whenAll(tasks)
                .then(() => {
                    if (token?.isCancellationRequested) {
                        reject(new OperationCanceledError("ForAsync completed, but was canceled during execution."));
                    } else {
                        resolve();
                    }
                })
                .catch(reject);
        });
    }

    /**
     * Executes an array of arbitrary asynchronous actions concurrently and waits for all of them to complete.
     * @param {(() => Task<void>)[]} actions An array of functions, each returning a Task<void>.
     * @returns {Task<void>} A Task that completes when all specified actions have completed.
     */
    public static Invoke(actions: (() => Task<void>)[]): Task<void> {
        const tasks = actions.map(action => action());

        return new Task<void>((resolve, reject) => {
            TaskFactory.whenAll(tasks)
                .then(() => resolve())
                .catch(reject);
        });
    }

    /**
     * Executes a pre-defined CPU-bound function on a dedicated Web Worker thread.
     * @template T The expected return type from the worker function.
     * @param {WorkerTask} manager The initialized instance of the WorkerTask.
     * @param {string} functionName The name of the function to execute.
     * @param {any} args The structured data object/payload to pass to the worker function.
     * @returns {Task<T>} A Task that completes when the worker returns the result.
     */
    public static RunWebWorkerTask<T>(manager: WorkerTask, functionName: string, args: any): Task<T> {
        console.log(`dispatchWorkerAction called on ${manager.constructor.name} with function ${functionName}`);
        return manager.dispatchWorkerAction<T>(functionName, args);
    }
}