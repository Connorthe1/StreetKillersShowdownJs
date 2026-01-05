/**
 * Trap.js
 * 
 * Менеджер ловушек
 * 
 * Содержит:
 * - Создание бочек (createBarrel)
 * - Обновление ловушек (updateTraps)
 * - Взрыв бочек (barrelDead)
 * - Коллизии с игроком, врагами, пулями
 * - Обработка окон и дверей
 */

import * as PIXI from 'pixi.js'
import { random } from '../utils/GameUtils.js'

/**
 * Менеджер ловушек
 */
export class TrapManager {
    constructor(world, player, playerState, gameState, enemies, currentDogEnemy, playerBullets, zeroRight, afterBuilding, ground, fg, bochka) {
        this.world = world
        this.player = player
        this.playerState = playerState
        this.gameState = gameState
        this.enemies = enemies
        this.currentDogEnemy = currentDogEnemy
        this.playerBullets = playerBullets
        this.zeroRight = zeroRight
        this.afterBuilding = afterBuilding
        this.ground = ground
        this.fg = fg
        this.bochka = bochka
        
        // Массив ловушек
        this.traps = []
        
        // Callbacks
        this.addPointsCallback = null
        this.damagePlayerCallback = null
        this.damageEnemyCallback = null
        this.soundPlayer = null
        this.createParticlesCallback = null
        this.createExplodeCallback = null
        this.sleepCallback = null
        this.gun = null
    }
    
    /**
     * Устанавливает колбэки
     */
    setCallbacks(callbacks) {
        if (callbacks.addPoints) this.addPointsCallback = callbacks.addPoints
        if (callbacks.damagePlayer) this.damagePlayerCallback = callbacks.damagePlayer
        if (callbacks.damageEnemy) this.damageEnemyCallback = callbacks.damageEnemy
        if (callbacks.soundPlayer) this.soundPlayer = callbacks.soundPlayer
        if (callbacks.createParticles) this.createParticlesCallback = callbacks.createParticles
        if (callbacks.createExplode) this.createExplodeCallback = callbacks.createExplode
        if (callbacks.sleep) this.sleepCallback = callbacks.sleep
        if (callbacks.gun) this.gun = callbacks.gun
    }
    
    /**
     * Обновляет состояние
     */
    updateState(state) {
        if (state.player !== undefined) this.player = state.player
        if (state.playerState !== undefined) this.playerState = state.playerState
        if (state.zeroRight !== undefined) this.zeroRight = state.zeroRight
        if (state.afterBuilding !== undefined) this.afterBuilding = state.afterBuilding
        if (state.currentDogEnemy !== undefined) this.currentDogEnemy = state.currentDogEnemy
    }
    
    /**
     * Создает бочку
     */
    createBarrel() {
        if (!this.bochka) {
            console.warn('Barrel texture not available')
            return null
        }
        
        const randomPos = Math.floor(this.zeroRight + Math.floor(Math.random() * (250 - 50 + 1) + 50))
        
        // Проверка на здания
        if (this.afterBuilding > randomPos - 100) {
            return null
        }
        
        // Проверка на другие ловушки
        let findErr = false
        this.traps.forEach(trap => {
            const t = trap.getLocalBounds ? trap.getLocalBounds() : trap
            if (randomPos > t.x - 100 && randomPos < t.x + t.width + 100) {
                findErr = true
            }
        })
        
        if (findErr) return null
        
        // Создание бочки
        const bochkaContainer = new PIXI.Container()
        const bochkaTop = new PIXI.AnimatedSprite(this.bochka.animations.bochkaTop)
        const bochkaDown = new PIXI.AnimatedSprite(this.bochka.animations.bochkaDown)
        
        bochkaTop.scale.set(2)
        bochkaDown.scale.set(2)
        bochkaTop.loop = false
        bochkaDown.loop = false
        bochkaTop.animationSpeed = 0.2
        bochkaDown.animationSpeed = 0.2
        bochkaDown.anchor.set(0.5)
        bochkaTop.anchor.set(0.5)
        bochkaDown.parentGroup = this.fg
        bochkaDown.zOrder = 10
        
        const groundY = this.ground.getLocalBounds ? this.ground.getLocalBounds().y : 0
        bochkaTop.position.set(randomPos, groundY + 56)
        bochkaDown.position.set(randomPos, bochkaTop.y + 6)
        
        bochkaContainer.addChild(bochkaTop)
        bochkaContainer.addChild(bochkaDown)
        bochkaContainer.dead = false
        
        if (this.world) {
            this.world.addChild(bochkaContainer)
        }
        
        this.traps.push(bochkaContainer)
        return bochkaContainer
    }
    
