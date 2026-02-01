import { random } from '../utils/GameUtils.js'
import {BuildingManager} from "../environment/managers/Building";
import {PuddleManager} from "../environment/managers/Puddle";
import {WallManager} from "../environment/managers/Wall";
import {TrapManager} from "../environment/managers/Trap";
import {CanManager} from "../environment/Can";
import {PowerUpManager} from "../entities/PowerUp";
import {EnemyManager} from "../entities/Enemy";
import {DogEnemyManager} from "../entities/DogEnemy";
import {BossManager} from "../entities/Boss";

/**
 * Менеджер спавна сущностей
 */
export class SpawnManager {
    constructor(gameState, physicsManager, ground, fg, world, worldCoords, resources, sleep, storage, eventBus) {
        this.gameState = gameState
        this.world = world
        this.worldCoords = worldCoords
        this.resources = resources
        this.eventBus = eventBus
        this.sleep = sleep
        this.physicsManager = physicsManager
        this.ground = ground
        this.fg = fg
        this.storage = storage

        this.buildingManager = new BuildingManager(world, physicsManager, ground, worldCoords, fg, resources, eventBus)
        this.puddleManager = new PuddleManager(gameState, world, worldCoords, resources, eventBus, sleep)
        this.wallManager = new WallManager(world, ground, worldCoords, resources, eventBus)
        this.trapManager = new TrapManager(world, gameState, worldCoords, ground, fg, resources, eventBus)
        this.canManager = new CanManager(world, physicsManager, gameState, fg, worldCoords, resources, storage, eventBus)

        this.powerUpManager = new PowerUpManager(world, gameState, fg, storage, worldCoords, resources, eventBus)

        this.enemyManager = new EnemyManager(world, gameState, worldCoords, resources, eventBus)
        this.dogEnemyManager = new DogEnemyManager(world, worldCoords, fg, resources, eventBus)
        this.bossManager = new BossManager(world, gameState, worldCoords, resources, sleep, eventBus)

        this.currentBoss = null

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
            this.puddleManager.createPuddle(this.buildingManager.getBuildings())
        }

        // Спавн зданий
        if (!this.bossManager.getCurrentBoss()) {
            this.buildingManager.createBuildingChance()
        }

        // Спавн банки
        if (Math.random() < 0.1) {
            this.canManager.createCan()
        }

        // Спавн пауэр-апа
        if (Math.random() < 0.05) {
            this.powerUpManager.createPowerUp()
        }

        // Спавн врага
        if (Math.random() < 0.5) {
            this.enemyManager.createEnemy()
        }

        // Спавн врага-собаки
        if (Math.random() < 0.05 && this.gameState.points > 2000) {
            this.dogEnemyManager.createDogEnemy()
        }

        // Спавн босса или бочки
        if (!this.buildingManager.getIsBuilding() && !this.bossManager.getCurrentBoss() && (this.buildingManager.getAfterBuilding() < this.worldCoords.zeroRight - this.worldCoords.worldWidth / 2)) {
            if (Math.random() < Math.min(this.gameState.points / 40000, 0.1) && this.gameState.points > 2000) {
                this.bossManager.createBoss(random(1, 3))
                return
            }
            if (Math.random() < 0.3) {
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
