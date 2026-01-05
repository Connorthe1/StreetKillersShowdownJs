/**
 * Enemy.js
 * 
 * Классы врагов и их менеджер
 * 
 * Содержит:
 * - Класс Enemy (базовый класс врага)
 * - Подклассы: ShieldEnemy, SilenceEnemy, ShotgunEnemy, SmgEnemy, DefaultEnemy
 * - Класс EnemyManager (управление всеми врагами)
 * - Методы: createEnemy(), updateEnemies(), damageEnemy(), enemyShooting()
 * - Логика обнаружения игрока
 * - Логика стрельбы врагов
 * - Обработка смерти врагов
 */

import * as PIXI from 'pixi.js'
import { random } from '../utils/GameUtils.js'
import { getPercent } from '../utils/GameUtils.js'

/**
 * Менеджер врагов
 */
export class EnemyManager {
    constructor(world, gameState, enemies, playerBullets, player, playerState, traps, buildings, currentBoss, zeroLeft, WORLD_WIDTH, secondFloor, playerPos) {
        this.world = world
        this.gameState = gameState
        this.enemies = enemies
        this.playerBullets = playerBullets
        this.player = player
        this.playerState = playerState
        this.traps = traps
        this.buildings = buildings
        this.currentBoss = currentBoss
        this.zeroLeft = zeroLeft
        this.WORLD_WIDTH = WORLD_WIDTH
        this.secondFloor = secondFloor
        this.playerPos = playerPos
        
        // Текстуры и параметры (устанавливаются позже)
        this.enemiesTexture = null
        this.enemyParams = null
        
        // Callbacks
        this.shotCallback = null
        this.damagePlayerCallback = null
        this.createParticlesCallback = null
        this.createExplodeCallback = null
        this.spawnDropMoneyCallback = null
        this.cameraShakeCallback = null
        this.HUDmeleeKillCallback = null
        this.addPointsCallback = null
        this.soundPlayer = null
        this.sleepCallback = null
        this.gun = null
    }
    
    /**
     * Устанавливает текстуры и параметры врагов
     */
    setTextures(textures, enemyParams) {
        this.enemiesTexture = textures
        this.enemyParams = enemyParams
    }
    
    /**
     * Устанавливает колбэки
     */
    setCallbacks(callbacks) {
        if (callbacks.shot) this.shotCallback = callbacks.shot
        if (callbacks.damagePlayer) this.damagePlayerCallback = callbacks.damagePlayer
        if (callbacks.createParticles) this.createParticlesCallback = callbacks.createParticles
        if (callbacks.createExplode) this.createExplodeCallback = callbacks.createExplode
        if (callbacks.spawnDropMoney) this.spawnDropMoneyCallback = callbacks.spawnDropMoney
        if (callbacks.cameraShake) this.cameraShakeCallback = callbacks.cameraShake
        if (callbacks.HUDmeleeKill) this.HUDmeleeKillCallback = callbacks.HUDmeleeKill
        if (callbacks.addPoints) this.addPointsCallback = callbacks.addPoints
        if (callbacks.soundPlayer) this.soundPlayer = callbacks.soundPlayer
        if (callbacks.sleep) this.sleepCallback = callbacks.sleep
        if (callbacks.gun) this.gun = callbacks.gun
    }
    
    /**
     * Обновляет состояние
     */
    updateState(state) {
        if (state.player !== undefined) this.player = state.player
        if (state.playerState !== undefined) this.playerState = state.playerState
        if (state.currentBoss !== undefined) this.currentBoss = state.currentBoss
        if (state.zeroLeft !== undefined) this.zeroLeft = state.zeroLeft
        if (state.traps !== undefined) this.traps = state.traps
        if (state.buildings !== undefined) this.buildings = state.buildings
    }
    
