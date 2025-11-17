import { GpuExecutionType, GpuComputeRequest, GpuTaskRunner, GpuComputeArguments } from "./GpuCompute";
import { CancellationToken, Task } from "./Task";
import { TaskFactory } from "./TaskFactory";
import { TaskRegistry } from "./TaskRegistry";
import { WorkerTask } from "./WorkerTask";


export interface GpuTaskConstructor<TArgs extends GpuComputeArguments, TResult> {
    new (args: TArgs): GpuTask<TResult>;
}


export abstract class GpuTask<TResult> {
  abstract shaderCode: string;
  abstract arrayLength: number;
  abstract inputs: { data: ArrayBufferView; readOnly?: boolean; }[];
  abstract outputSizeInBytes: number;
  abstract deserializer: (data: ArrayBuffer) => TResult;
  abstract readonly executionType: GpuExecutionType;

  shaderEntry: string = "main";
  computeParams?: ArrayBufferView;
  argumentData?: ArrayBufferView;

  toGpuRequest(): GpuComputeRequest<TResult> {
    return {
      shaderCode: this.shaderCode,
      shaderEntry: this.shaderEntry,
      arrayLength: this.arrayLength,
      inputs: this.inputs,
      outputSizeInBytes: this.outputSizeInBytes,
      computeParams: this.computeParams,
      argumentData: this.argumentData,
      deserializer: this.deserializer,
    };
  }

  run(token?: CancellationToken): Task<TResult> {
    return GpuTaskRunner.execute(this, token);
  }
  public abstract getRunConfig(): GpuComputeRequest<TResult>;

  public static runInWorker<T>(
    workerManager: WorkerTask,
    args: any
  ): Task<T> {
  
    return TaskFactory.RunWebWorkerTask<T>(workerManager, this.name, args);
  }

  static registerTask(name?: string) {
    const ctor = this as any;
    const taskName = name ?? ctor.name;
    TaskRegistry.register(taskName, ctor);
  }

}
