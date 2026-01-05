/**
 * Grenade.js
 * 
 * Менеджер гранат
 * 
 * Содержит:
 * - Создание гранат (shotGrenade, grenadeBounce)
 * - Обновление гранат (updateGrenades, updateGrenade)
 * - Активация гранат (activateGrenade)
 * - Взрыв гранат (grenadeExplode)
 * - Физика гранат (Matter.js)
 * - Урон от взрыва врагам, ловушкам, боссам
 */

import * as PIXI from 'pixi.js'
import * as Matter from 'matter-js'
import { random } from '../utils/GameUtils.js'

/**
 * Менеджер гранат
 */
export class GrenadeManager {
    constructor(world, engine, physicsManager, player, playerState, enemies, traps, currentDogEnemy, currentBoss, zeroLeft, activeItems, bounceParticlesTexture, particles) {
        this.world = world
        this.engine = engine
        this.physicsManager = physicsManager
        this.player = player
        this.playerState = playerState
        this.enemies = enemies
        this.traps = traps
        this.currentDogEnemy = currentDogEnemy
        this.currentBoss = currentBoss
        this.zeroLeft = zeroLeft
        this.activeItems = activeItems
        this.bounceParticlesTexture = bounceParticlesTexture
        this.particles = particles
        
        // Массив гранат
        this.grenades = []
        
        // Активная граната (для игрока)
        this.activeGrenade = null
        
        // Callbacks
        this.damagePlayerCallback = null
        this.createExplodeCallback = null
        this.damageEnemyCallback = null
        this.barrelDeadCallback = null
        this.soundPlayer = null
        this.sleepCallback = null
    }
    
    /**
     * Устанавливает колбэки
     */
    setCallbacks(callbacks) {
        if (callbacks.damagePlayer) this.damagePlayerCallback = callbacks.damagePlayer
        if (callbacks.createExplode) this.createExplodeCallback = callbacks.createExplode
        if (callbacks.damageEnemy) this.damageEnemyCallback = callbacks.damageEnemy
        if (callbacks.barrelDead) this.barrelDeadCallback = callbacks.barrelDead
        if (callbacks.soundPlayer) this.soundPlayer = callbacks.soundPlayer
        if (callbacks.sleep) this.sleepCallback = callbacks.sleep
    }
    
    /**
     * Обновляет состояние
     */
    updateState(state) {
        if (state.player !== undefined) this.player = state.player
        if (state.playerState !== undefined) this.playerState = state.playerState
        if (state.zeroLeft !== undefined) this.zeroLeft = state.zeroLeft
        if (state.currentDogEnemy !== undefined) this.currentDogEnemy = state.currentDogEnemy
        if (state.currentBoss !== undefined) this.currentBoss = state.currentBoss
    }
    
    /**
     * Бросает гранату (врагом/боссом)
     * @param {PIXI.Sprite} char - персонаж, бросающий гранату
     * @param {number} offsetX - смещение по X
     * @param {number} offsetY - смещение по Y
     */
    shotGrenade(char, offsetX, offsetY) {
        if (!this.bounceParticlesTexture) {
            console.warn('Grenade texture not available')
            return null
        }
        
        const grenade = new PIXI.Sprite(this.bounceParticlesTexture.textures.grenade)
        grenade.scale.set(-1.5)
        grenade.position.set(char.x + offsetX, char.y - offsetY)
        grenade.lifeTime = 100
        grenade.type = 'grenade'
        grenade.dead = false
        
        // Создание физического тела
        grenade.body = Matter.Bodies.rectangle(
            grenade.x,
            grenade.y,
            12,
            4,
            {
                isStatic: false,
                restitution: 0.5
            }
        )
        
        if (this.world) {
            this.world.addChild(grenade)
        }
        
        if (this.physicsManager) {
            this.physicsManager.addBody(grenade.body)
        }
        
        // Применение силы
        const randomMassX = Math.random() * (0.2 - 0.1) + 0.1
        Matter.Body.applyForce(
            grenade.body,
            grenade.body.position,
            { x: -randomMassX / 100, y: -0.0005 }
        )
        
        this.grenades.push(grenade)
        return grenade
    }
    
    /**
     * Бросает гранату игроком (отскок)
     */
    grenadeBounce() {
        if (!this.activeItems || !this.player) {
            console.warn('Active items or player not available')
            return null
        }
        
        const grenade = new PIXI.Sprite(this.activeItems.textures.handGrenade)
        grenade.scale.set(1.2)
        grenade.anchor.set(0.5)
        grenade.position.set(this.player.x + 10, this.player.y - 20)
        
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
        
        if (this.world) {
            this.world.addChild(grenade)
        }
        
        if (this.physicsManager) {
            this.physicsManager.addBody(grenade.body)
        }
        
        // Применение силы
        Matter.Body.applyForce(
            grenade.body,
            grenade.body.position,
            { x: 0.0005, y: -0.0003 }
        )
        
        this.activeGrenade = grenade
        
        // Взрыв через 650мс
        if (this.sleepCallback) {
            this.sleepCallback(650).then(() => {
                this.grenadeExplode()
            })
        }
        
        return grenade
    }
    
    /**
     * Обновляет все гранаты
     */
    updateGrenades() {
        this.grenades.forEach((b, idx) => {
            if (b.dead) return
            
            // Активация при попадании в игрока во время выстрела
            if (this.player && this.playerState) {
                if ((this.player.x + 40 > b.x && b.x + b.width > this.player.x) &&
                    this.playerState.state === 'shot' &&
                    b.body.speed > 2) {
                    this.activateGrenade(b, idx, true)
                    return
                }
            }
            
            // Уменьшение времени жизни
            b.lifeTime--
            if (b.lifeTime <= 0) {
                b.dead = true
                this.activateGrenade(b, idx)
                return
            }
            
            // Обновление позиции и поворота
            b.position = b.body.position
            b.rotation = b.body.angle
        })
    }
    
