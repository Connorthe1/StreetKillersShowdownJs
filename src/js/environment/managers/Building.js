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
import {random, randomRGB} from '../../utils/GameUtils.js'
import {BUILDING_CHANCE} from "../../core/GameConfig";

/**
 * Менеджер зданий
 */
export class BuildingManager {
    constructor(world, physicsManager, worldCoords, fg, resources, eventBus) {
        this.world = world
        this.physicsManager = physicsManager

        this.worldCoords = worldCoords
        this.fg = fg
        this.eventBus = eventBus
        this.resources = resources

        // Состояние
        this.buildingChance = BUILDING_CHANCE
        this.buildings = []
        this.buildingType = 0
        this.afterBuilding = 0
        this.isBuilding = false
        this.isClub = false

        eventBus.on('building:getIsBuilding', () => this.isBuilding)
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
        const randBuild = this.buildingType > 0 ? this.buildingType : random(1, 2)
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

        this.eventBus.emit('wall:clear', position)
        
        if (type === 'start') {
            buildBack = new PIXI.Sprite(this.resources.build2.textures.Build2FOne)
            buildFront = new PIXI.Sprite(this.resources.build2.textures.Build2FOneClose)
            buildBack.anchor.set(0.5)
            buildBack.position.set(position + buildBack.width / 2, this.worldCoords.ground - 118)

            this.eventBus.emit('zipline:create', {pos: {x: position, y: buildBack.y - buildBack.height / 2}, type: 1})

            this.eventBus.emit('trap:window', position + 11)
            if (Math.random() < 0.5) {
                this.eventBus.emit('trap:door', {pos: position + buildBack.width - 72, isSecondFloor: true})
            }
            if (Math.random() < 0.5) {
                this.eventBus.emit('wall:createInBuild', {pos: position + buildBack.width - 180, isSecondFloor: true})
            }
        } else {
            const rand = Math.random()
            if (!lastBuilding.outroof) {
                if (rand < 0.5) {
                    buildConnect = new PIXI.Sprite(this.resources.build2.textures.Build2fOneConnect)
                    buildBack = new PIXI.Sprite(this.resources.build2.textures.Build2FTwo)
                    buildFront = new PIXI.Sprite(this.resources.build2.textures.Build2FTwoClose)
                    buildBack.anchor.set(0.5)
                    buildBack.position.set(position + buildBack.width / 2, this.worldCoords.ground - 118)
                    if (Math.random() < 0.5) {
                        this.eventBus.emit('wall:createInBuild', {pos: buildBack.x - 50, isSecondFloor: true})
                    }
                    if (type === 'end') {
                        this.eventBus.emit('trap:window', position + buildBack.width - 93)
                    } else {
                        if (Math.random() < 0.5) {
                            this.eventBus.emit('trap:door', {pos: position + buildBack.width - 72})
                        }
                    }
                } else {
                    buildBack = new PIXI.Sprite(this.resources.build2.textures.Build2Outroof)
                    buildContainer.outroof = true
                    buildBack.anchor.set(0.5)
                    buildBack.position.set(position + buildBack.width / 2, this.worldCoords.ground - 2)
                    if (Math.random() < 0.5) {
                        this.eventBus.emit('wall:createInBuild', {pos: position + buildBack.width - 250, isSecondFloor: true, isRoof: true})
                    }
                    if (Math.random() < 0.5) {
                        this.eventBus.emit('wall:createInBuild', {pos: position + 150, isSecondFloor: true, isRoof: true})
                    }
                }
            } else {
                if (rand < 0.5) {
                    buildBack = new PIXI.Sprite(this.resources.build2.textures.Build2FThree)
                    buildFront = new PIXI.Sprite(this.resources.build2.textures.Build2FThreeClose)
                    buildBack.anchor.set(0.5)
                    buildBack.position.set(position + buildBack.width / 2 - 104, this.worldCoords.ground - 118)
                    if (Math.random() < 0.5) {
                        this.eventBus.emit('wall:createInBuild', {pos: position + buildBack.width - 360, isSecondFloor: true})
                    }
                    if (Math.random() < 0.5) {
                        this.eventBus.emit('wall:createInBuild', {pos: position + 210, isSecondFloor: true})
                    }
                    if (Math.random() < 0.5) {
                        console.log('WINDOW', position - 108)
                        this.eventBus.emit('trap:window', position - 108)
                    } else {
                        this.eventBus.emit('trap:door', {pos: position - 88, isSecondFloor: true})
                    }
                    if (type === 'end') {
                        this.eventBus.emit('trap:window', position + buildBack.width - 212)
                    }
                } else {
                    buildBack = new PIXI.Sprite(this.resources.build2.textures.Build2Outroof)
                    buildConnect = new PIXI.Sprite(this.resources.build2.textures.Build2fOneConnect)
                    buildContainer.outroof = true
                    buildBack.anchor.set(0.5)
                    buildBack.position.set(position + buildBack.width / 2, this.worldCoords.ground - 2)
                    if (Math.random() < 0.5) {
                        this.eventBus.emit('wall:createInBuild', {pos: position + buildBack.width - 250, isSecondFloor: true, isRoof: true})
                    }
                    if (Math.random() < 0.5) {
                        this.eventBus.emit('wall:createInBuild', {pos: position + 150, isSecondFloor: true, isRoof: true})
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
        buildContainer.resetSpawnZones = [
            {
                x: bounds.x - 50,
                w: bounds.x + 150
            },
            {
                x: bounds.x + bounds.width - 50,
                w: bounds.x + bounds.width + 150
            }
        ]
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

        this.eventBus.emit('wall:clear', position)

        if (type === 'start') {
            buildBack = new PIXI.Sprite(this.resources.build1.textures.Build1FOne)
            buildFront = new PIXI.Sprite(this.resources.build1.textures.Build1FOneClose)
            this.eventBus.emit('trap:door', {pos: position + 32})

            if (Math.random() < 0.5) {
                this.eventBus.emit('trap:door', {pos: position + buildBack.width - 72})
            }
            if (Math.random() < 0.5) {
                this.eventBus.emit('wall:createInBuild', {pos: position + buildBack.width / 2})
            }
        } else {
            const rand = Math.random()
            if (rand < 0.5) {
                buildBack = new PIXI.Sprite(this.resources.build1.textures.Build1FTwo)
                buildFront = new PIXI.Sprite(this.resources.build1.textures.Build1FTwoClose)
                if (Math.random() < 0.5) {
                    this.eventBus.emit('wall:createInBuild', {pos: position + buildBack.width - 150})
                }
                if (Math.random() < 0.5) {
                    this.eventBus.emit('trap:door', {pos: position + buildBack.width - 72})
                }
            } else {
                buildBack = new PIXI.Sprite(this.resources.build1.textures.Build1FThree)
                buildFront = new PIXI.Sprite(this.resources.build1.textures.Build1FThreeClose)
                if (Math.random() < 0.5) {
                    this.eventBus.emit('wall:createInBuild', {pos: position + buildBack.width - 150})
                }
                if (Math.random() < 0.5) {
                    this.eventBus.emit('wall:createInBuild', {pos: position + buildBack.width - 340})
                }
                if (Math.random() < 0.5) {
                    this.eventBus.emit('trap:door', {pos: position + buildBack.width - 72})
                }
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
        buildBack.position.set(position + buildBack.width / 2, this.worldCoords.ground - 97)
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
        buildContainer.resetSpawnZones = [
            {
                x: bounds.x - 50,
                w: bounds.x + 150
            },
            {
                x: bounds.x + bounds.width - 50,
                w: bounds.x + bounds.width + 150
            }
        ]
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

        this.eventBus.emit('wall:clear', position + clubBack.width / 2)
        
        for (let i = 1; i <= 17; i++) {
            const rand = Math.floor(Math.random() * (9 - 1 + 1) + 1)
            const laserBeam = new PIXI.AnimatedSprite(this.resources.laserBeamTexture.animations[`render${rand}`])
            laserBeam.position.set(position + 526 + (i * 44), this.worldCoords.firstFloor - 234)
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
        clubBack.position.set(position + clubBack.width / 2, this.worldCoords.ground - 97)
        clubFront.position.set(position + clubFront.width / 2, clubBack.y)
        clubContainer.club = true
        
        if (Math.random() < 0.5) {
            this.eventBus.emit('wall:createInClub', {pos: position + 190, type: 0})
        }
        if (Math.random() < 0.5) {
            this.eventBus.emit('wall:createInClub', {pos: position + 410, type: 1})
        }
        if (Math.random() < 0.5) {
            this.eventBus.emit('wall:createInClub', {pos: position + 540, type: 1})
        }
        if (Math.random() < 0.1) {
            this.eventBus.emit('boss:create', {pos: clubBack.x + 130, type: 4})
        } else {
            if (Math.random() < 0.5) {
                this.eventBus.emit('wall:createInClub', {pos: position + 840, type: 0})
            }
            if (Math.random() < 0.5) {
                this.eventBus.emit('wall:createInClub', {pos: position + 1300, type: 0})
            }
        }
        if (Math.random() < 0.5) {
            this.eventBus.emit('wall:createInClub', {pos: position + 1600, type: 2})
        }
        if (Math.random() < 0.5) {
            this.eventBus.emit('wall:createInClub', {pos: position + 1900, type: 2})
        }
        
        clubContainer.addChild(clubBack)
        clubContainer.addChild(clubFront)
        const bounds = clubContainer.getLocalBounds()
        clubContainer.resetSpawnZones = [
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
        clubContainer.body = Matter.Bodies.rectangle(clubBack.x, this.worldCoords.secondFloor + 50, clubBack.width + 20, 40, { isStatic: true })

        this.physicsManager.addBody(clubContainer.body)
        this.world.addChild(clubContainer)

        return clubContainer
    }

    update() {
        this.buildings.forEach((build, idx) => {
            const b = build.getBounds()
            if (b.x + b.width < 0) {
                if (build.club) {
                    this.isClub = false
                    this.isBuilding = false
                }
                this.clear(this.buildings[idx])
                this.buildings.splice(idx, 1)
            }
        })
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
        this.world.removeChild(build)
    }
}
