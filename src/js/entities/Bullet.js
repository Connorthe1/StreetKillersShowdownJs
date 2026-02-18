/**
 * Bullet.js
 *
 * Класс-инстанс одной пули (по аналогии с Enemy).
 * Хранит sprite, состояние, обновляет движение и границы.
 */

import * as PIXI from 'pixi.js'
import { getPercent } from '../utils/GameUtils.js'
import {soundPlayer} from "../playSound";

export class Bullet {
    constructor(world, resources, eventBus, gameState, bulletSpeed) {
        this.world = world
        this.resources = resources
        this.eventBus = eventBus
        this.gameState = gameState
        this.bulletSpeed = bulletSpeed

        this.damage = 1
        this.owner = null

        this.sprite = null
        this.isFriendly = false
        this.toDestroy = false
        this.skip = false
    }

    /**
     * Создаёт спрайт пули и добавляет в мир.
     * @param {number} x
     * @param {number} y
     * @param {Object} char - персонаж (игрок/враг) с gun/params
     * @param {boolean} isFriendly
     * @returns {this}
     */
    create(x, y, char, isFriendly) {
        const bullet = new PIXI.Sprite(this.resources.particles.textures.bullet)
        const gunParams = char.gun || char.params

        bullet.anchor.set(0.5)
        bullet.zIndex = 11
        bullet.scale.x = 1.5
        bullet.scale.y = 2
        bullet.position.set(!isFriendly ? x - 14 : x + 14, y)

        if (isFriendly && char.activePowerUps?.some(item => item.type === 'boostGun')) {
            bullet.tint = 16731469
            this.damage = 2
        }

        let rotate = Math.random() * (gunParams.angle ?? 0.4)
        rotate *= Math.round(Math.random()) ? 1 : -1
        bullet.rotation = rotate

        this.sprite = bullet
        this.isFriendly = isFriendly
        this.owner = char
        this.addToWorld()

        return this
    }

    update(worldCoords, gameSpeed) {
        if (this.toDestroy) return

        if (this.isFriendly) {
            this.sprite.position.x += (Math.cos(this.sprite.rotation) * this.bulletSpeed) * gameSpeed
            this.sprite.position.y += (Math.sin(this.sprite.rotation) * this.bulletSpeed) * gameSpeed
        } else {
            this.sprite.position.x -= (Math.cos(this.sprite.rotation) * this.bulletSpeed) * gameSpeed
            this.sprite.position.y -= (Math.sin(this.sprite.rotation) * this.bulletSpeed) * gameSpeed
        }

        if (this.isOutOfBounds(worldCoords)) {
            if (this.isFriendly) {
                this.gameState.decreaseStreak(0.5)
            }
            this.emitSparkParticles()
            this.destroy()
        }
    }

    setSkip() {
        this.skip = true
        soundPlayer.bulletSkip()
    }

    isOutOfBounds(worldCoords) {
        const { x, width } = this.sprite
        if (this.isFriendly) {
            return x < worldCoords.zeroLeft || x - width * 2 > worldCoords.zeroLeft + getPercent(worldCoords.worldWidth, 90)
        }
        return x < worldCoords.zeroLeft + 50 || x > worldCoords.zeroRight + 100
    }

    emitSparkParticles() {
        for (let i = 0; i <= 3; i++) {
            this.eventBus.emit('particle:default', { coords: this.sprite, type: 'spark', floor: undefined, size: 1 })
        }
    }

    destroy() {
        this.world.removeChild(this.sprite)
        this.toDestroy = true
    }

    addToWorld() {
        this.world.addChild(this.sprite)
    }

    getBounds() {
        return this.sprite ? this.sprite.getBounds() : { x: 0, y: 0, width: 0, height: 0 }
    }

    get x() { return this.sprite?.x ?? 0 }
    get y() { return this.sprite?.y ?? 0 }
    get width() { return this.sprite?.width ?? 0 }
    get height() { return this.sprite?.height ?? 0 }
}
