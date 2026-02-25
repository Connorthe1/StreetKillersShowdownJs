import * as PIXI from 'pixi.js'
import * as Matter from 'matter-js'

/**
 * Менеджер гранат
 */
export class HandGrenade {
    constructor(world, physicsManager, worldCoords, resources, timer, eventBus) {
        this.world = world
        this.physicsManager = physicsManager
        this.worldCoords = worldCoords
        this.resources = resources
        this.timer = timer
        this.eventBus = eventBus
        
        // Активная граната (для игрока)
        this.activeGrenade = null

        this.eventBus.on('grenade:throw', data => {
            this.throw(data)
        })
    }
    
    /**
     * Бросает гранату игроком (отскок)
     */
    throw(pos) {
        const grenade = new PIXI.Sprite(this.resources.activeItems.textures.handGrenade)
        grenade.scale.set(1.2)
        grenade.anchor.set(0.5)
        grenade.position.set(pos.x + 10, pos.y - 20)
        
        // Создание физического тела
        grenade.body = Matter.Bodies.rectangle(
            grenade.x,
            grenade.y,
            2,
            10,
            {
                isStatic: false,
                restitution: 0.5
            }
        )
        
        grenade.rotation = Math.floor(Math.random() * (6 + 1))

        this.world.addChild(grenade)
        this.physicsManager.addBody(grenade.body)
        
        // Применение силы
        Matter.Body.applyForce(
            grenade.body,
            grenade.body.position,
            { x: 0.0005, y: -0.0003 }
        )
        
        this.activeGrenade = grenade
        
        // Взрыв
        this.timer.sleep(800).then(() => {
            this.activate()
        })
    }
    
    /**
     * Обновляет активную гранату игрока
     */
    update() {
        if (!this.activeGrenade) return
        
        this.activeGrenade.position = this.activeGrenade.body.position
        if (this.activeGrenade.body.speed > 0.2) {
            this.activeGrenade.rotation += 0.1
        } else {
            this.activeGrenade.rotation = this.activeGrenade.body.angle
        }
    }

    activate() {
        if (!this.activeGrenade) return

        this.eventBus.emit('explode:create', {
            target: this.activeGrenade,
            offsetX: 0,
            offsetY: 0,
            isBig: false,
            size: 50
        })
        
        this.clear()
    }
    
    clear() {
        if (this.activeGrenade) {
            this.physicsManager.removeBody(this.activeGrenade.body)
            this.world.removeChild(this.activeGrenade)
            this.activeGrenade = null
        }
    }
}
