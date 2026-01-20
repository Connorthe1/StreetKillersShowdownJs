/**
 * Building.js
 * 
 * Менеджер зданий и связанных объектов
 * 
 * Содержит:
 * - Создание зданий (createBuilding, createBuildingZipline, createClub)
 * - Создание укрытий в зданиях (createCoverInBuild, createCoverInClub)
 * - Создание дверей и окон (createDoor, createWindow)
 * - Обновление зданий (updateBuildings, updateZiplines)
 * - Управление зонами спавна
 * - Логика зиплайнов
 */

import * as PIXI from 'pixi.js'
import * as Matter from 'matter-js'
import { random, randomRGB } from '../../utils/GameUtils.js'
import {BUILDING_CHANCE} from "../../core/GameConfig";

/**
 * Менеджер зданий
 */
export class BuildingManager {
    constructor(world, physicsManager, ground, worldCoords, gameConfig, fg, resources, eventBus) {
        this.world = world
        this.physicsManager = physicsManager
        this.ground = ground

        this.worldCoords = worldCoords
        this.fg = fg
        this.eventBus = eventBus
        this.resources = resources
        this.gameConfig = gameConfig

        // Состояние
        this.buildingChance = BUILDING_CHANCE
        this.buildings = []
        this.buildingType = 0
        this.afterBuilding = 0
        this.isBuilding = false
        this.isClub = false
    }

    createBuildingChance() {
        if (!this.isClub) {
            const randomBuild = random(1, 10)

            const lastBuilding = this.buildings[this.buildings.length - 1] || null

            switch (true) {
                case randomBuild <= this.buildingChance:
                    if (this.isBuilding) {
                        this.spawnBuilding('continue', lastBuilding)
                    } else {
                        if (this.buildings.length === 0) {
                            const testClub = random(1, 10)
                            this.isBuilding = true
                            if (testClub === 1) {
                                this.isClub = true
                                this.buildings.push(this.createClub())
                                return
                            }
                            this.spawnBuilding('start', lastBuilding)
                        }
                    }
                    break
                default:
                    if (this.isBuilding) {
                        this.isBuilding = false
                        this.spawnBuilding('end', lastBuilding)
                    }
                    break
            }
        }
    }

    spawnBuilding(type, lastBuilding) {
        const randBuild = this.buildingType > 0 ? this.buildingType : random(1, 1)
        switch (randBuild) {
            case 1:
                this.buildingType = 1
                this.createBuildingZipline(type, lastBuilding)
                break
            case 2:
                this.buildingType = 2
                this.createBuilding(type, lastBuilding)
                break
        }
        if (type === 'end') {
            this.buildingType = 0
        }
    }

