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

        eventBus.on('spawn:entity', data => {
            this.spawnEntity()
        })
    }
    
    /**
     * Главная функция спавна сущностей
     */
    spawnEntity() {
        // Спавн лужи
        if (Math.random() < 0.2) {
            this.puddleManager.create(this.buildingManager.getBuildings())
        }

        // Спавн зданий
        if (!this.bossManager.hasActiveBoss()) {
            this.buildingManager.createBuildingChance()
        }

        // Спавн банки
        if (Math.random() < 0.1) {
            this.canManager.create({buildings: this.buildingManager.getBuildings()})
        }

        // Спавн пауэр-апа
        if (Math.random() < 0.05) {
            this.powerUpManager.create({buildings: this.buildingManager.getBuildings()})
        }

        // Спавн врага
        if (Math.random() < 0.5) {
            this.enemyManager.create({
                buildings: this.buildingManager.getBuildings(),
                traps: this.trapManager.getTraps(),
                boss: this.bossManager.getBoss()
            })
        }

        // Спавн врага-собаки
        if (Math.random() < 0.05 && this.gameState.points > 2000) {
            this.dogEnemyManager.create({buildings: this.buildingManager.getBuildings(), afterBuilding: this.buildingManager.getAfterBuilding()})
        }

        // Спавн машины на фоне
        if (Math.random() > 0.5) {
            this.carManager.create()
        }

        // Создание деревянных элементов на фоне
        if (Math.random() > 0.5) {
            this.woodBGManager.create(this.worldCoords.zeroRight, this.worldCoords.firstFloor)
        }

        // Создание мусора рядом с полом (если в здании)
        if (Math.random() > 0.75 && !this.buildingManager.getIsBuilding()) {
            const posX = random(10, 100)
            const posY = random(35, 45)
            this.garbageManager.create(this.worldCoords.zeroRight + posX, this.worldCoords.firstFloor + posY)
        }

        if (Math.random() > 0.75 && !this.buildingManager.getIsBuilding()) {
            const posX = random(10, 100)
            const posY = random(5, 15)
            this.garbageManager.create(this.worldCoords.zeroRight + posX, this.worldCoords.firstFloor + posY)
        }

        // Спавн босса или бочки
        if (!this.buildingManager.getIsBuilding() && !this.bossManager.hasActiveBoss() && (this.buildingManager.getAfterBuilding() < this.worldCoords.zeroRight - this.worldCoords.worldWidth / 2)) {
            if (Math.random() < Math.min(this.gameState.points / 40000, 0.1) && this.gameState.points > 2000) {
                this.bossManager.create(random(1, 3))
                return
            }
            if (Math.random() < 0.5) {
                this.trapManager.createBarrel({afterBuilding: this.buildingManager.getAfterBuilding(), enemies: this.enemyManager.getEnemies()})
                return
            }
            if (Math.random() < 0.5) {
                this.wallManager.createWall(null, false, this.buildingManager.getAfterBuilding())
                return
            }
        }
    }

    update(gameSpeed) {
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
