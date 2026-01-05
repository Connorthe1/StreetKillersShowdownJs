/**
 * ExplosionManager.js
 * 
 * Менеджер взрывов
 * 
 * Содержит:
 * - Создание взрывов (createExplode)
 * - Анимация взрывов (большой/маленький)
 * - Звуки взрыва
 * - Тряска камеры при взрыве
 */

import * as PIXI from 'pixi.js'

/**
 * Менеджер взрывов
 */
export class ExplosionManager {
    constructor(world) {
        this.world = world
        
        // Текстуры (устанавливаются позже)
        this.bigExplode = null
        this.bochka = null
        
        // Callbacks
        this.cameraShakeCallback = null
        this.soundPlayer = null
    }
    
    /**
     * Устанавливает текстуры
     */
    setTextures(textures) {
        if (textures.bigExplode) this.bigExplode = textures.bigExplode
        if (textures.bochka) this.bochka = textures.bochka
    }
    
    /**
     * Устанавливает колбэки
     */
    setCallbacks(callbacks) {
        if (callbacks.cameraShake) this.cameraShakeCallback = callbacks.cameraShake
        if (callbacks.soundPlayer) this.soundPlayer = callbacks.soundPlayer
    }
    
    /**
     * Создает взрыв
     * @param {PIXI.Sprite|Object} target - цель взрыва (спрайт с позицией)
     * @param {number} offsetX - смещение по X
     * @param {number} offsetY - смещение по Y
     * @param {boolean} isBig - большой взрыв
     * @param {boolean} silence - беззвучный взрыв
     */
    createExplode(target, offsetX = 0, offsetY = 0, isBig = false, silence = false) {
        if (!this.world) {
            console.warn('World not available for explosion')
            return null
        }
        
        // Тряска камеры
        if (this.cameraShakeCallback) {
            this.cameraShakeCallback(2, 500)
        }
        
        // Звук взрыва
        if (!silence && this.soundPlayer) {
            this.soundPlayer.explosion()
        }
        
        // Определение анимации взрыва
        let explodeAnimation = null
        if (isBig) {
            if (!this.bigExplode) {
                console.warn('Big explode texture not available')
                return null
            }
            explodeAnimation = this.bigExplode.animations.explode
        } else {
            if (!this.bochka) {
                console.warn('Bochka texture not available')
                return null
            }
            explodeAnimation = this.bochka.animations.smallExplode
        }
        
        // Создание спрайта взрыва
        const explode = new PIXI.AnimatedSprite(explodeAnimation)
        explode.zIndex = target.zIndex !== undefined ? target.zIndex : 0
        explode.loop = false
        explode.anchor.set(0.5)
        explode.height = explode.height * 3
        explode.width = explode.width * 3
        explode.animationSpeed = isBig ? 0.25 : 0.4
        
        // Определение позиции
        let x, y
        if (target.x !== undefined && target.y !== undefined) {
            x = target.x + offsetX
            y = target.y + offsetY
        } else if (target.position) {
            x = target.position.x + offsetX
            y = target.position.y + offsetY
        } else {
            console.warn('Invalid target for explosion')
            return null
        }
        
        explode.position.set(x, y)
        
        // Добавление в мир
        this.world.addChild(explode)
        explode.play()
        
        // Удаление после завершения анимации
        explode.onComplete = () => {
            if (this.world) {
                this.world.removeChild(explode)
            }
        }
        
        return explode
    }
}

