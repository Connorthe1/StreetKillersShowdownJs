export class GameTimer {
    constructor() {
        this.tasks = new Set();
        this.namedTasks = new Map();
    }

    sleep(duration, id = null) {
        let task;

        const promise = new Promise((resolve) => {
            task = {
                time: 0,
                duration,
                resolve,
                paused: false,
                id
            };

            this.tasks.add(task);

            if (id !== null) {
                this.namedTasks.set(id, task);
            }
        });

        // добавляем методы управления прямо в promise
        promise.pause = () => (task.paused = true);
        promise.resume = () => (task.paused = false);
        promise.extend = (ms) => (task.duration += ms);

        promise.cancel = () => {
            this.tasks.delete(task);
            if (task.id !== null) this.namedTasks.delete(task.id);
        };

        return promise;
    }

    pause(id) {
        const task = this.namedTasks.get(id);
        if (task) task.paused = true;
    }

    resume(id) {
        const task = this.namedTasks.get(id);
        if (task) task.paused = false;
    }

    cancel(id) {
        const task = this.namedTasks.get(id);
        if (!task) return;

        this.tasks.delete(task);
        this.namedTasks.delete(id);
    }

    extend(id, ms, limit = 0) {
        const task = this.namedTasks.get(id);
        if (task) {
            if (limit) {
                const check = task.duration + ms
                if (check > limit) {
                    task.duration = limit
                } else {
                    task.duration = check
                }
            } else {
                task.duration += ms;
            }
        }
    }

    update(dt) {
        for (const task of [...this.tasks]) {
            if (task.paused) continue;

            task.time += dt;

            if (task.time >= task.duration) {
                task.resolve();
                this.tasks.delete(task);

                if (task.id !== null) {
                    this.namedTasks.delete(task.id);
                }
            }
        }
    }
}
