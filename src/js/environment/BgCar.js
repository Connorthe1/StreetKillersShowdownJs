/**
 * BgCar.js
 * 
 * Менеджер фоновых машин
 * 
 * Содержит:
 * - Создание фоновых машин (createBgCar)
 * - Обновление фоновых машин (updateBgCar)
 * - Анимация движения машин
 * - Удаление за границами экрана
 */

import * as PIXI from 'pixi.js'
import { random, randomRGB } from '../utils/GameUtils.js'

/**
 * Менеджер фоновых машин
 */
export class BgCarManager {
    constructor(world, ground, worldCoords, resources) {
        this.world = world
        this.worldCoords = worldCoords
        this.ground = ground
        this.resources = resources
        
        // Текущая фоновая машина
        this.bgCar = null
    }
    
    /**
     * Создает фоновую машину
     */
    createBgCar() {
        if (this.bgCar) {
            // Удаляем предыдущую машину, если она существует
            this.removeBgCar()
        }
        
        const car = new PIXI.Container()
        const carBack = new PIXI.Sprite(this.resources.bgCarTexture.textures.carBack)
        const carFront = new PIXI.Sprite(this.resources.bgCarTexture.textures.carFront)
        
        carBack.anchor.set(0.5)
        carFront.anchor.set(0.5)
        carBack.tint = randomRGB()
        
        // Случайное направление движения
        if (Math.random() < 0.5) {
            // Движение справа налево
            car.side = 1
            const groundY = this.ground.getLocalBounds ? this.ground.getLocalBounds().y : 0
            car.position.set(this.worldCoords.zeroRight, groundY + 56)
        } else {
            // Движение слева направо (зеркальное отображение)
            carBack.scale.set(-1, 1)
            carFront.scale.set(-1, 1)
            car.side = -1
            const groundY = this.ground.getLocalBounds ? this.ground.getLocalBounds().y : 0
            car.position.set(this.worldCoords.zeroLeft - 100, groundY + 56)
        }
        
        // Случайная скорость
        car.speed = random(4, 10)
        car.zIndex = -1
        
        car.addChild(carBack)
        car.addChild(carFront)
        
        if (this.world) {
            this.world.addChild(car)
        }
        
        this.bgCar = car
        return car
    }
    
    /**
     * Обновляет фоновую машину
     */
    updateBgCar() {
        if (!this.bgCar) return
        
        const b = this.bgCar.getBounds ? this.bgCar.getBounds() : this.bgCar
        
        if (this.bgCar.side > 0) {
            // Движение справа налево
            this.bgCar.x -= this.bgCar.speed
            if (b.x + b.width < 0) {
                this.removeBgCar()
            }
        } else {
            // Движение слева направо
            this.bgCar.x += this.bgCar.speed
            if (b.x > this.worldCoords.zeroRight) {
                this.removeBgCar()
            }
        }
    }
    
    /**
     * Удаляет фоновую машину
     */
    removeBgCar() {
        if (!this.bgCar) return
        
        if (this.world) {
            this.world.removeChild(this.bgCar)
        }
        
        this.bgCar = null
    }
    
    /**
     * Получает текущую фоновую машину
     */
    getBgCar() {
        return this.bgCar
    }
    
    /**
     * Очищает фоновую машину
     */
    clear() {
        this.removeBgCar()
    }
}
