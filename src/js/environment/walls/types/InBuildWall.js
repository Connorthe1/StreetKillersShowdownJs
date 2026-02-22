import { Wall } from '../Wall.js'
import * as PIXI from 'pixi.js'
import {random} from "../../../utils/GameUtils";

/**
 * Укрытие внутри здания
 */
export class InBuildWall extends Wall {
    constructor(world, worldCoords, resources, eventBus) {
        super(world, worldCoords, resources, eventBus)

        this.bound = 0
    }

    /**
     * Создаёт спрайт укрытия в здании.
     * @param {number} pos - позиция по X
     * @param {boolean} isSecondFloor - второй этаж
     * @param {boolean} isRoof - крыша
     * @returns {InBuildWall}
     */
    create(pos, isSecondFloor, isRoof) {
        if (isRoof) {
            const randomWall = random(0,1)
            this.sprite = new PIXI.Sprite(this.resources.inFloorTexture.textures[`Floor-${randomWall}`])
            this.sprite.coverX = randomWall === 0 ? pos - 24 : pos - 34
        } else {
            const randomWall = random(0,2)
            this.sprite = new PIXI.Sprite(this.resources.inBuildTexture.textures[`inhouse-${randomWall}`])
            this.sprite.coverX = pos - 20
        }

        this.sprite.anchor.set(0.5, 1)
        this.sprite.position.set(
            pos,
            isSecondFloor ? (isRoof ? this.worldCoords.ground - 114: this.worldCoords.ground - 109) : this.worldCoords.ground + 78
        )
        this.sprite.height = this.sprite.height * 2
        this.sprite.width = this.sprite.width * 2
        this.sprite.zIndex = 1

        this.addToWorld()
        return this
    }
}
