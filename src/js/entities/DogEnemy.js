/**
 * DogEnemy.js
 * 
 * Менеджер собаки-врага
 * 
 * Содержит:
 * - Создание собаки-врага (createDogEnemy)
 * - Обновление собаки-врага (updateDogEnemy)
 * - Логика движения к игроку
 * - Коллизии с игроком (урон)
 * - Коллизии с пулями игрока
 * - Определение уровня (первый/второй этаж)
 */

import * as PIXI from 'pixi.js'
import { random } from '../utils/GameUtils.js'

/**
 * Менеджер собаки-врага
 */
export class DogEnemyManager {
    constructor(world, player, playerState, playerBullets, buildings, zeroLeft, zeroRight, playerPos, secondFloor, gameSpeed, fg) {
        this.world = world
        this.player = player
        this.playerState = playerState
        this.playerBullets = playerBullets
        this.buildings = buildings
        this.zeroLeft = zeroLeft
        this.zeroRight = zeroRight
        this.playerPos = playerPos
        this.secondFloor = secondFloor
        this.gameSpeed = gameSpeed
        this.fg = fg
        
        // Текущая собака-враг
        this.currentDogEnemy = null
        
        // Текстуры и параметры (устанавливаются позже)
        this.dogEnemy = null
        this.enemyParams = null
        
        // Callbacks
        this.damagePlayerCallback = null
        this.damageEnemyCallback = null
        this.soundPlayer = null
        this.gun = null
    }
    
    /**
     * Устанавливает текстуры и параметры
     */
    setTextures(dogEnemy, enemyParams) {
        this.dogEnemy = dogEnemy
        this.enemyParams = enemyParams
    }
    
    /**
     * Устанавливает колбэки
     */
    setCallbacks(callbacks) {
        if (callbacks.damagePlayer) this.damagePlayerCallback = callbacks.damagePlayer
        if (callbacks.damageEnemy) this.damageEnemyCallback = callbacks.damageEnemy
        if (callbacks.soundPlayer) this.soundPlayer = callbacks.soundPlayer
        if (callbacks.gun) this.gun = callbacks.gun
    }
    
    /**
     * Обновляет состояние
     */
    updateState(state) {
        if (state.player !== undefined) this.player = state.player
        if (state.playerState !== undefined) this.playerState = state.playerState
        if (state.zeroLeft !== undefined) this.zeroLeft = state.zeroLeft
        if (state.zeroRight !== undefined) this.zeroRight = state.zeroRight
        if (state.gameSpeed !== undefined) this.gameSpeed = state.gameSpeed
    }
    
    /**
     * Создает собаку-врага
     */
    createDogEnemy() {
        if (!this.dogEnemy || !this.enemyParams) {
            console.warn('Dog enemy textures or params not available')
            return null
        }
        
        if (this.currentDogEnemy) {
            // Удаляем предыдущую собаку, если она существует
            this.removeDogEnemy()
        }
        
        // Звук лая
        if (this.soundPlayer) {
            this.soundPlayer.dogBarking()
        }
        
        // Определение позиции
        let randomPos = Math.floor(this.zeroRight + random(10, 10))
        let level = this.playerPos
        
        // Проверка, нужно ли спавнить на втором этаже
        if (this.buildings && this.buildings.length > 0) {
            const activeBuilding = this.buildings[0]
            const lastBuilding = this.buildings[this.buildings.length - 1]
            const lastBuildingBounds = lastBuilding.getLocalBounds ? lastBuilding.getLocalBounds() : lastBuilding
            
            if ((lastBuildingBounds.x + lastBuildingBounds.width > randomPos && 
                 activeBuilding.getLocalBounds().x < randomPos) && 
                activeBuilding.secondFloor) {
                level = this.secondFloor
            }
        }
        
        // Создание собаки
        const dog = new PIXI.AnimatedSprite(this.dogEnemy.animations.idle)
        dog.anchor.set(0.5)
        dog.scale.set(2)
        dog.animationSpeed = 0.2
        dog.position.set(this.zeroRight + 100, level)
        dog.params = {}
        dog.parentGroup = this.fg
        dog.zOrder = 6
        
        // Копирование параметров
        if (this.enemyParams.dog) {
            Object.keys(this.enemyParams.dog).forEach(item => {
                dog.params[item] = this.enemyParams.dog[item]
            })
        }
        
        // Случайная скорость
        dog.params.speed = random(0.5, 1, true, true)
        dog.params.animset = this.dogEnemy.animations
        dog.skip = false
        
        this.currentDogEnemy = dog
        
        if (this.world) {
            this.world.addChild(dog)
        }
        dog.play()
        
        return dog
    }
    
    /**
     * Обновляет собаку-врага
     */
    updateDogEnemy() {
        if (!this.currentDogEnemy) return
        
        // Проверка смерти
        if (!this.currentDogEnemy.params.dead) {
            // Коллизия с игроком (урон)
            if (!this.currentDogEnemy.skip && this.player) {
                if (this.checkPlayerCollision()) {
                    if (this.damagePlayerCallback) {
                        this.damagePlayerCallback()
                    }
                    this.currentDogEnemy.skip = true
                }
            }
            
            // Движение к игроку
            this.currentDogEnemy.x -= this.currentDogEnemy.params.speed * this.gameSpeed
            
            // Коллизия с пулями игрока
            if (this.playerBullets && this.gun) {
                this.checkBulletCollisions()
            }
        }
        
        // Удаление за левой границей
        if (this.currentDogEnemy.x + 100 < this.zeroLeft) {
            this.removeDogEnemy()
        }
    }
    
    /**
     * Проверяет коллизию с игроком
     */
    checkPlayerCollision() {
        if (!this.player || !this.currentDogEnemy) return false
        
        return this.player.x + 40 > this.currentDogEnemy.x &&
            this.player.x < this.currentDogEnemy.x + this.currentDogEnemy.width &&
            this.player.y + this.player.height > this.currentDogEnemy.y &&
            this.player.y < this.currentDogEnemy.y + this.currentDogEnemy.height
    }
    
    /**
     * Проверяет коллизии с пулями игрока
     */
    checkBulletCollisions() {
        if (!this.playerBullets || !this.currentDogEnemy) return
        
        this.playerBullets.forEach((bullet, idx) => {
            if (this.currentDogEnemy.x + this.currentDogEnemy.width > bullet.x &&
                this.currentDogEnemy.x < bullet.x &&
                this.currentDogEnemy.y - this.currentDogEnemy.height < bullet.y &&
                this.currentDogEnemy.y + this.currentDogEnemy.height / 2 > bullet.y) {
                
                // Удаление пули
                if (this.world) {
                    this.world.removeChild(bullet)
                }
                this.playerBullets.splice(idx, 1)
                
                // Урон собаке
                if (this.damageEnemyCallback && this.gun) {
                    this.damageEnemyCallback(this.currentDogEnemy, this.gun.damage)
                }
            }
        })
    }
    
    /**
     * Удаляет собаку-врага
     */
    removeDogEnemy() {
        if (!this.currentDogEnemy) return
        
        if (this.world) {
            this.world.removeChild(this.currentDogEnemy)
        }
        
        this.currentDogEnemy = null
    }
    
    /**
     * Получает текущую собаку-врага
     */
    getCurrentDogEnemy() {
        return this.currentDogEnemy
    }
    
    /**
     * Проверяет, существует ли собака-враг
     */
    hasDogEnemy() {
        return this.currentDogEnemy !== null
    }
    
    /**
     * Очищает собаку-врага
     */
    clear() {
        this.removeDogEnemy()
    }
}
