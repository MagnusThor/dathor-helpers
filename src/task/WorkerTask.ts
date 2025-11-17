    import { extractTransferables } from "./extractTransferables";
    import { Task } from "./Task";
    import { OperationCanceledError } from "./Task";
    import type { CancellationToken } from "./Task";

    /**
     * A managed worker task helper that allows dispatching async functions to a dedicated Worker.
     * Automatically serializes messages, awaits responses, and wraps the result in a Task<T>.
     */
    export class WorkerTask {
      //  private readonly worker: Worker;
        private nextId = 0;
        private pending = new Map<
            number,
            { resolve: (value: any) => void; reject: (reason: any) => void }
        >();

        constructor(public readonly worker: Worker, options?: WorkerOptions) {
          
            this.worker.onmessage = this.handleMessage.bind(this);
            this.worker.onerror = this.handleError.bind(this);
        }

        private handleMessage(e: MessageEvent) {
            const { id, result, error } = e.data;
            const entry = this.pending.get(id);
            if (!entry) return;
            this.pending.delete(id);

            if (error) {
                entry.reject(new Error(error));
            } else {
                entry.resolve(result);
            }
        }

        private handleError(e: ErrorEvent) {
           
            // Reject all pending promises
            for (const [, entry] of this.pending.entries()) {
                entry.reject(new Error(e.message));
            }
            this.pending.clear();
        }

        /**
         * Dispatches a worker-side function by name, passing args as structured clone data.
         * Returns a Task<T> that resolves when the worker posts back the result.
         */
        public dispatchWorkerAction<T>(
            functionName: string,
            args: any,
            transfer?: Transferable[],
            token?: CancellationToken
        ): Task<T> {
            return new Task<T>((resolve, reject) => {
                if (token?.isCancellationRequested) {
                    reject(new OperationCanceledError("Worker task was canceled before dispatch."));
                    return;
                }
                if (typeof functionName !== "string") {
                    throw new Error("Invalid functionName: must be a string");
                }
                const id = this.nextId++;
                this.pending.set(id, { resolve, reject });
                try {
                    this.worker.postMessage({ id, functionName, args }, transfer ? transfer : extractTransferables(args));
                } catch (err) {
                    this.pending.delete(id);
                    reject(err);
                }
                token?.register(() => {
                    this.worker.postMessage({ cancel: id });
                    reject(new OperationCanceledError("Worker task was canceled."));
                });
            });
        }

        public terminate(): void {
            this.worker.terminate();
        }
    }
