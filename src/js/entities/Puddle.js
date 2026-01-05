/**
 * Puddle.js
 * 
 * Менеджер луж
 * 
 * Содержит:
 * - Создание луж (createPuddle)
 * - Обновление луж (updatePuddles)
 * - Взаимодействие с игроком
 * - Эффекты при прохождении через лужу (частицы, звук, бонусы)
 */

import * as PIXI from 'pixi.js'
import { random } from '../utils/GameUtils.js'

/**
 * Менеджер луж
 */
export class PuddleManager {
    constructor(world, player, playerState, gameState, zeroLeft, zeroRight, playerPos, buildings, puddleTexture) {
        this.world = world
        this.player = player
        this.playerState = playerState
        this.gameState = gameState
        this.zeroLeft = zeroLeft
        this.zeroRight = zeroRight
        this.playerPos = playerPos
        this.buildings = buildings
        this.puddleTexture = puddleTexture
        
        // Массив луж
        this.puddles = []
        
        // Callbacks
        this.addPointsCallback = null
        this.soundPlayer = null
        this.createParticlesCallback = null
        this.sleepCallback = null
        this.playerSpeed = null
        this.playerDefaultSpeed = null
    }
    
    /**
     * Устанавливает колбэки
     */
    setCallbacks(callbacks) {
        if (callbacks.addPoints) this.addPointsCallback = callbacks.addPoints
        if (callbacks.soundPlayer) this.soundPlayer = callbacks.soundPlayer
        if (callbacks.createParticles) this.createParticlesCallback = callbacks.createParticles
        if (callbacks.sleep) this.sleepCallback = callbacks.sleep
        if (callbacks.playerSpeed) this.playerSpeed = callbacks.playerSpeed
        if (callbacks.playerDefaultSpeed) this.playerDefaultSpeed = callbacks.playerDefaultSpeed
    }
    
    /**
     * Обновляет состояние
     */
    updateState(state) {
        if (state.player !== undefined) this.player = state.player
        if (state.playerState !== undefined) this.playerState = state.playerState
        if (state.zeroLeft !== undefined) this.zeroLeft = state.zeroLeft
        if (state.zeroRight !== undefined) this.zeroRight = state.zeroRight
    }
    
    /**
     * Создает лужу
     */
    createPuddle() {
        if (!this.puddleTexture) {
            console.warn('Puddle texture not available')
            return null
        }
        
        // Проверка на здания (не создавать лужи на втором этаже или в клубе)
        if (this.buildings && this.buildings.length > 0) {
            const activeBuilding = this.buildings[0]
            const lastBuilding = this.buildings[this.buildings.length - 1]
            const lastBuildingBounds = lastBuilding.getLocalBounds ? lastBuilding.getLocalBounds() : lastBuilding
            
            if ((lastBuildingBounds.x + lastBuildingBounds.width > this.zeroRight &&
                 activeBuilding.getLocalBounds().x < this.zeroRight) &&
                (activeBuilding.secondFloor || activeBuilding.club)) {
                return null
            }
        }
        
        // Случайный тип лужи (1 или 2)
        const rand = random(1, 2)
        const puddle = new PIXI.Sprite(this.puddleTexture.textures[`puddle${rand}`])
        puddle.anchor.set(0.5)
        puddle.position.set(this.zeroRight + puddle.width, this.playerPos + 24)
        puddle.dead = false
        
        if (this.world) {
            this.world.addChild(puddle)
        }
        
        this.puddles.push(puddle)
        return puddle
    }
    
    /**
     * Обновляет лужи
     */
    updatePuddles() {
        this.puddles.forEach((puddle, idx) => {
            // Удаление за левой границей
            if (puddle.x + puddle.width < this.zeroLeft) {
                if (this.world) {
                    this.world.removeChild(puddle)
                }
                this.puddles.splice(idx, 1)
                return
            }
            
            // Пропуск уже обработанных луж
            if (puddle.dead) return
            
            // Коллизия с игроком
            if (this.player && this.playerState) {
                if (this.player.x + 40 > puddle.x + 20 &&
                    puddle.x + puddle.width > this.player.x) {
                    this.handlePuddleCollision(puddle)
                }
            }
        })
    }
    
    /**
     * Обрабатывает коллизию с лужей
     */
    handlePuddleCollision(puddle) {
        puddle.dead = true
        
        // Проверка состояния игрока (кувырок или обычное движение)
        if (this.playerState.state === 'roll' || this.playerState.state === 'rollEnd') {
            // Бонус при кувырке через лужу
            if (this.addPointsCallback) {
                this.addPointsCallback(20)
            }
            
            if (this.gameState) {
                this.gameState.scoreStreak += 1
            }
            
            // Увеличение скорости
            if (this.playerSpeed !== null && this.playerSpeed !== undefined &&
                this.playerDefaultSpeed !== null && this.playerDefaultSpeed !== undefined) {
                this.playerSpeed.value = this.playerDefaultSpeed.value * 1.5
            }
            
            // Звук и частицы
            if (this.soundPlayer) {
                this.soundPlayer.waterStep()
            }
            
            if (this.createParticlesCallback) {
                for (let i = 0; i <= 20; i++) {
                    this.createParticlesCallback({ x: puddle.x, y: puddle.y - 10 }, 'drop')
                }
            }
        } else {
            // Обычное прохождение через лужу
            if (this.soundPlayer) {
                this.soundPlayer.waterStep()
            }
            
            if (this.createParticlesCallback) {
                // Первая волна частиц
                for (let i = 0; i <= 14; i++) {
                    this.createParticlesCallback({ x: puddle.x - 20, y: puddle.y - 10 }, 'drop')
                }
            }
            
            // Вторая волна частиц с задержкой
            if (this.sleepCallback) {
                this.sleepCallback(250).then(() => {
                    if (this.soundPlayer) {
                        this.soundPlayer.waterStep()
                    }
                    if (this.createParticlesCallback) {
                        for (let i = 0; i <= 14; i++) {
                            this.createParticlesCallback({ x: puddle.x + 20, y: puddle.y - 10 }, 'drop')
                        }
                    }
                })
            }
        }
    }
    
    /**
     * Получает массив луж
     */
    getPuddles() {
        return this.puddles
    }
    
    /**
     * Очищает все лужи
     */
    clear() {
        this.puddles.forEach(puddle => {
            if (this.world) {
                this.world.removeChild(puddle)
            }
        })
        this.puddles = []
    }

    setTextures(puddleTexture) {
        this.puddleTexture = puddleTexture
    }
}
