import { soundPlayer } from './playSound.js'
import * as PIXI from 'pixi.js'
import { Layer, Group, Stage } from '@pixi/layers';
import { Player } from './core/Player.js'
import { GAME_SCALE, DEFAULT_GAME_SPEED, SLOW_GAME_SPEED, BG_SPEED, initGameConfig } from './core/GameConfig.js'
import { GameState } from './core/GameState.js'
import { StorageManager } from './storage/StorageManager.js'
import { ResourceLoader } from './resources/ResourceLoader.js'
import { PhysicsManager } from './physics/PhysicsManager.js'
import { ParticleManager } from './entities/Particle.js'
import { BulletManager } from './entities/projectiles/BulletManager.js'
import { BackgroundManager } from './environment/Background.js'
import { GroundManager } from './environment/managers/GroundManager.js'
import { ZipLineManager } from './environment/zipLines/ZipLineManager.js'
import { SpawnManager } from './core/SpawnManager.js'
import { HUDManager } from './ui/HUD.js'
import { CameraManager } from './core/CameraManager.js'
import { HandGrenade } from './entities/HandGrenade.js'
import { MoneyManager } from './entities/money/MoneyManager.js'
import { InputHandler } from './core/InputHandler.js'
import { ExplosionManager } from './entities/ExplosionManager.js'
import { MeleeKillManager } from './ui/MeleeKill.js'
import { MenuManager } from './ui/Menu.js'
import { EndScreenManager } from './ui/EndScreen.js'
import { EventBus } from './utils/EventBus.js'
import {InteractionSystem} from "./physics/InteractionSystem";
import {GameTimer} from "./core/GameTimer";

// Экземпляр игрока
let playerInstance = null
// Инициализация размеров экрана
let gameWidth
let gameHeight
if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|BB|PlayBook|IEMobile|Windows Phone|Kindle|Silk|Opera Mini/i.test(navigator.userAgent)) {
    gameWidth = screen.width
    gameHeight = screen.height
} else {
    gameWidth = document.documentElement.clientWidth;
    gameHeight = document.documentElement.clientHeight;
}

// Инициализация конфигурации игры
const gameConfig = initGameConfig(gameWidth, gameHeight)
const { WORLD_WIDTH, WORLD_HEIGHT, textStyles } = gameConfig
const gameSpeed = {
    current: DEFAULT_GAME_SPEED,
    default: DEFAULT_GAME_SPEED,
    slow: SLOW_GAME_SPEED
}
const worldCoords = {
    zeroLeft: 0,
    zeroRight: WORLD_WIDTH,
    firstFloor: WORLD_HEIGHT - 230,
    secondFloor: WORLD_HEIGHT - 420,
    worldWidth: WORLD_WIDTH,
    worldHeight: WORLD_HEIGHT,
}

// Инициализация состояния игры
let gameState
let music = null

let bulletManager // Инициализируется после создания world

let world
let groundContainer
let hudContainer

// Менеджеры окружения и сущностей
let backgroundManager // Инициализируется после создания world
let groundManager // Инициализируется после создания world
let zipLineManager // Инициализируется после создания world

// Массивы частиц теперь управляются через ParticleManager
// Массивы окружения теперь управляются через отдельные менеджеры
let particleManager // Инициализируется после создания world
let spawnManager // Инициализируется после создания world
let hudManager // Инициализируется после создания hud
let cameraManager // Инициализируется после создания world
let grenadeManager // Менеджер гранат
let moneyManager // Менеджер денег
let explosionManager // Менеджер взрывов
let meleeKillManager // Менеджер ближнего боя
let menuManager // Менеджер меню
let endScreenManager // Менеджер экрана окончания
let interactionSystem
let timer

// Инициализация менеджера физики
const physicsManager = new PhysicsManager()
const eventBus = new EventBus()
let foregroundContainer
let hudLayer

//STORAGE
// Инициализация менеджера хранилища
const storageManager = new StorageManager()
// Для обратной совместимости оставляем storage как ссылку на storageManager.storage
let storage = storageManager.getStorage()

