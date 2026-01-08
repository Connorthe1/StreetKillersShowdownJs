/**
 * GameManager.js
 * 
 * Главный координатор всех игровых систем
 * 
 * Содержит:
 * - Координация всех менеджеров
 * - Управление игровым циклом
 * - Инициализация всех систем
 * - Управление жизненным циклом игры
 */

/**
 * Главный менеджер игры
 */
export class GameManager {
    constructor() {
        // Менеджеры (будут установлены позже)
        this.gameState = null
        this.physicsManager = null
        this.particleManager = null
        this.bulletManager = null
        this.environmentManager = null
        this.spawnManager = null
        this.eventManager = null
        this.hudManager = null
        this.cameraManager = null
        this.storageManager = null
        this.resourceLoader = null
        this.scoreManager = null
        this.collisionDetector = null
        this.enemyManager = null
        this.grenadeManager = null
        this.trapManager = null
        this.moneyManager = null
        this.powerUpManager = null
        this.dogEnemyManager = null
        this.explosionManager = null
        this.meleeKillManager = null
        this.menuManager = null
        this.endScreenManager = null
        this.playerDamageManager = null
        // Менеджеры окружения
        this.backgroundManager = null
        this.groundManager = null
        this.bgCarManager = null
        this.garbageManager = null
        this.puddleManager = null
        this.canManager = null
        this.buildingManager = null
        this.wallManager = null
        this.zipLineManager = null
        
        // Игровые объекты
        this.world = null
        this.hud = null
        this.app = null
        this.player = null
        
        // Состояние
        this.isInitialized = false
    }
    
    /**
     * Устанавливает менеджеры
     */
    setManagers(managers) {
        if (managers.gameState) this.gameState = managers.gameState
        if (managers.physicsManager) this.physicsManager = managers.physicsManager
        if (managers.particleManager) this.particleManager = managers.particleManager
        if (managers.bulletManager) this.bulletManager = managers.bulletManager
        if (managers.environmentManager) this.environmentManager = managers.environmentManager
        if (managers.spawnManager) this.spawnManager = managers.spawnManager
        if (managers.eventManager) this.eventManager = managers.eventManager
        if (managers.hudManager) this.hudManager = managers.hudManager
        if (managers.cameraManager) this.cameraManager = managers.cameraManager
        if (managers.storageManager) this.storageManager = managers.storageManager
        if (managers.resourceLoader) this.resourceLoader = managers.resourceLoader
        if (managers.scoreManager) this.scoreManager = managers.scoreManager
        if (managers.collisionDetector) this.collisionDetector = managers.collisionDetector
        if (managers.enemyManager) this.enemyManager = managers.enemyManager
        if (managers.grenadeManager) this.grenadeManager = managers.grenadeManager
        if (managers.trapManager) this.trapManager = managers.trapManager
        if (managers.moneyManager) this.moneyManager = managers.moneyManager
        if (managers.powerUpManager) this.powerUpManager = managers.powerUpManager
        if (managers.dogEnemyManager) this.dogEnemyManager = managers.dogEnemyManager
        if (managers.explosionManager) this.explosionManager = managers.explosionManager
        if (managers.meleeKillManager) this.meleeKillManager = managers.meleeKillManager
        if (managers.menuManager) this.menuManager = managers.menuManager
        if (managers.endScreenManager) this.endScreenManager = managers.endScreenManager
        if (managers.playerDamageManager) this.playerDamageManager = managers.playerDamageManager
        // Менеджеры окружения
        if (managers.backgroundManager) this.backgroundManager = managers.backgroundManager
        if (managers.groundManager) this.groundManager = managers.groundManager
        if (managers.bgCarManager) this.bgCarManager = managers.bgCarManager
        if (managers.garbageManager) this.garbageManager = managers.garbageManager
        if (managers.puddleManager) this.puddleManager = managers.puddleManager
        if (managers.canManager) this.canManager = managers.canManager
        if (managers.buildingManager) this.buildingManager = managers.buildingManager
        if (managers.wallManager) this.wallManager = managers.wallManager
        if (managers.zipLineManager) this.zipLineManager = managers.zipLineManager
    }
    
