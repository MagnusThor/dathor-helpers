export class WorkerHelper<T = any> {
    private worker: Worker;
    private nextId = 0;
    private pending = new Map<number, (value: T) => void>();
    constructor(workerUrl: string, options?: WorkerOptions) {
        this.worker = new Worker(workerUrl, { type: "module", ...options });
        this.worker.onmessage = (e) => {
            const { id, result, error } = e.data;
            const resolve = this.pending.get(id);
            if (resolve) {
                this.pending.delete(id);
                if (error) throw new Error(error);
                resolve(result);
            }
        };
    }
    run(taskName: string, args: any): Promise<T> {
        const id = this.nextId++;
        return new Promise<T>((resolve) => {
            this.pending.set(id, resolve);
            this.worker.postMessage({ taskName, args, id });
        });
    }
    terminate() {
        this.worker.terminate();
    }
}
