export class GarbageManager {
    constructor(world, resources) {
        this.world = world
        this.resources = resources

        // Массив мусора
        this.garbages = []
    }

    createGarbage(posX, posY, type = 0) {
        const garbage = new Garbage(posX, posY, type)

        this.world.addChild(garbage.body)
        this.garbages.push(garbage)
    }

    updateGarbage(zeroLeft) {
        for (let i = this.garbages.length - 1; i >= 0; i--) {
            const garbage = this.garbages[i]
            garbage.update()

            if (garbage.body.x < zeroLeft) {
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
