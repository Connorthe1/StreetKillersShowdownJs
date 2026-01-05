/**
 * DogEnemy.js
 * 
 * Менеджер собаки-врага
 * 
 * Содержит:
 * - Создание собаки-врага (createDogEnemy)
 * - Обновление собаки-врага (updateDogEnemy)
 * - Движение к игроку
 * - Коллизии с игроком и пулями
 * - Удаление за границами экрана
 */

import * as PIXI from 'pixi.js'
import { random } from '../utils/GameUtils.js'

/**
 * Менеджер собаки-врага
 */
export class DogEnemyManager {
    constructor(world, player, playerState, playerBullets, buildings, zeroRight, playerPos, secondFloor, fg, gameSpeed) {
        this.world = world
        this.player = player
        this.playerState = playerState
        this.playerBullets = playerBullets
        this.buildings = buildings
        this.zeroRight = zeroRight
        this.playerPos = playerPos
        this.secondFloor = secondFloor
        this.fg = fg
        this.gameSpeed = gameSpeed
        
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
        if (state.playerBullets !== undefined) this.playerBullets = state.playerBullets
        if (state.buildings !== undefined) this.buildings = state.buildings
        if (state.zeroRight !== undefined) this.zeroRight = state.zeroRight
        if (state.zeroLeft !== undefined) this.zeroLeft = state.zeroLeft
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
        
        if (this.soundPlayer) {
            this.soundPlayer.dogBarking()
        }
        
        let randomPos = Math.floor(this.zeroRight + random(10, 10))
        let level = this.playerPos
        
        // Проверка на здания (может быть на втором этаже)
        if (this.buildings && this.buildings.length > 0) {
            const activeBuilding = this.buildings[0]
            const lastBuilding = this.buildings[this.buildings.length - 1]
            const lastBuildingBounds = lastBuilding.getLocalBounds ? lastBuilding.getLocalBounds() : lastBuilding
            const activeBuildingBounds = activeBuilding.getLocalBounds ? activeBuilding.getLocalBounds() : activeBuilding
            
            if ((lastBuildingBounds.x + lastBuildingBounds.width > randomPos && 
                 activeBuildingBounds.x < randomPos) && 
                activeBuilding.secondFloor) {
                level = this.secondFloor
            }
        }
        
        const dog = new PIXI.AnimatedSprite(this.dogEnemy.animations.idle)
        dog.anchor.set(0.5)
        dog.scale.set(2)
        dog.animationSpeed = 0.2
        dog.position.set(this.zeroRight + 100, level)
        dog.params = {}
        dog.parentGroup = this.fg
        dog.zOrder = 6
        
        // Копирование параметров из enemyParams.dog
        if (this.enemyParams && this.enemyParams.dog) {
            Object.keys(this.enemyParams.dog).forEach(item => {
                dog.params[item] = this.enemyParams.dog[item]
            })
        }
        
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
        
        if (!this.currentDogEnemy.params.dead) {
            // Коллизия с игроком
            if (!this.currentDogEnemy.skip && this.player) {
                const playerBounds = this.player.getBounds ? this.player.getBounds() : this.player
                const dogBounds = this.currentDogEnemy.getBounds ? this.currentDogEnemy.getBounds() : this.currentDogEnemy
                
                if (playerBounds.x + 40 > dogBounds.x && 
                    playerBounds.x < dogBounds.x + dogBounds.width && 
                    playerBounds.y + playerBounds.height > dogBounds.y && 
                    playerBounds.y < dogBounds.y + dogBounds.height) {
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
                this.playerBullets.forEach((bullet, idx) => {
                    const bulletBounds = bullet.getBounds ? bullet.getBounds() : bullet
                    const dogBounds = this.currentDogEnemy.getBounds ? this.currentDogEnemy.getBounds() : this.currentDogEnemy
                    
                    if (dogBounds.x + dogBounds.width > bulletBounds.x && 
                        dogBounds.x < bulletBounds.x && 
                        dogBounds.y - dogBounds.height < bulletBounds.y && 
                        dogBounds.y + dogBounds.height / 2 > bulletBounds.y) {
                        
                        if (this.world) {
                            this.world.removeChild(bullet)
                        }
                        this.playerBullets.splice(idx, 1)
                        
                        if (this.damageEnemyCallback) {
                            this.damageEnemyCallback(this.currentDogEnemy, this.gun.damage)
                        }
                    }
                })
            }
        }
        
        // Удаление за левой границей
        if (this.currentDogEnemy.x + 100 < this.zeroLeft) {
            if (this.world) {
                this.world.removeChild(this.currentDogEnemy)
            }
            this.currentDogEnemy = null
        }
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
        if (this.currentDogEnemy) {
            if (this.world) {
                this.world.removeChild(this.currentDogEnemy)
            }
            this.currentDogEnemy = null
        }
    }
}
