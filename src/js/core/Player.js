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
    constructor(world, gameState, resources, storage, worldCoords, timer, eventBus) {
        // GameState для управления уроном
        this.world = world
        this.gameState = gameState
        this.resources = resources
        this.storage = storage
        this.worldCoords = worldCoords
        this.timer = timer
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
        this.secondFloor = false
        this.stimpack = false
        this.skillCD = false
        this.inBossFight = false
        this.leaveCover = false
        this.afterRoll = true
        this.triggerDelay = false
        this.isMeleeActive = false

        // Скорости

        // Базовая скорость
        this.initSpeed = 5
        // Обычная скорость в забеге
        this.defaultSpeed = this.initSpeed
        // Текущая скорость
        this.speed = this.defaultSpeed
        
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

        eventBus.on('player:rollPause', () => {
            this.timer.pause('player:roll')
        })

        eventBus.on('player:rollResume', () => {
            this.timer.extend('player:roll', 200, 600)
            this.timer.resume('player:roll')
        })

        eventBus.on('player:meleeEnd', () => {
            this.isMeleeActive = false
        })

        eventBus.on('player:bossEnd', () => {
            this.inBossFight = false
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

    update(gameSpeed, delta) {
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

        if (this.inZipLine) {
            this.eventBus.emit('particle:trail', { coords: this.sprite, tint: null, zipLine: true })
            if (this.inZipLine === 'top') {
                this.sprite.y -= (5 * gameSpeed)
                if (this.sprite.y < this.worldCoords.secondFloor) {
                    this.inZipLine = ''
                    this.sprite.rotation = 0
                    this.setPlayerSpeed(this.defaultSpeed)
                    this.sprite.y = this.worldCoords.secondFloor
                    this.secondFloor = true
                    this.event('Space')
                }
            } else {
                this.sprite.y += (5 * gameSpeed)
                if (this.sprite.y > this.worldCoords.firstFloor) {
                    this.inZipLine = ''
                    this.sprite.rotation = 0
                    this.setPlayerSpeed(this.defaultSpeed)
                    this.sprite.y = this.worldCoords.firstFloor
                    this.secondFloor = false
                    this.playAnim('')
                }
            }
        }
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
            this.timer.sleep(1000).then(() => {
                this.endGame()
            });
        } else {
            // Восстановление после урона
            this.timer.sleep(200).then(() => {
                this.invincible = false
                if (this.inCover) {
                    this.sprite.tint = this.sprite.shadow
                } else {
                    this.sprite.tint = this.sprite.color
                }
            });
        }
    }

    event(key) {
        if (this.health === 0 || this.gameState.gameEnd || this.gameState.isPause || this.gameState.isMenu || !this.gameState.gameStart || this.inZipLine) return

        switch (key) {
            //RELOAD
            case 'KeyR':
                if ((!this.state || this.state === 'rollEnd') && this.gun.currentAmmo < this.gun.ammo && !this.isMeleeActive) {
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
                if (!this.state && !this.inBossFight && !this.isMeleeActive) {
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
                        this.timer.sleep(550, 'player:roll').then(() => {
                            if (this.inCover || this.inZipLine) {
                                this.gameState.increaseStreak(1)
                            } else {
                                if (this.isMeleeActive) return
                                this.setPlayerSpeed(this.defaultSpeed)
                                this.playAnim()
                            }
                        })
                        if (this.isMeleeActive) this.timer.pause('player:roll')
                    };
                }
                break
            //SHOT
            case 'KeyF':
                if (this.isMeleeActive) {
                    this.eventBus.emit('melee:handleMeleeKill', {skip: false, noDamage: false})

                    // Анимация ближнего боя
                    if (this.gun.melee) {
                        this.playAnim('melee')
                        this.timer.sleep(150, 'player:melee').then(() => {
                            if (this.inCover) return this.playAnim('idle')
                            this.state = ''
                            this.event({code:'Space'})
                        })
                    }
                    return
                }
                if ((!this.state || this.state === 'rollEnd') && !this.triggerDelay) {
                    if (this.gun.currentAmmo <= 0) {
                        soundPlayer.pistolEmpty()
                        return;
                    }
                    this.triggerDelay = true
                    this.timer.sleep(this.gun.shotTrigger, 'player:trigger').then(() => {
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
                    this.eventBus.emit('bullet:shot', {character: this, offsetX: this.gun.offsetX, offsetY: this.gun.offsetY, gunParams: this.gun, friendly: true})
                    if (this.stimpack) {
                        this.timer.sleep(100, 'player:doubleShot').then(() => {
                            this.eventBus.emit('bullet:shot', {character: this, offsetX: this.gun.offsetX, offsetY: this.gun.offsetY, gunParams: this.gun, friendly: true})
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
                this.timer.sleep(6000, 'player:skillCD').then(() => {
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
                this.timer.sleep(15000, 'player:skillCD').then(() => {
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

    //TODO || (wall.forBoss && !currentBoss.params.dead)
    handleCover(wall) {
        if (!this.inCover && this.isRollState() && !this.leaveCover || (wall.forBoss && !this.inBossFight)) {
            this.inBossFight = wall.forBoss
            this.inCover = true
            this.setPlayerSpeed(0)
            this.sprite.x = wall.coverX
            this.playAnim('idle')

            if (this.inBossFight) {
                this.eventBus.emit('boss:activate')
            }
        }
    }

    handlePuddle() {
        this.setPlayerSpeed(this.defaultSpeed * 1.5)
    }

    isRollState() {
        return this.state === 'roll' || this.state === 'rollEnd'
    }

    updateDefaultSpeedByScore(score) {
        this.defaultSpeed = this.initSpeed + score
    }

    setPlayerSpeed(speed) {
        this.speed = speed
    }

    handlePowerUp(powerUp) {
        const findAlreadyActive = this.activePowerUps.find(item => item.type === powerUp.options.type)

        if (findAlreadyActive) {
            // Обновление времени существования
            findAlreadyActive.expired = Date.now() + ((5 + (5 * this.storage.upgrades[powerUp.options.type])) * 1000)
        } else {
            // Добавление нового пауэр-апа
            this.playerState.activePowerUps.push({
                type: powerUp.options.type,
                expired: Date.now() + ((5 + (5 * this.storage.upgrades[powerUp.options.type])) * 1000)
            })

            this.eventBus.emit('hud:updatePowerUps', this.activePowerUps)

            // Применение эффектов пауэр-апа
            switch (powerUp.options.type) {
                case 'boostAmmo':
                    this.gun.currentAmmo = this.gun.ammo * 2
                    this.gun.ammo *= 2
                    this.eventBus.emit('hud:createBulletsDisplay', this.gun)
                    break
                case 'boostGun':
                    this.gun.damage *= 2
                    break
            }
        }
    }

    handleMelee(enemy, distance) {
        const MELEE_RANGE = 40
        if (distance >= MELEE_RANGE || enemy.skip) return
        if (this.inBossFight || this.isRollState()) {
            enemy.handleMelee()
            if (this.invincible) {
                // Damage Sphere
            } else {
                this.isMeleeActive = true
                this.eventBus.emit('melee:activate', enemy)
            }
        }
    }

    get playerSpeed() {
        return this.speed
    }
    
}