    createBuildingZipline(type, lastBuilding) {
        console.log('createBuildingZipline', type)
        const buildContainer = new PIXI.Container()
        buildContainer.secondFloor = true
        let buildBack
        let buildFront
        let buildConnect
        let position = this.worldCoords.zeroRight + 300
        
        if (lastBuilding && type !== 'start') {
            const LBbounds = lastBuilding.getLocalBounds()
            position = LBbounds.x + LBbounds.width
        }
        
        this.deleteWallsAroundBuilding(position)
        
        if (type === 'start') {
            buildBack = new PIXI.Sprite(this.resources.build2.textures.Build2FOne)
            buildFront = new PIXI.Sprite(this.resources.build2.textures.Build2FOneClose)
            buildBack.anchor.set(0.5)
            buildBack.position.set(position + buildBack.width / 2, this.ground.getLocalBounds().y - 118)

            this.eventBus.emit('zipline:create', {pos: {x: position, y: buildBack.y - buildBack.height / 2}, type: 1})

            this.createWindow(position + 11)
            if (Math.random() < 0.5) {
                this.createDoor(position + buildBack.width - 72, true)
            }
            if (Math.random() < 0.5) {
                this.createCoverInBuild(position + buildBack.width - 180, true)
            }
        } else {
            const rand = Math.random()
            if (!lastBuilding.outroof) {
                if (rand < 0.5) {
                    buildConnect = new PIXI.Sprite(this.resources.build2.textures.Build2fOneConnect)
                    buildBack = new PIXI.Sprite(this.resources.build2.textures.Build2FTwo)
                    buildFront = new PIXI.Sprite(this.resources.build2.textures.Build2FTwoClose)
                    buildBack.anchor.set(0.5)
                    buildBack.position.set(position + buildBack.width / 2, this.ground.getLocalBounds().y - 118)
                    if (Math.random() < 0.5) {
                        this.createCoverInBuild(buildBack.x - 50, true)
                    }
                    if (type === 'end') {
                        this.createWindow(position + buildBack.width - 93)
                    } else {
                        if (Math.random() < 0.5) {
                            this.createDoor(position + buildBack.width - 72)
                        }
                    }
                } else {
                    buildBack = new PIXI.Sprite(this.resources.build2.textures.Build2Outroof)
                    buildContainer.outroof = true
                    buildBack.anchor.set(0.5)
                    buildBack.position.set(position + buildBack.width / 2, this.ground.getLocalBounds().y - 2)
                    if (Math.random() < 0.5) {
                        this.createCoverInBuild(position + buildBack.width - 250, true, true)
                    }
                    if (Math.random() < 0.5) {
                        this.createCoverInBuild(position + 150, true, true)
                    }
                }
            } else {
                if (rand < 0.5) {
                    buildBack = new PIXI.Sprite(this.resources.build2.textures.Build2FThree)
                    buildFront = new PIXI.Sprite(this.resources.build2.textures.Build2FThreeClose)
                    buildBack.anchor.set(0.5)
                    buildBack.position.set(position + buildBack.width / 2 - 104, this.ground.getLocalBounds().y - 118)
                    if (Math.random() < 0.5) {
                        this.createCoverInBuild(position + buildBack.width - 360, true)
                    }
                    if (Math.random() < 0.5) {
                        this.createCoverInBuild(position + 210, true)
                    }
                    if (Math.random() < 0.5) {
                        this.createWindow(position - 108)
                    } else {
                        this.createDoor(position - 88, true)
                    }
                    if (type === 'end') {
                        this.createWindow(position + buildBack.width - 212)
                    }
                } else {
                    buildBack = new PIXI.Sprite(this.resources.build2.textures.Build2Outroof)
                    buildConnect = new PIXI.Sprite(this.resources.build2.textures.Build2fOneConnect)
                    buildContainer.outroof = true
                    buildBack.anchor.set(0.5)
                    buildBack.position.set(position + buildBack.width / 2, this.ground.getLocalBounds().y - 2)
                    if (Math.random() < 0.5) {
                        this.createCoverInBuild(position + buildBack.width - 250, true, true)
                    }
                    if (Math.random() < 0.5) {
                        this.createCoverInBuild(position + 150, true, true)
                    }
                }
            }
        }
        
        if (type === 'end') {
            if (buildContainer.outroof) {
                this.eventBus.emit('zipline:create', {pos: {x: buildBack.x + buildBack.width / 2 - 96, y: buildBack.y - buildBack.height / 2 - 74}, type: 2})
            } else {
                this.eventBus.emit('zipline:create', {pos: {x: buildBack.x + buildBack.width / 2, y: buildBack.y - buildBack.height / 2}, type: 3})
            }
            this.afterBuilding = buildBack.x + buildBack.width / 2
        }

        if (buildFront) {
            buildFront.anchor.set(0.5)
            buildFront.position.set(buildBack.x, buildBack.y)
            buildFront.parentGroup = this.fg
            buildFront.zOrder = 10
            buildContainer.addChild(buildFront)
        }

        if (buildConnect) {
            if (buildContainer.outroof) {
                buildConnect.position.set(buildBack.x - buildBack.width - 54 , buildBack.y - buildBack.height / 2 - 42)
            } else {
                buildConnect.position.set((buildBack.x - buildBack.width * 1.5) - 4, buildBack.y - buildBack.height / 2)
            }
            buildContainer.addChild(buildConnect)
        }
        
        buildContainer.addChild(buildBack)
        const bounds = buildContainer.getLocalBounds()
        const resetSpawnZones = [
            {
                x: bounds.x - 50,
                w: bounds.x + 150
            },
            {
                x: bounds.x + bounds.width - 50,
                w: bounds.x + bounds.width + 150
            }
        ]
        buildContainer.resetSpawnZones = resetSpawnZones
        buildContainer.body = Matter.Bodies.rectangle(buildBack.x, this.worldCoords.secondFloor + 50, buildBack.width + 20, 40, { isStatic: true })
        if (this.physicsManager) {
            this.physicsManager.addBody(buildContainer.body)
        }
        if (this.world) {
            this.world.addChild(buildContainer)
        }
        this.buildings.push(buildContainer)
    }

