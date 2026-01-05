/**
 * Garbage.js
 * 
 * Менеджер мусора
 * 
 * Содержит:
 * - Создание мусора (createGarbage)
 * - Обновление мусора (updateGarbage)
 * - Коллизии с пулями (только для бутылок - типы 3 и 4)
 * - Разрушение бутылок с эффектами
 */

import * as PIXI from 'pixi.js'
import { random } from '../utils/GameUtils.js'

/**
 * Менеджер мусора
 */
export class GarbageManager {
    constructor(world, zeroLeft, enemyBullets, playerBullets, isClub) {
        this.world = world
        this.zeroLeft = zeroLeft
        this.enemyBullets = enemyBullets
        this.playerBullets = playerBullets
        this.isClub = isClub
        
        // Массив мусора
        this.garbages = []
        
        // Текстуры (устанавливаются позже)
        this.garbageTexture = null
        
        // Callbacks
        this.soundPlayer = null
        this.createParticlesCallback = null
    }
    
    /**
     * Устанавливает текстуры
     */
    setTextures(garbageTexture) {
        this.garbageTexture = garbageTexture
    }
    
    /**
     * Устанавливает колбэки
     */
    setCallbacks(callbacks) {
        if (callbacks.soundPlayer) this.soundPlayer = callbacks.soundPlayer
        if (callbacks.createParticles) this.createParticlesCallback = callbacks.createParticles
    }
    
    /**
     * Обновляет состояние
     */
    updateState(state) {
        if (state.zeroLeft !== undefined) this.zeroLeft = state.zeroLeft
        if (state.isClub !== undefined) this.isClub = state.isClub
        if (state.enemyBullets !== undefined) this.enemyBullets = state.enemyBullets
        if (state.playerBullets !== undefined) this.playerBullets = state.playerBullets
    }
    
    /**
     * Создает мусор
     * @param {number} posX - позиция X
     * @param {number} posY - позиция Y
     * @param {number} type - тип мусора (1-10, опционально)
     */
    createGarbage(posX, posY, type = null) {
        if (this.isClub) return null
        
        if (!this.garbageTexture) {
            console.warn('Garbage texture not available')
            return null
        }
        
        const rand = type || random(1, 10)
        const garbage = new PIXI.Sprite(this.garbageTexture.textures[`trash${rand}`])
        garbage.type = rand
        garbage.anchor.set(0, 1)
        garbage.position.set(posX, posY)
        
        if (this.world) {
            this.world.addChild(garbage)
        }
        
        this.garbages.push(garbage)
        return garbage
    }
    
    /**
     * Обновляет мусор
     */
    updateGarbage() {
        this.garbages.forEach((garbage, idx) => {
            // Удаление за левой границей
            if (garbage.x + garbage.width < this.zeroLeft) {
                if (this.world) {
                    this.world.removeChild(garbage)
                }
                this.garbages.splice(idx, 1)
                return
            }
            
            // Обработка бутылок (типы 3 и 4) - могут быть разбиты пулями
            if (garbage.type === 3 || garbage.type === 4) {
                // Проверка коллизии с пулями врагов
                if (this.enemyBullets) {
                    this.enemyBullets.forEach((bullet, bulletIdx) => {
                        if (this.checkBulletCollision(bullet, garbage)) {
                            this.breakBottle(garbage, idx)
                            return
                        }
                    })
                }
                
                // Проверка коллизии с пулями игрока
                if (this.playerBullets) {
                    this.playerBullets.forEach((bullet, bulletIdx) => {
                        if (this.checkBulletCollision(bullet, garbage)) {
                            this.breakBottle(garbage, idx)
                            return
                        }
                    })
                }
            }
        })
    }
    
    /**
     * Проверяет коллизию пули с мусором
     */
    checkBulletCollision(bullet, garbage) {
        const b = bullet.getBounds ? bullet.getBounds() : bullet
        const g = garbage.getBounds ? garbage.getBounds() : garbage
        
        return g.x > b.x &&
            b.x + b.width > g.x &&
            g.y > b.y &&
            b.y + b.height > g.y
    }
    
    /**
     * Разбивает бутылку
     */
    breakBottle(garbage, idx) {
        // Звук разбития стекла
        if (this.soundPlayer) {
            this.soundPlayer.glassBreak()
        }
        
        // Создание частиц
        if (this.createParticlesCallback) {
            for (let i = 0; i <= 8; i++) {
                this.createParticlesCallback(garbage, 'bottle')
            }
        }
        
        // Удаление мусора
        if (this.world) {
            this.world.removeChild(garbage)
        }
        this.garbages.splice(idx, 1)
    }
    
    /**
     * Получает массив мусора
     */
    getGarbages() {
        return this.garbages
    }
    
    /**
     * Очищает весь мусор
     */
    clear() {
        this.garbages.forEach(garbage => {
            if (this.world) {
                this.world.removeChild(garbage)
            }
        })
        this.garbages = []
    }
}
