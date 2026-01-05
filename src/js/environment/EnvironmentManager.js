/**
 * EnvironmentManager.js
 * 
 * Менеджер окружения игры
 * 
 * Содержит:
 * - Управление фоном (createBg, updateBg)
 * - Управление землей/полом (createFloor, updateFloor, createWood)
 * - Управление фоновыми машинами (createBgCar, updateBgCar)
 * - Управление объектами окружения (createGarbage, updateGarbage, createPuddle, updatePuddles, createCan, updateCan)
 * - Управление зданиями (spawnBuilding, createBuilding, createClub)
 * - Логика спавна объектов окружения
 */

import * as PIXI from 'pixi.js'
import * as Matter from 'matter-js'
import { random, randomRGB } from '../utils/GameUtils.js'
import { FENCE_CHANCE, BUILDING_CHANCE, GROUND_COLORS, BG_SPEED } from '../core/GameConfig.js'

/**
 * Менеджер окружения
 */
export class EnvironmentManager {
    constructor(world, ground, woodsBG, engine, physicsManager, gameState) {
        this.world = world
        this.ground = ground
        this.woodsBG = woodsBG
        this.engine = engine
        this.physicsManager = physicsManager
        this.gameState = gameState
        
        // Состояние окружения
        this.background = null
        this.bgPosition = 0
        this.bgSpeed = BG_SPEED
        this.floorPosition = 0
        this.woodsBGarr = []
        
        // Флаги состояния
        this.isFence = false
        this.isBuilding = false
        this.afterBuilding = 0
        this.isClub = false
        this.buildingType = 0
        
        // Массивы объектов
        this.buildings = []
        this.garbages = []
        this.puddles = []
        this.zipLines = []
        
        // Текущие объекты
        this.bgCar = null
        this.currentCan = null
        
        // Константы
        this.fenceChance = FENCE_CHANCE
        this.buildingChance = BUILDING_CHANCE
        this.groundColor = GROUND_COLORS
        this.selectGroundColor = 0
        
        // Текстуры (устанавливаются позже)
        this.textures = null
        this.woods = null
        this.bgCarTexture = null
        this.garbageTexture = null
        this.puddleTexture = null
        this.canTexture = null
        this.build1 = null
        this.build2 = null
        this.buildZiplineTexture = null
        this.club = null
    }
    
    /**
     * Устанавливает текстуры для окружения
     */
    setTextures(textures) {
        this.textures = textures.textures
        this.woods = textures.woods
        this.bgCarTexture = textures.bgCarTexture
        this.garbageTexture = textures.garbageTexture
        this.puddleTexture = textures.puddleTexture
        this.canTexture = textures.canTexture
        this.build1 = textures.build1
        this.build2 = textures.build2
        this.buildZiplineTexture = textures.buildZiplineTexture
        this.club = textures.club
    }
    
    /**
     * Создает фон
     */
    createBg(img, WORLD_WIDTH, WORLD_HEIGHT, gameHeight) {
        const tiling = new PIXI.TilingSprite(img, WORLD_WIDTH + 100, gameHeight + 100)
        tiling.anchor.set(0.5, 1)
        tiling.zIndex = -10
        tiling.tilePosition.y = gameHeight
        tiling.position.set(WORLD_WIDTH / 2, WORLD_HEIGHT)
        this.world.addChild(tiling)
        this.background = tiling
        return tiling
    }
    
    /**
     * Обновляет фон
     */
    updateBg(zeroLeft, WORLD_WIDTH, playerSpeed, gameSpeed, gameStart) {
        if (gameStart) {
            this.bgPosition -= (this.bgSpeed * playerSpeed) * gameSpeed
            this.background.x = zeroLeft + WORLD_WIDTH / 2
            this.background.tilePosition.x = this.bgPosition
        }
    }
    
