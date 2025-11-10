// TaskScheduler.ts (JSDoc Implemented)
import { CancellationToken, Task } from "./Task"; // Assuming these are imported from the combined file

/**
 * A time-based task scheduler that utilizes the browser's requestAnimationFrame
 * loop for high-precision, frame-rate-synchronized scheduling.
 * * It supports basic scheduling operations, pausing/resuming, and .NET TPL-inspired
 * asynchronous operations via the `delay` method.
 */
export class TaskScheduler {
    private tasks: { id: number; time: number; callback: () => void; }[] = [];
    private animationFrameId: number | null = null;
    private startTime: number | null = null;
    private nextTaskId: number = 0;
    private isPaused: boolean = false;
    private pauseStartTime: number | null = null;
    private idleTime: number = 0;

    /**
     * Adds a new task to be executed after a specified delay.
     * @param {() => void} callback The function to execute when the delay is reached.
     * @param {number} delay The delay in milliseconds before the task should execute.
     * @returns {number} The unique ID of the scheduled task, which can be used for removal.
     */
    addTask(callback: () => void, delay: number): number {
        const taskId = this.nextTaskId++;
        // Use idleTime to account for time spent paused
        this.tasks.push({ id: taskId, time: delay + this.idleTime, callback });
        this.tasks.sort((a, b) => a.time - b.time);
        this.start();
        return taskId;
    }

    /**
     * Removes a task from the scheduler queue using its unique ID.
     * @param {number} taskId The ID of the task to remove.
     * @returns {boolean} True if the task was found and removed; otherwise, false.
     */
    removeTask(taskId: number): boolean {
        const index = this.tasks.findIndex(task => task.id === taskId);
        if (index !== -1) {
            this.tasks.splice(index, 1);
            if (this.tasks.length === 0) {
                this.stop();
            }
            return true;
        }
        return false;
    }

    /**
     * Changes the delay for an existing scheduled task.
     * @param {number} taskId The ID of the task to reschedule.
     * @param {number} newDelay The new delay in milliseconds from the current moment.
     * @returns {boolean} True if the task was found and rescheduled; otherwise, false.
     */
    rescheduleTask(taskId: number, newDelay: number): boolean {
        const task = this.tasks.find(task => task.id === taskId);
        if (task) {
            // Apply new delay relative to current idle time
            task.time = newDelay + this.idleTime; 
            this.tasks.sort((a, b) => a.time - b.time);
            return true;
        }
        return false;
    }

    /**
     * Starts or resumes the requestAnimationFrame scheduling loop.
     * If paused, it updates timing variables to account for the pause duration.
     */
    start(): void {
        if (this.animationFrameId !== null) return;
        
        if (this.isPaused && this.pauseStartTime) {
            // Calculate time spent paused (idleTime)
            this.idleTime += performance.now() - this.pauseStartTime;
            this.pauseStartTime = null;
            this.isPaused = false;
            // Note: Task times were already adjusted in the previous implementation logic
            // for now, we leave the idleTime mechanism to handle pause adjustments.
            this.tasks.forEach(task => task.time += this.idleTime);
            this.tasks.sort((a, b) => a.time - b.time);
        }

        // Adjust startTime by idleTime to ensure elapsed time is correct after pause
        this.startTime = performance.now() - this.idleTime; 
        
        const executeTasks = (currentTime: number) => {
            if (this.startTime === null) return;

            // Elapsed time calculated from the adjusted startTime
            const elapsed = currentTime - this.startTime;

            while (this.tasks.length > 0 && this.tasks[0].time <= elapsed) {
                const task = this.tasks.shift();
                if (task) {
                    task.callback();
                }
            }

            if (this.tasks.length > 0) {
                this.animationFrameId = requestAnimationFrame(executeTasks);
            } else {
                this.stop();
            }
        };

        this.animationFrameId = requestAnimationFrame(executeTasks);
    }

    /**
     * Stops the requestAnimationFrame loop and clears state variables without
     * clearing the task queue.
     */
    stop(): void {
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
            this.startTime = null;
        }
    }

    /**
     * Clears all tasks from the queue and stops the scheduler loop.
     */
    clear(): void {
        this.tasks = [];
        this.stop();
        this.idleTime = 0;
    }

    /**
     * Pauses the scheduling loop, recording the pause start time to correctly
     * offset task times upon resumption.
     */
    pause(): void {
        if (this.animationFrameId !== null && !this.isPaused) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
            this.pauseStartTime = performance.now();
            this.isPaused = true;
        }
    }
    
    // ------------------------------------------
    // New Task/Cancellation Integration (TPL Analogue)
    // ------------------------------------------

    /**
     * Creates a Task that completes after a specified delay, scheduled using 
     * the requestAnimationFrame loop.
     * * This allows the delay to be awaited using async/await and respects cancellation.
     * (Equivalent to .NET's Task.Delay(delay, token))
     * @param {number} delay The delay in milliseconds.
     * @param {CancellationToken} [token] An optional CancellationToken to enable cancellation.
     * @returns {Task<void>} A Task that resolves after the delay or rejects with an 
     * Error if canceled.
     */
    public delay(delay: number, token?: CancellationToken): Task<void> {
        // If cancellation is already requested, return a rejected/canceled Task immediately
        if (token?.isCancellationRequested) {
             return new Task<void>((_resolve, reject) => reject(new Error("Task was canceled.")));
        }

        let taskId: number | null = null;

        const taskPromise = new Task<void>((resolve, reject) => {
            const delayCallback = () => {
                // Final check to see if cancellation was requested right before execution
                if (taskId !== null) {
                    if (token?.isCancellationRequested) {
                         reject(new Error("Task was canceled."));
                    } else {
                        resolve();
                    }
                }
            };
            
            // 1. Add the task to the underlying scheduler
            taskId = this.addTask(delayCallback, delay);

            // 2. Register for cancellation
            if (token) {
                token.register(() => {
                    // Stop the scheduled task in the rAF queue
                    if (taskId !== null) {
                        this.removeTask(taskId);
                        taskId = null;
                    }
                    // Reject the Task promise
                    reject(new Error("Task was canceled."));
                });
            }
        });

        return taskPromise;
    }
}