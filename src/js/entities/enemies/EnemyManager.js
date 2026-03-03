import { random } from '../../utils/GameUtils.js'
import {Enemy} from "./Enemy";

const PADDING = 40

/**
 * Менеджер врагов
 */
export class EnemyManager {
    constructor(world, gameState, worldCoords, resources, timer, eventBus) {
        this.world = world
        this.gameState = gameState
        this.worldCoords = worldCoords
        this.resources = resources
        this.timer = timer
        this.eventBus = eventBus

        this.enemies = []

        eventBus.on('enemy:create', ({pos, canCover, enemyType}) => {
            this.create({pos, canCover, enemyType})
        })

        eventBus.on('enemy:bossClear', pos => {
            this.bossClear(pos)
        })
    }

    /**
     * Собирает все запрещённые зоны (враги, босс, здания, ловушки)
     * в единый список {x, w} прямоугольников, в которых спавн запрещён.
     */
    collectExclusionZones(params) {
        const zones = []

        for (const enemy of this.enemies) {
            // Враги с canCover имеют приоритет — не сдвигать нового врага с canCover из-за них
            if (params?.canCover && enemy.params?.canCover) continue
            zones.push({
                x: enemy.sprite.x - 50,
                w: enemy.sprite.x + enemy.sprite.width + 50
            })
        }

        if (params?.boss) {
            zones.push({
                x: params.boss.x - 50,
                w: params.boss.x + params.boss.width
            })
        }

        if (params?.buildings?.length > 0) {
            for (const build of params.buildings) {
                if (build.resetSpawnZones) {
                    // console.log(build.resetSpawnZones)
                    for (const zone of build.resetSpawnZones) {
                        zones.push({ x: zone.x, w: zone.w})
                    }
                }
            }
        }

        if (params?.traps?.length > 0) {
            for (const trap of params.traps) {
                const b = trap.sprite.getLocalBounds()
                zones.push({
                    x: b.x + 30,
                    w: b.x + b.width - 30
                })
            }
        }

        return zones
    }

    /**
     * Проверяет, попадает ли позиция в одну из запрещённых зон.
     * Если попадает — пытается вытолкнуть позицию к ближайшему краю зоны.
     * Возвращает скорректированную позицию или null, если позиция невалидна.
     */
    resolvePosition(pos, zones, margin = 10, maxAttempts = 3) {
        for (let attempt = 0; attempt < maxAttempts; attempt++) {
            const conflicting = zones.find(z => pos > z.x && pos < z.w)
            // console.log(pos, conflicting)
            if (!conflicting) return pos

            const distToLeft = pos - conflicting.x
            const distToRight = conflicting.w - pos
            pos = distToLeft <= distToRight
                ? conflicting.x - margin
                : conflicting.w + margin
        }

        const stillConflicting = zones.some(z => pos > z.x && pos < z.w)
        return stillConflicting ? null : pos
    }

    create(params) {
        let randomPos = params?.pos || Math.floor(this.worldCoords.zeroRight + Math.floor(Math.random() * (250 - 50 + 1) + 50))

        // console.log('spawnEnemy')
        const zones = this.collectExclusionZones(params)
        // Враги с canCover имеют приоритет — при коллизии не сдвигать, а просто выйти
        if (params?.canCover) {
            const conflicting = zones.some(z => randomPos > z.x && randomPos < z.w)
            if (conflicting) return
        }
        const resolvedPos = this.resolvePosition(randomPos, zones)
        if (resolvedPos === null || randomPos < this.worldCoords.zeroRight) return
        randomPos = resolvedPos

        // console.log('final:', randomPos)

        let isSecondFloor = false
        if (params?.buildings?.length > 0) {
            const activeBuilding = params.buildings[0]
            const lastBuilding = params.buildings[params.buildings.length - 1].getLocalBounds()
            if ((lastBuilding.x + lastBuilding.width > randomPos && 
                 activeBuilding.getLocalBounds().x < randomPos) && 
                activeBuilding.secondFloor) {
                isSecondFloor = true
            }
        }

        let enemyType = params?.enemyType
        if (!enemyType) {
            const rand = random(1, 100)
            if (rand > Math.max(200 - this.gameState.points / 100, 80)) {
                enemyType = 'shield'
            } else if (rand > Math.max(150 - this.gameState.points / 100, 75)) {
                enemyType = 'silence'
            } else if (rand > Math.max(130 - this.gameState.points / 100, 60)) {
                enemyType = 'shotgun'
            } else if (rand > Math.max(115 - this.gameState.points / 100, 50)) {
                enemyType = 'smg'
            } else if (rand > Math.max(95 - this.gameState.points / 100, 20)) {
                enemyType = 'nigga'
            } else {
                enemyType = 'default'
            }
        }

        const enemy = new Enemy(this.world, this.resources, this.worldCoords, this.timer, this.gameState, this.eventBus).create({x: randomPos, y: isSecondFloor ? this.worldCoords.secondFloor : this.worldCoords.firstFloor}, params?.canCover, enemyType)
        this.enemies.push(enemy)
    }

    update() {
        this.enemies = this.enemies.reduce((acc, enemy) => {
            enemy.update()
            if (!enemy.toDestroy) acc.push(enemy)
            return acc
        }, [])
    }

    bossClear(pos) {
        this.enemies.forEach((enemy) => {
            if (enemy.x > pos - 400 && enemy.x < pos + 50) {
                enemy.destroy()
            }
        })
    }

    getEnemies() {
        return this.enemies
    }

    clear() {
        this.enemies.forEach(enemy => {
            this.world.removeChild(enemy)
        })
        this.enemies = []
    }
}
