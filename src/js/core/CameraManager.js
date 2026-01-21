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
    constructor(world, gameState, worldCoords, sleep, eventBus) {
        this.world = world
        this.gameState = gameState
        this.worldCoords = worldCoords
        this.sleep = sleep
        this.eventBus = eventBus

        eventBus.on('camera:shake', data => {
            this.cameraShake(data.intensity, data.duration)
        })
    }

    async cameraShake(intensity, duration) {
        let time = 0
        const part = Math.floor((duration / 10) / 8)
        const defaultIntensity = intensity || 3
        const intensityStep = defaultIntensity / 4
        const timer = setInterval(() => {
            if (this.gameState.isPause || this.gameState.gameEnd) return
            time++
            switch (true) {
                case time > part * 7 : {
                    this.world.pivot.y -= defaultIntensity - intensityStep * 3
                    break
                }
                case time > part * 6 : {
                    this.world.pivot.y += defaultIntensity - intensityStep * 3
                    break
                }
                case time > part * 5 : {
                    this.world.pivot.y -= defaultIntensity - intensityStep * 2
                    break
                }
                case time > part * 4 : {
                    this.world.pivot.y += defaultIntensity - intensityStep * 2
                    break
                }
                case time > part * 3 : {
                    this.world.pivot.y += defaultIntensity - intensityStep
                    break
                }
                case time > part * 2 : {
                    this.world.pivot.y -= defaultIntensity - intensityStep
                    break
                }
                case time > part : {
                    this.world.pivot.y -= defaultIntensity
                    break
                }
                default: {
                    this.world.pivot.y += defaultIntensity
                    break
                }
            }
        }, 10)
        await this.sleep(duration)
        clearInterval(timer)
        this.world.pivot.y = (-this.world.pivot.y)
    }
}
