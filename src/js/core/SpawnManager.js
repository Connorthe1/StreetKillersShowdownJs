import { random } from '../utils/GameUtils.js'
import {BuildingManager} from "../environment/managers/Building";
import {PuddleManager} from "../environment/puddles/PuddleManager";
import { WallsManager } from '../environment/walls/WallsManager.js'
import {TrapManager} from "../environment/traps/TrapsManager";
import {CanManager} from "../environment/Can";
import {PowerUpManager} from "../entities/PowerUp";
import {EnemyManager} from "../entities/enemies/EnemyManager";
import {DogEnemyManager} from "../entities/enemies/DogEnemy";
import {BossManager} from "../entities/enemies/Boss";
import {CarBG} from "../environment/classes/CarBG";
import {GarbageManager} from "../entities/garbage/GarbageManager";
import {WoodBG} from "../environment/classes/WoodBG";

const SPAWN_AHEAD = 50
const MIN_GAP = 40
const MAX_GAP = 190

/**
 * Менеджер спавна сущностей
 */
export class SpawnManager {
    constructor(gameState, physicsManager, fg, world, worldCoords, resources, timer, storage, eventBus) {
        this.gameState = gameState
        this.world = world
        this.worldCoords = worldCoords
        this.resources = resources
        this.eventBus = eventBus
        this.timer = timer
        this.physicsManager = physicsManager
        this.fg = fg
        this.storage = storage

        this.nextSpawnX = worldCoords.zeroRight + SPAWN_AHEAD

        this.buildingManager = new BuildingManager(world, physicsManager, worldCoords, fg, resources, eventBus)
        this.puddleManager = new PuddleManager(world, worldCoords, resources, eventBus, timer)
        this.wallManager = new WallsManager(world, worldCoords, resources, eventBus)
        this.trapManager = new TrapManager(world, worldCoords, fg, resources, timer, eventBus)
        this.canManager = new CanManager(world, physicsManager, fg, worldCoords, resources, storage, eventBus)
        this.carManager = new CarBG(world, resources, worldCoords)
        this.woodBGManager = new WoodBG(world, resources, worldCoords)
        this.garbageManager = new GarbageManager(world, resources, eventBus)

        this.powerUpManager = new PowerUpManager(world, fg, storage, worldCoords, resources, eventBus)

        this.enemyManager = new EnemyManager(world, gameState, worldCoords, resources, timer, eventBus)
        this.dogEnemyManager = new DogEnemyManager(world, gameState, worldCoords, fg, resources, eventBus)
        this.bossManager = new BossManager(world, gameState, worldCoords, resources, timer, eventBus)
    }
    
    getSpawnWeights() {
        return [
            { type: 'enemy',    weight: 40 },
            { type: 'wall',     weight: 15 },
            { type: 'barrel',   weight: 30 },
            { type: 'boss',     weight: 5 },
            { type: 'none',     weight: 10 },
        ]
    }

    pickEntityType() {
        const weights = this.getSpawnWeights()
        const total = weights.reduce((sum, e) => sum + e.weight, 0)
        if (total <= 0) return 'none'

        let roll = random(1, total)
        for (const entry of weights) {
            roll -= entry.weight
            if (roll <= 0) return entry.type
        }
        return 'none'
    }

    spawnEntity(posX) {
        this.spawnIndependent()

        const type = this.pickEntityType()

        const isBuilding = this.buildingManager.getIsBuilding(type === 'boss' ? posX + this.worldCoords.worldWidth : posX)
        const hasBoss = this.bossManager.hasActiveBoss()

        console.log(type)

        switch (type) {
            case 'enemy':
                this.enemyManager.create({
                    pos: posX,
                    buildings: this.buildingManager.getBuildings(),
                    boss: this.bossManager.getBoss()
                })
                break
            case 'wall':
                if (!isBuilding && !hasBoss) {
                    this.wallManager.createWall({
                        pos: posX,
                        afterBuilding: this.buildingManager.getAfterBuilding(),
                        forBoss: false
                    })
                }
                break
            case 'barrel':
                if (!isBuilding && !hasBoss) {
                    this.trapManager.createBarrel({
                        pos: posX,
                        afterBuilding: this.buildingManager.getAfterBuilding()
                    })
                }
                break
            case 'boss':
                if (!isBuilding && !hasBoss && this.gameState.points > 2000) {
                    this.bossManager.create({pos: posX + this.worldCoords.worldWidth, type: random(1, 3)})
                    this.advanceSpawnCursor(this.worldCoords.worldWidth * 1.5)
                }
                break
            case 'none':
                break
        }
    }

    spawnIndependent() {
        if (!this.bossManager.hasActiveBoss()) {
            this.buildingManager.createBuildingChance()
        }
        if (Math.random() < 0.2) {
            this.puddleManager.create(this.buildingManager.getBuildings())
        }
        if (Math.random() < 0.1) {
            this.canManager.create({ buildings: this.buildingManager.getBuildings() })
        }
        if (Math.random() < 0.05) {
            this.powerUpManager.create({ buildings: this.buildingManager.getBuildings() })
        }
        if (Math.random() < 0.05 && this.gameState.points > 2000) {
            this.dogEnemyManager.create({ buildings: this.buildingManager.getBuildings(), afterBuilding: this.buildingManager.getAfterBuilding() })
        }

        if (Math.random() > 0.5) {
            this.carManager.create()
        }
        if (Math.random() > 0.5) {
            this.woodBGManager.create(this.worldCoords.zeroRight, this.worldCoords.firstFloor)
        }
        if (Math.random() > 0.75 && !this.buildingManager.getIsBuilding()) {
            this.garbageManager.create(
                this.worldCoords.zeroRight + random(10, 100),
                this.worldCoords.firstFloor + random(5, 45)
            )
        }
    }

    advanceSpawnCursor(entityWidth = 30) {
        this.nextSpawnX += entityWidth + random(MIN_GAP, MAX_GAP)
    }

    update(gameSpeed) {
        while (this.nextSpawnX < this.worldCoords.zeroRight + SPAWN_AHEAD) {
            this.spawnEntity(this.nextSpawnX)
            this.advanceSpawnCursor()
        }

        this.carManager.update()
        this.trapManager.update()
        this.puddleManager.update()
        this.canManager.update()
        this.powerUpManager.update()
        this.bossManager.update(gameSpeed)
        this.enemyManager.update()
        this.dogEnemyManager.update(gameSpeed)
        this.buildingManager.update()
        this.woodBGManager.update()
        this.wallManager.update()
        this.garbageManager.update()
    }

    clear() {
        this.buildingManager.clear()
        this.puddleManager.clear()
        this.wallManager.clear()
        this.trapManager.clear()
        this.canManager.clear()
        this.carManager.clear()
        this.woodBGManager.clear()
        this.garbageManager.clear()
        this.powerUpManager.clear()
        this.enemyManager.clear()
        this.dogEnemyManager.clear()
        this.bossManager.clear()
    }
}
