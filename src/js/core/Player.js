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
    constructor(world, gameState, resources, storage, worldCoords, sleep, eventBus) {
        // GameState для управления уроном
        this.world = world
        this.gameState = gameState
        this.resources = resources
        this.storage = storage
        this.worldCoords = worldCoords
        this.sleep = sleep
        this.eventBus = eventBus

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
        this.triggerDelay = false

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
            offsetX: 30,
            offsetY: 12,
            shotTrigger: 0,
            reloadAnim: 0.2,
            reloadTime: 1000,
            noStop: false,
            melee: false
        }

        eventBus.on('player:defaultSpeed', speed => {
            this.updateDefaultSpeedByScore(speed)
        })

        eventBus.on('player:event', key => {
            this.event(key)
        })
    }

    // Создает спрайт игрока
    createPlayer(x = 0, y = 0, fg) {
        const player = new PIXI.AnimatedSprite(this.currentSkin.animations.run)
        player.color = player.tint
        player.shadow = 11776947
        player.anchor.set(0.5)
        player.scale.x = 2
        player.scale.y = 2
        player.animationSpeed = 0.2
        player.autoUpdate = true
        player.loop = true
        player.parentGroup = fg
        player.zOrder = 5
        player.position.set(x, y)
        this.world.addChild(player)
        player.play()


        this.sprite = player
        return player
    }

    updatePlayer(gameSpeed, delta) {
        if (this.activePowerUps.length > 0) {
            this.activePowerUps.forEach((powerUp, idx) => {
                if (Date.now() > powerUp.expired) {
                    switch (true) {
                        case powerUp.type === 'boostAmmo':
                            this.gun.ammo = this.gun.ammo / 2
                            break
                        case powerUp.type === 'boostGun':
                            this.gun.damage = this.gun.damage / 2
                            break
                    }
                    this.activePowerUps.splice(idx, 1)

                    this.eventBus.emit('hud:updatePowerUps', this.activePowerUps)
                    console.log('endPW')
                }
            })
        }
        if (this.gameState.gameStart) {
            const dtX = 1 - Math.exp(-delta / 5)
            const dtY = 1 - Math.exp(-delta / 20)
            this.world.pivot.x = ((this.sprite.x - 60) - this.world.pivot.x) * dtX + this.world.pivot.x;
            this.world.pivot.y = (-this.world.pivot.y) * dtY + this.world.pivot.y;
        }
        this.sprite.x += (0.5 * this.speed) * gameSpeed;

        this.worldCoords.zeroLeft = (this.sprite.x - 100)
        this.worldCoords.zeroRight = (this.sprite.x + this.worldCoords.worldWidth)
    }

    /**
     * Наносит урон игроку
     */
    damagePlayer() {
        if (!this.sprite) return
        
        // Тряска камеры
        this.eventBus.emit('camera:shake', {intensity: 4, duration: 600})
        
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
            this.eventBus.emit('hud:updatePowerUps', this.activePowerUps)
        } else {
            // Проверка наличия стимпака
            if (this.stimpack) {
                soundPlayer.damageMetal()
                this.sprite.tint = 16777021
                this.stimpack = false
                this.eventBus.emit('hud:removeShield')
            } else {
                // Нанесение реального урона
                this.gameState.decreaseStreak(30)

                this.sprite.tint = 16737894
                this.health--
                
                // Удаление сердца из HUD
                this.eventBus.emit('hud:removeHP')
            }
        }
        
        // Проверка смерти игрока
        if (this.health <= 0) {
            // Создание частиц крови
            const isOnSecondFloor = this.worldCoords.secondFloor === this.sprite.y
            for (let i = 0; i <= 20; i++) {
                this.eventBus.emit('particle:default', {coords: this.sprite, type: 'blood', floor: isOnSecondFloor})
            }
            
            // Удаление игрока из мира
            this.world.removeChild(this.sprite)

            // Остановка движения игрока
            this.setPlayerSpeed(0)

            // Задержка перед окончанием игры
            this.sleep(1000).then(() => {
                this.endGame()
            })
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

    event(key) {
        if (this.health === 0 || this.gameState.gameEnd || this.gameState.isPause || this.gameState.isMenu || !this.gameState.gameStart) return
        if (this.inZipLine) return
        const isMeleeActive = this.eventBus.emit('melee:isActive', null, true);
        switch (key) {
            //RELOAD
            case 'KeyR':
                if ((!this.state || this.state === 'rollEnd') && this.gun.currentAmmo < this.gun.ammo && !isMeleeActive) {
                    soundPlayer.gunReload(this.gun.type)
                    this.playAnim('reload')
                    this.setPlayerSpeed(0)
                    switch (this.gun.type) {
                        case 'shotgun':
                            for (let i = 0; i < this.gun.ammo - this.gun.currentAmmo; i++) {
                                this.eventBus.emit('particle:bounce', {coords: this.sprite, type: 'shell', tint: 16711680})
                            }
                            break
                        case 'revolver':
                            for (let i = 0; i < this.gun.ammo - this.gun.currentAmmo; i++) {
                                this.eventBus.emit('particle:bounce', {coords: this.sprite, type: 'shell'})
                            }
                            break
                        default:
                            this.eventBus.emit('particle:bounce', {coords: this.sprite, type: 'mag'})
                            break
                    }
                    this.sprite.onComplete = () => {
                        this.eventBus.emit('hud:createBulletsDisplay', this.gun)

                        this.gun.currentAmmo = this.gun.ammo
                        if (this.inCover) {
                            this.playAnim('idle')
                            return
                        }
                        this.setPlayerSpeed(this.defaultSpeed)
                        this.playAnim()
                    }
                }
                break
            //ROLL
            case 'Space':
                if (!this.state && !this.inBossFight && !isMeleeActive) {
                    this.gameState.increaseStreak(1)
                    soundPlayer.slide()
                    this.playAnim('roll')
                    this.setPlayerSpeed(this.defaultSpeed * 1.5)
                    if (this.inCover) {
                        this.inCover = false
                        this.sprite.anchor.y = 0.5
                        this.leaveCover = true
                    }
                    this.sprite.onComplete = () => {
                        this.leaveCover = false
                        if (this.inZipLine || this.state !== 'roll') return
                        this.playAnim('rollEnd')
                        this.sleep(550, true).then(() => {
                            console.log('resolve')
                            if (this.inCover || this.inZipLine) {
                                this.gameState.increaseStreak(1)
                            } else {
                                if (isMeleeActive) return
                                this.setPlayerSpeed(this.defaultSpeed)
                                this.playAnim()
                            }
                            this.rollId = null
                        })
                        if (isMeleeActive) this.rollId.pause()
                    };
                }
                break
            //SHOT
            case 'KeyF':
                if (isMeleeActive) {
                    this.eventBus.emit('melee:handleMeleeKill', {skip: false, noDamage: false})
                    return
                }
                if ((!this.state || this.state === 'rollEnd') && !this.triggerDelay) {
                    if (this.gun.currentAmmo <= 0) {
                        soundPlayer.pistolEmpty()
                        return;
                    }
                    this.triggerDelay = true
                    this.sleep(this.gun.shotTrigger).then(() => {
                        this.triggerDelay = false
                    })
                    if (this.inCover) {
                        // player.y = playerState.secondFloor ? secondFloor : playerPos
                        this.sprite.anchor.y = 0.5
                        this.sprite.tint = this.sprite.color
                    }
                    this.gun.currentAmmo--
                    this.eventBus.emit('hud:removeBullet')

                    this.playAnim('shot')
                    this.eventBus.emit('bullet:shot', {char: this, offsetX: this.gun.offsetX, offsetY: this.gun.offsetY, eventGun: this.gun.type, friendly: true})
                    if (this.stimpack) {
                        this.sleep(100).then(() => {
                            this.eventBus.emit('bullet:shot', {char: this, offsetX: this.gun.offsetX, offsetY: this.gun.offsetY, eventGun: this.gun.type, friendly: true})
                        })
                    }
                    if (!this.gun.noStop) {
                        this.setPlayerSpeed(0)
                        this.sprite.onComplete = () => {
                            if (this.inCover) {
                                this.playAnim('idle')
                                return
                            }
                            this.setPlayerSpeed(this.defaultSpeed)
                            this.playAnim()
                        }
                    } else {
                        if (this.inCover) {
                            this.sprite.onComplete = () => {
                                this.playAnim('idle')
                            }
                            return
                        }
                        this.setPlayerSpeed(this.defaultSpeed)
                        this.playAnim()
                    }
                }
                break
            //THROW GRENADE
            case 'KeyE':
                if (this.skillCD || this.storage.activeItems.grenades === 0) return;
                storage.activeItems.grenades -= 1
                this.skillCD = true

                this.eventBus.emit('hud:setSkillsAlpha', 0.3)
                this.eventBus.emit('hud:updateSkills', this.storage)

                if (grenadeManager) {
                    grenadeManager.grenadeBounce()
                }
                this.sleep(6000).then(() => {
                    this.eventBus.emit('hud:setSkillsAlpha', 1)
                    this.skillCD = false
                })
                break
            //USE STIMPACK
            case 'KeyW':
                if (this.skillCD || storage.activeItems.stimpack === 0) return;
                storage.activeItems.stimpack -= 1
                this.skillCD = true

                this.eventBus.emit('hud:setSkillsAlpha', 0.3)
                this.eventBus.emit('hud:updateSkills', this.storage)
                this.eventBus.emit('hud:createShield', this.health)

                this.stimpack = true
                soundPlayer.useSkill()
                this.sleep(15000).then(() => {
                    this.eventBus.emit('hud:removeShield')
                    this.eventBus.emit('hud:setSkillsAlpha', 1)

                    this.skillCD = false
                    this.stimpack = false
                })
                break
            case 'KeyQ':
                if (this.speed) {
                    this.setPlayerSpeed(0)
                } else {
                    this.setPlayerSpeed(this.defaultSpeed)
                }
                break
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
        
        if (!anim || (anim === 'shotEnd' && this.gun.noStop)) {
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
                this.defaultSpeed += skin.speedAmp
                this.speed = this.defaultSpeed
                this.initSpeed = this.defaultSpeed
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

    updateDefaultSpeedByScore(score) {
        this.defaultSpeed = this.initSpeed + score
    }

    setPlayerSpeed(speed) {
        this.speed = speed
    }

    get playerSpeed() {
        return this.speed
    }

    get playerDefaultSpeed() {
        return this.defaultSpeed
    }
    
}

