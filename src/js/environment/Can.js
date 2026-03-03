import * as PIXI from 'pixi.js'
import * as Matter from 'matter-js'
import { random } from '../utils/GameUtils.js'
import {soundPlayer} from "../playSound";

/**
 * Менеджер банок
 */
export class CanManager {
    constructor(world, physicsManager, fg, worldCoords, resources, storage, eventBus) {
        this.world = world
        this.physicsManager = physicsManager
        this.worldCoords = worldCoords
        this.fg = fg
        this.resources = resources
        this.storage = storage
        this.eventBus = eventBus

        // Текущая банка
        this.sprite = null
        // Физическое тело
        this.body = null

        this.health = 0
        this.touched = false
        this.collisionOffset = {left: 10, right: 10}
    }
    
    /**
     * Создает банку
     */
    create() {
        if (this.sprite) return

        const can = new PIXI.Sprite(this.resources.canTexture.textures.pixelCan)
        can.width = 8
        can.height = 16
        can.position.set(this.worldCoords.zeroRight, this.worldCoords.secondFloor + 20)
        can.anchor.set(0, 0.5)
        can.parentGroup = this.fg
        can.zOrder = 6

        this.health = this.storage.upgrades.can + 1
        this.body = Matter.Bodies.rectangle(this.worldCoords.zeroRight, this.worldCoords.firstFloor + 20, 8, 16, {isStatic: false, restitution: 0.2, frictionAir: 0.01, chamfer: { radius: [5,5,0,0] }});
        this.sprite = can

        this.addToWorld()
    }
    
    /**
     * Обновляет банку
     */
    update() {
        if (!this.sprite) return
        
        // Обновление позиции и поворота из физики
        this.sprite.position = this.body.position
        this.sprite.rotation = this.body.angle

        if (this.body.speed < 0.1) this.touched = false
        
        // Удаление банки, если она вышла за границы или потеряла здоровье
        if (this.isOutOfBounds() || this.health <= 0) {
            this.clear()
        }
    }

    activate(player) {
        if (player.isRollState() && !this.touched) {
            this.touched = true
            soundPlayer.canDrop()
            this.physicsManager.applyForce(this.body, {x: this.body.position.x, y: this.body.position.y + 7.5}, {x: random(0.005, 0.01, true, true) , y: -random(0.002, 0.00, true, true)});
        }
    }
    
    /**
     * Обрабатывает попадание банки
     */
    hit() {
        this.touched = false
        this.health -= 1

        this.eventBus.emit('game:addScore', 2.5)
        this.eventBus.emit('game:addPoints', 50)
        
        // Замедление банки после удара
        this.body.speed = 0.5
        
        // Отскок банки
        this.physicsManager.applyForce(
            this.body,
            { x: this.body.position.x, y: this.body.position.y + 7.5 },
            { x: -random(0.005, 0.01, true, true), y: -random(0.002, 0.006, true, true) }
        )
    }


    addToWorld() {
        this.world.addChild(this.sprite)
        this.physicsManager.addBody(this.body)
    }

    isOutOfBounds() {
        const can = this.sprite.getBounds()

        return (can.x + can.width < 0) || (can.x > this.worldCoords.worldWidth + 300)
    }
    
    clear() {
        if (!this.sprite) return

        this.world.removeChild(this.sprite)
        this.physicsManager.removeBody(this.body)

        this.health = 0
        this.touched = false
        this.sprite = null
        this.body = null
    }
}
