/**
 * Player.js
 * 
 * Класс игрока с объединенной функциональностью управления уроном
 * 
 * Содержит:
 * - Логику игрока (движение, анимации, состояние)
 * - Логику нанесения урона игроку
 * - Обработку щитов и пауэр-апов
 * - Обработку смерти игрока
 */

import * as PIXI from 'pixi.js'
import { soundPlayer } from "../playSound";

/**
 * Класс игрока
 */
export class Player {
    constructor(world, gameState, resources, storage, WORLD_WIDTH, worldCoords) {
        // GameState для управления уроном
        this.world = world
        this.gameState = gameState
        this.resources = resources
        this.storage = storage
        this.WORLD_WIDTH = WORLD_WIDTH

        // Спрайт игрока
        this.sprite = null
        this.currentSkin = resources.skinStore[Number(storage.selectedSkin)].param
        
        // Состояние игрока
        this.state = ''
        this.health = 3
        this.invincible = false
        this.inCover = false
        this.inZipLine = false
        this.activePowerUps = []
        this.rollId = null
        this.secondFloor = false
        this.stimpack = false
        this.skillCD = false
        this.inBossFight = false
        this.leaveCover = false
        this.afterRoll = true
        
        // Скорости

        // Обычная скорость в забеге
        this.defaultSpeed = 1
        // Текущая скорость
        this.speed = 1
        // Базовая скорость
        this.initSpeed = 1
        
        // Параметры оружия
        this.gun = {
            ammo: 5,
            currentAmmo: 5,
            damage: 10,
            fireRate: 100,
            type: 'pistol',
            angle: 0.4,
            offsetX: 0,
            offsetY: 0,
            shotTrigger: 0,
            reloadAnim: 0.2,
            reloadTime: 1000,
            noStop: false,
            melee: false
        }
        
        // UI ближнего боя
        this.meleeKill = null
        
        // Задержка триггера
        this.triggerDelay = false
        
        // Колбэки для управления уроном
        this.cameraShake = null
        this.hud = null
        this.world = null
        this.createParticles = null
        this.sleep = null
        this.endGame = null
        this.HUDupdatePowerUp = null
        this.HUDremoveShield = null
        this.getSecondFloor = null
        this.setPlayerSpeed = null

        this.worldCoords = worldCoords
    }
    
    /**
     * Устанавливает колбэки для управления уроном
     * @param {Object} callbacks - объект с колбэками
     */
    setDamageCallbacks(callbacks) {
        if (callbacks.cameraShake !== undefined) this.cameraShake = callbacks.cameraShake
        if (callbacks.hud !== undefined) this.hud = callbacks.hud
        if (callbacks.world !== undefined) this.world = callbacks.world
        if (callbacks.createParticles !== undefined) this.createParticles = callbacks.createParticles
        if (callbacks.sleep !== undefined) this.sleep = callbacks.sleep
        if (callbacks.endGame !== undefined) this.endGame = callbacks.endGame
        if (callbacks.HUDupdatePowerUp !== undefined) this.HUDupdatePowerUp = callbacks.HUDupdatePowerUp
        if (callbacks.HUDremoveShield !== undefined) this.HUDremoveShield = callbacks.HUDremoveShield
        if (callbacks.getSecondFloor !== undefined) this.getSecondFloor = callbacks.getSecondFloor
        if (callbacks.setPlayerSpeed !== undefined) this.setPlayerSpeed = callbacks.setPlayerSpeed
    }
    
    /**
     * Создает спрайт игрока
     * @param {number} x - позиция X
     * @param {number} y - позиция Y
     * @returns {PIXI.AnimatedSprite} спрайт игрока
     */
    createPlayer(x = 0, y = 0) {
        if (!this.currentSkin) {
            console.error('Player.createPlayer: skin is required and must have animations.run')
            return null
        }
        
        const playerSprite = new PIXI.AnimatedSprite(this.currentSkin.animations.run)
        playerSprite.anchor.set(0.5, 0.7)
        playerSprite.position.set(x, y)
        playerSprite.scale.set(2)
        playerSprite.animationSpeed = 0.2
        playerSprite.loop = true
        playerSprite.play()
        
        playerSprite.color = 0xffffff
        playerSprite.shadow = 0x757575
        
        this.sprite = playerSprite
        
        return playerSprite
    }

