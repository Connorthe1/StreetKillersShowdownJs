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

        this.health = this.storage.upgrades.can + 1
        this.dealDamage = false
        this.collisionOffset = {left: -40, right: 20}
    }
    
    /**
     * Создает банку
     */
    create() {
        if (this.sprite) return

        const can = new PIXI.Sprite(this.resources.canTexture.textures.pixelCan)
        can.width = 8
        can.height = 16
        can.position.set(this.worldCoords.zeroRight, this.worldCoords.firstFloor + 20)
        can.anchor.set(0, 0.5)
        can.parentGroup = this.fg
        can.zOrder = 6

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
        
        // Удаление банки, если она вышла за границы или потеряла здоровье
        if ((this.sprite.x > this.worldCoords.zeroRight + 300) ||
            (this.sprite.y > this.worldCoords.worldHeight) ||
            (this.sprite.x < this.worldCoords.zeroLeft) ||
            (this.health <= 0)) {
            this.destroy()
        }
    }

    handlePlayer(player) {
        if (player.isRollState() && !this.sprite.touched) {
            this.dealDamage = false
            soundPlayer.canDrop()
            Matter.Body.applyForce(this.body, {x: this.body.position.x, y: this.body.position.y + 7.5}, {x: random(0.005, 0.01, true, true) , y: -random(0.002, 0.00, true, true)});
        }
    }
    
    /**
     * Обрабатывает попадание банки во врага
     */
    handleCanHitEnemy(enemy, isBoss) {
        this.currentCan.dealDamage = true
        this.currentCan.health -= 1
        
        if (this.gameState) {
            this.gameState.scoreStreak += 2.5
        }
        
        if (this.addPointsCallback) {
            this.addPointsCallback(50)
        }
        
        if (this.damageEnemyCallback) {
            const damage = Math.floor(this.currentCan.body.speed)
            this.damageEnemyCallback(enemy, damage, isBoss)
        }
        
        // Замедление банки после удара
        this.currentCan.body.speed = 0.5
        
        // Отскок банки
        Matter.Body.applyForce(
            this.currentCan.body,
            { x: this.currentCan.body.position.x, y: this.currentCan.body.position.y + 7.5 },
            { x: -random(0.005, 0.01, true, true), y: -random(0.002, 0.006, true, true) }
        )
    }
    
    /**
     * Обрабатывает попадание банки в ловушку
     */
    handleCanHitTrap(trap) {
        this.currentCan.dealDamage = true
        this.currentCan.health -= 1
        
        if (this.gameState) {
            this.gameState.scoreStreak += 2.5
        }
        
        if (this.addPointsCallback) {
            this.addPointsCallback(50)
        }
        
        // Замедление банки после удара
        this.currentCan.body.speed = 0.5
        
        // Отскок банки
        Matter.Body.applyForce(
            this.currentCan.body,
            { x: this.currentCan.body.position.x, y: this.currentCan.body.position.y + 7.5 },
            { x: -random(0.005, 0.01, true, true), y: -random(0.002, 0.006, true, true) }
        )
        
        // Обработка ловушки
        if (trap.type) {
            if (trap.type === 'window' && this.soundPlayer) {
                this.soundPlayer.glassBreak()
            }
            if (trap.play) {
                trap.play()
            }
            trap.dead = true
        } else {
            if (this.barrelDeadCallback) {
                this.barrelDeadCallback(trap)
            }
        }
    }


    addToWorld() {
        this.world.addChild(this.sprite)

        const engine = this.physicsManager.getEngine()
        Matter.World.add(engine.world, this.body);
    }
    
    /**
     * Удаляет банку
     */
    destroy() {
        if (!this.sprite) return

        this.world.removeChild(this.sprite)
        this.physicsManager.removeBody(this.body)
        
        this.sprite = null
        this.body = null
    }
}