    createBuilding(type, lastBuilding) {
        console.log('createBuilding', type)
        const buildContainer = new PIXI.Container()
        let buildBack
        let buildFront
        let buildConnect
        let position = this.worldCoords.zeroRight + 300

        if (lastBuilding && type !== 'start') {
            const LBbounds = lastBuilding.getLocalBounds()
            position = LBbounds.x + LBbounds.width
        }
        
        this.deleteWallsAroundBuilding(position)

        if (type === 'start') {
            buildBack = new PIXI.Sprite(this.resources.build1.textures.Build1FOne)
            buildFront = new PIXI.Sprite(this.resources.build1.textures.Build1FOneClose)
            // if (trapManager) trapManager.createDoor(position + 32)
            // if (Math.random() < 0.5) {
            //     if (trapManager) trapManager.createDoor(position + buildBack.width - 72)
            // }
            // if (Math.random() < 0.5) {
            //     createCoverInBuild(position + buildBack.width / 2)
            // }
        } else {
            const rand = Math.random()
            if (rand < 0.5) {
                buildBack = new PIXI.Sprite(this.resources.build1.textures.Build1FTwo)
                buildFront = new PIXI.Sprite(this.resources.build1.textures.Build1FTwoClose)
                // if (Math.random() < 0.5) {
                //     createCoverInBuild(position + buildBack.width - 150)
                // }
                // if (Math.random() < 0.5) {
                //     if (trapManager) trapManager.createDoor(position + buildBack.width - 72)
                // }
            } else {
                buildBack = new PIXI.Sprite(this.resources.build1.textures.Build1FThree)
                buildFront = new PIXI.Sprite(this.resources.build1.textures.Build1FThreeClose)
                // if (Math.random() < 0.5) {
                //     createCoverInBuild(position + buildBack.width - 150)
                // }
                // if (Math.random() < 0.5) {
                //     createCoverInBuild(position + buildBack.width - 340)
                // }
                // if (Math.random() < 0.5) {
                //     if (trapManager) trapManager.createDoor(position + buildBack.width - 72)
                // }
            }
            if (type !== 'end') {
                if (rand < 0.5) {
                    buildConnect = new PIXI.Sprite(this.resources.build1.textures.Build1FTwoConnection)
                } else {
                    buildConnect = new PIXI.Sprite(this.resources.build1.textures.Build1FThreeConnection)
                }
            }
        }
        
        buildBack.anchor.set(0.5)
        buildFront.anchor.set(0.5)
        buildFront.parentGroup = this.fg
        buildFront.zOrder = 10
        buildBack.position.set(position + buildBack.width / 2, this.ground.getLocalBounds().y - 97)
        buildFront.position.set(position + buildFront.width / 2, buildBack.y)
        
        if (buildConnect) {
            buildConnect.anchor.set(0.5)
            buildConnect.position.set(position + buildConnect.width / 2, buildBack.y)
            buildContainer.addChild(buildConnect)
        }
        
        if (type === 'end') {
            this.afterBuilding = buildBack.x + buildBack.width / 2
        }
        
        buildContainer.addChild(buildBack)
        buildContainer.addChild(buildFront)
        const bounds = buildContainer.getLocalBounds()
        const resetSpawnZones = [
            {
                x: bounds.x - 50,
                w: bounds.x + 150
            },
            {
                x: bounds.x + bounds.width - 50,
                w: bounds.x + bounds.width + 150
            }
        ]
        buildContainer.resetSpawnZones = resetSpawnZones
        buildContainer.body = Matter.Bodies.rectangle(buildBack.x, this.worldCoords.secondFloor + 50, buildBack.width + 20, 40, { isStatic: true })

        this.physicsManager.addBody(buildContainer.body)
        this.world.addChild(buildContainer)
        this.buildings.push(buildContainer)
    }
    
