/**
 * Bullet.js
 * 
 * Классы и менеджер для пуль
 * 
 * Содержит:
 * - Класс Bullet (базовый класс для пуль)
 * - Класс PlayerBullet (пули игрока)
 * - Класс EnemyBullet (пули врагов)
 * - Класс BulletManager (управление всеми пулями)
 * - Методы: spawnBullet(), updateBullets(), shot()
 * - Логика движения пуль
 * - Обработка столкновений и удаления пуль
 */

import * as PIXI from 'pixi.js'
import { getPercent } from '../utils/GameUtils.js'
import { BULLET_SPEED } from '../core/GameConfig.js'
import {soundPlayer} from "../playSound";

/**
 * Менеджер для управления пулями
 */
export class BulletManager {
    constructor(world, gameState, resources, eventBus) {
        this.world = world
        this.gameState = gameState
        this.resources = resources
        this.eventBus = eventBus

        // Массивы пуль
        this.playerBullets = []
        this.enemyBullets = []
        this.shotsArr = [] // Анимации выстрелов
        
        this.bulletSpeed = BULLET_SPEED
    }

    spawnBullet(x, y, char, isFriendly) {
        const bullet = new PIXI.Sprite(this.resources.particles.textures.bullet)

        bullet.anchor.set(0.5)
        bullet.zIndex = 11
        bullet.scale.x = 1.5
        bullet.scale.y = 2
        bullet.position.set(!isFriendly ? x - 14 : x + 14, y)

        // Применение эффекта пауэр-апа
        if (isFriendly && char.activePowerUps.some(item => item.type === 'boostGun')) {
            bullet.tint = 16731469
        }
        
        // Угол полета пули
        let rotate = Math.random() * (char.gun.angle ?? 0.4)
        rotate *= Math.round(Math.random()) ? 1 : -1
        bullet.rotation = rotate
        
        this.world.addChild(bullet)
        
        if (isFriendly) {
            this.playerBullets.push(bullet)
        } else {
            this.enemyBullets.push(bullet)
        }
        
        return bullet
    }
    
    /**
     * Создает выстрел с анимацией
     * @param {Object} char - объект стреляющего
     * @param {number} offsetX - смещение X
     * @param {number} offsetY - смещение Y
     * @param {string} eventGun - тип оружия
     * @param {boolean} friendly - дружественная пуля (игрок)
     * @param {Function} sleep - функция задержки
     * @returns {Array} массив созданных пуль
     */
    shot(char, offsetX, offsetY, eventGun, friendly, sleep = null) {
        const shot = new PIXI.AnimatedSprite(this.resources.particles.animations.gunShot)
        shot.anchor.set(0.5)
        shot.scale.x = 1.2
        shot.scale.y = 1.2
        shot.animationSpeed = 0.2
        shot.zIndex = 11
        
        if (soundPlayer) {
            soundPlayer.gunShot(eventGun, eventGun === 'smg' || eventGun === 'rifle')
        }
        
        const createdBullets = []
        
        if (friendly) {
            // Пули игрока
            if (char.activePowerUps.some(item => item.type === 'boostGun')) {
                shot.tint = 16757683
            }
            shot.position.set(char.sprite.x + offsetX, char.sprite.y - offsetY)
            
            if (char.gun && char.gun.noStop) {
                this.shotsArr.push(shot)
                if (sleep) {
                    sleep(150).then(() => {
                        this.shotsArr.splice(0, 1)
                    })
                }
            }
            
            // Создание пуль (для дробовика - 3 пули)
            const bulletCount = eventGun === 'shotgun' ? 3 : 1
            for (let i = 0; i < bulletCount; i++) {
                const bullet = this.spawnBullet(
                    shot.x - 10,
                    shot.y,
                    char,
                    friendly
                )
                if (bullet) createdBullets.push(bullet)
            }
        } else {
            // Пули врага
            shot.position.set(((char.x + 4) - char.width / 2) + offsetX, (char.y - 10) + offsetY)
            
            const bulletCount = eventGun === 'shotgun' ? 3 : 1
            for (let i = 0; i < bulletCount; i++) {
                const bullet = this.spawnBullet(
                    shot.x + 10,
                    shot.y,
                    char,
                    friendly,
                )
                if (bullet) createdBullets.push(bullet)
            }
        }
        
        // Создание отскакивающей частицы (гильза)
        if (eventGun !== 'shotgun' && eventGun !== 'revolver') {
            this.eventBus.emit('particle:bounce', { coords: char.sprite, type: 'shell' })
        }

        this.world.addChild(shot)
        shot.play()
        
        if (sleep) {
            sleep(150).then(() => {
                this.world.removeChild(shot)
            })
        }

        return createdBullets
    }

    updateBullets(worldCoords, gameSpeed) {
        // Обновление пуль врагов
        this.enemyBullets.forEach((b, idx) => {
            b.position.x -= (Math.cos(b.rotation) * this.bulletSpeed) * gameSpeed
            b.position.y -= (Math.sin(b.rotation) * this.bulletSpeed) * gameSpeed
            
            if (b.position.x < worldCoords.zeroLeft + 50 || b.position.x > worldCoords.zeroRight + 100) {
                // Создание частиц при исчезновении
                for (let i = 0; i <= 3; i++) {
                    this.eventBus.emit('particle:default', { coords: b, type: 'spark', floor: undefined, size: 1 })
                }
                this.world.removeChild(b)
                this.enemyBullets.splice(idx, 1)
            }
        })
        
        // Обновление пуль игрока
        this.playerBullets.forEach((b, idx) => {
            b.position.x += (Math.cos(b.rotation) * this.bulletSpeed) * gameSpeed
            b.position.y += (Math.sin(b.rotation) * this.bulletSpeed) * gameSpeed
            
            if (b.position.x < worldCoords.zeroLeft || b.x - b.width * 2 > worldCoords.zeroLeft + getPercent(worldCoords.worldWidth, 90)) {
                this.world.removeChild(b)
                this.gameState.decreaseStreakBy(0.5)
                // Создание частиц при исчезновении
                for (let i = 0; i <= 3; i++) {
                    this.eventBus.emit('particle:default', { coords: b, type: 'spark', floor: undefined, size: 1 })
                }
                this.playerBullets.splice(idx, 1)
            }
        })
        
        // Обновление анимаций выстрелов
        if (this.shotsArr.length > 0) {
            this.shotsArr.forEach(item => {
                // item.x += (playerSpeed / 2)
                // Анимации выстрелов двигаются вместе с игроком
                // (обновляется в ticker через playerSpeed)
            })
        }
    }
    
    /**
     * Очищает все пули
     */
    clear() {
        this.playerBullets.forEach(bullet => {
            this.world.removeChild(bullet)
        })
        this.playerBullets = []
        
        this.enemyBullets.forEach(bullet => {
            this.world.removeChild(bullet)
        })
        this.enemyBullets = []
        
        this.shotsArr.forEach(shot => {
            this.world.removeChild(shot)
        })
        this.shotsArr = []
    }
    
    /**
     * Получает массивы пуль (для обратной совместимости)
     */
    getBulletArrays() {
        return {
            playerBullets: this.playerBullets,
            enemyBullets: this.enemyBullets,
            shotsArr: this.shotsArr
        }
    }
}
