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
    constructor(resources, worldCoords, posY) {
        this.resources = resources
        this.worldCoords = worldCoords
        this.posY = posY

        this.body = null
        this.side = Math.random() < 0.5
        this.speed = random(4, 10)

        this.create()
    }
    
    /**
     * Создает фоновую машину
     */
    create() {
        const car = new PIXI.Container()
        const carBack = new PIXI.Sprite(this.resources.bgCarTexture.textures.carBack)
        const carFront = new PIXI.Sprite(this.resources.bgCarTexture.textures.carFront)
        
        carBack.anchor.set(0.5)
        carFront.anchor.set(0.5)
        carBack.tint = randomRGB()
        
        // Случайное направление движения
        if (this.side) {
            car.position.set(this.worldCoords.zeroRight, this.posY - 12)
        } else {
            // Движение слева направо (зеркальное отображение)
            carBack.scale.set(-1, 1)
            carFront.scale.set(-1, 1)
            car.position.set(this.worldCoords.zeroLeft - 100, this.posY - 12)
        }

        car.zIndex = -1
        
        car.addChild(carBack)
        car.addChild(carFront)

        this.body = car
        return this.body
    }
    
    /**
     * Обновляет фоновую машину
     */
    update() {
        if (this.side > 0) {
            // Движение справа налево
            this.body.x -= this.speed
        } else {
            // Движение слева направо
            this.body.x += this.speed
        }
    }
}
