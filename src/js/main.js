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
import { BulletManager } from './entities/BulletManager.js'
import { BackgroundManager } from './environment/Background.js'
import { GroundManager } from './environment/managers/GroundManager.js'
import { ZipLineManager } from './environment/managers/ZipLineManager.js'
import { SpawnManager } from './core/SpawnManager.js'
import { HUDManager } from './ui/HUD.js'
import { CameraManager } from './core/CameraManager.js'
import { GrenadeManager } from './entities/Grenade.js'
import { MoneyManager } from './entities/Money.js'
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

window.Telegram.WebApp.ready()
window.Telegram.WebApp.expand()

const timeouts = []
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

let distance = 0
// Инициализация состояния игры
let gameState
let music = null

let bulletManager // Инициализируется после создания world

// Окружение теперь управляется через отдельные менеджеры
let background
let bgPosition = 0
let bgSpeed = BG_SPEED

let world
let groundContainer
let hudContainer

// Менеджеры окружения и сущностей
let backgroundManager // Инициализируется после создания world
let groundManager // Инициализируется после создания world
let zipLineManager // Инициализируется после создания world

let enemies = []
// Массивы частиц теперь управляются через ParticleManager
// Массивы окружения теперь управляются через отдельные менеджеры
let buildings = []
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
let currentBoss = null
let activeGrenade = null
let interactionSystem
let timer

// Инициализация менеджера физики
const physicsManager = new PhysicsManager()
const eventBus = new EventBus()
let engine // Для обратной совместимости
let foregroundContainer
let hudLayer

