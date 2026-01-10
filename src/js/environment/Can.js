/**
 * Can.js
 * 
 * Менеджер банок (Can)
 * 
 * Содержит:
 * - Создание банки (createCan)
 * - Обновление банки (updateCan)
 * - Физика банки (Matter.js)
 * - Коллизии с врагами, боссами, ловушками
 * - Взаимодействие с игроком (удар ногой)
 * - Урон от банки врагам
 */

import * as PIXI from 'pixi.js'
import * as Matter from 'matter-js'
import { random } from '../utils/GameUtils.js'

/**
 * Менеджер банок
 */
export class CanManager {
    constructor(world, engine, physicsManager, player, playerState, gameState, zeroLeft, zeroRight, WORLD_HEIGHT, playerPos, fg) {
        this.world = world
        this.engine = engine
        this.physicsManager = physicsManager
        this.player = player
        this.playerState = playerState
        this.gameState = gameState
        this.zeroLeft = zeroLeft
        this.zeroRight = zeroRight
        this.WORLD_HEIGHT = WORLD_HEIGHT
        this.playerPos = playerPos
        this.fg = fg
        
        // Текущая банка
        this.currentCan = null
        
        // Текстуры (устанавливаются позже)
        this.canTexture = null
        
        // Callbacks
        this.damageEnemyCallback = null
        this.addPointsCallback = null
        this.soundPlayer = null
        this.barrelDeadCallback = null
        this.storage = null
        this.enemies = null
        this.currentDogEnemy = null
        this.currentBoss = null
        this.traps = null
    }
    
    /**
     * Устанавливает текстуры
     */
    setTextures(canTexture) {
        this.canTexture = canTexture
    }
    
    /**
     * Устанавливает колбэки
     */
    setCallbacks(callbacks) {
        if (callbacks.damageEnemy) this.damageEnemyCallback = callbacks.damageEnemy
        if (callbacks.addPoints) this.addPointsCallback = callbacks.addPoints
        if (callbacks.soundPlayer) this.soundPlayer = callbacks.soundPlayer
        if (callbacks.barrelDead) this.barrelDeadCallback = callbacks.barrelDead
        if (callbacks.storage) this.storage = callbacks.storage
    }
    
    /**
     * Обновляет состояние
     */
    updateState(state) {
        if (state.player !== undefined) this.player = state.player
        if (state.playerState !== undefined) this.playerState = state.playerState
        if (state.zeroLeft !== undefined) this.zeroLeft = state.zeroLeft
        if (state.zeroRight !== undefined) this.zeroRight = state.zeroRight
        if (state.enemies !== undefined) this.enemies = state.enemies
        if (state.currentDogEnemy !== undefined) this.currentDogEnemy = state.currentDogEnemy
        if (state.currentBoss !== undefined) this.currentBoss = state.currentBoss
        if (state.traps !== undefined) this.traps = state.traps
    }
    
    /**
     * Создает банку
     */
    createCan() {
        if (!this.canTexture || !this.storage) {
            console.warn('Can texture or storage not available')
            return null
        }
        
        if (this.currentCan) {
            // Удаляем предыдущую банку, если она существует
            this.removeCan()
        }
        
        const can = new PIXI.Sprite(this.canTexture.textures.pixelCan)
        can.width = 8
        can.height = 16
        can.anchor.set(0, 0.5)
        can.health = this.storage.upgrades.can + 1
        can.parentGroup = this.fg
        can.zOrder = 6
        can.dealDamage = false
        can.touched = false
        
        // Создание физического тела
        can.body = Matter.Bodies.rectangle(
            this.zeroRight,
            this.playerPos + 20,
            8,
            16,
            {
                isStatic: false,
                restitution: 0.2,
                frictionAir: 0.01,
                chamfer: { radius: [5, 5, 0, 0] }
            }
        )
        
        if (this.world) {
            this.world.addChild(can)
        }
        
        if (this.physicsManager) {
            this.physicsManager.addBody(can.body)
        }
        
        this.currentCan = can
        return can
    }
    
