import * as PIXI from 'pixi.js'
import { random } from '../utils/GameUtils.js'
import {soundPlayer} from "../playSound";

const POWER_UPS = ['boostAmmo', 'boostGun', 'boostShield']

export class PowerUpManager {
    constructor(world, fg, storage, worldCoords, resources, eventBus) {
        this.world = world
        this.worldCoords = worldCoords
        this.fg = fg
        this.resources = resources
        this.storage = storage
        this.eventBus = eventBus

        // Активный пауэр-ап
        this.sprite = null

        this.options = null
        this.collisionOffset = {left: -30, right: 0}
    }
    
    /**
     * Создает пауэр-ап
     */
    create() {
        if (this.sprite) return
        
        // Случайная позиция
        const randomPos = Math.floor(this.worldCoords.zeroRight + Math.floor(Math.random() * (250 - 50 + 1) + 50))
        
        // Случайный тип пауэр-апа
        const rand = random(0, 2)
        const powerUpType = POWER_UPS[rand]
        
        const powerUp = new PIXI.Sprite(this.resources.menuIcons.textures[powerUpType])
        powerUp.scale.set(0.4)
        powerUp.anchor.set(0.5)
        powerUp.parentGroup = this.fg
        powerUp.zOrder = 6
        powerUp.position.set(randomPos, this.worldCoords.firstFloor - 10)

        this.options = {
            type: powerUpType,
            init: powerUp.y,
            positive: false
        }
        
        this.sprite = powerUp

        this.addToWorld()
    }
    
    /**
     * Обновляет пауэр-ап
     */
    update() {
        if (!this.sprite) return
        
        // Удаление за левой границей
        if (this.sprite.x < this.worldCoords.zeroLeft) {
            this.destroy()
            return;
        }
        
        // Анимация плавного движения вверх-вниз
        if (this.sprite.y > this.options.init + 10) {
            this.options.positive = true
        }
        if (this.sprite.y < this.options.init - 10) {
            this.options.positive = false
        }
        
        if (this.options.positive) {
            this.sprite.y -= 0.2
        } else {
            this.sprite.y += 0.2
        }
    }
    
    /**
     * Собирает пауэр-ап
     */
    activate() {
        soundPlayer.powerUp()
        
        this.destroy()
    }

    addToWorld() {
        this.world.addChild(this.sprite)
    }

    destroy() {
        if (!this.sprite) return

        this.world.removeChild(this.sprite)
        this.options = null

        this.sprite = null
    }
}
