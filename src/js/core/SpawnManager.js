import { random } from '../utils/GameUtils.js'
import {BuildingManager} from "../environment/managers/Building";
import {PuddleManager} from "../environment/managers/Puddle";
import {WallManager} from "../environment/managers/Wall";
import {TrapManager} from "../environment/managers/Trap";

/**
 * Менеджер спавна сущностей
 */
export class SpawnManager {
    constructor(gameState, physicsManager, ground, fg, world, worldCoords, resources, sleep, gameConfig, eventBus) {
        this.gameState = gameState
        this.world = world
        this.worldCoords = worldCoords
        this.resources = resources
        this.eventBus = eventBus
        this.sleep = sleep
        this.gameConfig = gameConfig
        this.physicsManager = physicsManager
        this.ground = ground
        this.fg = fg

        this.buildingManager = new BuildingManager(world, physicsManager, ground, worldCoords, gameConfig, fg, resources, eventBus)
        this.puddleManager = new PuddleManager(gameState, world, worldCoords, resources, eventBus, sleep)
        this.wallManager = new WallManager(world, ground, worldCoords, resources, eventBus)
        this.trapManager = new TrapManager(world, gameState, worldCoords, ground, fg, resources, eventBus)

        this.currentBoss = null
        this.currentDogEnemy = null
        this.activePowerUp = null
        this.currentCan = null

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
        if (!this.currentBoss) {
            this.buildingManager.createBuildingChance()
        }

        // Спавн босса или бочки
        if (!this.buildingManager.getIsBuilding() && !this.currentBoss && (this.buildingManager.getAfterBuilding() < this.worldCoords.zeroRight - this.worldCoords.worldWidth / 2)) {
            // if (Math.random() < Math.min(this.gameState.points / 40000, 0.1) && this.gameState.points > 2000) {
            //     if (this.createBossCallback) {
            //         this.createBossCallback(random(1, 3))
            //     }
            //     return
            // }
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

        return;

        // Спавн пауэр-апа
        if (Math.random() < 0.05 && !this.activePowerUp && this.createPowerUpCallback) {
            this.createPowerUpCallback()
        }
        
        // Спавн врага-собаки
        if (Math.random() < 0.05 && !this.currentDogEnemy && this.gameState.points > 2000 && this.createDogEnemyCallback) {
            this.createDogEnemyCallback()
        }
        
        // Спавн врага
        if (Math.random() < 0.5 && this.createEnemyCallback) {
            this.createEnemyCallback()
        }
        
        // Спавн банки
        if (Math.random() < 0.1 && !this.currentCan && this.createCanCallback) {
            this.createCanCallback()
        }
    }
    
    /**
     * Определяет тип врага на основе очков игрока
     */
    getEnemyType() {
        const rand = random(1, 100)
        let enemyType = 'default'
        
        switch (true) {
            case rand > Math.max(180 - this.gameState.points / 100, 90):
                enemyType = 'shield'
                break
            case rand > Math.max(150 - this.gameState.points / 100, 75):
                enemyType = 'silence'
                break
            case rand > Math.max(130 - this.gameState.points / 100, 60):
                enemyType = 'shotgun'
                break
            case rand > Math.max(115 - this.gameState.points / 100, 50):
                enemyType = 'smg'
                break
            case rand > Math.max(95 - this.gameState.points / 100, 20):
                enemyType = 'nigga'
                break
            case rand > 0:
                enemyType = 'default'
                break
        }
        
        return enemyType
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