    /**
     * Создает часть пола
     */
    createFloor(idx, WORLD_WIDTH, WORLD_HEIGHT, createGarbageCallback, createParticlesCallback) {
        if (!this.textures) {
            console.warn('Textures not available for floor')
            return
        }
        
        const part = new PIXI.Container()
        const floor = new PIXI.Sprite(this.textures.ground)
        floor.anchor.set(0, 1)
        floor.position.set((this.floorPosition + idx) * floor.width, WORLD_HEIGHT)
        floor.tint = this.groundColor[this.selectGroundColor]
        
        let bgWall
        const randomWall = Math.floor(Math.random() * (10 - 1 + 1) + 1)
        if (randomWall < this.fenceChance) {
            if (!this.isFence) {
                bgWall = new PIXI.Sprite(this.textures.groundFenceStart)
            } else {
                bgWall = new PIXI.Sprite(this.textures.groundFenceMiddle)
            }
            this.isFence = true
        } else {
            if (this.isFence) {
                bgWall = new PIXI.Sprite(this.textures.groundFenceEnd)
            } else {
                bgWall = new PIXI.Sprite(this.textures.groundWall)
            }
            this.isFence = false
        }
        
        if (Math.random() > 0.5) {
            this.createWood(floor.x, floor.y - floor.height)
        }
        
        if (Math.random() > 0.75 && this.isBuilding && createGarbageCallback) {
            const posX = random(10, 100)
            const posY = random(94, 104)
            createGarbageCallback(floor.x + floor.width + posX, floor.y + posY)
        }
        
        if (Math.random() > 0.75 && this.isBuilding && createGarbageCallback) {
            const posX = random(10, 100)
            const posY = random(65, 75)
            createGarbageCallback(floor.x + floor.width + posX, floor.y + posY)
        }
        
        floor.body = Matter.Bodies.rectangle(
            floor.x,
            floor.y - floor.height + 44,
            floor.width + 20,
            40,
            { isStatic: true }
        )
        
        bgWall.anchor.set(0, 1)
        bgWall.position.set((this.floorPosition + idx) * bgWall.width, floor.y - floor.height)
        part.addChild(floor)
        part.addChild(bgWall)
        this.ground.addChild(part)
        Matter.World.add(this.engine.world, floor.body)
    }
    
    /**
     * Обновляет пол
     */
    updateFloor(zeroLeft, spawnEntityCallback) {
        if (zeroLeft - this.ground.getLocalBounds().x > 192) {
            this.floorPosition++
            Matter.World.remove(this.engine.world, this.ground.getChildAt(0).children[0].body)
            this.ground.removeChildAt(0)
            // createFloor будет вызван извне с правильными параметрами
            if (spawnEntityCallback) {
                spawnEntityCallback()
            }
        }
        
        this.woodsBGarr.forEach((wood, idx) => {
            const w = wood.getBounds()
            if (w.x + w.width < 0) {
                this.woodsBG.removeChild(wood)
                this.woodsBGarr.splice(idx, 1)
            }
        })
    }
    
    /**
     * Создает дерево на фоне
     */
    createWood(posX, posY) {
        if (!this.woods) {
            console.warn('Woods textures not available')
            return
        }
        
        const wood = new PIXI.AnimatedSprite(this.woods.animations[`wood${random(1, 4)}_part`])
        wood.scale.set(random(0.8, 1.5, true, true))
        wood.anchor.set(0, 1)
        wood.position.set(posX, posY + 60)
        wood.animationSpeed = 0.1
        wood.play()
        
        this.woodsBGarr.push(wood)
        this.woodsBG.addChild(wood)
    }
    
