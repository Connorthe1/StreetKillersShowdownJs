import { Wall } from '../Wall.js'
import * as PIXI from 'pixi.js'

/**
 * Укрытие в клубе
 */
export class InClubWall extends Wall {
    constructor(world, worldCoords, resources, eventBus) {
        super(world, worldCoords, resources, eventBus)

        this.bound = 0
    }

    /**
     * Создаёт спрайт укрытия в клубе.
     * @param {number} pos - позиция по X
     * @param {number} type - тип (0, 1, 2)
     * @param {boolean} [forBoss] - для босса
     * @returns {InClubWall}
     */
    create(pos, type, forBoss = false) {
        this.sprite = new PIXI.Sprite(this.resources.inClubTexture.textures[`inClub-${type}`])

        switch (type) {
            case 0:
                //COUCH
                this.bound = 50
                this.sprite.coverX = pos - 42
                this.sprite.position.set(pos, this.worldCoords.ground + 31)
                break
            case 1:
                //AUTO
                this.bound = 70
                this.sprite.coverX = pos - 20
                this.sprite.position.set(pos, this.worldCoords.ground + 25)
                break
            case 2:
                //TRASH
                this.bound = 60
                this.sprite.coverX = pos - 20
                this.sprite.position.set(pos, this.worldCoords.ground + 33)
                break
        }

        if (forBoss) {
            this.sprite.forBoss = true
        }

        this.sprite.anchor.set(0.5)
        this.sprite.height = this.sprite.height * 2
        this.sprite.width = this.sprite.width * 2
        this.sprite.zIndex = 1

        this.addToWorld()
        return this
    }
}
