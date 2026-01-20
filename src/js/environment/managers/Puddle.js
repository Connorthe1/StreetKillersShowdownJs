/**
 * Puddle.js
 * 
 * Менеджер луж
 * 
 * Содержит:
 * - Создание луж (createPuddle)
 * - Обновление луж (updatePuddles)
 * - Взаимодействие с игроком
 * - Эффекты при прохождении через лужу (частицы, звук, бонусы)
 */

import * as PIXI from 'pixi.js'
import { random } from '../../utils/GameUtils.js'
import {soundPlayer} from "../../playSound";

/**
 * Менеджер луж
 */
export class PuddleManager {
    constructor(gameState, world, worldCoords, resources, eventBus, sleep) {
        this.world = world
        this.gameState = gameState
        this.worldCoords = worldCoords
        this.resources = resources
        this.eventBus = eventBus
        this.sleep = sleep

        // Массив луж
        this.puddles = []

        eventBus.on('puddle:create', data => {
            this.createPuddle(data.buildings)
        })
    }
    
    /**
     * Создает лужу
     */
    createPuddle(buildings) {
        // Проверка на здания (не создавать лужи на втором этаже или в клубе)
        if (buildings && buildings.length > 0) {
            const activeBuilding = buildings[0]
            const lastBuilding = buildings[buildings.length - 1]
            const lastBuildingBounds = lastBuilding.getLocalBounds ? lastBuilding.getLocalBounds() : lastBuilding
            
            if ((lastBuildingBounds.x + lastBuildingBounds.width > this.worldCoords.zeroRight &&
                 activeBuilding.getLocalBounds().x < this.worldCoords.zeroRight) &&
                (activeBuilding.secondFloor || activeBuilding.club)) {
                return null
            }
        }
        
        // Случайный тип лужи (1 или 2)
        const rand = random(1, 2)
        const puddle = new PIXI.Sprite(this.resources.puddleTexture.textures[`puddle${rand}`])
        puddle.anchor.set(0.5)
        puddle.position.set(this.worldCoords.zeroRight + puddle.width, this.worldCoords.firstFloor + 24)
        puddle.dead = false
        
        if (this.world) {
            this.world.addChild(puddle)
        }
        
        this.puddles.push(puddle)
        return puddle
    }

    /**
     * Обновляет лужи
     */
    updatePuddles() {
        this.puddles.forEach((puddle, idx) => {
            // Удаление за левой границей
            if (puddle.x + puddle.width < this.worldCoords.zeroLeft) {
                if (this.world) {
                    this.world.removeChild(puddle)
                }
                this.puddles.splice(idx, 1)
                return
            }
            
            // Пропуск уже обработанных луж
            if (puddle.dead) return
            
            // Коллизия с игроком
            // if (this.player && this.playerState) {
            //     if (this.player.x + 40 > puddle.x + 20 &&
            //         puddle.x + puddle.width > this.player.x) {
            //         this.handlePuddleCollision(puddle)
            //     }
            // }
        })
    }
    
    /**
     * Обрабатывает коллизию с лужей
     */
    handlePuddleCollision(puddle) {
        puddle.dead = true
        
        // Проверка состояния игрока (кувырок или обычное движение)
        if (this.playerState.state === 'roll' || this.playerState.state === 'rollEnd') {
            // Бонус при кувырке через лужу
            if (this.addPointsCallback) {
                this.addPointsCallback(20)
            }
            
            if (this.gameState) {
                this.gameState.scoreStreak += 1
            }
            
            // Увеличение скорости
            if (this.playerSpeed !== null && this.playerSpeed !== undefined &&
                this.playerDefaultSpeed !== null && this.playerDefaultSpeed !== undefined) {
                const defaultSpeed = (typeof this.playerDefaultSpeed === 'object' && this.playerDefaultSpeed.value !== undefined) 
                    ? this.playerDefaultSpeed.value 
                    : (typeof this.playerDefaultSpeed === 'number' ? this.playerDefaultSpeed : 1)
                const newSpeed = defaultSpeed * 1.5
                
                if (typeof this.playerSpeed === 'function') {
                    this.playerSpeed(newSpeed)
                } else if (typeof this.playerSpeed === 'object' && this.playerSpeed.value !== undefined) {
                    this.playerSpeed.value = newSpeed
                }
            }
            
            // Звук и частицы
            soundPlayer.waterStep()

            for (let i = 0; i <= 20; i++) {
                this.eventBus.emit('particle:default', { coords: { x: puddle.x, y: puddle.y - 10 }, type: 'drop' })
            }
        } else {
            // Обычное прохождение через лужу
            soundPlayer.waterStep()

            for (let i = 0; i <= 14; i++) {
                this.eventBus.emit('particle:default', { coords: { x: puddle.x - 20, y: puddle.y - 10 }, type: 'drop' })
            }
            
            // Вторая волна частиц с задержкой
            if (this.sleep) {
                this.sleep(250).then(() => {
                    soundPlayer.waterStep()
                    for (let i = 0; i <= 14; i++) {
                        this.eventBus.emit('particle:default', { coords: { x: puddle.x - 20, y: puddle.y - 10 }, type: 'drop' })
                    }
                })
            }
        }
    }
    
    /**
     * Очищает все лужи
     */
    clear() {
        this.puddles.forEach(puddle => {
            if (this.world) {
                this.world.removeChild(puddle)
            }
        })
        this.puddles = []
    }
}
