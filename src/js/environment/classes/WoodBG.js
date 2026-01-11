import * as PIXI from 'pixi.js'
import { random } from '../../utils/GameUtils.js'

export class WoodBG {
    constructor(posX, posY, resources) {
        this.resources = resources
        this.body = null

        this.create(posX, posY)
    }

    create(posX, posY) {
        const woodType = random(1, 4)
        const wood = new PIXI.AnimatedSprite(this.resources.woods.animations[`wood${woodType}_part`])
        wood.scale.set(random(0.8, 1.5, true, true))
        wood.anchor.set(0, 1)
        wood.position.set(posX, posY + 60)
        wood.animationSpeed = 0.1
        wood.play()

        this.body = wood
    }
}
