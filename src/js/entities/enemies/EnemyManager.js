import * as PIXI from 'pixi.js'
import { random } from '../../utils/GameUtils.js'
import { getPercent } from '../../utils/GameUtils.js'
import {default as enemyParams} from '../../enemyParams.js'
import {BarrelTrap} from "../../environment/traps/types/BarrelTrap";
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

    create(pos = null, canCover = false, enemyType = null) {
        let randomPos = pos || Math.floor(this.worldCoords.zeroLeft + this.worldCoords.worldWidth + Math.floor(Math.random() * (250 - 50 + 1) + 50))
        let isSecondFloor = false

        const buildings = this.eventBus.emit('buildings:get', null, true) || []
        
        // Проверка зон спавна зданий
        if (buildings.length > 0) {
            buildings.forEach(build => {
                if (build.resetSpawnZones) {
                    build.resetSpawnZones.forEach(zone => {
                        if (randomPos + 30 > zone.x && randomPos < zone.w) {
                            if (zone.w - randomPos < randomPos - zone.x) {
                                randomPos = zone.w + 50
                            } else {
                                randomPos = zone.x - 50
                            }
                        }
                    })
                }
            })
        }
        
        // Проверка на дубликаты
        const findDuplicate = this.enemies.some(enemy => randomPos + 30 > enemy.sprite.x && randomPos < enemy.sprite.x + enemy.sprite.width)
        if (findDuplicate) return
        
        // Проверка на босса
        // if (this.currentBoss) {
        //     if (randomPos + 30 > this.currentBoss.x && randomPos < this.currentBoss.x + this.currentBoss.width) {
        //         return null
        //     }
        // }
        
        // Определение этажа
        if (buildings.length > 0) {
            const activeBuilding = buildings[0]
            const lastBuilding = buildings[buildings.length - 1].getLocalBounds()
            if ((lastBuilding.x + lastBuilding.width > randomPos && 
                 activeBuilding.getLocalBounds().x < randomPos) && 
                activeBuilding.secondFloor) {
                isSecondFloor = true
            }
        }
        
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

        const enemy = new Enemy(this.world, this.resources, this.worldCoords, this.timer, this.gameState, this.eventBus).create({x: randomPos, y: isSecondFloor ? this.worldCoords.secondFloor : this.worldCoords.firstFloor}, canCover, enemyType)
        this.enemies.push(enemy)
    }

    /**
     * Обновляет всех врагов
     * @param {number} gameSpeed - скорость игры
     * @param {boolean} meleeKill - активен ли ближний бой
     */
    updateEnemies() {
        this.enemies.forEach((enemy, idx) => {
            if (!enemy.params.dead) {
                // Обнаружение игрока

                // Проверка коллизии с пулями игрока
                if (this.playerBullets) {
                    this.playerBullets.forEach((bullet, bulletIdx) => {
                        if (enemy.x - enemy.width / 2 < bullet.x + bullet.width &&
                            enemy.x + enemy.width / 2 > bullet.x &&
                            enemy.y - enemy.height / 2 < bullet.y &&
                            enemy.y + enemy.height / 2 > bullet.y) {

                            if (enemy.params.inCover) return

                            if (this.world) {
                                this.world.removeChild(bullet)
                            }
                            this.playerBullets.splice(bulletIdx, 1)

                            const damage = this.gun ?
                                (enemy.x - this.player.x < getPercent(this.WORLD_WIDTH, 30) ?
                                    this.gun.damage * 2 : this.gun.damage) : 10

                            this.damageEnemy(enemy, damage)
                        }
                    })
                }
            }
        })

        // this.gameState.points -= 250 * this.gameState.multiplier
        // if (this.gameState.points < 0) {
        //     this.gameState.points = 0
        // }
        // this.gameState.decreaseStreakBy(20)

        this.enemies.forEach(enemy => enemy.update())

        this.enemies = this.enemies.filter(enemy => enemy.toDestroy === false)
    }
    
    /**
     * Наносит урон врагу
     * @param {PIXI.AnimatedSprite} enemy - враг
     * @param {number} damage - урон
     * @param {boolean} isBoss - является ли боссом
     */
    damageEnemy(enemy, damage, isBoss = false) {
        if (!enemy || !enemy.params) return
        
        enemy.params.health -= damage
        
        if (this.addPointsCallback) {
            this.addPointsCallback(5)
        }
        this.gameState.increaseStreak(0.5)
        
        // Звуки
        if (this.soundPlayer) {
            if (isBoss || (enemy.params.shield && !enemy.params.knocked)) {
                this.soundPlayer.damageMetal()
            } else {
                this.soundPlayer.damageFlesh()
            }
        }
        
        // Частицы
        if (this.createParticlesCallback) {
            const particleType = isBoss || (enemy.params.shield && !enemy.params.knocked) ? 'spark' : 'blood'
            for (let i = 0; i < random(8, 20); i++) {
                this.createParticlesCallback(enemy, particleType, enemy.secondFloor)
            }
        }
        
        // Смерть
        if (enemy.params.health <= 0) {
            this.handleEnemyDeath(enemy, damage, isBoss)
            return
        }
        
        // Обработка щита
        if (enemy.params.shield && !enemy.params.knocked && enemy.params.health <= 2) {
            enemy.params.knocked = true
            enemy.textures = enemy.params.animset.knock
            enemy.play()
            enemy.params.animset.idle = enemy.params.animset.idleAlt
            enemy.params.animset.shot = enemy.params.animset.shotAlt
            
            if (this.sleepCallback) {
                this.sleepCallback(150).then(() => {
                    if (enemy.params.health <= 0) return
                    enemy.textures = enemy.params.animset.idle
                    enemy.play()
                })
            }
        }
    }
    
    /**
     * Обрабатывает смерть врага
     */
    handleEnemyDeath(enemy, damage, isBoss) {
        // Удаление предупреждений
        if (enemy.params.detect) {
            if (enemy.params.warning && this.world) {
                this.world.removeChild(enemy.params.warning)
            }
            if (enemy.params.longDetector && this.world) {
                this.world.removeChild(enemy.params.longDetector)
            }
        }
        
        // Взрывы при смерти
        if (enemy.params.deathType && this.createExplodeCallback) {
            switch (enemy.params.deathType) {
                case 'smallExplode':
                    this.createExplodeCallback(enemy, 0, 0, false)
                    break
                case 'bigExplode':
                    this.createExplodeCallback(enemy, -28, -24, true)
                    break
            }
        }
        
        // Тряска камеры
        if (this.cameraShakeCallback) {
            this.cameraShakeCallback(1, 400)
        }
        
        enemy.params.dead = true
        this.gameState.increaseStreak(enemy.params.points / 10)
        
        if (this.addPointsCallback) {
            this.addPointsCallback(enemy.params.points)
        }
        
        enemy.loop = false
        
        // Критический урон
        if (damage > (this.gun ? this.gun.damage : 10) || isBoss) {
            if (this.addPointsCallback) {
                this.addPointsCallback(10)
            }
            enemy.textures = enemy.params.animset.deathCrit || enemy.params.animset.death
            if (this.createParticlesCallback) {
                for (let i = 0; i < random(8, 20); i++) {
                    this.createParticlesCallback(enemy, 'blood', enemy.secondFloor)
                }
            }
        } else {
            enemy.textures = enemy.params.animset.death
        }
        
        // Выпадение денег
        if (enemy.params.moneyDrop && this.spawnDropMoneyCallback) {
            for (let i = 0; i <= random(0, enemy.params.moneyDrop); i++) {
                this.spawnDropMoneyCallback(enemy)
            }
        }
        
        enemy.play()
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
            if (this.world) {
                this.world.removeChild(enemy)
            }
        })
        this.enemies = []
    }
}
