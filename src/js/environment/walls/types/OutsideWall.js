import { Wall } from '../Wall.js'
import * as PIXI from 'pixi.js'
import { random } from '../../../utils/GameUtils.js'

/**
 * Стена снаружи (уличное укрытие)
 */
export class OutsideWall extends Wall {
    constructor(world, worldCoords, resources, eventBus) {
        super(world, worldCoords, resources, eventBus)

        this.bound = 0
    }

    /**
     * Создаёт спрайт стены снаружи.
     * @param {number} pos - позиция по X
     * @param {boolean} [forBoss] - для босса
     * @returns {OutsideWall}
     */
    create(pos, forBoss = false) {
        const randomWall = random(1, 10)

        if (randomWall < 4) {
            this.sprite = new PIXI.Sprite(this.resources.textures.textures.coverTrash)
            this.sprite.position.set(pos, this.worldCoords.ground + 36)
            this.bound = -20
            this.sprite.coverX = pos - 28
        } else {
            this.sprite = new PIXI.Sprite(this.resources.textures.textures.wall)
            this.sprite.position.set(pos, this.worldCoords.ground + 36)
            this.bound = 0
            this.sprite.coverX = pos - 20
        }

        if (forBoss) {
            this.sprite.forBoss = forBoss
        }

        this.sprite.anchor.set(0.5)
        this.addToWorld()

        if (Math.random() < 0.5 && randomWall < 4) {
            const garbagePos = random(10, this.sprite.width / 2)
            this.eventBus.emit('garbage:create', {
                x: this.sprite.x - this.sprite.width / 2 + garbagePos,
                y: this.sprite.y,
                type: 4
            })
        }

        return this
    }
}