    /**
     * Создает клуб
     */
    createClub() {
        let position = this.worldCoords.zeroRight + 300
        const clubContainer = new PIXI.Container()
        const clubBack = new PIXI.Sprite(this.resources.club.textures.clubBack)
        const clubFront = new PIXI.Sprite(this.resources.club.textures.clubFront)
        
        this.deleteWallsAroundBuilding(position + clubBack.width / 2)
        
        for (let i = 1; i <= 17; i++) {
            const rand = Math.floor(Math.random() * (9 - 1 + 1) + 1)
            const laserBeam = new PIXI.AnimatedSprite(this.resources.laserBeamTexture.animations[`render${rand}`])
            laserBeam.position.set(position + 526 + (i * 44), this.gameConfig.WORLD_HEIGHT - 434)
            laserBeam.tint = randomRGB()
            laserBeam.scale.y = `1.0${rand}`
            laserBeam.parentGroup = this.fg
            if (Math.random() < 0.5) {
                laserBeam.zOrder = 4
            } else {
                laserBeam.zOrder = 6
            }
            laserBeam.animationSpeed = 0.01 * rand + 0.01
            laserBeam.alpha = 0.4
            laserBeam.play()
            clubContainer.addChild(laserBeam)
        }
        
        clubBack.anchor.set(0.5)
        clubFront.anchor.set(0.5)
        clubFront.parentGroup = this.fg
        clubFront.zOrder = 10
        clubBack.position.set(position + clubBack.width / 2, this.ground.getLocalBounds().y - 97)
        clubFront.position.set(position + clubFront.width / 2, clubBack.y)
        clubContainer.club = true
        
        if (Math.random() < 0.5) {
            this.createCoverInClub(position + 190, 0)
        }
        if (Math.random() < 0.5) {
            this.createCoverInClub(position + 410, 1)
        }
        if (Math.random() < 0.5) {
            this.createCoverInClub(position + 540, 1)
        }
        if (Math.random() < 0.1) {
            if (this.createBossCallback) {
                this.createBossCallback(4, clubBack.x + 130)
            }
        } else {
            if (Math.random() < 0.5) {
                this.createCoverInClub(position + 840, 0)
            }
            if (Math.random() < 0.5) {
                this.createCoverInClub(position + 1300, 0)
            }
        }
        if (Math.random() < 0.5) {
            this.createCoverInClub(position + 1600, 2)
        }
        if (Math.random() < 0.5) {
            this.createCoverInClub(position + 1900, 2)
        }
        
        clubContainer.addChild(clubBack)
        clubContainer.addChild(clubFront)
        const bounds = clubContainer.getLocalBounds()
        const resetSpawnZones = [
            {
                x: bounds.x - 50,
                w: bounds.x + 100
            },
            {
                x: clubBack.x - 450,
                w: clubBack.x - 350
            },
            {
                x: clubBack.x + clubBack.width / 2 + 350,
                w: clubBack.x + clubBack.width / 2 + 450
            }
        ]
        clubContainer.resetSpawnZones = resetSpawnZones
        clubContainer.body = Matter.Bodies.rectangle(clubBack.x, this.worldCoords.secondFloor + 50, clubBack.width + 20, 40, { isStatic: true })
        if (this.physicsManager) {
            this.physicsManager.addBody(clubContainer.body)
        }
        if (this.world) {
            this.world.addChild(clubContainer)
        }
        return clubContainer
    }
    
    /**
     * Создает укрытие в здании
     * @param {number} pos - позиция X
     * @param {boolean} isSecondFloor - на втором этаже
     * @param {boolean} isRoof - на крыше
     */
    createCoverInBuild(pos, isSecondFloor, isRoof) {
        return
        let wall
        if (isRoof) {
            const randomWall = Math.floor(Math.random() * (1 + 1))
            wall = new PIXI.Sprite(this.resources.inFloorTexture.textures[`Floor-${randomWall}`])
            wall.coverX = pos - 34
        } else {
            const randomWall = Math.floor(Math.random() * (2 + 1))
            wall = new PIXI.Sprite(this.resources.inBuildTexture.textures[`inhouse-${randomWall}`])
            wall.coverX = pos - 20
        }
        wall.bound = 0
        wall.anchor.set(0.5, 1)
        wall.position.set(
            pos,
            isSecondFloor ? (isRoof ? this.ground.getLocalBounds().y - 115 : this.ground.getLocalBounds().y - 110) : this.ground.getLocalBounds().y + 78
        )
        wall.height = wall.height * 2
        wall.width = wall.width * 2
        wall.zIndex = 1
        if (this.world) {
            this.world.addChild(wall)
        }
        this.walls.push(wall)
    }
    