// Флаги состояния теперь в gameState (isPause, isMenu, gameStart, gameEnd)

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
    engine = physicsManager.init(1);
    app.stage.sortableChildren = true;

    hudLayer = new Group(99, true)
    app.stage.addChild(new Layer(hudLayer));
    PIXI.BaseTexture.defaultOptions.scaleMode = 0

    // Инициализация загрузчика ресурсов
    const resourceLoader = new ResourceLoader()
    
    // Загрузка загрузочного экрана
    await resourceLoader.loadLoaderScreen(app, gameWidth, gameHeight)

    // Свайпы теперь обрабатываются через InputHandler в startGame()
    //VK load
    // await getData()

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
        // Инициализация менеджера частиц
        particleManager = new ParticleManager(world, physicsManager, groundContainer, resources, gameState, eventBus)

        bulletManager = new BulletManager(world, gameState, resources, timer, eventBus)

        backgroundManager = new BackgroundManager(world, worldCoords, gameHeight, resources, gameState)

        groundManager = new GroundManager(world, groundContainer, physicsManager, resources, worldCoords, eventBus)

        worldCoords.firstFloor = groundContainer.getLocalBounds().y + 70
        worldCoords.secondFloor = groundContainer.getLocalBounds().y - 120

        // Initialize player instance
        playerInstance = new Player(world, gameState, resources, storage, worldCoords, timer, eventBus)
          // Инициализация менеджера спавна
        spawnManager = new SpawnManager(gameState, physicsManager, groundContainer, foregroundContainer, world, worldCoords, resources, timer, storage, eventBus)
        
        zipLineManager = new ZipLineManager(world, worldCoords, resources, eventBus)
        
        // Инициализация менеджера HUD
        hudManager = new HUDManager(app, storage, hudContainer, gameState, gameWidth, gameHeight, textStyles, resources, eventBus)
        
        // Инициализация менеджера камеры
        cameraManager = new CameraManager(world, gameState, worldCoords, eventBus)

        meleeKillManager = new MeleeKillManager(hudContainer, gameState, gameWidth, gameHeight, timer, eventBus)

        explosionManager = new ExplosionManager(world, resources, eventBus)

        grenadeManager = new GrenadeManager(world, physicsManager, worldCoords, resources, timer, eventBus)

        moneyManager = new MoneyManager(world, physicsManager, worldCoords, resources, eventBus)

        endScreenManager = new EndScreenManager(app, gameState, gameWidth, gameHeight, textStyles, resources, storageManager, eventBus)

        eventBus.on('endScreen:clearTimeouts', () => {
            timeouts.length = 0
        })
        eventBus.on('endScreen:stopMusic', () => {
            music.stop()
        })
        eventBus.on('endScreen:removeHud', () => {
            if (hudContainer && app.stage) app.stage.removeChild(hudContainer)
        })
        eventBus.on('endScreen:restart', () => {
            restartGame()
        })
        eventBus.on('gameSpeed:default', () => {
            gameSpeed.current = gameSpeed.default
        })
        eventBus.on('gameSpeed:slow', () => {
            gameSpeed.current = gameSpeed.slow
        })

        // Инициализация менеджера меню
        menuManager = new MenuManager(app, gameState, storage, gameWidth, gameHeight, textStyles, resources, storageManager, sleep, eventBus)

        eventBus.on('menu:startGame', () => {
            startGame()
        })

        eventBus.emit('menu:create')

        interactionSystem = new InteractionSystem()
    }

    function startGame() {
        playerInstance.createPlayer(-100, worldCoords.firstFloor, foregroundContainer)
        playerInstance.updateGunFromSkin()

        if (hudManager) {
            hudManager.createBulletsDisplay(playerInstance.gun)
            hudManager.createMainHUD(playerInstance.playerState)
            hudManager.createPauseMenu({
                storage: storage,
                hasMeleeKill: () => meleeKillManager.meleeKill,
                pauseGame: () => {
                    const allAnimated = world.children.filter(item => item.animationSpeed)
                    allAnimated.forEach(item => item.stop())
                    music.set('paused', true)
                    gameState.isPause = true
                },
                pauseTimeouts: () => {
                    timeouts.forEach(item => item.pause())
                },
                resumeGame: () => {
                    const allAnimated = world.children.filter(item => item.animationSpeed)
                    allAnimated.forEach(item => item.play())
                    music.set('paused', false)
                    gameState.isPause = false
                },
                resumeTimeouts: () => {
                    timeouts.forEach(item => item.resume())
                },
                endGame: (skip) => {
                    timeouts.length = 0
                    eventBus.emit('endScreen:create', skip)
                }
            })
        }

        music = soundPlayer.startMusic()
        
        // Инициализация обработчика ввода (для свайпов)
        const inputHandler = new InputHandler(app.renderer.view, gameState, playerInstance.playerState, storage, eventBus)

        // Старый обработчик оставлен для обратной совместимости
        app.ticker.maxFPS = 60
        app.ticker.minFPS = 60
        app.ticker.add(ticker)
        // if (Math.floor(app.ticker.FPS) <= 35) {
        //     defaultGameSpeed = 2
        //     slowGameSpeed = 0.2
        // }
        gameSpeed.current = gameSpeed.default
        gameState.startScoreTimer()
    }

    function restartGame() {
        music.destroy()
        music = null
        app.stage.removeChild(app.stage.getChildByName('endScreen'))
        app.stage.removeChild(world)
        app.ticker.remove(ticker)
        worldCoords.zeroLeft = 0
        worldCoords.zeroRight = WORLD_WIDTH
        gameSpeed.current = gameSpeed.default

        gameState.reset()
        bulletManager.clear()

        distance = 0

        background = null
        bgPosition = 0
        bgSpeed = BG_SPEED;

        world = null
        groundContainer = null
        hudContainer = null

        // Обновление ссылок на массивы для обратной совместимости
        enemies.length = 0
        if (particleManager) {
            particleManager.clear()
        }
        buildings.length = 0
        zipLineManager.clear()
        // Обновление ссылок на массивы для обратной совместимости
        activeGrenade = null
        currentBoss = null
        init()
    }

    function ticker(delta) {
        if (gameState.gameEnd || gameState.isPause) return
        timer.update(app.ticker.elapsedMS);

        if (playerInstance.sprite && playerInstance.sprite.x > 10) {
            gameState.gameStart = true
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
            gameState.updateScore(playerInstance.stimpack)
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
            bulletManager.updateBullets(worldCoords, gameSpeed.current)
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

        particleManager.updateAllParticles(worldCoords.zeroLeft, playerInstance)

        interactionSystem.update({
            player: playerInstance,
            spawn: spawnManager,
            bullets: bulletManager,
            explosion: explosionManager,
            melee: meleeKillManager
        })
    }
}

async function sleep(time, isRoll) {
    const idx = timeouts.length
    return new Promise((resolve, reject) => {
        const timer = new Timer(function(e) {
            timeouts.splice(idx ,1)
            resolve(true);
        }, time);
        if (isRoll) {
            console.log('rollId Created')
            playerInstance.rollId = timer
        } else {
            timeouts.push(timer)
        }
    });
}

const Timer = function(callback, delay) {
    let timerId, start, remaining = delay;

    this.pause = function() {
        window.clearTimeout(timerId);
        timerId = null;
        remaining -= Date.now() - start;
    };

    this.resume = function(time = 0, maxTime) {
        if (timerId) {
            return;
        }
        const maxRemaining = maxTime ? Math.min(maxTime, remaining + time) : remaining + time
        start = Date.now();
        timerId = window.setTimeout(callback, maxRemaining);
    };

    this.stop = function() {
        if (timerId) {
            window.clearTimeout(timerId);
            timerId = null;
        }
        return false
    };

    this.resume();
};

// random перенесена в utils/GameUtils.js