    /**
     * Создает врага
     * @param {number} pos - позиция X (опционально)
     * @param {boolean} canCover - может ли враг быть в укрытии
     * @param {string} enemyType - тип врага (опционально, определяется автоматически)
     * @returns {PIXI.AnimatedSprite|null} созданный враг или null
     */
    createEnemy(pos = null, canCover = false, enemyType = null) {
        if (!this.enemiesTexture || !this.enemyParams) {
            console.warn('Enemy textures or params not available')
            return null
        }
        
        let randomPos = pos || Math.floor(this.zeroLeft + this.WORLD_WIDTH + Math.floor(Math.random() * (250 - 50 + 1) + 50))
        let isSecondFloor = false
        
        // Проверка зон спавна зданий
        if (this.buildings && this.buildings.length > 0) {
            this.buildings.forEach(build => {
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
        const findDuplicate = this.enemies.findIndex(
            enemy => randomPos + 30 > enemy.x && randomPos < enemy.x + enemy.width
        )
        if (findDuplicate >= 0) return null
        
        // Проверка на босса
        if (this.currentBoss) {
            if (randomPos + 30 > this.currentBoss.x && randomPos < this.currentBoss.x + this.currentBoss.width) {
                return null
            }
        }
        
        // Определение этажа
        if (this.buildings && this.buildings.length > 0) {
            const activeBuilding = this.buildings[0]
            const lastBuilding = this.buildings[this.buildings.length - 1].getLocalBounds()
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
        
        // Создание врага
        const enemy = new PIXI.AnimatedSprite(this.enemiesTexture.animations[`${enemyType}Idle`])
        enemy.params = {}
        
        // Копирование параметров
        if (this.enemyParams[enemyType]) {
            Object.keys(this.enemyParams[enemyType]).forEach(item => {
                enemy.params[item] = this.enemyParams[enemyType][item]
            })
        }
        
        // Настройка анимаций
        enemy.params.animset = {}
        enemy.params.animset.idle = this.enemiesTexture.animations[`${enemyType}Idle`]
        enemy.params.animset.shot = this.enemiesTexture.animations[`${enemyType}Shot`]
        enemy.params.animset.death = this.enemiesTexture.animations[`${enemyType}Death`]
        enemy.params.animset.deathCrit = this.enemiesTexture.animations[`${enemyType}DeathCrit`]
        
        if (enemy.params.shield) {
            enemy.params.animset.idleAlt = this.enemiesTexture.animations[`${enemyType}IdleAlt`]
            enemy.params.animset.shotAlt = this.enemiesTexture.animations[`${enemyType}ShotAlt`]
            enemy.params.animset.knock = this.enemiesTexture.animations[`${enemyType}Knock`]
        }
        
        enemy.anchor.set(0.5)
        
        if (canCover) {
            enemy.params.canCover = true
            enemy.params.inCover = true
            enemy.anchor.y = 0.7
            enemy.tint = 11776947
        }
        
        enemy.scale.set(2)
        enemy.animationSpeed = 0.2
        enemy.zIndex = 8
        enemy.position.set(randomPos, isSecondFloor ? this.secondFloor : this.playerPos)
        enemy.secondFloor = isSecondFloor
        
        this.world.addChild(enemy)
        enemy.play()
        this.enemies.push(enemy)
        
        return enemy
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
    
    /**
     * Обновляет всех врагов
     * @param {number} gameSpeed - скорость игры
     * @param {boolean} meleeKill - активен ли ближний бой
     */
    updateEnemies(gameSpeed, meleeKill = false) {
        if (!this.player) return
        
        this.enemies.forEach((enemy, idx) => {
            if (!enemy.params.dead) {
                // Обнаружение игрока
                if (!enemy.params.detect) {
                    const checkTraps = this.traps ? this.traps.find(trap => {
                        if (!trap.dead && trap.type) {
                            if (trap.x > enemy.x - this.WORLD_WIDTH && trap.x < enemy.x) {
                                return true
                            }
                        }
                        return false
                    }) : null
                    
                    if (!checkTraps) {
                        const detectRange = getPercent(this.WORLD_WIDTH, enemy.params.detectRange)
                        if (enemy.x - this.player.x < detectRange && enemy.y - 20 <= this.player.y) {
                            enemy.params.detect = true
                            if (this.shotCallback) {
                                this.shotCallback(enemy)
                            }
                        }
                    }
                }
                
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
                
                // Проверка коллизии с игроком
                if (!enemy.skip && 
                    this.player.x > enemy.x - 30 && 
                    this.player.x + 40 < enemy.x + enemy.width) {
                    
                    if (!meleeKill && 
                        (this.playerState.state === 'roll' || this.playerState.state === 'rollEnd')) {
                        if (this.playerState.invincible) {
                            this.damageEnemy(enemy, 10)
                        } else {
                            if (this.HUDmeleeKillCallback) {
                                this.HUDmeleeKillCallback(enemy)
                            }
                        }
                    } else {
                        if (enemy.params.inCover) return
                        this.gameState.points -= 250 * this.gameState.multiplier
                        if (this.gameState.points < 0) {
                            this.gameState.points = 0
                        }
                        this.gameState.decreaseStreakBy(20)
                    }
                    enemy.skip = true
                }
            }
            
            // Удаление врагов за левой границей
            if (enemy.x + enemy.width < this.zeroLeft) {
                if (this.world) {
                    this.world.removeChild(enemy)
                }
                this.enemies.splice(idx, 1)
            }
        })
    }
    
    /**
     * Получает массив врагов (для обратной совместимости)
     */
    getEnemies() {
        return this.enemies
    }
    
    /**
     * Очищает всех врагов
     */
    clear() {
        this.enemies.forEach(enemy => {
            if (this.world) {
                this.world.removeChild(enemy)
            }
        })
        this.enemies = []
    }
}