    /**
     * Создает фоновую машину
     */
    createBgCar(zeroLeft, zeroRight, groundY) {
        if (!this.bgCarTexture) {
            console.warn('BgCar texture not available')
            return
        }
        
        const car = new PIXI.Container()
        const carBack = new PIXI.Sprite(this.bgCarTexture.textures.carBack)
        const carFront = new PIXI.Sprite(this.bgCarTexture.textures.carFront)
        carBack.anchor.set(0.5)
        carFront.anchor.set(0.5)
        carBack.tint = randomRGB()
        
        if (Math.random() < 0.5) {
            car.side = 1
            car.position.set(zeroRight, groundY + 56)
        } else {
            carBack.scale.set(-1, 1)
            carFront.scale.set(-1, 1)
            car.side = -1
            car.position.set(zeroLeft - 100, groundY + 56)
        }
        
        car.speed = random(4, 10)
        car.zIndex = -1
        car.addChild(carBack)
        car.addChild(carFront)
        this.world.addChild(car)
        this.bgCar = car
    }
    
    /**
     * Обновляет фоновую машину
     */
    updateBgCar(zeroLeft, zeroRight) {
        if (!this.bgCar) return
        
        const b = this.bgCar.getBounds()
        if (this.bgCar.side > 0) {
            this.bgCar.x -= this.bgCar.speed
            if (b.x + b.width < 0) {
                this.world.removeChild(this.bgCar)
                this.bgCar = null
            }
        } else {
            this.bgCar.x += this.bgCar.speed
            if (b.x > zeroRight) {
                this.world.removeChild(this.bgCar)
                this.bgCar = null
            }
        }
    }
    
    /**
     * Создает мусор
     */
    createGarbage(posX, posY, type) {
        if (this.isClub) return
        if (!this.garbageTexture) {
            console.warn('Garbage texture not available')
            return
        }
        
        const rand = type || random(1, 10)
        const garbage = new PIXI.Sprite(this.garbageTexture.textures[`trash${rand}`])
        garbage.type = rand
        garbage.anchor.set(0, 1)
        garbage.position.set(posX, posY)
        this.world.addChild(garbage)
        this.garbages.push(garbage)
    }
    
    /**
     * Обновляет мусор
     */
    updateGarbage(zeroLeft, enemyBullets, playerBullets, soundPlayer, createParticlesCallback) {
        this.garbages.forEach((garbage, idx) => {
            if (garbage.x + garbage.width < zeroLeft) {
                this.world.removeChild(garbage)
                this.garbages.splice(idx, 1)
                return
            }
            
            if (garbage.type === 3 || garbage.type === 4) {
                // Проверка столкновения с пулями врагов
                enemyBullets.forEach(bullet => {
                    const b = bullet.getBounds()
                    const g = garbage.getBounds()
                    if (g.x > b.x && b.x + b.width > g.x && g.y > b.y && b.y + b.height > g.y) {
                        if (soundPlayer) soundPlayer.glassBreak()
                        if (createParticlesCallback) {
                            for (let i = 0; i <= 8; i++) {
                                createParticlesCallback(garbage, 'bottle')
                            }
                        }
                        this.world.removeChild(garbage)
                        this.garbages.splice(idx, 1)
                        return
                    }
                })
                
                // Проверка столкновения с пулями игрока
                playerBullets.forEach(bullet => {
                    const b = bullet.getBounds()
                    const g = garbage.getBounds()
                    if (g.x > b.x && b.x + b.width > g.x && g.y > b.y && b.y + b.height > g.y) {
                        if (soundPlayer) soundPlayer.glassBreak()
                        if (createParticlesCallback) {
                            for (let i = 0; i <= 8; i++) {
                                createParticlesCallback(garbage, 'bottle')
                            }
                        }
                        this.world.removeChild(garbage)
                        this.garbages.splice(idx, 1)
                        return
                    }
                })
            }
        })
    }
    
