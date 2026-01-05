/**
 * Player.js
 * 
 * Модуль игрока
 * 
 * Содержит:
 * - Класс Player (управление игроком)
 * - Состояние игрока (playerState)
 * - Параметры оружия (gun)
 * - Переменные управления игроком
 * - Функция updateGunFromSkin (обновление оружия из скина и апгрейдов)
 */

import * as PIXI from 'pixi.js'
import { getPercent } from './utils/GameUtils.js'

/**
 * Состояние игрока
 */
export const playerState = {
    state: '',
    health: 3,
    invincible: false,
    inCover: false,
    inZipLine: false,
    activePowerUps: [],
    rollId: null,
    secondFloor: false,
    currentSkin: null,
    stimpack: false,
    skillCD: false,
    inBossFight: false,
    leaveCover: false
}

/**
 * Скорость игрока по умолчанию
 */
export let playerDefaultSpeed = 1

/**
 * Текущая скорость игрока
 */
export let playerSpeed = { value: 1 }

/**
 * Начальная скорость
 */
export let initSpeed = 1

/**
 * Спрайт игрока
 */
export let player = null

/**
 * Массив пуль игрока
 */
export let playerBullets = []

/**
 * Параметры оружия
 */
export let gun = {
    ammo: 30,
    currentAmmo: 30,
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

/**
 * UI ближнего боя
 */
export let meleeKill = null

/**
 * Сторона селектора ближнего боя
 */
export let meleeKillSelectorSide = 1

/**
 * Скорость селектора ближнего боя
 */
export let meleeKillSelectorSpeed = 5

/**
 * Стрик ближнего боя
 */
export let meleeKillStreak = { value: 0 }

/**
 * Таймер стрика ближнего боя
 */
export let meleeKillStreakTimer = null

/**
 * Задержка триггера
 */
export let triggerDelay = 0

/**
 * Обновляет параметры оружия из скина и апгрейдов
 * @param {number} skinIndex - индекс скина
 * @param {Object} storage - хранилище с апгрейдами
 * @param {Function} getPercent - функция получения процента
 * @param {Array} skinStore - массив скинов (опционально, должен быть передан извне)
 */
export function updateGunFromSkin(skinIndex, storage, getPercent, skinStore = null) {
    if (!storage || !getPercent) {
        console.warn('updateGunFromSkin: storage or getPercent not provided')
        return
    }
    
    // Базовые параметры оружия
    gun.currentAmmo = 5
    gun.ammo = 5
    gun.angle = 0.4
    gun.type = 'pistol'
    gun.offsetX = 0
    gun.offsetY = 0
    gun.shotTrigger = 0
    gun.reloadAnim = 0.2
    gun.reloadTime = 1000
    gun.noStop = false
    gun.melee = false
    gun.damage = 10
    gun.fireRate = 100
    
    // Применение параметров скина
    if (skinStore && skinStore[skinIndex]) {
        const skin = skinStore[skinIndex]
        
        // Тип оружия
        if (skin.gun) {
            gun.type = skin.gun
        }
        
        // Количество патронов
        if (skin.gunAmmo !== undefined) {
            gun.ammo = skin.gunAmmo
            gun.currentAmmo = skin.gunAmmo
        }
        
        // Угол разброса
        if (skin.gunAngle !== undefined) {
            gun.angle = skin.gunAngle
        }
        
        // Урон
        if (skin.gunDamage !== undefined) {
            gun.damage = 10 * skin.gunDamage
        }
        
        // Задержка выстрела
        if (skin.gunShotDelay !== undefined) {
            gun.shotTrigger = skin.gunShotDelay
        }
        
        // Смещение для выстрела
        if (skin.offsetX !== undefined) {
            gun.offsetX = skin.offsetX
        }
        if (skin.offsetY !== undefined) {
            gun.offsetY = skin.offsetY
        }
        
        // Время перезарядки
        if (skin.reloadTime !== undefined) {
            gun.reloadTime = skin.reloadTime
        }
        
        // Скорость анимации перезарядки
        if (skin.reloadAnim !== undefined) {
            gun.reloadAnim = skin.reloadAnim
        }
        
        // Не останавливаться при стрельбе
        if (skin.noStop !== undefined) {
            gun.noStop = skin.noStop
        }
        
        // Ближний бой
        if (skin.melee !== undefined) {
            gun.melee = skin.melee
        }
        
        // Множитель скорости
        if (skin.speedAmp !== undefined) {
            playerDefaultSpeed = initSpeed * skin.speedAmp
            playerSpeed.value = playerDefaultSpeed
        }
    }
    
    // Применение апгрейдов
    if (storage.upgrades) {
        // Апгрейд триггера
        if (storage.upgrades.gunTrigger) {
            gun.shotTrigger = (gun.shotTrigger || 0) + (storage.upgrades.gunTrigger * 50)
        }
        
        // Апгрейд точности
        if (storage.upgrades.accuracy) {
            gun.angle = Math.max(0.1, gun.angle - (storage.upgrades.accuracy * 0.05))
        }
        
        // Апгрейд урона
        if (storage.upgrades.boostGun) {
            gun.damage = gun.damage + (storage.upgrades.boostGun * 2)
        }
        
        // Апгрейд патронов
        if (storage.upgrades.boostAmmo) {
            gun.ammo = gun.ammo + (storage.upgrades.boostAmmo * 5)
            gun.currentAmmo = gun.ammo
        }
    }
}

/**
 * Класс игрока
 */
export class Player {
    constructor() {
        this.player = null
        this.currentSkin = null
    }
    
    /**
     * Создает спрайт игрока
     * @param {Object} skin - параметры скина с текстурами и анимациями
     * @param {number} x - позиция X
     * @param {number} y - позиция Y
     * @returns {PIXI.AnimatedSprite} спрайт игрока
     */
    createPlayer(skin, x = 0, y = 0) {
        if (!skin || !skin.animations) {
            console.warn('Player.createPlayer: skin or animations not provided')
            return null
        }
        
        this.currentSkin = skin
        playerState.currentSkin = skin
        
        // Создание анимированного спрайта из анимации бега
        const playerSprite = new PIXI.AnimatedSprite(skin.animations.run)
        playerSprite.anchor.set(0.5, 0.7)
        playerSprite.position.set(x, y)
        playerSprite.scale.set(2)
        playerSprite.animationSpeed = 0.2
        playerSprite.loop = true
        playerSprite.play()
        
        // Сохранение цветов для использования в анимациях
        playerSprite.color = 0xffffff
        playerSprite.shadow = 0x757575
        
        // Сохранение ссылки
        this.player = playerSprite
        player = playerSprite
        
        return playerSprite
    }
    
    /**
     * Обновляет игрока
     * @param {number} delta - дельта времени
     * @param {boolean} gameEnd - игра окончена
     * @param {boolean} gameStart - игра началась
     * @param {number} gameSpeed - скорость игры
     * @param {Array} enemyBullets - массив пуль врагов
     * @param {PIXI.Container} world - игровой мир
     * @param {Object} soundPlayer - проигрыватель звуков
     * @param {Function} damagePlayer - функция нанесения урона игроку
     */
    updatePlayer(delta, gameEnd, gameStart, gameSpeed, enemyBullets, world, soundPlayer, damagePlayer) {
        if (!this.player || gameEnd) return
        
        // Обновление позиции игрока
        if (gameStart) {
            const speed = playerSpeed.value || playerSpeed || 1
            this.player.x += (0.5 * speed) * gameSpeed
        }
        
        // Проверка столкновения с пулями врагов
        if (enemyBullets && Array.isArray(enemyBullets)) {
            enemyBullets.forEach((bullet, idx) => {
                if (!bullet || !this.player) return
                
                const bulletBounds = bullet.getBounds ? bullet.getBounds() : bullet
                const playerBounds = this.player.getBounds()
                
                if (this.player.x + 40 > bulletBounds.x && 
                    this.player.x < bulletBounds.x && 
                    this.player.y - this.player.height / 2 < bulletBounds.y && 
                    this.player.y + this.player.height / 2 > bulletBounds.y) {
                    
                    // Проверка на уклонение
                    if (playerState.state === 'roll' || 
                        playerState.state === 'rollEnd' || 
                        (playerState.inCover && playerState.state !== 'shot')) {
                        if (soundPlayer && soundPlayer.bulletSkip) {
                            soundPlayer.bulletSkip()
                        }
                        return
                    }
                    
                    // Удаление пули
                    if (world && bullet.parent) {
                        world.removeChild(bullet)
                    }
                    enemyBullets.splice(idx, 1)
                    
                    // Проверка на неуязвимость
                    if (playerState.invincible) {
                        return
                    }
                    
                    // Нанесение урона
                    if (damagePlayer) {
                        damagePlayer()
                    }
                }
            })
        }
    }
    
    /**
     * Проигрывает анимацию
     * @param {string} anim - название анимации (idle, run, shot, reload, roll, rollEnd, zipLine, melee)
     */
    playAnim(anim) {
        if (!this.player || !this.currentSkin || !this.currentSkin.animations) {
            return
        }
        
        // Настройка цикла анимации
        this.player.loop = !anim || anim === 'idle'
        
        // Скорость анимации
        this.player.animationSpeed = (anim === 'reload' && gun.reloadAnim) ? gun.reloadAnim : 0.2
        
        // Специальная обработка для оружия без остановки
        if (gun.noStop && anim === 'shot' && !playerState.inCover) {
            if (playerState.state) {
                this.updatePlayerState(anim, this.currentSkin.animations.run, this.player.color)
            } else {
                playerState.state = anim
            }
            return
        }
        
        // Сброс состояния
        if (!anim || (anim === 'shotEnd' && gun.noStop)) {
            this.resetPlayerState()
        } else {
            // Установка цвета в зависимости от состояния
            const tint = (anim === 'roll' || anim === 'rollEnd' || (playerState.inCover && anim !== 'shot')) ? 
                this.player.shadow : this.player.color
            this.player.tint = tint
            
            // Обработка специальных анимаций
            if (anim === 'idle' || anim === 'zipLine') {
                if (anim === 'idle') {
                    this.player.anchor.y = 0.7
                }
                this.updatePlayerState('', this.currentSkin.animations[anim], tint)
            } else {
                // Проверка наличия анимации
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
     * @param {string} state - состояние
     * @param {Array} textures - текстуры анимации
     * @param {number} tint - цвет
     */
    updatePlayerState(state, textures, tint) {
        if (!this.player || !textures) return
        
        playerState.state = state
        this.player.textures = textures
        this.player.tint = tint
        this.player.play()
    }
    
    /**
     * Сбрасывает состояние игрока
     */
    resetPlayerState() {
        if (!this.player || !this.currentSkin) return
        
        playerState.state = ''
        if (this.currentSkin.animations.run) {
            this.player.textures = this.currentSkin.animations.run
        }
        this.player.tint = this.player.color
        this.player.play()
    }
    
    /**
     * Получает спрайт игрока
     */
    getPlayer() {
        return this.player
    }
    
    /**
     * Устанавливает скин
     */
    setSkin(skin) {
        this.currentSkin = skin
        playerState.currentSkin = skin
    }
}

