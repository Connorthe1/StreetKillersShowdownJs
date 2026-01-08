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

/**
 * Класс игрока
 */
export class Player {
    constructor(gameState = null) {
        // Спрайт игрока
        this.sprite = null
        this.currentSkin = null
        
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
        this.defaultSpeed = 1
        this.speed = 1
        this.initSpeed = 1
        
        // Параметры оружия
        this.gunAmmo = 30
        this.gunCurrentAmmo = 30
        this.gunDamage = 10
        this.gunFireRate = 100
        this.gunType = 'pistol'
        this.gunAngle = 0.4
        this.gunOffsetX = 0
        this.gunOffsetY = 0
        this.gunShotTrigger = 0
        this.gunReloadAnim = 0.2
        this.gunReloadTime = 1000
        this.gunNoStop = false
        this.gunMelee = false
        
        // UI ближнего боя
        this.meleeKill = null
        
        // Задержка триггера
        this.triggerDelay = false
        
        // GameState для управления уроном
        this.gameState = gameState
        
        // Колбэки для управления уроном
        this.cameraShake = null
        this.soundPlayer = null
        this.hud = null
        this.world = null
        this.createParticles = null
        this.sleep = null
        this.endGame = null
        this.HUDupdatePowerUp = null
        this.HUDremoveShield = null
        this.getSecondFloor = null
        this.setPlayerSpeed = null
    }
    
