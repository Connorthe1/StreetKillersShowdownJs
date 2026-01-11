/**
 * Particle.js
 * 
 * Классы частиц и их менеджер
 * 
 * Содержит:
 * - Класс Particle (базовый класс частиц)
 * - Подклассы: BloodParticle, SparkParticle, DropParticle, BottleParticle
 * - Класс TrailParticle (частицы следа)
 * - Класс BounceParticle (отскакивающие частицы)
 * - Класс ParticleManager (управление всеми частицами)
 * - Методы: createParticles(), updateParticles(), spawnTrailParticle(), spawnBounceParticle()
 * - Физика частиц
 */

import * as PIXI from 'pixi.js'
import { random } from '../utils/GameUtils.js'
import { soundPlayer } from "../playSound";

/**
 * Менеджер для управления всеми типами частиц
 */
export class ParticleManager {
    constructor(world, engine, physicsManager, ground, resources, gameState, eventBus) {
        this.world = world
        this.physicsManager = physicsManager
        this.ground = ground
        this.resources = resources
        this.gameState = gameState
        this.eventBus = eventBus

        // Массивы частиц
        this.physParticles = []
        this.bounceParticles = []
        this.trails = []

        eventBus.on('particle:default', data => {
            this.createParticle(data.coords, data.type, data.floor, data.size);
        })

        eventBus.on('particle:bounce', data => {
            this.spawnBounceParticle(data.coords, data.type, data.tint);
        })

        eventBus.on('particle:trail', data => {
            this.spawnTrailParticle(data.coords, data.tint, data.zipLine);
        })
        
        // Таймер следа
        this.stepSound = 0
    }

    createParticle(coords, particleType, floor, size) {
        let particle
        
        switch (particleType) {
            case 'blood': {
                const randomBlood = random(0, 4)
                particle = new PIXI.Sprite(this.resources.physParticlesTexture.textures[`blood-${randomBlood}`])
                particle.scale.set(size || 2)
                break
            }
            case 'spark': {
                particle = new PIXI.Sprite(this.resources.physParticlesTexture.textures['spark'])
                const particleTint = random(0, 2)
                switch (particleTint) {
                    case 0:
                        particle.tint = 16777011
                        break
                    case 1:
                        particle.tint = 16777164
                        break
                    case 2:
                        particle.tint = 16771891
                        break
                }
                const randomSize = random(size || 3, (size + 1) || 4)
                particle.scale.set(randomSize)
                break
            }
            case 'drop': {
                particle = PIXI.Sprite.from(PIXI.Texture.WHITE)
                const particleTint = random(0, 2)
                switch (particleTint) {
                    case 0:
                        particle.tint = 9424895
                        break
                    case 1:
                        particle.tint = 15138815
                        break
                    case 2:
                        particle.tint = 16777215
                        break
                }
                const randomSize = random(2, 4)
                particle.width = randomSize
                particle.height = randomSize
                break
            }
            case 'bottle': {
                particle = PIXI.Sprite.from(PIXI.Texture.WHITE)
                particle.tint = 32768
                const randomSize = random(2, 3)
                particle.width = randomSize
                particle.height = randomSize
                break
            }
        }
        
        particle.type = particleType
        if (floor) {
            particle.edge = random(this.ground.getLocalBounds().y - 115, this.ground.getLocalBounds().y - 85)
        } else {
            particle.edge = random(this.ground.getLocalBounds().y + 75, this.ground.getLocalBounds().y + 110)
        }
        particle.anchor.set(0.5)
        particle.position.set(coords.x, coords.y)
        
        // Создание физического тела
        particle.body = this.physicsManager.createDynamicBody(particle.x, particle.y, 1, 1, { isSensor: true })
        this.world.addChild(particle)
        this.physicsManager.addBody(particle.body)
        
        // Применение случайной силы
        let randomMassX = Math.random() * particle.body.mass
        const randomMassY = Math.random() * particle.body.mass
        randomMassX *= Math.round(Math.random()) ? 1 : -1
        this.physicsManager.applyForce(particle.body, particle.body.position, {
            x: randomMassX / 50,
            y: -randomMassY / 50
        })
        
        this.physParticles.push(particle)
    }
    