window.onload = async function () {
    const app = new PIXI.Application({
        width: gameWidth,
        height: gameHeight,
        backgroundColor: 'black',
        resolution: window.devicePixelRatio,
        useContextAlpha: false,
        antialias: false
    })
    globalThis.__PIXI_APP__ = app;
    app.stage = new Stage();
    document.body.appendChild(app.view)
    // Инициализация физического движка
    physicsManager.init(1);
    app.stage.sortableChildren = true;

    hudLayer = new Group(99, true)
    app.stage.addChild(new Layer(hudLayer));
    PIXI.BaseTexture.defaultOptions.scaleMode = 0

    // Инициализация загрузчика ресурсов
    const resourceLoader = new ResourceLoader()
    
    // Загрузка загрузочного экрана
    await resourceLoader.loadLoaderScreen(app, gameWidth, gameHeight)

    // Загрузка всех ресурсов
    const resources = await resourceLoader.loadAllAssets()

    // Удаление загрузочного экрана
    resourceLoader.removeLoaderScreen(app)
    init()

    function init() {
        world = new PIXI.Container()
        world.name = 'world'
        world.sortableChildren = true;
        world.scale.set(GAME_SCALE)
        app.stage.addChild(world)

        hudContainer = new PIXI.Container()
        hudContainer.name = 'hud'
        hudContainer.sortableChildren = true;
        hudContainer.parentGroup = hudLayer
        hudContainer.zOrder = 99
        app.stage.addChild(hudContainer)

        foregroundContainer = new Group(9, true)
        world.addChild(new Layer(foregroundContainer));

        groundContainer = new PIXI.Container()
        groundContainer.name = 'ground'
        world.addChild(groundContainer)

        timer = new GameTimer();

        gameState = new GameState(eventBus)

        groundManager = new GroundManager(world, groundContainer, physicsManager, resources, worldCoords, eventBus)

        worldCoords.firstFloor = groundContainer.getLocalBounds().y + 70
        worldCoords.secondFloor = groundContainer.getLocalBounds().y - 120
        worldCoords.ground = groundContainer.getLocalBounds().y

        particleManager = new ParticleManager(world, physicsManager, groundContainer, resources, gameState, eventBus)

        bulletManager = new BulletManager(world, gameState, resources, timer, eventBus, physicsManager)

        backgroundManager = new BackgroundManager(world, worldCoords, gameHeight, resources, gameState)

        // Initialize player instance
        playerInstance = new Player(world, gameState, resources, storage, worldCoords, timer, eventBus)
          // Инициализация менеджера спавна
        spawnManager = new SpawnManager(gameState, physicsManager, foregroundContainer, world, worldCoords, resources, timer, storage, eventBus)
        
        zipLineManager = new ZipLineManager(world, worldCoords, resources, eventBus)
        
        // Инициализация менеджера HUD
        hudManager = new HUDManager(app, storage, hudContainer, gameState, gameWidth, gameHeight, textStyles, resources, eventBus)
        
        // Инициализация менеджера камеры
        cameraManager = new CameraManager(world, gameState, worldCoords, eventBus)

        meleeKillManager = new MeleeKillManager(hudContainer, gameState, gameWidth, gameHeight, timer, eventBus)

        explosionManager = new ExplosionManager(world, resources, eventBus)

        grenadeManager = new HandGrenade(world, physicsManager, worldCoords, resources, timer, eventBus)

        moneyManager = new MoneyManager(world, physicsManager, worldCoords, resources, eventBus)

        endScreenManager = new EndScreenManager(app, gameState, gameWidth, gameHeight, textStyles, resources, storageManager, eventBus)

        eventBus.on('endScreen:stopMusic', () => {
            music.stop()
        })
        eventBus.on('endScreen:restart', () => {
            restartGame()
        })

        //SLOW MODE
        eventBus.on('gameSpeed:default', () => {
            gameSpeed.current = gameSpeed.default
        })
        eventBus.on('gameSpeed:slow', () => {
            gameSpeed.current = gameSpeed.slow
        })

        eventBus.on('game:pause', () => {
            pauseGame()
        })
        eventBus.on('game:resume', () => {
            resumeGame()
        })

        // Инициализация менеджера меню
        menuManager = new MenuManager(app, gameState, gameWidth, gameHeight, textStyles, resources, storageManager, timer, eventBus)

        eventBus.on('menu:startGame', () => {
            startGame()
        })

        menuManager.createMenu()

        interactionSystem = new InteractionSystem()
    }

    function startGame() {
        playerInstance.createPlayer(-100, worldCoords.firstFloor, foregroundContainer)
        playerInstance.setGunParams()

        hudManager.init(playerInstance)

        music = soundPlayer.startMusic()
        
        // Инициализация обработчика ввода (для свайпов)
        const inputHandler = new InputHandler(app.renderer.view, gameState, storage, eventBus)

        // Старый обработчик оставлен для обратной совместимости
        app.ticker.maxFPS = 60
        app.ticker.minFPS = 60
        app.ticker.add(ticker)

        gameSpeed.current = gameSpeed.default
    }

    function restartGame() {
        music.destroy()
        music = null
        // app.stage.removeChild(app.stage.getChildByName('endScreen'))
        app.stage.removeChild(world)
        app.stage.removeChild(world)
        app.ticker.remove(ticker)

        resetWorldCoords()
        gameSpeed.current = gameSpeed.default

        gameState.reset()
        bulletManager.clear()

        world = null
        groundContainer = null
        hudContainer = null

        // Обновление ссылок на массивы для обратной совместимости

        particleManager.clear()
        zipLineManager.clear()

        init()
    }

    function ticker(delta) {
        if (gameState.gameEnd || gameState.isPause) return
        timer.update(app.ticker.elapsedMS);

        if (!gameState.gameStart && menuManager.menu) {
            menuManager.menu.x -= 20
        }

        if (!gameState.gameStart && playerInstance.sprite.x > 10) {
            gameState.gameStart = true
            menuManager.clear()
        }

        if (hudManager) {
            hudManager.update()
        }
        physicsManager.update();
        // Обновление ближнего боя через MeleeKillManager
        if (meleeKillManager) {
            meleeKillManager.update()
        }
        if (gameState) {
            gameState.update(app.ticker.elapsedMS, playerInstance.stimpack)
        }
        // Use the Player module's updatePlayer method
        if (playerInstance) {
            playerInstance.update(gameSpeed.current, delta)
        }
        // Обновление фона и пола через менеджеры
        if (backgroundManager) {
            backgroundManager.updateBg(worldCoords.zeroLeft, playerInstance.speed, gameSpeed.current)
        }
        if (groundManager) {
            groundManager.updateFloor(worldCoords.zeroLeft)
        }
        if (bulletManager) {
            bulletManager.update(worldCoords, gameSpeed.current)
        }
        if (spawnManager) {
            spawnManager.update(gameSpeed.current)
        }
        if (cameraManager) {
            cameraManager.update(app.ticker.elapsedMS)
        }
        if (grenadeManager) {
            grenadeManager.update()
        }
        if (moneyManager) {
            moneyManager.update()
        }

        particleManager.updateAllParticles(worldCoords.zeroLeft, playerInstance)

        interactionSystem.update({
            player: playerInstance,
            spawn: spawnManager,
            bullets: bulletManager,
            explosion: explosionManager,
            melee: meleeKillManager,
            zipLine: zipLineManager,
            money: moneyManager,
        })
    }

    function pauseGame() {
        const allAnimated = world.children.filter(item => item.animationSpeed)
        allAnimated.forEach(item => item.stop())
        music.set('paused', true)
        gameState.isPause = true
    }

    function resumeGame() {
        const allAnimated = world.children.filter(item => item.animationSpeed)
        allAnimated.forEach(item => item.play())
        music.set('paused', false)
        gameState.isPause = false
    }

    function resetWorldCoords() {
        worldCoords.zeroLeft = 0
        worldCoords.zeroRight = WORLD_WIDTH
    }
}