    updatePlayer(gameSpeed, delta) {
        // if (this.activePowerUps.length > 0) {
        //     this.activePowerUps.forEach((powerUp, idx) => {
        //         if (Date.now() > powerUp.expired) {
        //             switch (true) {
        //                 case powerUp.type === 'boostAmmo':
        //                     gun.ammo = gun.ammo / 2
        //                     break
        //                 case powerUp.type === 'boostGun':
        //                     gun.damage = gun.damage / 2
        //                     break
        //             }
        //             this.activePowerUps.splice(idx, 1)
        //             if (hudManager) {
        //                 hudManager.updatePowerUps(playerState)
        //             }
        //             console.log('endPW')
        //         }
        //     })
        // }
        if (this.gameState.gameStart) {
            const dtX = 1 - Math.exp(-delta / 5)
            const dtY = 1 - Math.exp(-delta / 20)
            this.world.pivot.x = ((this.sprite.x - 60) - this.world.pivot.x) * dtX + this.world.pivot.x;
            this.world.pivot.y = (-this.world.pivot.y) * dtY + this.world.pivot.y;
        }
        this.sprite.x += (0.5 * this.speed) * gameSpeed;

        this.worldCoords.zeroLeft = (this.sprite.x - 100)
        this.worldCoords.zeroRight = (this.sprite.x + this.WORLD_WIDTH)
    }
    
    /**
     * Наносит урон игроку
     */
    damagePlayer() {
        if (!this.sprite) return
        
        // Тряска камеры
        if (this.cameraShake) {
            this.cameraShake(4, 600)
        }
        
        // Установка неуязвимости
        this.invincible = true
        
        // Проверка наличия щита (boostShield)
        if (this.activePowerUps.some(item => item.type === 'boostShield')) {
            soundPlayer.damageMetal()
            this.sprite.tint = 16777021
            const shieldIndex = this.activePowerUps.findIndex(item => item.type === 'boostShield')
            if (shieldIndex !== -1) {
                this.activePowerUps.splice(shieldIndex, 1)
            }
            if (this.HUDupdatePowerUp) {
                this.HUDupdatePowerUp()
            }
        } else {
            // Проверка наличия стимпака
            if (this.stimpack) {
                soundPlayer.damageMetal()
                this.sprite.tint = 16777021
                this.stimpack = false
                if (this.HUDremoveShield) {
                    this.HUDremoveShield()
                }
            } else {
                // Нанесение реального урона
                if (this.gameState) {
                    this.gameState.scoreStreak -= 30
                }
                this.sprite.tint = 16737894
                this.health--
                
                // Удаление сердца из HUD
                if (this.hud) {
                    const hearts = this.hud.getChildByName('hearts')
                    if (hearts && hearts.children.length > 0) {
                        hearts.removeChildAt(0)
                    }
                }
            }
        }
        
        // Проверка смерти игрока
        if (this.health <= 0) {
            // Создание частиц крови
            if (this.createParticles) {
                const secondFloor = this.getSecondFloor ? this.getSecondFloor() : false
                const isOnSecondFloor = secondFloor === this.sprite.y
                for (let i = 0; i <= 20; i++) {
                    this.createParticles(this.sprite, 'blood', isOnSecondFloor)
                }
            }
            
            // Удаление игрока из мира
            if (this.world && this.sprite) {
                this.world.removeChild(this.sprite)
            }
            
            // Остановка движения игрока
            if (this.setPlayerSpeed) {
                this.setPlayerSpeed(false)
            }
            
            // Задержка перед окончанием игры
            if (this.sleep && this.endGame) {
                this.sleep(1000).then(() => {
                    this.endGame()
                })
            }
        } else {
            // Восстановление после урона
            if (this.sleep) {
                this.sleep(200).then(() => {
                    this.invincible = false
                    if (this.sprite) {
                        if (this.inCover) {
                            this.sprite.tint = this.sprite.shadow
                        } else {
                            this.sprite.tint = this.sprite.color
                        }
                    }
                })
            }
        }
    }
    
    /**
     * Проигрывает анимацию
     * @param {string} anim - название анимации
     */
    playAnim(anim) {
        if (!this.sprite || !this.currentSkin || !this.currentSkin.animations) {
            return
        }
        
        this.sprite.loop = !anim || anim === 'idle'
        this.sprite.animationSpeed = (anim === 'reload' && this.gun.reloadAnim) ? this.gun.reloadAnim : 0.2
        
        if (this.gun.noStop && anim === 'shot' && !this.inCover) {
            if (this.state) {
                this.updatePlayerState(anim, this.currentSkin.animations.run, this.sprite.color)
            } else {
                this.state = anim
            }
            return
        }
        
        if (!anim || (anim === 'shotEnd' && this.gunNoStop)) {
            this.resetPlayerState()
        } else {
            const tint = (anim === 'roll' || anim === 'rollEnd' || (this.inCover && anim !== 'shot')) ?
                this.sprite.shadow : this.sprite.color
            this.sprite.tint = tint
            
            if (anim === 'idle' || anim === 'zipLine') {
                if (anim === 'idle') {
                    this.sprite.anchor.y = 0.7
                }
                this.updatePlayerState('', this.currentSkin.animations[anim], tint)
            } else {
                if (this.currentSkin.animations[anim]) {
                    this.updatePlayerState(anim, this.currentSkin.animations[anim], tint)
                } else {
                    console.warn(`Animation "${anim}" not found in skin animations`)
                }
            }
        }
    }
    
