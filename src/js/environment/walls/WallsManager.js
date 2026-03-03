import { random } from '../../utils/GameUtils.js'
import { OutsideWall } from './types/OutsideWall.js'
import { InBuildWall } from './types/InBuildWall.js'
import { InClubWall } from './types/InClubWall.js'

/**
 * Менеджер стен и укрытий
 */
export class WallsManager {
    constructor(world, worldCoords, resources, eventBus) {
        this.world = world
        this.worldCoords = worldCoords
        this.resources = resources
        this.eventBus = eventBus

        this.walls = []

        eventBus.on('wall:bossClear', pos => {
            this.bossClear(pos)
        })

        eventBus.on('wall:create', data => {
            this.createWall(data.pos, data.forBoss, data.afterBuilding)
        })

        eventBus.on('wall:createInBuild', ({pos, isSecondFloor, isRoof}) => {
            this.createCoverInBuild(pos, isSecondFloor, isRoof)
        })

        eventBus.on('wall:createInClub', data => {
            this.createCoverInClub(data.pos, data.type, data.forBoss)
        })

        eventBus.on('wall:clear', data => {
            this.deleteWallsAroundBuilding(data)
        })
    }

    registerWall(wall) {
        this.walls.push(wall)
    }

    createWall(pos = null, forBoss = false, afterBuilding = 0) {
        const randomPos = pos ?? this.worldCoords.zeroRight + random(100, 250)

        if (afterBuilding > randomPos - 100) {
            return
        }

        if (this.walls.length > 0) {
            const lastWall = this.walls[this.walls.length - 1]
            const bounds = lastWall.sprite?.getLocalBounds?.() ?? lastWall.sprite ?? lastWall
            const wallX = bounds.x ?? bounds.position?.x ?? 0
            const wallWidth = bounds.width ?? 0
            if (randomPos > wallX - 100 && randomPos < wallX + wallWidth + 100) {
                return
            }
        }

        if (!pos && !forBoss) {
            const rand = random(1, 10)
            if (rand > 1) {
                this.eventBus.emit('enemy:create', { pos: randomPos + 50, canCover: true })
            }
        }

        const wall = new OutsideWall(
            this.world,
            this.worldCoords,
            this.resources,
            this.eventBus
        ).create(randomPos, forBoss)

        this.registerWall(wall)
    }

    createCoverInBuild(pos, isSecondFloor = false, isRoof = false) {
        const wall = new InBuildWall(
            this.world,
            this.worldCoords,
            this.resources,
            this.eventBus
        ).create(pos, isSecondFloor, isRoof)

        this.registerWall(wall)
    }

    createCoverInClub(pos, type, forBoss) {
        const wall = new InClubWall(
            this.world,
            this.worldCoords,
            this.resources,
            this.eventBus
        ).create(pos, type, forBoss)

        this.registerWall(wall)
    }

    update() {
        this.walls.forEach(wall => wall.update())
        this.walls = this.walls.filter(wall => !wall.toDestroy)
    }

    bossClear(pos) {
        this.walls.forEach(wall => {
            const wallX = wall.sprite?.x ?? 0
            if (wallX > pos - 400 && wallX < pos + 200) {
                wall.destroy()
            }
        })
    }

    /**
     * Удаляет стены вокруг здания
     * @param {number} position - позиция здания
     */
    deleteWallsAroundBuilding(position) {
        this.walls.forEach(wall => {
            const wallX = wall.sprite?.x ?? 0
            if (wallX + 100 > position) {
               wall.destroy()
            }
        })
    }

    clear() {
        this.walls.forEach(wall => wall.destroy())
        this.walls = []
    }
}