    /**
     * Создает укрытие в клубе
     * @param {number} pos - позиция X
     * @param {number} type - тип укрытия (0, 1, 2)
     * @param {boolean} forBoss - для босса
     */
    createCoverInClub(pos, type, forBoss) {
        if (!this.inClubTexture) {
            console.warn('Club cover textures not available')
            return
        }
        
        const wall = new PIXI.Sprite(this.resources.inClubTexture.textures[`inClub-${type}`])
        switch (type) {
            case 0:
                wall.bound = 50
                wall.coverX = pos - 42
                wall.position.set(pos, this.ground.getLocalBounds().y + 31)
                break
            case 1:
                wall.bound = 80
                wall.coverX = pos - 26
                wall.position.set(pos, this.ground.getLocalBounds().y + 25)
                break
            case 2:
                wall.bound = 80
                wall.coverX = pos - 30
                wall.position.set(pos, this.ground.getLocalBounds().y + 33)
                break
        }
        if (forBoss) {
            wall.forBoss = true
        }
        wall.anchor.set(0.5)
        wall.height = wall.height * 2
        wall.width = wall.width * 2
        wall.zIndex = 1
        if (this.world) {
            this.world.addChild(wall)
        }
        this.walls.push(wall)
    }
    
    /**
     * Создает дверь
     * @param {number} pos - позиция X
     * @param {boolean} isSecondFloor - на втором этаже
     */
    createDoor(pos, isSecondFloor) {
        if (!this.doorTexture) {
            console.warn('Door texture not available')
            return
        }
        
        const door = new PIXI.AnimatedSprite(this.doorTexture.animations.door)
        door.loop = false
        door.animationSpeed = 0.6
        door.anchor.set(0.5)
        door.position.set(pos, isSecondFloor ? this.ground.getLocalBounds().y - 143 : this.ground.getLocalBounds().y + 47)
        door.zIndex = 1
        door.type = 'door'
        if (this.world) {
            this.world.addChild(door)
        }
        // Двери добавляются в traps, а не в walls
        if (this.traps) {
            this.traps.push(door)
        }
    }
    
    /**
     * Создает окно
     * @param {number} pos - позиция X
     */
    createWindow(pos) {
        if (!this.windowTexture) {
            console.warn('Window texture not available')
            return
        }
        
        const window = new PIXI.AnimatedSprite(this.windowTexture.animations.window)
        window.loop = false
        window.animationSpeed = 0.6
        window.anchor.set(0.5)
        window.position.set(pos, this.ground.getLocalBounds().y - 137)
        window.zIndex = 1
        window.type = 'window'
        if (this.world) {
            this.world.addChild(window)
        }
        // Окна добавляются в traps, а не в walls
        if (this.traps) {
            this.traps.push(window)
        }
    }
    
    /**
     * Удаляет стены вокруг здания
     * @param {number} position - позиция здания
     */
    deleteWallsAroundBuilding(position) {
        if (!this.walls) return
        
        this.walls.forEach((wall, idx) => {
            const wallX = wall.position ? wall.position.x : (wall.x || 0)
            if (wallX + 100 > position) {
                if (this.world) {
                    this.world.removeChild(wall)
                }
                this.walls.splice(idx, 1)
            }
        })
    }
    
    /**
     * Обновляет зиплайны
     * @deprecated Используйте ZipLineManager.updateZiplines() вместо этого
     * Метод оставлен для обратной совместимости, но будет удален в будущем
     */
    updateZiplines() {
        // Метод перенесен в ZipLineManager
        // Оставлен для обратной совместимости
        console.warn('BuildingManager.updateZiplines() устарел. Используйте ZipLineManager.updateZiplines()')
    }

    getBuildings() {
        return this.buildings
    }

    getIsBuilding() {
        return this.isBuilding
    }

    getAfterBuilding() {
        return this.afterBuilding
    }
    
    clear(build) {
        this.physicsManager.removeBody(build.body)
    }
}
