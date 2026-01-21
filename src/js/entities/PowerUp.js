/**
 * PowerUp.js
 * 
 * Менеджер пауэр-апов
 * 
 * Содержит:
 * - Создание пауэр-апов (createPowerUp)
 * - Обновление пауэр-апов (updatePowerUp)
 * - Активация пауэр-апов игроком
 * - Анимация пауэр-апов (плавное движение вверх-вниз)
 * - Типы пауэр-апов: boostAmmo, boostGun, boostShield
 */

import * as PIXI from 'pixi.js'
import { random } from '../utils/GameUtils.js'

/**
 * Менеджер пауэр-апов
 */
export class PowerUpManager {
    constructor(world, gameState, fg, storage, worldCoords, resources, eventBus) {
        this.world = world
        this.gameState = gameState
        this.worldCoords = worldCoords
        this.fg = fg
        this.resources = resources
        this.storage = storage
        this.eventBus = eventBus

        // Активный пауэр-ап
        this.activePowerUp = null
    }
    
    /**
     * Создает пауэр-ап
     */
    createPowerUp() {
        if (this.activePowerUp) return
        
        // Случайная позиция
        const randomPos = Math.floor(this.worldCoords.zeroRight + Math.floor(Math.random() * (250 - 50 + 1) + 50))
        
        // Случайный тип пауэр-апа
        const rand = random(0, 2)
        const powerUps = ['boostAmmo', 'boostGun', 'boostShield']
        const powerUpType = powerUps[rand]
        
        const powerUp = new PIXI.Sprite(this.resources.menuIcons.textures[powerUpType])
        powerUp.type = powerUpType
        powerUp.scale.set(0.4)
        powerUp.anchor.set(0.5)
        powerUp.parentGroup = this.fg
        powerUp.zOrder = 6
        powerUp.position.set(randomPos, this.worldCoords.firstFloor - 10)
        powerUp.init = powerUp.y
        powerUp.positive = false
        
        this.activePowerUp = powerUp
        this.world.addChild(powerUp)
        
        return powerUp
    }
    
    /**
     * Обновляет пауэр-ап
     */
    updatePowerUp() {
        if (!this.activePowerUp) return
        
        // Удаление за левой границей
        if (this.activePowerUp.x < this.zeroLeft) {
            this.removePowerUp()
            return
        }
        
        // Сбор пауэр-апа игроком
        if (this.player) {
            if (this.player.x + this.player.width / 4 > this.activePowerUp.x) {
                this.collectPowerUp()
                return
            }
        }
        
        // Анимация плавного движения вверх-вниз
        if (this.activePowerUp.y > this.activePowerUp.init + 10) {
            this.activePowerUp.positive = true
        }
        if (this.activePowerUp.y < this.activePowerUp.init - 10) {
            this.activePowerUp.positive = false
        }
        
        if (this.activePowerUp.positive) {
            this.activePowerUp.y -= 0.2
        } else {
            this.activePowerUp.y += 0.2
        }
    }
    
    /**
     * Собирает пауэр-ап
     */
    collectPowerUp() {
        if (!this.activePowerUp || !this.playerState || !this.storage) return
        
        // Звук сбора
        if (this.soundPlayer) {
            this.soundPlayer.powerUp()
        }
        
        // Удаление пауэр-апа
        if (this.world) {
            this.world.removeChild(this.activePowerUp)
        }
        
        // Проверка, есть ли уже такой пауэр-ап
        const findAlreadyActive = this.playerState.activePowerUps.find(
            item => item.type === this.activePowerUp.type
        )
        
        if (findAlreadyActive) {
            // Обновление времени существования
            findAlreadyActive.expired = Date.now() + 
                ((5 + (5 * this.storage.upgrades[this.activePowerUp.type])) * 1000)
        } else {
            // Добавление нового пауэр-апа
            this.playerState.activePowerUps.push({
                type: this.activePowerUp.type,
                expired: Date.now() + 
                    ((5 + (5 * this.storage.upgrades[this.activePowerUp.type])) * 1000)
            })
            
            if (this.HUDupdatePowerUpCallback) {
                this.HUDupdatePowerUpCallback()
            }
            
            // Применение эффектов пауэр-апа
            switch (this.activePowerUp.type) {
                case 'boostAmmo':
                    if (this.gun) {
                        this.gun.currentAmmo = this.gun.ammo * 2
                        this.gun.ammo *= 2
                        if (this.HUDbulletsCallback) {
                            this.HUDbulletsCallback()
                        }
                    }
                    break
                case 'boostGun':
                    if (this.gun) {
                        this.gun.damage *= 2
                    }
                    break
                case 'boostShield':
                    // Щит обрабатывается отдельно в логике игрока
                    break
            }
        }
        
        this.activePowerUp = null
    }
    
    /**
     * Удаляет пауэр-ап
     */
    removePowerUp() {
        if (!this.activePowerUp) return
        
        if (this.world) {
            this.world.removeChild(this.activePowerUp)
        }
        
        this.activePowerUp = null
    }
    
    /**
     * Получает активный пауэр-ап
     */
    getActivePowerUp() {
        return this.activePowerUp
    }
    
    /**
     * Проверяет, существует ли активный пауэр-ап
     */
    hasActivePowerUp() {
        return this.activePowerUp !== null
    }
    
    /**
     * Очищает пауэр-ап
     */
    clear() {
        this.removePowerUp()
    }
}
