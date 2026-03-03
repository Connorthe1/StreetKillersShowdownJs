import * as PIXI from 'pixi.js'
import * as Matter from 'matter-js'
import { FENCE_CHANCE, GROUND_COLORS } from '../../core/GameConfig.js'

/**
 * Класс для создания отдельных сегментов пола
 */
export class FloorSegment {
    constructor(resources, physicsManager, floorPosition, segmentIndex, selectGroundColor, isFence, changeWall) {
        this.resources = resources
        this.physicsManager = physicsManager
        this.floorPosition = floorPosition
        this.segmentIndex = segmentIndex
        this.selectGroundColor = selectGroundColor
        this.isFence = isFence
        this.changeWall = changeWall

        this.part = null
        this.floor = null
        this.bgWall = null
        
        this.create()
    }

    create() {
        this.part = new PIXI.Container()
        this.floor = new PIXI.Sprite(this.resources.textures.textures.ground)
        this.floor.anchor.set(0, 1)
        this.floor.position.set((this.floorPosition + this.segmentIndex) * this.floor.width, this.resources.WORLD_HEIGHT) // Will be set from outside
        this.floor.tint = GROUND_COLORS[this.selectGroundColor]

        if (this.changeWall) {
            if (!this.isFence) {
                this.bgWall = new PIXI.Sprite(this.resources.textures.textures.groundFenceStart)
            } else {
                this.bgWall = new PIXI.Sprite(this.resources.textures.textures.groundFenceMiddle)
            }
        } else {
            if (this.isFence) {
                this.bgWall = new PIXI.Sprite(this.resources.textures.textures.groundFenceEnd)
            } else {
                this.bgWall = new PIXI.Sprite(this.resources.textures.textures.groundWall)
            }
        }
        
        // Создание физического тела для пола
        this.floor.body = Matter.Bodies.rectangle(
            this.floor.x,
            this.floor.y - this.floor.height + 44,
            this.floor.width + 20,
            40,
            { isStatic: true }
        )
        
        this.bgWall.anchor.set(0, 1)
        this.bgWall.position.set((this.floorPosition + this.segmentIndex) * this.bgWall.width, this.floor.y - this.floor.height)
        
        this.part.addChild(this.floor)
        this.part.addChild(this.bgWall)
    }

    getPart() {
        return this.part
    }

    getFloor() {
        return this.floor
    }
    
    getBody() {
        return this.floor.body
    }

    destroy() {
        if (this.floor.body) {
            this.physicsManager.removeBody(this.floor.body)
            this.floor.body = null
        }
        if (this.part?.parent) {
            this.part.parent.removeChild(this.part)
        }
        this.part?.destroy({ children: true })
        this.part = null
        this.floor = null
        this.bgWall = null
    }
}
