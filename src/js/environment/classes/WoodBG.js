import * as PIXI from 'pixi.js'
import { random } from '../../utils/GameUtils.js'

export class WoodBG {
    constructor(world, resources) {
        this.resources = resources
        this.world = world

        this.woodsArr = []
    }

    create(posX, posY) {
        const woodType = random(1, 4)
        const wood = new PIXI.AnimatedSprite(this.resources.woods.animations[`wood${woodType}_part`])
        wood.scale.set(random(0.8, 1.5, true, true))
        wood.anchor.set(0, 1)
        wood.position.set(posX, posY + 50)
        wood.animationSpeed = 0.1
        wood.play()

        wood.zIndex = -1

        this.woodsArr.push(wood)
        this.world.addChild(wood)
    }

    update() {
        this.woodsArr.forEach((wood, idx) => {
            const w = wood.getBounds ? wood.getBounds() : wood
            const woodX = w.x || (wood.position ? wood.position.x : 0)
            const woodWidth = w.width || 0

            if (woodX + woodWidth < 0) {
                this.world.removeChild(wood)
                this.woodsArr.splice(idx, 1)
            }
        })
    }

    clear() {
        this.woodsArr.forEach(wood => this.world.removeChild(wood))
        this.woodsArr = []
    }
}