    /**
     * Создает лужу
     */
    createPuddle(zeroRight, playerPos) {
        if (!this.puddleTexture) {
            console.warn('Puddle texture not available')
            return
        }
        
        if (this.buildings.length > 0) {
            const activeBuilding = this.buildings[0]
            const lastBuilding = this.buildings[this.buildings.length - 1].getLocalBounds()
            if ((lastBuilding.x + lastBuilding.width > zeroRight && activeBuilding.getLocalBounds().x < zeroRight) && 
                (activeBuilding.secondFloor || activeBuilding.club)) {
                return
            }
        }
        
        const rand = random(1, 2)
        const puddle = new PIXI.Sprite(this.puddleTexture.textures[`puddle${rand}`])
        puddle.anchor.set(0.5)
        puddle.position.set(zeroRight + puddle.width, playerPos + 24)
        this.world.addChild(puddle)
        this.puddles.push(puddle)
    }
    
    /**
     * Обновляет лужи
     */
    updatePuddles(zeroLeft, player, playerState, playerSpeed, playerDefaultSpeed, addPointsCallback, soundPlayer, createParticlesCallback, sleep) {
        this.puddles.forEach((puddle, idx) => {
            if (puddle.x + puddle.width < zeroLeft) {
                this.world.removeChild(puddle)
                this.puddles.splice(idx, 1)
                return
            }
            
            if (puddle.dead) return
            
            if (player && player.x + 40 > puddle.x + 20 && puddle.x + puddle.width > player.x) {
                puddle.dead = true
                if (playerState.state === 'roll' || playerState.state === 'rollEnd') {
                    if (addPointsCallback) addPointsCallback(20)
                    this.gameState.increaseStreak(1)
                    if (soundPlayer) soundPlayer.waterStep()
                    if (createParticlesCallback) {
                        for (let i = 0; i <= 20; i++) {
                            createParticlesCallback({ x: puddle.x, y: puddle.y - 10 }, 'drop')
                        }
                    }
                } else {
                    if (soundPlayer) soundPlayer.waterStep()
                    if (createParticlesCallback) {
                        for (let i = 0; i <= 14; i++) {
                            createParticlesCallback({ x: puddle.x - 20, y: puddle.y - 10 }, 'drop')
                        }
                    }
                    if (sleep) {
                        sleep(250).then(() => {
                            if (soundPlayer) soundPlayer.waterStep()
                            if (createParticlesCallback) {
                                for (let i = 0; i <= 14; i++) {
                                    createParticlesCallback({ x: puddle.x + 20, y: puddle.y - 10 }, 'drop')
                                }
                            }
                        })
                    }
                }
            }
        })
    }
    
    /**
     * Создает банку
     */
    createCan(zeroRight, playerPos, storage, fg) {
        if (!this.canTexture) {
            console.warn('Can texture not available')
            return
        }
        
        const can = new PIXI.Sprite(this.canTexture.textures.pixelCan)
        can.width = 8
        can.height = 16
        can.anchor.set(0, 0.5)
        can.health = storage.upgrades.can + 1
        can.parentGroup = fg
        can.zOrder = 6
        can.body = Matter.Bodies.rectangle(
            zeroRight,
            playerPos + 20,
            8,
            16,
            {
                isStatic: false,
                restitution: 0.2,
                frictionAir: 0.01,
                chamfer: { radius: [5, 5, 0, 0] }
            }
        )
        this.world.addChild(can)
        Matter.World.add(this.engine.world, can.body)
        this.currentCan = can
    }
    
