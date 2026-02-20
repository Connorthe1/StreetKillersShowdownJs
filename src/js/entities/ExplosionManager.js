import * as PIXI from 'pixi.js'
import {soundPlayer} from "../playSound";

/**
 * Менеджер взрывов.
 * Хранит активные взрывы с зоной урона (квадрат) для коллизий в InteractionSystem.
 */
export class ExplosionManager {
    constructor(world, resources, eventBus) {
        this.world = world
        this.resources = resources
        this.eventBus = eventBus

        this.activeExplosion = null

        eventBus.on('explode:create', data => {
            this.createExplode(data.target, data.offsetX, data.offsetY, data.isBig, data.silence)
        })
    }

    createExplode(target, offsetX = 0, offsetY = 0, isBig = false, silence = false) {
        this.eventBus.emit('camera:shake', {intensity: 2, duration: 500})
        
        // Звук взрыва
        if (!silence && soundPlayer) {
            soundPlayer.explosion()
        }
        // Определение анимации взрыва
        let explodeAnimation = isBig ? this.resources.bigExplode.animations.explode : this.resources.bochka.animations.smallExplode
        
        // Создание спрайта взрыва
        const explode = new PIXI.AnimatedSprite(explodeAnimation)
        explode.zIndex = target.zIndex !== undefined ? target.zIndex : 0
        explode.loop = false
        explode.anchor.set(0.5)
        explode.height = explode.height * 3
        explode.width = explode.width * 3
        explode.animationSpeed = isBig ? 0.15 : 0.25
        
        // Определение позиции
        let x, y
        if (target.x !== undefined && target.y !== undefined) {
            x = target.x + offsetX
            y = target.y + offsetY
        } else if (target.position) {
            x = target.position.x + offsetX
            y = target.position.y + offsetY
        } else {
            console.warn('Invalid target for explosion')
            return null
        }
        
        explode.position.set(x, y)
        
        // Зона урона — квадрат с настраиваемым размером (половина стороны)
        const size = isBig ? 60 : 30

        this.world.addChild(explode)

        const bounds = explode.getBounds()

        this.activeExplosion = {
            x: bounds.x,
            y: bounds.y,
            width: size,
            height: size,
            right: bounds.right - (bounds.width / 2) + (size / 2),
            left: bounds.left - (bounds.width / 2) - (size / 2),
            top: bounds.top - (bounds.height / 2) - (size / 2),
            bottom: bounds.bottom - (bounds.height / 2) + (size / 2)
        }
        
        // Добавление в мир
        explode.play()
        
        // Удаление после завершения анимации
        explode.onComplete = () => {
            this.world.removeChild(explode)
            this.activeExplosion = null
        }
    }

    destroy() {
        this.activeExplosion = null
    }
}

