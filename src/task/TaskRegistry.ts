import { GpuTaskConstructor } from "./GpuTask";

/**
 * Central registry for named Task types that can be instantiated dynamically.
 * Used by both main thread (TaskFactory) and Worker contexts.
 */
export class TaskRegistry {
    private static registry = new Map<string, GpuTaskConstructor<any, any>>();

    /**
     * Registers a task class with the specified name.
     * @param name Unique identifier for the task.
     * @param taskCtor Constructor of the task.
     */
    public static register(name: string, taskCtor: any): void {
        if (TaskRegistry.registry.has(name)) {
            console.warn(`[TaskRegistry] Task '${name}' is already registered. Overwriting.`);
        }
        TaskRegistry.registry.set(name, taskCtor);
    }

    /**
     * Retrieves a task constructor by name.
     * @param name The name of the registered task.
     */
    public static get(name: string): any | undefined {
        return TaskRegistry.registry.get(name);
    }

    /**
     * Returns all registered task names (for debugging/introspection).
     */
    public static list(): string[] {
        return Array.from(TaskRegistry.registry.keys());
    }
}
