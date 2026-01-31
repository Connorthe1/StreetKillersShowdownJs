/**
 * Money.js
 * 
 * Менеджер денег
 * 
 * Содержит:
 * - Создание денег (spawnDropMoney)
 * - Обновление денег (updateDropMoney)
 * - Физика денег (Matter.js)
 * - Сбор денег игроком
 * - Удаление за границами экрана
 */

import * as PIXI from 'pixi.js'
import * as Matter from 'matter-js'
import { random } from '../utils/GameUtils.js'
import {soundPlayer} from "../playSound";

/**
 * Менеджер денег
 */
export class MoneyManager {
    constructor(world, physicsManager, worldCoords, resources, eventBus) {
        this.world = world
        this.physicsManager = physicsManager
        this.worldCoords = worldCoords
        this.resources = resources
        this.eventBus = eventBus
        
        // Массив денег
        this.moneyDrop = []
    }
    
    /**
     * Создает деньги на позиции
     * @param {Object|PIXI.Sprite} pos - позиция {x, y} или спрайт с позицией
     */
    spawnDropMoney(pos) {
        // Определение позиции
        let x, y
        if (pos.x !== undefined && pos.y !== undefined) {
            x = pos.x
            y = pos.y
        } else if (pos.position) {
            x = pos.position.x
            y = pos.position.y
        } else {
            console.warn('Invalid position for money spawn')
            return null
        }
        
        const money = new PIXI.Sprite(this.resources.menuIcons.textures.money)
        money.scale.set(0.15)
        money.anchor.set(0.5)
        money.position.set(x, y)
        
        // Создание физического тела
        money.body = Matter.Bodies.rectangle(
            money.x,
            money.y,
            2,
            10,
            {
                isStatic: false,
                restitution: 0.5
            }
        )
        
        money.rotation = Math.floor(Math.random() * (6 + 1))

        this.world.addChild(money)
        this.physicsManager.addBody(money.body)
        
        // Применение случайной силы
        let randomMassX = Math.random() * money.body.mass
        const randomMassY = Math.random() * money.body.mass
        randomMassX *= Math.round(Math.random()) ? 1 : -1
        
        Matter.Body.applyForce(
            money.body,
            money.body.position,
            { x: randomMassX / 50, y: -randomMassY / 35 }
        )
        
        this.moneyDrop.push(money)
    }
    
    /**
     * Обновляет все деньги
     */
    updateDropMoney() {
        this.moneyDrop.forEach((b, idx) => {
            // Обновление позиции из физики
            b.position = b.body.position
            
            // Обновление поворота
            if (b.body.speed > 0.2) {
                b.rotation += 0.1
            } else {
                b.rotation = b.body.angle
            }
            
            // Сбор денег игроком
            if (this.player) {
                if (this.player.x + 20 > b.x && this.player.x < b.x + 10) {
                    // Звук сбора
                    soundPlayer.coins()
                    
                    // Удаление денег
                    if (this.world) {
                        this.world.removeChild(b)
                    }
                    
                    if (this.physicsManager && b.body) {
                        this.physicsManager.removeBody(b.body)
                    }
                    
                    this.moneyDrop.splice(idx, 1)
                    
                    // Добавление денег в gameState
                    if (this.gameState) {
                        this.gameState.collectedMoney += random(1, 10)
                    }
                    
                    return
                }
            }
            
            // Удаление за левой границей
            if (b.x < this.worldCoords.zeroLeft) {
                if (this.world) {
                    this.world.removeChild(b)
                }
                
                if (this.physicsManager && b.body) {
                    this.physicsManager.removeBody(b.body)
                }
                
                this.moneyDrop.splice(idx, 1)
            }
        })
    }
    
    /**
     * Получает массив денег
     */
    getMoneyDrop() {
        return this.moneyDrop
    }
    
    /**
     * Очищает все деньги
     */
    clear() {
        this.moneyDrop.forEach(money => {
            if (this.world) {
                this.world.removeChild(money)
            }
            
            if (this.physicsManager && money.body) {
                this.physicsManager.removeBody(money.body)
            }
        })
        this.moneyDrop = []
    }
}