    /**
     * Обновляет активную гранату игрока
     */
    updateGrenade() {
        if (!this.activeGrenade) return
        
        this.activeGrenade.position = this.activeGrenade.body.position
        if (this.activeGrenade.body.speed > 0.2) {
            this.activeGrenade.rotation += 0.1
        } else {
            this.activeGrenade.rotation = this.activeGrenade.body.angle
        }
    }
    
    /**
     * Активирует гранату (взрыв)
     * @param {PIXI.Sprite} grenade - граната
     * @param {number} idx - индекс в массиве
     * @param {boolean} now - взорвать немедленно
     */
    async activateGrenade(grenade, idx, now = false) {
        if (now) {
            // Немедленный взрыв
            if (this.damagePlayerCallback) {
                this.damagePlayerCallback()
            }
            if (this.createExplodeCallback) {
                this.createExplodeCallback(grenade, 0, 0, false)
            }
            if (this.physicsManager && grenade.body) {
                this.physicsManager.removeBody(grenade.body)
            }
            if (this.world) {
                this.world.removeChild(grenade)
            }
            this.grenades.splice(idx, 1)
            return
        }
        
        // Создание предупреждения
        if (!this.particles) {
            console.warn('Particles texture not available')
            return
        }
        
        const warning = new PIXI.Sprite(this.particles.textures.detection)
        warning.zIndex = 20
        warning.anchor.set(0.5)
        warning.tint = 16776960
        warning.scale.x = 1.5
        warning.scale.y = 2
        warning.position.set(grenade.x, grenade.y - 40)
        
        if (this.world) {
            this.world.addChild(warning)
        }
        
        // Ожидание перед взрывом
        if (this.sleepCallback) {
            await this.sleepCallback(300)
            warning.tint = 16711680
            await this.sleepCallback(200)
            
            // Проверка состояния игрока
            if (this.playerState && this.playerState.state === 'shot') {
                if (this.damagePlayerCallback) {
                    this.damagePlayerCallback()
                }
            }
            
            // Взрыв
            if (this.createExplodeCallback) {
                this.createExplodeCallback(grenade, 0, 0)
            }
            
            if (this.physicsManager && grenade.body) {
                this.physicsManager.removeBody(grenade.body)
            }
            
            if (this.world) {
                this.world.removeChild(warning)
                this.world.removeChild(grenade)
            }
            
            this.grenades.splice(idx, 1)
        }
    }
    
    /**
     * Взрыв гранаты с уроном
     */
    grenadeExplode() {
        if (!this.activeGrenade) return
        
        if (this.createExplodeCallback) {
            this.createExplodeCallback(this.activeGrenade, 0, 0, false)
        }
        
        const g = this.activeGrenade.getBounds ? this.activeGrenade.getBounds() : this.activeGrenade
        
        // Урон врагам
        if (this.enemies) {
            this.enemies.forEach(enemy => {
                const e = enemy.getBounds ? enemy.getBounds() : enemy
                if (e.x > g.x - 200 && e.x < g.x + 200) {
                    if (enemy.params && !enemy.params.dead) {
                        if (this.damageEnemyCallback) {
                            this.damageEnemyCallback(enemy, 8)
                        }
                    }
                }
            })
        }
        
        // Урон ловушкам
        if (this.traps) {
            this.traps.forEach(trap => {
                const t = trap.getBounds ? trap.getBounds() : trap
                if (t.x > g.x - 200 && t.x < g.x + 200 && !trap.dead) {
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
            })
        }
        
        // Урон собаке-врагу
        if (this.currentDogEnemy) {
            const dogBounds = this.currentDogEnemy.getBounds ? this.currentDogEnemy.getBounds() : this.currentDogEnemy
            if (dogBounds.x > g.x - 200 && dogBounds.x < g.x + 200) {
                if (this.currentDogEnemy.params && !this.currentDogEnemy.params.dead) {
                    if (this.damageEnemyCallback) {
                        this.damageEnemyCallback(this.currentDogEnemy, 8)
                    }
                }
            }
        }
        
        // Урон боссу
        if (this.currentBoss) {
            const bossBounds = this.currentBoss.getBounds ? this.currentBoss.getBounds() : this.currentBoss
            if (bossBounds.x > g.x - 200 && bossBounds.x < g.x + 200) {
                if (this.currentBoss.params && !this.currentBoss.params.dead) {
                    if (this.damageEnemyCallback) {
                        this.damageEnemyCallback(this.currentBoss, 8, true)
                    }
                }
            }
        }
        
        // Удаление гранаты
        if (this.physicsManager && this.activeGrenade.body) {
            this.physicsManager.removeBody(this.activeGrenade.body)
        }
        
        if (this.world) {
            this.world.removeChild(this.activeGrenade)
        }
        
        this.activeGrenade = null
    }
    
    /**
     * Получает массив гранат
     */
    getGrenades() {
        return this.grenades
    }
    
    /**
     * Получает активную гранату
     */
    getActiveGrenade() {
        return this.activeGrenade
    }
    
    /**
     * Очищает все гранаты
     */
    clear() {
        this.grenades.forEach(grenade => {
            if (this.physicsManager && grenade.body) {
                this.physicsManager.removeBody(grenade.body)
            }
            if (this.world) {
                this.world.removeChild(grenade)
            }
        })
        this.grenades = []
        
        if (this.activeGrenade) {
            if (this.physicsManager && this.activeGrenade.body) {
                this.physicsManager.removeBody(this.activeGrenade.body)
            }
            if (this.world) {
                this.world.removeChild(this.activeGrenade)
            }
            this.activeGrenade = null
        }
    }
}