    /**
     * Обновляет все ловушки
     */
    updateTraps() {
        this.traps.forEach((trap, idx) => {
            const trapB = trap.getBounds ? trap.getBounds() : trap
            
            if (!trap.dead) {
                // Коллизия с игроком
                if (this.player) {
                    const p = this.player.getBounds ? this.player.getBounds() : this.player
                    if (p.x > trapB.x + 20 && p.x < trapB.x + 50) {
                        if (trap.type) {
                            // Окно или дверь
                            if (trap.type === 'window' && this.soundPlayer) {
                                this.soundPlayer.glassBreak()
                            }
                            if (trap.play) {
                                trap.play()
                            }
                            trap.dead = true
                            if (this.addPointsCallback) {
                                this.addPointsCallback(25)
                            }
                        } else {
                            // Бочка
                            if (this.playerState && 
                                (this.playerState.state === 'roll' || this.playerState.state === 'rollEnd')) {
                                return // Игнорировать при кувырке
                            }
                            this.barrelDead(trap)
                        }
                    }
                }
                
                // Коллизия с собакой-врагом
                if (this.currentDogEnemy) {
                    const d = this.currentDogEnemy.getBounds ? this.currentDogEnemy.getBounds() : this.currentDogEnemy
                    if (d.x + d.width > trapB.x && d.x < trapB.x + trapB.width) {
                        if (trap.type) {
                            // Окно или дверь
                            if (trap.type === 'window' && this.soundPlayer) {
                                this.soundPlayer.glassBreak()
                            }
                            if (trap.type === 'door') return // Двери не активируются собаками
                            
                            if (trap.play) {
                                trap.play()
                            }
                            if (this.gameState) {
                                this.gameState.scoreStreak += 5
                            }
                            trap.dead = true
                            if (this.addPointsCallback) {
                                this.addPointsCallback(25)
                            }
                            if (this.damageEnemyCallback && this.gun) {
                                this.damageEnemyCallback(this.currentDogEnemy, this.gun.damage)
                            }
                        } else {
                            // Бочка
                            this.barrelDead(trap)
                        }
                    }
                }
                
                // Коллизия с пулями игрока
                if (this.playerBullets) {
                    this.playerBullets.forEach((bullet, bulletIdx) => {
                        const bulletBound = bullet.getBounds ? bullet.getBounds() : bullet
                        const trapWidth = trap.type ? trapB.width / 2 : trapB.width / 4
                        
                        if (bulletBound.x + bulletBound.width > trapB.x + trapWidth &&
                            bulletBound.x < trapB.x + trapB.width &&
                            bulletBound.y > trapB.y &&
                            bulletBound.y < trapB.y + trapB.height) {
                            
                            // Удаление пули
                            if (this.world) {
                                this.world.removeChild(bullet)
                            }
                            this.playerBullets.splice(bulletIdx, 1)
                            
                            if (trap.type) {
                                // Окно или дверь
                                if (trap.type === 'window' && this.soundPlayer) {
                                    this.soundPlayer.glassBreak()
                                }
                                if (trap.play) {
                                    trap.play()
                                }
                                trap.dead = true
                                if (this.addPointsCallback) {
                                    this.addPointsCallback(25)
                                }
                                if (this.gameState) {
                                    this.gameState.scoreStreak += 1
                                }
                            } else {
                                // Бочка
                                this.barrelDead(trap)
                            }
                        }
                    })
                }
            }
            
            // Удаление за левой границей
            if (trapB.x + trapB.width < 0) {
                if (this.world) {
                    this.world.removeChild(trap)
                }
                this.traps.splice(idx, 1)
            }
        })
    }
    
    /**
     * Взрыв бочки
     * @param {PIXI.Container} barrel - бочка
     */
    async barrelDead(barrel) {
        if (!barrel || barrel.dead) return
        
        // Звуки
        if (this.soundPlayer) {
            this.soundPlayer.damageMetal()
            this.soundPlayer.beep()
        }
        
        // Очки
        if (this.addPointsCallback) {
            this.addPointsCallback(30)
        }
        
        if (this.gameState) {
            this.gameState.scoreStreak += 2
        }
        
        barrel.dead = true
        
        // Задержка перед взрывом
        if (this.sleepCallback) {
            await this.sleepCallback(100)
        }
        
        const b = barrel.getBounds ? barrel.getBounds() : barrel
        
        // Урон собаке-врагу
        if (this.currentDogEnemy && this.damageEnemyCallback) {
            const e = this.currentDogEnemy.getBounds ? this.currentDogEnemy.getBounds() : this.currentDogEnemy
            if (e.x + e.width > b.x - 100 && e.x < b.x + b.width + 100) {
                if (!this.currentDogEnemy.params || !this.currentDogEnemy.params.dead) {
                    this.damageEnemyCallback(this.currentDogEnemy, 4)
                }
            }
        }
        
        // Урон врагам
        if (this.enemies && this.damageEnemyCallback) {
            this.enemies.forEach(enemy => {
                const e = enemy.getBounds ? enemy.getBounds() : enemy
                if (e.x + e.width > b.x - 100 && e.x < b.x + b.width + 100) {
                    if (!enemy.params || !enemy.params.dead) {
                        this.damageEnemyCallback(enemy, 4)
                    }
                }
            })
        }
        
        // Урон игроку
        if (this.player && this.playerState && !this.playerState.inCover && this.damagePlayerCallback) {
            const p = this.player.getBounds ? this.player.getBounds() : this.player
            if (p.x + p.width > b.x - 20 && p.x + 40 < b.x + b.width + 20) {
                this.damagePlayerCallback()
            }
        }
        
        // Анимация взрыва бочки
        if (barrel.children && barrel.children.length >= 2) {
            barrel.children[0].textures = this.bochka.animations.bochkaTopDead
            barrel.children[1].textures = this.bochka.animations.bochkaDownDead
            barrel.children[0].play()
            barrel.children[1].play()
        }
        
        // Частицы искр
        if (this.createParticlesCallback && barrel.children && barrel.children[0]) {
            for (let i = 0; i < 20; i++) {
                this.createParticlesCallback(barrel.children[0], 'spark')
            }
        }
        
        // Взрывы
        if (this.createExplodeCallback && barrel.children && barrel.children.length >= 2) {
            this.createExplodeCallback(barrel.children[0], -20, 10, false)
            this.createExplodeCallback(barrel.children[1], 20, 30, false, true)
        }
    }
    
    /**
     * Получает массив ловушек
     */
    getTraps() {
        return this.traps
    }
    
    /**
     * Очищает все ловушки
     */
    clear() {
        this.traps.forEach(trap => {
            if (this.world) {
                this.world.removeChild(trap)
            }
        })
        this.traps = []
    }
}