    /**
     * Обновляет банку
     */
    updateCan() {
        if (!this.currentCan) return
        
        // Обновление позиции и поворота из физики
        this.currentCan.position = this.currentCan.body.position
        this.currentCan.rotation = this.currentCan.body.angle
        
        // Удаление банки, если она вышла за границы или потеряла здоровье
        if ((this.currentCan.x > this.zeroRight + 300) ||
            (this.currentCan.y > this.WORLD_HEIGHT) ||
            (this.currentCan.x < this.zeroLeft) ||
            (this.currentCan.health <= 0)) {
            this.removeCan()
            return
        }
        
        // Взаимодействие с игроком (удар ногой)
        if (this.player && this.playerState) {
            if (this.player.x + 40 > this.currentCan.x + 40 &&
                this.player.x < this.currentCan.x + 20 &&
                this.currentCan.y > this.player.y &&
                this.player.y + this.player.height > this.currentCan.y &&
                (this.playerState.state === 'roll' || this.playerState.state === 'rollEnd') &&
                !this.currentCan.touched) {
                this.currentCan.dealDamage = false
                this.currentCan.touched = true
                
                if (this.soundPlayer) {
                    this.soundPlayer.canDrop()
                }
                
                // Применение силы к банке
                Matter.Body.applyForce(
                    this.currentCan.body,
                    { x: this.currentCan.body.position.x, y: this.currentCan.body.position.y + 7.5 },
                    { x: random(0.005, 0.01, true, true), y: -random(0.002, 0.00, true, true) }
                )
            }
        }
        
        // Урон от банки врагам (только если банка движется и еще не нанесла урон)
        if (!this.currentCan.dealDamage && this.currentCan.body.speed > 1) {
            // Коллизия с обычными врагами
            if (this.enemies) {
                this.enemies.forEach(enemy => {
                    if (this.checkCollision(this.currentCan, enemy)) {
                        if (!enemy.params || !enemy.params.dead) {
                            this.handleCanHitEnemy(enemy, false)
                        }
                    }
                })
            }
            
            // Коллизия с собакой-врагом
            if (this.currentDogEnemy) {
                if (this.checkCollision(this.currentCan, this.currentDogEnemy)) {
                    if (!this.currentDogEnemy.params || !this.currentDogEnemy.params.dead) {
                        this.handleCanHitEnemy(this.currentDogEnemy, false)
                    }
                }
            }
            
            // Коллизия с боссом
            if (this.currentBoss) {
                if (this.checkCollision(this.currentCan, this.currentBoss)) {
                    if (!this.currentBoss.params || !this.currentBoss.params.dead) {
                        this.handleCanHitEnemy(this.currentBoss, true)
                    }
                }
            }
            
            // Коллизия с ловушками
            if (this.traps) {
                this.traps.forEach(trap => {
                    if (this.checkCollision(this.currentCan, trap)) {
                        if (!trap.dead) {
                            this.handleCanHitTrap(trap)
                        }
                    }
                })
            }
        }
    }
    
    /**
     * Проверяет коллизию между банкой и объектом
     */
    checkCollision(can, target) {
        const canBounds = can.getBounds ? can.getBounds() : can
        const targetBounds = target.getBounds ? target.getBounds() : target
        
        return canBounds.x > targetBounds.x &&
            targetBounds.x + targetBounds.width > canBounds.x &&
            canBounds.y > targetBounds.y &&
            targetBounds.y + targetBounds.height > canBounds.y
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
    
    /**
     * Удаляет банку
     */
    removeCan() {
        if (!this.currentCan) return
        
        if (this.world) {
            this.world.removeChild(this.currentCan)
        }
        
        if (this.currentCan.body && this.physicsManager) {
            this.physicsManager.removeBody(this.currentCan.body)
        }
        
        this.currentCan = null
    }
    
    /**
     * Получает текущую банку
     */
    getCurrentCan() {
        return this.currentCan
    }
    
    /**
     * Проверяет, существует ли банка
     */
    hasCan() {
        return this.currentCan !== null
    }
    
    /**
     * Очищает банку
     */
    clear() {
        this.removeCan()
    }
}