    /**
     * Устанавливает колбэки для управления уроном
     * @param {Object} callbacks - объект с колбэками
     */
    setDamageCallbacks(callbacks) {
        if (callbacks.cameraShake !== undefined) this.cameraShake = callbacks.cameraShake
        if (callbacks.soundPlayer !== undefined) this.soundPlayer = callbacks.soundPlayer
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
     * Устанавливает gameState
     * @param {Object} gameState - состояние игры
     */
    setGameState(gameState) {
        this.gameState = gameState
    }
    
    /**
     * Создает спрайт игрока
     * @param {number} x - позиция X
     * @param {number} y - позиция Y
     * @param {Object} skin - параметры скина с текстурами и анимациями (опционально)
     * @returns {PIXI.AnimatedSprite} спрайт игрока
     */
    createPlayer(x = 0, y = 0, skin = null) {
        const useSkin = skin || this.currentSkin
        
        if (!useSkin || !useSkin.animations || !useSkin.animations.run) {
            console.error('Player.createPlayer: skin is required and must have animations.run')
            return null
        }
        
        const playerSprite = new PIXI.AnimatedSprite(useSkin.animations.run)
        playerSprite.anchor.set(0.5, 0.7)
        playerSprite.position.set(x, y)
        playerSprite.scale.set(2)
        playerSprite.animationSpeed = 0.2
        playerSprite.loop = true
        playerSprite.play()
        
        playerSprite.color = 0xffffff
        playerSprite.shadow = 0x757575
        
        this.sprite = playerSprite
        this.currentSkin = useSkin
        
        return playerSprite
    }
    
    /**
     * Обновляет игрока
     * @param {boolean} gameStart - игра началась
     * @param {number} gameSpeed - скорость игры
     * @param {Array} enemyBullets - массив пуль врагов
     * @param {PIXI.Container} world - игровой мир
     * @param {Object} soundPlayer - проигрыватель звуков
     * @param {Function} damagePlayer - функция нанесения урона игроку (опционально, используется внутренний метод если не указан)
     */
    updatePlayer(gameStart, gameSpeed, enemyBullets, world, soundPlayer, damagePlayer = null) {
        if (!this.sprite) return
        
        if (gameStart) {
            const speed = this.speed || 1
            this.sprite.x += (0.5 * speed) * gameSpeed
        }
        
        // Используем внутренний метод damagePlayer, если не указан внешний
        const damageCallback = damagePlayer || (() => this.damagePlayer())
        
        if (enemyBullets && Array.isArray(enemyBullets)) {
            enemyBullets.forEach((bullet, idx) => {
                if (!bullet || !this.sprite) return
                
                const bulletBounds = bullet.getBounds ? bullet.getBounds() : bullet
                
                if (this.sprite.x + 40 > bulletBounds.x &&
                    this.sprite.x < bulletBounds.x &&
                    this.sprite.y - this.sprite.height / 2 < bulletBounds.y &&
                    this.sprite.y + this.sprite.height / 2 > bulletBounds.y) {
                    
                    if (this.state === 'roll' ||
                        this.state === 'rollEnd' ||
                        (this.inCover && this.state !== 'shot')) {
                        if (soundPlayer && soundPlayer.bulletSkip) {
                            soundPlayer.bulletSkip()
                        }
                        return
                    }
                    
                    if (world && bullet.parent) {
                        world.removeChild(bullet)
                    }
                    enemyBullets.splice(idx, 1)
                    
                    if (this.invincible) {
                        return
                    }
                    
                    damageCallback()
                }
            })
        }
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
            if (this.soundPlayer) {
                this.soundPlayer.damageMetal()
            }
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
                if (this.soundPlayer) {
                    this.soundPlayer.damageMetal()
                }
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
        this.sprite.animationSpeed = (anim === 'reload' && this.gunReloadAnim) ? this.gunReloadAnim : 0.2
        
        if (this.gunNoStop && anim === 'shot' && !this.inCover) {
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
    
    /**
     * Устанавливает скин
     */
    setSkin(skin) {
        this.currentSkin = skin
    }
    
    /**
     * Возвращает объект оружия
     */
    get gun() {
        return {
            ammo: this.gunAmmo,
            currentAmmo: this.gunCurrentAmmo,
            damage: this.gunDamage,
            fireRate: this.gunFireRate,
            type: this.gunType,
            angle: this.gunAngle,
            offsetX: this.gunOffsetX,
            offsetY: this.gunOffsetY,
            shotTrigger: this.gunShotTrigger,
            reloadAnim: this.gunReloadAnim,
            reloadTime: this.gunReloadTime,
            noStop: this.gunNoStop,
            melee: this.gunMelee
        }
    }
    
    /**
     * Возвращает объект состояния
     */
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
    
    /**
     * Обновляет параметры оружия из скина и апгрейдов
     */
    updateGunFromSkin(skinIndex, storage, getPercent, skinStore = null) {
        if (!storage || !getPercent) {
            console.warn('updateGunFromSkin: storage or getPercent not provided')
            return
        }
        
        // Базовые параметры оружия
        this.gunCurrentAmmo = 5
        this.gunAmmo = 5
        this.gunAngle = 0.4
        this.gunType = 'pistol'
        this.gunOffsetX = 0
        this.gunOffsetY = 0
        this.gunShotTrigger = 0
        this.gunReloadAnim = 0.2
        this.gunReloadTime = 1000
        this.gunNoStop = false
        this.gunMelee = false
        this.gunDamage = 10
        this.gunFireRate = 100
        
        // Применение параметров скина
        if (skinStore && skinStore[skinIndex]) {
            const skin = skinStore[skinIndex]
            
            if (skin.gun) {
                this.gunType = skin.gun
            }
            
            if (skin.gunAmmo !== undefined) {
                this.gunAmmo = skin.gunAmmo
                this.gunCurrentAmmo = skin.gunAmmo
            }
            
            if (skin.gunAngle !== undefined) {
                this.gunAngle = skin.gunAngle
            }
            
            if (skin.gunDamage !== undefined) {
                this.gunDamage = 10 * skin.gunDamage
            }
            
            if (skin.gunShotDelay !== undefined) {
                this.gunShotTrigger = skin.gunShotDelay
            }
            
            if (skin.offsetX !== undefined) {
                this.gunOffsetX = skin.offsetX
            }
            if (skin.offsetY !== undefined) {
                this.gunOffsetY = skin.offsetY
            }
            
            if (skin.reloadTime !== undefined) {
                this.gunReloadTime = skin.reloadTime
            }
            
            if (skin.reloadAnim !== undefined) {
                this.gunReloadAnim = skin.reloadAnim
            }
            
            if (skin.noStop !== undefined) {
                this.gunNoStop = skin.noStop
            }
            
            if (skin.melee !== undefined) {
                this.gunMelee = skin.melee
            }
            
            if (skin.speedAmp !== undefined) {
                this.defaultSpeed = this.initSpeed * skin.speedAmp
                this.speed = this.defaultSpeed
            }
        }
        
        // Применение апгрейдов
        if (storage.upgrades) {
            if (storage.upgrades.gunTrigger) {
                this.gunShotTrigger = (this.gunShotTrigger || 0) + (storage.upgrades.gunTrigger * 50)
            }
            
            if (storage.upgrades.accuracy) {
                this.gunAngle = Math.max(0.1, this.gunAngle - (storage.upgrades.accuracy * 0.05))
            }
            
            if (storage.upgrades.boostGun) {
                this.gunDamage = this.gunDamage + (storage.upgrades.boostGun * 2)
            }
            
            if (storage.upgrades.boostAmmo) {
                this.gunAmmo = this.gunAmmo + (storage.upgrades.boostAmmo * 5)
                this.gunCurrentAmmo = this.gunAmmo
            }
        }
    }
    
}