    /**
     * Обновляет банку
     */
    updateCan(zeroLeft, zeroRight, WORLD_HEIGHT, player, playerState, enemies, currentDogEnemy, soundPlayer, addPointsCallback, damageEnemyCallback, createParticlesCallback, random, sleep) {
        if (!this.currentCan) return
        
        this.currentCan.position = this.currentCan.body.position
        this.currentCan.rotation = this.currentCan.body.angle
        
        if ((this.currentCan.x > zeroRight + 300) || 
            (this.currentCan.y > WORLD_HEIGHT) || 
            (this.currentCan.x < zeroLeft) || 
            (this.currentCan.health <= 0)) {
            this.world.removeChild(this.currentCan)
            Matter.World.remove(this.engine.world, this.currentCan.body)
            this.currentCan = null
            return
        }
        
        // CAN TOUCHED
        if (player && player.x + 40 > this.currentCan.x + 40 && 
            player.x < this.currentCan.x + 20 && 
            this.currentCan.y > player.y && 
            player.y + player.height > this.currentCan.y && 
            (playerState.state === 'roll' || playerState.state === 'rollEnd') && 
            !this.currentCan.touched) {
            this.currentCan.dealDamage = false
            if (soundPlayer) soundPlayer.canDrop()
            Matter.Body.applyForce(
                this.currentCan.body,
                { x: this.currentCan.body.position.x, y: this.currentCan.body.position.y + 7.5 },
                { x: random(0.005, 0.01, true, true), y: -random(0.002, 0.00, true, true) }
            )
        }
        
        // CAN DAMAGE
        if (!this.currentCan.dealDamage && this.currentCan.body.speed > 1) {
            if (enemies) {
                enemies.forEach(enemy => {
                    const b = enemy.getBounds()
                    const can = this.currentCan.getBounds()
                    if (can.x > b.x && b.x + b.width > can.x && 
                        can.y > b.y && b.y + b.height > can.y && 
                        !enemy.params.dead) {
                        this.currentCan.dealDamage = true
                        this.currentCan.health -= 1
                        this.gameState.increaseStreak(2.5)
                        if (addPointsCallback) addPointsCallback(50)
                        if (damageEnemyCallback) {
                            damageEnemyCallback(enemy, Math.floor(this.currentCan.body.speed))
                        }
                        this.currentCan.body.speed = 0.5
                        Matter.Body.applyForce(
                            this.currentCan.body,
                            { x: this.currentCan.body.position.x, y: this.currentCan.body.position.y + 7.5 },
                            { x: -random(0.005, 0.01, true, true), y: -random(0.002, 0.006, true, true) }
                        )
                    }
                })
            }
            
            if (currentDogEnemy) {
                const b = currentDogEnemy.getBounds()
                const can = this.currentCan.getBounds()
                if (can.x > b.x && b.x + b.width > can.x && 
                    can.y > b.y && b.y + b.height > can.y && 
                    !currentDogEnemy.params.dead) {
                    this.currentCan.dealDamage = true
                    this.currentCan.health -= 1
                    this.gameState.increaseStreak(2.5)
                    if (addPointsCallback) addPointsCallback(50)
                    if (damageEnemyCallback) {
                        damageEnemyCallback(currentDogEnemy, Math.floor(this.currentCan.body.speed))
                    }
                    this.currentCan.body.speed = 0.5
                    Matter.Body.applyForce(
                        this.currentCan.body,
                        { x: this.currentCan.body.position.x, y: this.currentCan.body.position.y + 7.5 },
                        { x: -random(0.005, 0.01, true, true), y: -random(0.002, 0.006, true, true) }
                    )
                }
            }
        }
    }
    
    /**
     * Получает массивы объектов для обратной совместимости
     */
    getArrays() {
        return {
            buildings: this.buildings,
            garbages: this.garbages,
            puddles: this.puddles,
            zipLines: this.zipLines,
            woodsBGarr: this.woodsBGarr
        }
    }
    
    /**
     * Получает текущие объекты
     */
    getCurrentObjects() {
        return {
            bgCar: this.bgCar,
            currentCan: this.currentCan
        }
    }
    
    /**
     * Устанавливает текущие объекты (для обратной совместимости)
     */
    setCurrentObjects(objects) {
        if (objects.bgCar !== undefined) this.bgCar = objects.bgCar
        if (objects.currentCan !== undefined) this.currentCan = objects.currentCan
    }
    
    /**
     * Очищает все объекты окружения
     */
    clear() {
        // Очистка будет реализована при необходимости
    }
}