    /**
     * Устанавливает игровые объекты
     */
    setGameObjects(objects) {
        if (objects.world) this.world = objects.world
        if (objects.hud) this.hud = objects.hud
        if (objects.app) this.app = objects.app
        if (objects.player) this.player = objects.player
    }
    
    /**
     * Инициализация всех систем
     */
    async initialize(config) {
        if (this.isInitialized) {
            console.warn('GameManager already initialized')
            return
        }
        
        // Инициализация будет выполнена в main.js
        // Этот метод можно использовать для дополнительной настройки
        
        this.isInitialized = true
    }
    
    /**
     * Обновление всех систем (вызывается в игровом цикле)
     */
    update(delta, gameSpeed, zeroLeft, zeroRight, WORLD_WIDTH) {
        if (!this.isInitialized) return
        
        // Обновление физики
        if (this.physicsManager) {
            this.physicsManager.update()
        }
        
        // Обновление пуль
        if (this.bulletManager) {
            this.bulletManager.updateBullets(zeroLeft, zeroRight, WORLD_WIDTH, gameSpeed)
        }
        
        // Обновление частиц
        if (this.particleManager) {
            this.particleManager.updateParticles(zeroLeft)
            this.particleManager.updateBounceParticles()
            this.particleManager.updateTrailParticles(zeroLeft)
        }
        
        // Обновление камеры
        if (this.cameraManager && this.player) {
            this.cameraManager.update(this.player.x, gameSpeed, gameSpeed)
        }
        
        // Обновление HUD
        if (this.hudManager) {
            this.hudManager.updatePoints()
            this.hudManager.updateMultiplier()
            if (this.app) {
                this.hudManager.updateFPS(this.app.ticker.FPS)
            }
        }
    }
    
    /**
     * Очистка всех систем
     */
    cleanup() {
        // Очистка менеджеров
        if (this.particleManager) {
            this.particleManager.clear()
        }
        
        if (this.bulletManager) {
            this.bulletManager.clear()
        }
        
        if (this.environmentManager) {
            this.environmentManager.clear()
        }
        
        if (this.cameraManager) {
            this.cameraManager.reset()
            this.cameraManager.stopShake()
        }
        
        if (this.eventManager) {
            this.eventManager.destroy()
        }
        
        this.isInitialized = false
    }
    
    /**
     * Получение состояния игры
     */
    getGameState() {
        return {
            isInitialized: this.isInitialized,
            gameState: this.gameState,
            player: this.player
        }
    }
    
    /**
     * Получение всех менеджеров
     */
    getManagers() {
        return {
            gameState: this.gameState,
            physicsManager: this.physicsManager,
            particleManager: this.particleManager,
            bulletManager: this.bulletManager,
            environmentManager: this.environmentManager,
            spawnManager: this.spawnManager,
            eventManager: this.eventManager,
            hudManager: this.hudManager,
            cameraManager: this.cameraManager,
            storageManager: this.storageManager,
            resourceLoader: this.resourceLoader,
            scoreManager: this.scoreManager,
            collisionDetector: this.collisionDetector,
            enemyManager: this.enemyManager,
            grenadeManager: this.grenadeManager,
            trapManager: this.trapManager,
            moneyManager: this.moneyManager,
            powerUpManager: this.powerUpManager,
            dogEnemyManager: this.dogEnemyManager,
            explosionManager: this.explosionManager,
            meleeKillManager: this.meleeKillManager,
            menuManager: this.menuManager,
            endScreenManager: this.endScreenManager,
            playerDamageManager: this.playerDamageManager,
            backgroundManager: this.backgroundManager,
            groundManager: this.groundManager,
            bgCarManager: this.bgCarManager,
            garbageManager: this.garbageManager,
            puddleManager: this.puddleManager,
            canManager: this.canManager,
            buildingManager: this.buildingManager,
            wallManager: this.wallManager,
            zipLineManager: this.zipLineManager
        }
    }
}
