export class TaskScheduler {
    private tasks: { id: number; time: number; callback: () => void; }[] = [];
    private animationFrameId: number | null = null;
    private startTime: number | null = null;
    private nextTaskId: number = 0;
    private isPaused: boolean = false;
    private pauseStartTime: number | null = null;
    private idleTime: number = 0;

    addTask(callback: () => void, delay: number): number {
        const taskId = this.nextTaskId++;
        this.tasks.push({ id: taskId, time: delay + this.idleTime, callback });
        this.tasks.sort((a, b) => a.time - b.time);
        this.start();
        return taskId;
    }

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

    rescheduleTask(taskId: number, newDelay: number): boolean {
        const task = this.tasks.find(task => task.id === taskId);
        if (task) {
            task.time = newDelay + this.idleTime;
            this.tasks.sort((a, b) => a.time - b.time);
            return true;
        }
        return false;
    }

    start(): void {
        if (this.animationFrameId !== null) return;
        if (this.isPaused && this.pauseStartTime) {
            this.idleTime += performance.now() - this.pauseStartTime;
            this.pauseStartTime = null;
            this.isPaused = false;
            this.tasks.forEach(task => task.time += this.idleTime);
            this.tasks.sort((a, b) => a.time - b.time);
        }

        this.startTime = performance.now();
        const executeTasks = (currentTime: number) => {
            if (this.startTime === null) return;

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

    stop(): void {
        if (this.animationFrameId !== null) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
            this.startTime = null;
        }
    }

    clear(): void {
        this.tasks = [];
        this.stop();
        this.idleTime = 0;
    }

    pause(): void {
        if (this.animationFrameId !== null && !this.isPaused) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
            this.pauseStartTime = performance.now();
            this.isPaused = true;
        }
    }
}
