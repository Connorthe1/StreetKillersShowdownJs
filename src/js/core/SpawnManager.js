/**
 * SpawnManager.js
 * 
 * Менеджер спавна игровых сущностей
 * 
 * Содержит:
 * - Управление спавном врагов (createEnemy, createDogEnemy, createBoss)
 * - Управление спавном пауэр-апов (createPowerUp)
 * - Управление спавном объектов окружения
 * - Логика определения типа врага на основе очков
 * - Функция spawnEntity() - главная функция спавна
 */

import { random } from '../utils/GameUtils.js'
import { BUILDING_CHANCE } from '../core/GameConfig.js'

/**
 * Менеджер спавна сущностей
 */
export class SpawnManager {
    constructor(gameState, world, enemies, buildings, currentBoss, currentDogEnemy, activePowerUp, bgCar, currentCan, isBuilding, isClub, afterBuilding, worldCoords, WORLD_WIDTH) {
        this.gameState = gameState
        this.world = world
        this.enemies = enemies
        this.buildings = buildings
        this.currentBoss = currentBoss
        this.currentDogEnemy = currentDogEnemy
        this.activePowerUp = activePowerUp
        this.bgCar = bgCar
        this.currentCan = currentCan
        this.isBuilding = isBuilding
        this.isClub = isClub
        this.afterBuilding = afterBuilding
        this.worldCoords = worldCoords
        this.WORLD_WIDTH = WORLD_WIDTH
        
        // Константы
        this.buildingChance = BUILDING_CHANCE
        
        // Callbacks для создания объектов
        this.createPowerUpCallback = null
        this.createDogEnemyCallback = null
        this.createBgCarCallback = null
        this.createPuddleCallback = null
        this.spawnBuildingCallback = null
        this.createClubCallback = null
        this.createEnemyCallback = null
        this.createCanCallback = null
        this.createBossCallback = null
        this.createBarrelCallback = null
    }
    
    /**
     * Устанавливает колбэки для создания объектов
     */
    setCallbacks(callbacks) {
        if (callbacks.createPowerUp) this.createPowerUpCallback = callbacks.createPowerUp
        if (callbacks.createDogEnemy) this.createDogEnemyCallback = callbacks.createDogEnemy
        if (callbacks.createBgCar) this.createBgCarCallback = callbacks.createBgCar
        if (callbacks.createPuddle) this.createPuddleCallback = callbacks.createPuddle
        if (callbacks.spawnBuilding) this.spawnBuildingCallback = callbacks.spawnBuilding
        if (callbacks.createClub) this.createClubCallback = callbacks.createClub
        if (callbacks.createEnemy) this.createEnemyCallback = callbacks.createEnemy
        if (callbacks.createCan) this.createCanCallback = callbacks.createCan
        if (callbacks.createBoss) this.createBossCallback = callbacks.createBoss
        if (callbacks.createBarrel) this.createBarrelCallback = callbacks.createBarrel
    }
    
    /**
     * Обновляет состояние для спавна
     */
    updateState(state) {
        if (state.currentBoss !== undefined) this.currentBoss = state.currentBoss
        if (state.currentDogEnemy !== undefined) this.currentDogEnemy = state.currentDogEnemy
        if (state.activePowerUp !== undefined) this.activePowerUp = state.activePowerUp
        if (state.bgCar !== undefined) this.bgCar = state.bgCar
        if (state.currentCan !== undefined) this.currentCan = state.currentCan
        if (state.isBuilding !== undefined) this.isBuilding = state.isBuilding
        if (state.isClub !== undefined) this.isClub = state.isClub
        if (state.afterBuilding !== undefined) this.afterBuilding = state.afterBuilding
        if (state.zeroRight !== undefined) this.zeroRight = state.zeroRight
    }
    
    /**
     * Главная функция спавна сущностей
     */
    spawnEntity() {
        // Спавн пауэр-апа
        if (Math.random() < 0.05 && !this.activePowerUp && this.createPowerUpCallback) {
            this.createPowerUpCallback()
        }
        
        // Спавн врага-собаки
        if (Math.random() < 0.05 && !this.currentDogEnemy && this.gameState.points > 2000 && this.createDogEnemyCallback) {
            this.createDogEnemyCallback()
        }
        
        // Спавн фоновой машины
        if (Math.random() < 0.5 && !this.bgCar && this.createBgCarCallback) {
            this.createBgCarCallback()
        }
        
        // Спавн лужи
        if (Math.random() < 0.2 && this.createPuddleCallback) {
            this.createPuddleCallback()
        }
        
        // Спавн зданий
        if (!this.isClub && !this.currentBoss) {
            const randomBuild = Math.floor(Math.random() * (10 - 1 + 1) + 1)
            switch (true) {
                case randomBuild <= this.buildingChance:
                    if (this.isBuilding) {
                        if (this.spawnBuildingCallback) {
                            this.spawnBuildingCallback('continue')
                        }
                    } else {
                        if (this.buildings.length === 0) {
                            const testClub = Math.floor(Math.random() * (10 - 1 + 1) + 1)
                            this.isBuilding = true
                            if (testClub === 1) {
                                this.isClub = true
                                if (this.createClubCallback) {
                                    this.createClubCallback()
                                }
                                return
                            }
                            if (this.spawnBuildingCallback) {
                                this.spawnBuildingCallback('start')
                            }
                        }
                    }
                    break
                default:
                    if (this.isBuilding) {
                        this.isBuilding = false
                        if (this.spawnBuildingCallback) {
                            this.spawnBuildingCallback('end')
                        }
                    }
                    break
            }
        }
        
        // Спавн врага
        if (Math.random() < 0.5 && this.createEnemyCallback) {
            this.createEnemyCallback()
        }
        
        // Спавн банки
        if (Math.random() < 0.1 && !this.currentCan && this.createCanCallback) {
            this.createCanCallback()
        }
        
        // Спавн босса или бочки
        if (!this.isBuilding && !this.currentBoss && (this.afterBuilding < this.zeroRight - this.WORLD_WIDTH / 2)) {
            if (Math.random() < Math.min(this.gameState.points / 40000, 0.1) && this.gameState.points > 2000) {
                if (this.createBossCallback) {
                    this.createBossCallback(random(1, 3))
                }
                return
            }
            if (Math.random() < 0.3 && this.createBarrelCallback) {
                this.createBarrelCallback()
                return
            }
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
    
    /**
     * Получает состояние для обновления
     */
    getState() {
        return {
            isBuilding: this.isBuilding,
            isClub: this.isClub
        }
    }
}
