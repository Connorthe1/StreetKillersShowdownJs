import { random } from '../../utils/GameUtils.js'
import {Enemy} from "./Enemy";

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

        eventBus.on('enemy:create', data => {
            this.create(data.pos, data.canCover, data.enemyType)
        })

        eventBus.on('enemy:bossClear', pos => {
            this.bossClear(pos)
        })
    }

    create(params) {
        let randomPos = params?.pos || Math.floor(this.worldCoords.zeroLeft + this.worldCoords.worldWidth + Math.floor(Math.random() * (250 - 50 + 1) + 50))
        let isSecondFloor = false

        // Проверка на дубликаты
        const findDuplicate = this.enemies.some(enemy => randomPos > enemy.sprite.x - 50 && randomPos < enemy.sprite.x + enemy.sprite.width + 50)
        if (findDuplicate) return

        // Проверка на босса
        if (params?.boss) {
            if (randomPos + 30 > params.boss.x && randomPos < params.boss.x + params.boss.width) {
                return null
            }
        }
        
        // Проверка зон спавна зданий
        if (params?.buildings?.length > 0) {
            params.buildings.forEach(build => {
                if (build.resetSpawnZones) {
                    build.resetSpawnZones.forEach(zone => {
                        if (randomPos + 30 > zone.x && randomPos < zone.w) {
                            randomPos = zone.w + 50
                            // if (zone.w - randomPos < randomPos - zone.x) {
                            //     randomPos = zone.w + 50
                            // } else {
                            //     randomPos = zone.x - 50
                            // }
                        }
                    })
                }
            })
        }

        if (params?.traps?.length > 0) {
            params.traps.forEach(trap => {
                const trapB = trap.sprite.getLocalBounds()
                if (randomPos > trapB.x - 50 && randomPos < trapB.x + trapB.width + 50) {
                    if (trapB.x + trapB.width / 2 > randomPos) {
                        randomPos = trapB.x - 50
                    } else {
                        randomPos = trapB.x + trapB.width + 50
                    }
                }
            })
        }
        
        // Определение этажа
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
        // Определение типа врага
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

    clear() {
        this.enemies.forEach(enemy => {
            this.world.removeChild(enemy)
        })
        this.enemies = []
    }
}
