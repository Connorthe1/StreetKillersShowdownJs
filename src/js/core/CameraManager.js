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
    constructor(world, gameState, worldCoords, eventBus) {
        this.world = world
        this.gameState = gameState
        this.worldCoords = worldCoords
        this.eventBus = eventBus

        eventBus.on('camera:shake', data => {
            this.cameraShake(data.intensity, data.duration)
        })

        /** Состояние тряски камеры: { duration, intensity, elapsed, lastProcessedTick, cumulativeOffset } */
        this.shake = null
    }

     update(dt) {
        if (!this.shake) return
        if (this.gameState.isPause || this.gameState.gameEnd) return

        this.shake.elapsed += dt
        const { duration, part, defaultIntensity, intensityStep } = this.shake
        const maxTicks = part * 8
        const currentTick = Math.min(Math.floor(this.shake.elapsed / 10), maxTicks)

        for (let t = this.shake.lastProcessedTick + 1; t <= currentTick; t++) {
            const phaseDelta = this.phaseDelta(t, part, defaultIntensity, intensityStep)
            this.shake.cumulativeOffset += phaseDelta
        }
        this.shake.lastProcessedTick = currentTick
        this.world.pivot.y = this.shake.cumulativeOffset

        if (this.shake.elapsed >= duration) {
            this.world.pivot.y = -this.shake.cumulativeOffset
            this.shake = null
        }
    }

    phaseDelta(time, part, defaultIntensity, intensityStep) {
        switch (true) {
            case time > part * 7: return -(defaultIntensity - intensityStep * 3)
            case time > part * 6: return defaultIntensity - intensityStep * 3
            case time > part * 5: return -(defaultIntensity - intensityStep * 2)
            case time > part * 4: return defaultIntensity - intensityStep * 2
            case time > part * 3: return defaultIntensity - intensityStep
            case time > part * 2: return -(defaultIntensity - intensityStep)
            case time > part: return -defaultIntensity
            default: return defaultIntensity
        }
    }

    cameraShake(intensity, duration) {
        const part = Math.floor((duration / 10) / 8)
        const defaultIntensity = intensity || 3
        const intensityStep = defaultIntensity / 4
        this.shake = {
            duration,
            part,
            defaultIntensity,
            intensityStep,
            elapsed: 0,
            lastProcessedTick: -1,
            cumulativeOffset: 0
        }
    }
}
