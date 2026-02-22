import { Garbage } from "./Garbage";

export class GarbageManager {
    constructor(world, resources, eventBus) {
        this.world = world
        this.resources = resources
        this.eventBus = eventBus

        // Массив мусора
        this.garbages = []

        eventBus.on('garbage:create', data => {
            this.create(data.x, data.y, data.type);
        });
    }

    create(posX, posY, type = 0) {
        this.garbages.push(new Garbage(this.world, this.resources, this.eventBus).create(posX, posY, type))
    }

    update() {
        this.garbages.forEach(g => g.update())
        this.garbages = this.garbages.filter(g => !g.toDestroy)
    }

    clear() {
        this.garbages.forEach(garbage => {
            this.world.removeChild(garbage.destroy())
        })
        this.garbages = []
    }
}