    /**
     * Обновляет физические частицы
     * @param {number} zeroLeft - левая граница видимой области
     */
    updateParticles(zeroLeft) {
        this.physParticles.forEach((b, idx) => {
            if (!b.stop) {
                b.position = b.body.position
                if (b.type !== 'blood') {
                    b.rotation = b.body.angle
                }
                if (b.position.y > b.edge) {
                    b.stop = true
                    if (b.type === 'blood') {
                        b.scale.y = 1
                    }
                }
            }
            if (b.position.x < zeroLeft) {
                this.world.removeChild(b)
                this.physicsManager.removeBody(b.body)
                this.physParticles.splice(idx, 1)
            }
        })
    }
    
    /**
     * Создает частицу следа
     * @param {Object} pos - позиция {x, y}
     * @param {number} tint - цвет частицы (опционально)
     * @param {boolean} inZipLine - находится ли в зиплайне
     */
    spawnTrailParticle(pos, tint, inZipLine = false) {
        const rectangle = PIXI.Sprite.from(PIXI.Texture.WHITE)
        const randomParams = Math.floor(Math.random() * (3 + 1))
        
        switch (randomParams) {
            case 0:
                rectangle.tint = 16777215
                rectangle.width = 1
                rectangle.height = 1
                if (inZipLine) {
                    rectangle.position.set(pos.x + 5, pos.y - (pos.height || 0) / 2 + 18)
                } else {
                    rectangle.position.set(pos.x - 15, pos.y + 18)
                }
                rectangle.scaleSize = 0.1
                rectangle.initY = rectangle.y
                break
            case 1:
                rectangle.tint = 14869218
                rectangle.width = 2
                rectangle.height = 2
                if (inZipLine) {
                    rectangle.position.set(pos.x + 5, pos.y - (pos.height || 0) / 2 + 20)
                } else {
                    rectangle.position.set(pos.x - 10, pos.y + 20)
                }
                rectangle.scaleSize = 0.09
                rectangle.initY = rectangle.y
                break
            case 2:
                rectangle.tint = 13027014
                rectangle.width = 3
                rectangle.height = 3
                if (inZipLine) {
                    rectangle.position.set(pos.x + 5, pos.y - (pos.height || 0) / 2 + 22)
                } else {
                    rectangle.position.set(pos.x - 20, pos.y + 22)
                }
                rectangle.scaleSize = 0.07
                rectangle.initY = rectangle.y
                break
            case 3:
                rectangle.tint = 11250603
                rectangle.width = 4
                rectangle.height = 4
                if (inZipLine) {
                    rectangle.position.set(pos.x + 5, pos.y - (pos.height || 0) / 2 + 16)
                } else {
                    rectangle.position.set(pos.x - 12, pos.y + 16)
                }
                rectangle.scaleSize = 0.08
                rectangle.initY = rectangle.y
                break
        }
        
        if (tint) {
            rectangle.tint = tint
        } else {
            rectangle.alpha = 0.7
        }
        
        rectangle.endSize = Math.floor(Math.random() * (10 - 5 + 1) + 5)
        this.world.addChild(rectangle)
        this.trails.push(rectangle)
    }
    
    /**
     * Обновляет частицы следа
     * @param {number} zeroLeft - левая граница видимой области
     */
    updateTrailParticles(zeroLeft) {
        this.trails.forEach((item, idx) => {
            if (item.x < zeroLeft || item.y - item.height < item.initY - item.endSize) {
                this.world.removeChild(item)
                this.trails.splice(idx, 1)
                return
            }
            item.width += item.scaleSize / 2
            item.height += item.scaleSize / 2
            item.y -= item.scaleSize
            item.x -= item.scaleSize
        })
    }

