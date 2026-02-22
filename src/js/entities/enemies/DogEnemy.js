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
import {random} from '../../utils/GameUtils.js'
import {soundPlayer} from "../../playSound";
import {default as enemyParams} from '../../enemyParams.js'

/**
 * Менеджер собаки-врага
 */
export class DogEnemyManager {
    constructor(world, gameState, worldCoords, fg, resources, eventBus) {
        this.world = world
        this.gameState = gameState
        this.worldCoords = worldCoords
        this.fg = fg
        this.resources = resources
        this.eventBus = eventBus

        this.isAlive = true
        this.params = null
        this.animset = null
        this.skip = false

        this.collisionOffset = {left: -10, right: 10}
    }
    
    /**
     * Создает собаку-врага
     */
    create() {
        if (this.sprite) return

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
        dog.parentGroup = this.fg
        dog.zOrder = 6
        
        // Копирование параметров из enemyParams.dog
        this.params = {}
        Object.keys(enemyParams.dog).forEach(item => {
            this.params[item] = enemyParams.dog[item]
        })

        this.params.speed = random(0.5, 1, true, true)
        this.animset = this.resources.dogEnemy.animations
        this.skip = false
        
        this.sprite = dog

        this.addToWorld()

        dog.play()
    }

    damage() {
        if (!this.isAlive) return

        this.isAlive = false

        // Звуки
        soundPlayer.damageFlesh()

        for (let i = 0; i < random(8, 20); i++) {
            this.eventBus.emit('particle:default', {coords: this.sprite, type: 'blood', floor: this.sprite.y === this.worldCoords.secondFloor})
        }

        this.death()
    }

    death() {
        // Тряска камеры
        this.eventBus.emit('camera:shake', {intensity: 1, duration: 400})

        this.gameState.increaseStreak(this.params.points / 10)
        this.gameState.addPoints(this.params.points)

        this.sprite.loop = false
        this.sprite.textures = this.animset.death
        this.sprite.play()
    }
    
    /**
     * Обновляет собаку-врага
     */
    update(gameSpeed) {
        if (!this.sprite) return
        
        if (this.isAlive) {
            this.sprite.x -= this.params.speed * gameSpeed
        }
        
        // Удаление за левой границей
        if (this.isOutOfBounds()) {
            this.destroy()
        }
    }

    setSkip() {
        this.skip = true
    }

    isOutOfBounds() {
        const dog = this.sprite.getBounds()

        return dog.x + dog.width < 0
    }

    addToWorld() {
        this.world.addChild(this.sprite)
    }

    destroy() {
        this.world.removeChild(this.sprite)
        this.sprite = null
        this.isAlive = true
        this.params = null
        this.animset = null
        this.skip = false
    }
}