    /**
     * Обновляет состояние игрока
     */
    updatePlayerState(state, textures, tint) {
        if (!this.sprite || !textures) return
        
        this.state = state
        this.sprite.textures = textures
        this.sprite.tint = tint
        this.sprite.play()
    }
    
    /**
     * Сбрасывает состояние игрока
     */
    resetPlayerState() {
        if (!this.sprite || !this.currentSkin) return
        
        this.state = ''
        if (this.currentSkin.animations && this.currentSkin.animations.run) {
            this.sprite.textures = this.currentSkin.animations.run
        }
        this.sprite.tint = this.sprite.color
        this.sprite.play()
    }

    get playerState() {
        return {
            state: this.state,
            health: this.health,
            invincible: this.invincible,
            inCover: this.inCover,
            inZipLine: this.inZipLine,
            activePowerUps: this.activePowerUps,
            rollId: this.rollId,
            secondFloor: this.secondFloor,
            currentSkin: this.currentSkin,
            stimpack: this.stimpack,
            skillCD: this.skillCD,
            inBossFight: this.inBossFight,
            leaveCover: this.leaveCover,
            afterRoll: this.afterRoll
        }
    }
    
    /**
     * Геттеры для скоростей
     */
    get playerSpeed() {
        return this.speed
    }
    
    get playerDefaultSpeed() {
        return this.defaultSpeed
    }

    updateDefaultSpeedByScore(score) {
        this.defaultSpeed = this.initSpeed + score
    }
    
    /**
     * Обновляет параметры оружия из скина и апгрейдов
     */
    updateGunFromSkin() {
        const skinIndex = this.storage.selectedSkin

        if (!this.storage) {
            console.warn('updateGunFromSkin: storage not provided')
            return
        }
        
        // Применение параметров скина
        if (this.resources.skinStore && this.resources.skinStore[skinIndex]) {
            const skin = this.resources.skinStore[skinIndex]
            
            if (skin.gun) {
                this.gun.type = skin.gun
            }
            
            if (skin.gunAmmo !== undefined) {
                this.gun.ammo = skin.gunAmmo
                this.gun.currentAmmo = skin.gunAmmo
            }
            
            if (skin.gunAngle !== undefined) {
                this.gun.angle = skin.gunAngle
            }
            
            if (skin.gunDamage !== undefined) {
                this.gun.damage = 10 * skin.gunDamage
            }
            
            if (skin.gunShotDelay !== undefined) {
                this.gun.shotTrigger = skin.gunShotDelay
            }
            
            if (skin.offsetX !== undefined) {
                this.gun.offsetX = skin.offsetX
            }
            if (skin.offsetY !== undefined) {
                this.gun.offsetY = skin.offsetY
            }
            
            if (skin.reloadTime !== undefined) {
                this.gun.reloadTime = skin.reloadTime
            }
            
            if (skin.reloadAnim !== undefined) {
                this.gun.reloadAnim = skin.reloadAnim
            }
            
            if (skin.noStop !== undefined) {
                this.gun.noStop = skin.noStop
            }
            
            if (skin.melee !== undefined) {
                this.gun.melee = skin.melee
            }
            
            if (skin.speedAmp !== undefined) {
                this.defaultSpeed = this.initSpeed * skin.speedAmp
                this.speed = this.defaultSpeed
            }
        }
        
        // Применение апгрейдов
        if (this.storage.upgrades) {
            if (this.storage.upgrades.gunTrigger) {
                this.gun.shotTrigger = (this.gun.shotTrigger || 0) + (this.storage.upgrades.gunTrigger * 50)
            }
            
            if (this.storage.upgrades.accuracy) {
                this.gun.angle = Math.max(0.1, this.gun.angle - (this.storage.upgrades.accuracy * 0.05))
            }
            
            if (this.storage.upgrades.boostGun) {
                this.gun.damage = this.gun.damage + (this.storage.upgrades.boostGun * 2)
            }
            
            if (this.storage.upgrades.boostAmmo) {
                this.gun.ammo = this.gun.ammo + (this.storage.upgrades.boostAmmo * 5)
                this.gun.currentAmmo = this.gun.ammo
            }
        }
    }
    
}

