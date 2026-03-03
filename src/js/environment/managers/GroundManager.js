import { FloorSegment } from "../classes/Floor";
import { random } from '../../utils/GameUtils.js';
import { GROUND_COLORS, FENCE_CHANCE } from '../../core/GameConfig.js';

/**
 * Менеджер земли/пола
 */
export class GroundManager {
    constructor(world, ground, physicsManager, resources, worldCoords) {
        this.world = world
        this.ground = ground
        this.physicsManager = physicsManager
        this.resources = resources
        this.worldCoords = worldCoords

        this.segments = []
        this.floorPosition = 0
        this.selectGroundColor = 0
        this.isFence = false

        this.refreshGroundColor()

        for (let i = 0; i <= 3; i++) {
            this.createFloor(i)
        }
    }

    createFloor(idx) {
        const changeWall = random(1, 10) < FENCE_CHANCE

        const segment = new FloorSegment(
            { ...this.resources, WORLD_HEIGHT: this.worldCoords.worldHeight },
            this.physicsManager,
            this.floorPosition,
            idx,
            this.selectGroundColor,
            this.isFence,
            changeWall
        )

        this.isFence = changeWall

        this.ground.addChild(segment.getPart())
        this.physicsManager.addBody(segment.getBody())
        this.segments.push(segment)
    }

    updateFloor(zeroLeft) {
        if (!this.ground) return

        const groundBounds = this.ground.getLocalBounds()
        const groundX = groundBounds.x || 0

        if (zeroLeft - groundX > 192) {
            this.floorPosition++

            if (this.segments.length > 0) {
                this.segments.shift().destroy()
            }

            this.createFloor(3)
        }
    }

    refreshGroundColor() {
        this.selectGroundColor = random(0, GROUND_COLORS.length - 1)
    }

    clear() {
        this.segments.forEach(segment => segment.destroy())
        this.segments = []
        this.floorPosition = 0
        this.isFence = false
    }
}
