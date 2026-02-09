import { random } from '../utils/GameUtils.js'
import {BuildingManager} from "../environment/managers/Building";
import {PuddleManager} from "../environment/puddles/PuddleManager";
import {WallManager} from "../environment/managers/Wall";
import {TrapManager} from "../environment/traps/TrapsManager";
import {CanManager} from "../environment/Can";
import {PowerUpManager} from "../entities/PowerUp";
import {EnemyManager} from "../entities/enemies/EnemyManager";
import {DogEnemyManager} from "../entities/DogEnemy";
import {BossManager} from "../entities/Boss";
import {CarBG} from "../environment/classes/CarBG";
import {GarbageManager} from "../entities/garbage/GarbageManager";
import {WoodBG} from "../environment/classes/WoodBG";

/**
 * Менеджер спавна сущностей
 */
export class SpawnManager {
    constructor(gameState, physicsManager, ground, fg, world, worldCoords, resources, timer, storage, eventBus) {
        this.gameState = gameState
        this.world = world
        this.worldCoords = worldCoords
        this.resources = resources
        this.eventBus = eventBus
        this.timer = timer
        this.physicsManager = physicsManager
        this.ground = ground
        this.fg = fg
        this.storage = storage

        this.buildingManager = new BuildingManager(world, physicsManager, ground, worldCoords, fg, resources, eventBus)
        this.puddleManager = new PuddleManager(world, worldCoords, resources, eventBus, timer)
        this.wallManager = new WallManager(world, ground, worldCoords, resources, eventBus)
        this.trapManager = new TrapManager(world, worldCoords, ground, fg, resources, timer, eventBus)
        this.canManager = new CanManager(world, physicsManager, fg, worldCoords, resources, storage, eventBus)
        this.carManager = new CarBG(world, resources, worldCoords)
        this.woodBGManager = new WoodBG(world, resources, worldCoords)
        this.garbageManager = new GarbageManager(world, resources, eventBus)

        this.powerUpManager = new PowerUpManager(world, fg, storage, worldCoords, resources, eventBus)

        this.enemyManager = new EnemyManager(world, gameState, worldCoords, resources, timer, eventBus)
        this.dogEnemyManager = new DogEnemyManager(world, worldCoords, fg, resources, eventBus)
        this.bossManager = new BossManager(world, gameState, worldCoords, resources, timer, eventBus)

        eventBus.on('spawn:entity', data => {
            this.spawnEntity()
        })
    }
    
    /**
     * Главная функция спавна сущностей
     */
    spawnEntity() {
        this.bossManager.create()
        // this.enemyManager.create()

        return
        // Спавн лужи
        if (Math.random() < 0.2) {
            this.puddleManager.create(this.buildingManager.getBuildings())
        }

        // Спавн зданий
        if (!this.bossManager.getCurrentBoss()) {
            this.buildingManager.createBuildingChance()
        }

        // Спавн банки
        if (Math.random() < 0.1) {
            this.canManager.create()
        }

        // Спавн пауэр-апа
        if (Math.random() < 0.05) {
            this.powerUpManager.create()
        }

        // Спавн врага
        if (Math.random() < 0.5) {
            this.enemyManager.create()
        }

        // Спавн врага-собаки
        if (Math.random() < 0.05 && this.gameState.points > 2000) {
            this.dogEnemyManager.createDogEnemy()
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
            this.garbageManager.createGarbage(this.worldCoords.zeroRight + posX, this.worldCoords.firstFloor + posY)
        }

        if (Math.random() > 0.75 && !this.buildingManager.getIsBuilding()) {
            const posX = random(10, 100)
            const posY = random(5, 15)
            this.garbageManager.createGarbage(this.worldCoords.zeroRight + posX, this.worldCoords.firstFloor + posY)
        }

        // Спавн босса или бочки
        if (!this.buildingManager.getIsBuilding() && !this.bossManager.getCurrentBoss() && (this.buildingManager.getAfterBuilding() < this.worldCoords.zeroRight - this.worldCoords.worldWidth / 2)) {
            if (Math.random() < Math.min(this.gameState.points / 40000, 0.1) && this.gameState.points > 2000) {
                this.bossManager.create(random(1, 3))
                return
            }
            if (Math.random() < 0.5) {
                console.log('trap')
                this.trapManager.createBarrel(this.buildingManager.getAfterBuilding())
                return
            }
            if (Math.random() < 0.5) {
                console.log('wall')
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
    }
    
    /**
     * Проверяет, можно ли спавнить врага в указанной позиции
     */
    canSpawnEnemyAtPosition(pos, enemyWidth = 30) {
        // Проверка на дубликаты
        const findDuplicate = this.enemies.findIndex(
            enemy => pos + enemyWidth > enemy.x && pos < enemy.x + enemy.width
        )
        if (findDuplicate >= 0) return false
        
        // Проверка на босса
        if (this.currentBoss) {
            if (pos + enemyWidth > this.currentBoss.x && pos < this.currentBoss.x + this.currentBoss.width) {
                return false
            }
        }
        
        // Проверка на зоны спавна зданий
        if (this.buildings.length > 0) {
            for (const build of this.buildings) {
                if (build.resetSpawnZones) {
                    for (const zone of build.resetSpawnZones) {
                        if (pos + enemyWidth > zone.x && pos < zone.w) {
                            return false
                        }
                    }
                }
            }
        }
        
        return true
    }
}
