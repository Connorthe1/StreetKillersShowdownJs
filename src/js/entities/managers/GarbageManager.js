import { Garbage } from "../classes/Garbage";
import { EventBus } from "../../utils/EventBus";

export class GarbageManager {
    constructor(world, resources, eventBus) {
        this.world = world
        this.resources = resources
        this.eventBus = eventBus

        // Массив мусора
        this.garbages = []

        eventBus.on('garbage:create', data => {
            console.log('garbage:create')
            this.createGarbage(data.x, data.y, data.type);
        });
    }

    createGarbage(posX, posY, type = 0) {
        const garbage = new Garbage(posX, posY, type, this.resources, this.eventBus)

        this.world.addChild(garbage.body)
        this.garbages.push(garbage)
    }

    updateGarbage(zeroLeft) {
        for (let i = this.garbages.length - 1; i >= 0; i--) {
            const garbage = this.garbages[i]

            if (garbage.body.x + garbage.body.width < zeroLeft || !garbage.alive) {
                this.world.removeChild(garbage.body)
                this.garbages.splice(i, 1) // удаляем элемент из массива
            }
        }
    }

    clear() {
        this.garbages.forEach(garbage => {
            if (this.world) {
                this.world.removeChild(garbage.body)
            }
        })
        this.garbages = []
    }
}
