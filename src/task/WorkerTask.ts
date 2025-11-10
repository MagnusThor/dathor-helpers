import { Task } from "./Task";


/**
 * Manages communication with a single Web Worker instance, allowing asynchronous
 * execution of named, CPU-bound functions (actions) in a separate thread.
 */
export class WorkerTask {
    private nextTaskId: number;
    private worker: Worker;
    private pendingTasks: Map<number, { resolve: (value: any) => void; reject: (reason?: any) => void; }>;

    /**
     * Initializes the WorkerTask manager with a new Web Worker instance.
     * @param {string} WORKER_URL The URL or Blob URL of the worker script.
     */
    constructor(WORKER_URL: string) {
        this.pendingTasks = new Map<number, { resolve: (value: any) => void; reject: (reason?: any) => void }>();

        this.worker = new Worker(WORKER_URL);
        this.worker.onmessage = (e) => {
            const { taskId, status, result, error } = e.data;
            const taskPromise = this.pendingTasks.get(taskId);

            if (taskPromise) {
                if (status === 'completed') {
                    taskPromise.resolve(result);
                } else if (status === 'error') {
                    // Reject with a clear error message including worker details
                    taskPromise.reject(new Error(`Worker Task ${taskId} failed: ${error}`));
                }
                this.pendingTasks.delete(taskId);
            }
        };
        this.nextTaskId = 0;
    }

    /**
     * Dispatches a request to the managed worker to execute a pre-defined function.
     * @template T The expected return type from the worker function.
     * @param {string} action The name of the function to run (must be defined in the worker script's CpuFunctions).
     * @param {any} payload The structured data object to pass to the worker function.
     * @returns {Task<T>} A Task that resolves with the result from the worker.
     */
    public dispatchWorkerAction<T>(action: string, payload: any): Task<T> {
        const taskId = this.nextTaskId++;
        return new Task<T>((resolve, reject) => {
            this.pendingTasks.set(taskId, { resolve, reject });
            try {
                this.worker.postMessage({ action, payload, taskId });
            } catch (e) {
                this.pendingTasks.delete(taskId);
                reject(new Error(`Failed to post message to worker: ${e instanceof Error ? e.message : String(e)}`));
            }
        });
    }

    /**
     * Terminates the underlying Web Worker.
     */
    public dispose(): void {
        this.worker.terminate();
        this.pendingTasks.clear();
    }
}