    spawnBounceParticle(coords, particleType, tint) {
        const particle = new PIXI.Sprite(this.resources.bounceParticlesTexture.textures[particleType])
        particle.scale.set(2)
        particle.anchor.set(0.5)
        particle.position.set(coords.x, coords.y)
        particle.lifeTime = 500
        
        if (tint) {
            particle.tint = tint
        }
        
        // Создание физического тела
        particle.body = this.physicsManager.createDynamicBody(particle.x, particle.y, 2, 10, {
            restitution: 0.5
        })
        particle.rotation = Math.floor(Math.random() * (6 + 1))
        this.world.addChild(particle)
        this.physicsManager.addBody(particle.body)
        
        // Применение случайной силы
        let randomMassX = Math.random() * particle.body.mass
        const randomMassY = Math.random() * particle.body.mass
        randomMassX *= Math.round(Math.random()) ? 1 : -1
        this.physicsManager.applyForce(particle.body, particle.body.position, {
            x: randomMassX / 50,
            y: -randomMassY / 35
        })
        
        this.bounceParticles.push(particle)
    }
    
    /**
     * Обновляет отскакивающие частицы
     */
    updateBounceParticles() {
        this.bounceParticles.forEach((b, idx) => {
            b.lifeTime--
            if (b.lifeTime <= 0) {
                this.world.removeChild(b)
                this.physicsManager.removeBody(b.body)
                this.bounceParticles.splice(idx, 1)
                return
            }
            b.position = b.body.position
            if (b.body.speed > 0.2) {
                b.rotation += 0.1
            } else {
                b.rotation = b.body.angle
            }
        })
    }

    updateStepParticles(playerInstance) {
        if (!this.gameState || !playerInstance.sprite || this.gameState.gameEnd) {
            this.stepSound = 0
            return
        }

        // Частицы следа для stimpack
        if (playerInstance.stimpack) {
            this.spawnTrailParticle({x: playerInstance.sprite.x, y: playerInstance.sprite.y}, '#ffdd00')
            this.spawnTrailParticle({x: playerInstance.sprite.x, y: playerInstance.sprite.y - 10}, '#ffdd00')
            this.spawnTrailParticle({x: playerInstance.sprite.x, y: playerInstance.sprite.y - 20}, '#ffdd00')
            this.spawnTrailParticle({x: playerInstance.sprite.x, y: playerInstance.sprite.y - 30}, '#ffdd00')
            this.spawnTrailParticle({x: playerInstance.sprite.x, y: playerInstance.sprite.y - 40}, '#ffdd00')
        }

        // Частицы следа при движении
        if (playerInstance.speed > 0 && !this.gameState.isPause) {

            // Дополнительные частицы при качении
            if ((playerInstance.state === 'roll' || playerInstance.state === 'rollEnd')) {
                this.spawnTrailParticle(playerInstance.sprite)
                this.spawnTrailParticle(playerInstance.sprite)
                this.spawnTrailParticle(playerInstance.sprite)
            } else {
                // Звук шагов
                this.stepSound++
                if (this.stepSound > 20 && soundPlayer) {
                    this.spawnTrailParticle(playerInstance.sprite)
                    soundPlayer.footStep()
                    this.stepSound = 0
                }
            }
        }
    }

    updateAllParticles(zeroLeft, playerInstance) {
        this.updateParticles(zeroLeft)
        this.updateBounceParticles()
        this.updateTrailParticles(zeroLeft)
        this.updateStepParticles(playerInstance)
    }

    /**
     * Очищает все частицы
     */
    clear() {
        // Очистка физических частиц
        this.physParticles.forEach(particle => {
            this.world.removeChild(particle)
            if (particle.body) {
                this.physicsManager.removeBody(particle.body)
            }
        })
        this.physParticles = []

        // Очистка отскакивающих частиц
        this.bounceParticles.forEach(particle => {
            this.world.removeChild(particle)
            if (particle.body) {
                this.physicsManager.removeBody(particle.body)
            }
        })
        this.bounceParticles = []

        // Очистка частиц следа
        this.trails.forEach(particle => {
            this.world.removeChild(particle)
        })
        this.trails = []
    }
}
