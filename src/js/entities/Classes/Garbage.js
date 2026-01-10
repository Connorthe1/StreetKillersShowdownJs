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
import { random } from '../../utils/GameUtils.js'
import { soundPlayer } from "../../playSound";

/**
 * Менеджер мусора
 */
export class Garbage {
    constructor(world, isClub, bulletManager, particleManager, resources) {
        this.world = world
        this.isClub = isClub

        this.bulletManager = bulletManager
        this.particleManager = particleManager
        this.resources = resources

        // Массив мусора
        this.garbages = []
    }

    /**
     * Обновляет состояние
     */
    updateState(state) {
        if (state.isClub !== undefined) this.isClub = state.isClub
    }
    
    /**
     * Создает мусор
     * @param {number} posX - позиция X
     * @param {number} posY - позиция Y
     * @param {number} type - тип мусора (1-10, опционально)
     */
    createGarbage(posX, posY, type = 0) {
        if (this.isClub) return null
        console.log('createGarbage')
        
        const rand = type || random(1, 10)
        const garbage = new PIXI.Sprite(this.resources.garbageTexture.textures[`trash${rand}`])
        garbage.type = rand
        garbage.anchor.set(0, 1)
        garbage.position.set(posX, posY)

        this.world.addChild(garbage)
        this.garbages.push(garbage)
    }
    
    /**
     * Обновляет мусор
     */
    updateGarbage(zeroLeft) {
        const getBullets = this.bulletManager.getBulletArrays()

        this.garbages.forEach((garbage, idx) => {
            // Удаление за левой границей
            if (garbage.x + garbage.width < zeroLeft) {
                if (this.world) {
                    this.world.removeChild(garbage)
                }
                this.garbages.splice(idx, 1)
                return
            }
            
            // Обработка бутылок (типы 3 и 4) - могут быть разбиты пулями
            if (garbage.type === 3 || garbage.type === 4) {
                // Проверка коллизии с пулями врагов
                if (getBullets.enemyBullets) {
                    getBullets.enemyBullets.forEach(bullet => {
                        if (this.checkBulletCollision(bullet, garbage)) {
                            this.breakBottle(garbage, idx)
                            return
                        }
                    })
                }
                
                // Проверка коллизии с пулями игрока
                if (getBullets.playerBullets) {
                    getBullets.playerBullets.forEach(bullet => {
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
        if (soundPlayer) {
            soundPlayer.glassBreak()
        }
        
        // Создание частиц
        for (let i = 0; i <= 8; i++) {
            this.particleManager(garbage, 'bottle')
        }
        
        // Удаление мусора
        if (this.world) {
            this.world.removeChild(garbage)
        }
        this.garbages.splice(idx, 1)
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
