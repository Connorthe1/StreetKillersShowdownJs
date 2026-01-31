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
import {soundPlayer} from "../playSound";
import {default as enemyParams} from '../enemyParams.js'

/**
 * Менеджер собаки-врага
 */
export class DogEnemyManager {
    constructor(world, worldCoords, fg, resources, eventBus) {
        this.world = world
        this.worldCoords = worldCoords
        this.fg = fg
        this.resources = resources
        this.eventBus = eventBus

        // Текущая собака-враг
        this.currentDogEnemy = null
    }
    
    /**
     * Создает собаку-врага
     */
    createDogEnemy() {
        if (this.currentDogEnemy) return

        soundPlayer.dogBarking()
        
        let randomPos = Math.floor(this.worldCoords.zeroRight + random(10, 10))
        let level = this.worldCoords.firstFloor

        const buildings = this.eventBus.emit('buildings:get', null, true) || []
        
        // Проверка на здания (может быть на втором этаже)
        if (buildings.length > 0) {
            const activeBuilding = buildings[0]
            const lastBuilding = buildings[buildings.length - 1]
            const lastBuildingBounds = lastBuilding.getLocalBounds ? lastBuilding.getLocalBounds() : lastBuilding
            const activeBuildingBounds = activeBuilding.getLocalBounds ? activeBuilding.getLocalBounds() : activeBuilding
            
            if ((lastBuildingBounds.x + lastBuildingBounds.width > randomPos && 
                 activeBuildingBounds.x < randomPos) && 
                activeBuilding.secondFloor) {
                level = this.worldCoords.secondFloor
            }
        }
        
        const dog = new PIXI.AnimatedSprite(this.resources.dogEnemy.animations.idle)
        dog.anchor.set(0.5)
        dog.scale.set(2)
        dog.animationSpeed = 0.2
        dog.position.set(this.worldCoords.zeroRight + 100, level)
        dog.params = {}
        dog.parentGroup = this.fg
        dog.zOrder = 6
        
        // Копирование параметров из enemyParams.dog
        Object.keys(enemyParams.dog).forEach(item => {
            dog.params[item] = enemyParams.dog[item]
        })
        
        dog.params.speed = random(0.5, 1, true, true)
        dog.params.animset = this.resources.dogEnemy.animations
        dog.skip = false
        
        this.currentDogEnemy = dog

        this.world.addChild(dog)
        
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
        if (this.currentDogEnemy.x + 100 < this.worldCoords.zeroLeft) {
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
