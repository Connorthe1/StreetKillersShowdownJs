/**
 * CarBG.js
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
import { random, randomRGB } from '../../utils/GameUtils.js'

/**
 * Менеджер фоновых машин
 */
export class CarBG {
    constructor(world, resources, worldCoords) {
        this.world = world
        this.resources = resources
        this.worldCoords = worldCoords

        this.currentCar = null
        this.side = 0
        this.speed = 0
    }
    
    /**
     * Создает фоновую машину
     */
    create() {
        if (this.currentCar) return
        this.side = Math.random() < 0.5
        this.speed = random(4, 10)

        const car = new PIXI.Container()
        const carBack = new PIXI.Sprite(this.resources.bgCarTexture.textures.carBack)
        const carFront = new PIXI.Sprite(this.resources.bgCarTexture.textures.carFront)
        
        carBack.anchor.set(0.5)
        carFront.anchor.set(0.5)
        carBack.tint = randomRGB()
        
        // Случайное направление движения
        if (this.side) {
            car.position.set(this.worldCoords.zeroRight, this.worldCoords.firstFloor - 12)
        } else {
            // Движение слева направо (зеркальное отображение)
            carBack.scale.set(-1, 1)
            carFront.scale.set(-1, 1)
            car.position.set(this.worldCoords.zeroLeft - 100, this.worldCoords.firstFloor - 12)
        }

        car.zIndex = -1
        
        car.addChild(carBack)
        car.addChild(carFront)

        this.world.addChild(car)
        this.currentCar = car
    }
    
    /**
     * Обновляет фоновую машину
     */
    update() {
        if (!this.currentCar) return

        if (this.side > 0) {
            // Движение справа налево
            this.currentCar.x -= this.speed
        } else {
            // Движение слева направо
            this.currentCar.x += this.speed
        }

        const carBounds = this.currentCar.getBounds()

        if (this.side > 0) {
            if (carBounds.x + carBounds.width < 0) {
                this.clear()
            }
        } else {
            if (carBounds.x > this.worldCoords.zeroRight) {
                this.clear()
            }
        }
    }

    clear() {
        if (!this.currentCar) return
        this.world.removeChild(this.currentCar)
        this.currentCar = null
        this.side = 0
        this.speed = 0
    }
}
