/**
 * CameraManager.js
 * 
 * Менеджер камеры и видимой области
 * 
 * Содержит:
 * - Управление видимой областью (zeroLeft, zeroRight)
 * - Управление тряской камеры (cameraShake)
 * - Обновление позиции камеры
 * - Следование за игроком
 */

/**
 * Менеджер камеры
 */
export class CameraManager {
    constructor(world, gameState, WORLD_WIDTH) {
        this.world = world
        this.gameState = gameState
        this.WORLD_WIDTH = WORLD_WIDTH
        
        // Видимая область
        this.zeroLeft = 0
        this.zeroRight = WORLD_WIDTH
        
        // Состояние камеры
        this.shakeTimer = null
        this.shakeIntensity = 0
    }
    
    /**
     * Обновляет видимую область на основе позиции игрока
     */
    update(playerX, playerSpeed, gameSpeed) {
        if (!playerX) return
        
        // Обновление видимой области
        this.zeroLeft = playerX - this.WORLD_WIDTH / 2
        this.zeroRight = this.zeroLeft + this.WORLD_WIDTH
        
        // Обновление позиции мира (камера следует за игроком)
        this.world.x = -this.zeroLeft * this.world.scale.x
    }
    
    /**
     * Сброс видимой области
     */
    reset() {
        this.zeroLeft = 0
        this.zeroRight = this.WORLD_WIDTH
        if (this.world) {
            this.world.x = 0
            this.world.pivot.y = 0
        }
    }
    
    /**
     * Тряска камеры (основной метод)
     */
    async shake(intensity, duration, sleepCallback) {
        if (this.shakeTimer) {
            clearInterval(this.shakeTimer)
        }
        
        let time = 0
        const part = Math.floor((duration / 10) / 8)
        const defaultIntensity = intensity || 3
        const intensityStep = defaultIntensity / 4
        
        this.shakeIntensity = defaultIntensity
        
        this.shakeTimer = setInterval(() => {
            if (this.gameState.isPause || this.gameState.gameEnd) return
            time++
            
            switch (true) {
                case time > part * 7: {
                    this.world.pivot.y -= defaultIntensity - intensityStep * 3
                    break
                }
                case time > part * 6: {
                    this.world.pivot.y += defaultIntensity - intensityStep * 3
                    break
                }
                case time > part * 5: {
                    this.world.pivot.y -= defaultIntensity - intensityStep * 2
                    break
                }
                case time > part * 4: {
                    this.world.pivot.y += defaultIntensity - intensityStep * 2
                    break
                }
                case time > part * 3: {
                    this.world.pivot.y += defaultIntensity - intensityStep
                    break
                }
                case time > part * 2: {
                    this.world.pivot.y -= defaultIntensity - intensityStep
                    break
                }
                case time > part: {
                    this.world.pivot.y -= defaultIntensity
                    break
                }
                default: {
                    this.world.pivot.y += defaultIntensity
                    break
                }
            }
        }, 10)
        
        if (sleepCallback) {
            await sleepCallback(duration)
        } else {
            await new Promise(resolve => setTimeout(resolve, duration))
        }
        
        if (this.shakeTimer) {
            clearInterval(this.shakeTimer)
            this.shakeTimer = null
        }
        
        // Сброс позиции камеры
        this.world.pivot.y = -this.world.pivot.y
    }
    
    /**
     * Тряска камеры (алиас для обратной совместимости)
     */
    async cameraShake(intensity, duration) {
        return this.shake(intensity, duration, this.sleepCallback)
    }
    
    /**
     * Устанавливает колбэк для sleep
     */
    setSleepCallback(sleepCallback) {
        this.sleepCallback = sleepCallback
    }
    
    /**
     * Останавливает тряску камеры
     */
    stopShake() {
        if (this.shakeTimer) {
            clearInterval(this.shakeTimer)
            this.shakeTimer = null
        }
        if (this.world) {
            this.world.pivot.y = 0
        }
    }
    
    /**
     * Получает видимую область
     */
    getVisibleArea() {
        return {
            left: this.zeroLeft,
            right: this.zeroRight,
            width: this.zeroRight - this.zeroLeft
        }
    }
    
    /**
     * Проверяет, находится ли объект в видимой области
     */
    isVisible(x, width = 0) {
        return x + width >= this.zeroLeft && x <= this.zeroRight
    }
    
    /**
     * Получает позицию для спавна объектов справа от экрана
     */
    getSpawnPosition(offset = 0) {
        return this.zeroRight + offset
    }
    
    /**
     * Проверяет, нужно ли удалить объект (он вышел за левую границу)
     */
    shouldRemove(x, width = 0, margin = 0) {
        return x + width < this.zeroLeft - margin
    }
}
