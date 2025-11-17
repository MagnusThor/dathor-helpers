import { Task } from "./Task";
import { WorkerTask } from "./WorkerTask";

import { GpuComputeRequest, GpuExecutionType } from "./GpuCompute";

/**
 * Extends TaskFactory functionality to run GPU compute tasks in a dedicated Worker.
 */
export class GpuTaskFactory {

    /**
     * Offloads a GPU compute task to a WorkerTask.
     * @param workerManager The WorkerTask instance managing a dedicated worker.
     * @param config The GPU compute configuration (buffers, shader code, params, etc.).
     * @param executionType Type of GPU execution, e.g., single-pass or multi-pass on worker.
     */
    public static RunGpuTaskOnWorker<TResult>(
        workerManager: WorkerTask,
        config: GpuComputeRequest<TResult>,
        executionType: GpuExecutionType.SinglePassOnWorker | GpuExecutionType.MultiPassOnWorker
    ): Task<TResult> {
        return workerManager.dispatchWorkerAction<TResult>("runGpuCompute", {
            config,
            executionType,
        });
    }
}
