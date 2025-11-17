import { GpuComputeRequest, GpuExecutionType } from "./GpuCompute";
import { TaskFactory } from "./TaskFactory";
import { WorkerTask } from "./WorkerTask";


export async function executeGpuComputeOnWorker<TResult>(
    config: GpuComputeRequest<TResult>,
    type: GpuExecutionType,
    workerManager: WorkerTask
): Promise<TResult> {

    // Wrap execution in the worker
    return TaskFactory.RunWebWorkerTask<TResult>(workerManager, 'runGpuCompute', {
        config,
        executionType: type
    });
}
