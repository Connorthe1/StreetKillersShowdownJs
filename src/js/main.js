import {default as enemyParams} from './enemyParams.js'
import {default as sounds} from './sounds.js'
import { soundPlayer } from './playSound.js'
import * as PIXI from 'pixi.js'
import { Layer, Group, Stage } from '@pixi/layers';
import * as Matter from 'matter-js'
import { Scrollbox } from 'pixi-scrollbox';
import skinStore from './skinStore.json'
import storeUpgrades from './upgrades.json'
import bridge from '@vkontakte/vk-bridge';
import { Player, playerState, playerDefaultSpeed, playerSpeed, initSpeed, player, playerBullets, gun, meleeKill, meleeKillSelectorSide, meleeKillSelectorSpeed, meleeKillStreak, meleeKillStreakTimer, triggerDelay, updateGunFromSkin } from './Player.js'
import { getPercent, random, randomRGB } from './utils/GameUtils.js'
import { GAME_SCALE, DEFAULT_GAME_SPEED, SLOW_GAME_SPEED, BULLET_SPEED, FENCE_CHANCE, BUILDING_CHANCE, GROUND_COLORS, BG_SPEED, initGameConfig } from './core/GameConfig.js'
import { GameState } from './core/GameState.js'
import { StorageManager, BASE_STORAGE } from './storage/StorageManager.js'
import { ResourceLoader } from './resources/ResourceLoader.js'
import { PhysicsManager } from './physics/PhysicsManager.js'
import { ParticleManager } from './entities/Particle.js'
import { BulletManager } from './entities/Bullet.js'
import { BackgroundManager } from './environment/Background.js'
import { GroundManager } from './environment/Ground.js'
import { BgCarManager } from './entities/BgCar.js'
import { GarbageManager } from './entities/Garbage.js'
import { PuddleManager } from './entities/Puddle.js'
import { CanManager } from './entities/Can.js'
import { BuildingManager } from './entities/Building.js'
import { WallManager } from './entities/Wall.js'
import { ZipLineManager } from './entities/ZipLine.js'
import { SpawnManager } from './core/SpawnManager.js'
import { EventManager } from './core/EventManager.js'
import { HUDManager } from './ui/HUDManager.js'
import { CameraManager } from './core/CameraManager.js'
import { GameManager } from './core/GameManager.js'
import { PlayerDamageManager } from './core/PlayerDamageManager.js'
import { ScoreManager } from './core/ScoreManager.js'
import { CollisionDetector } from './physics/CollisionDetector.js'
import { EnemyManager } from './entities/Enemy.js'
import { BossManager } from './entities/Boss.js'
import { GrenadeManager } from './entities/Grenade.js'
import { TrapManager } from './entities/Trap.js'
import { MoneyManager } from './entities/Money.js'
import { PowerUpManager } from './entities/PowerUp.js'
import { DogEnemyManager } from './entities/DogEnemy.js'
import { InputHandler } from './core/InputHandler.js'
import { ExplosionManager } from './entities/ExplosionManager.js'
import { MeleeKillManager } from './ui/MeleeKillManager.js'
import { MenuManager } from './ui/Menu.js'
import { StoreManager } from './ui/Store.js'
import { EndScreenManager } from './ui/EndScreen.js'

// Переменные игрока импортируются из Player.js
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
const gameScale = GAME_SCALE
let defaultGameSpeed = DEFAULT_GAME_SPEED
let slowGameSpeed = SLOW_GAME_SPEED
let gameSpeed = DEFAULT_GAME_SPEED
let zeroLeft = 0
let zeroRight = WORLD_WIDTH

let distance = 0
// Инициализация состояния игры
const gameState = new GameState()
let music = null
let playerPos = WORLD_HEIGHT - 230
let secondFloor = WORLD_HEIGHT - 420

// Массивы пуль теперь управляются через BulletManager
let enemyBullets = []
const bulletSpeed = BULLET_SPEED
let bulletManager // Инициализируется после создания world

// Окружение теперь управляется через отдельные менеджеры
let background
let bgPosition = 0
let bgSpeed = BG_SPEED

let world
let particleContainer
let ground
let woodsBG
const woodsBGarr = []
let hud
let stepSound = 0
let floorPosition = 0
// Флаги окружения
const fenceChance = FENCE_CHANCE
let isFence = false
let isBuilding = false
let afterBuilding = 0
let isClub = false
const buildingChance = BUILDING_CHANCE
let buildingType = 0

// Менеджеры окружения и сущностей
let backgroundManager // Инициализируется после создания world
let groundManager // Инициализируется после создания world
let bgCarManager // Инициализируется после создания world
let garbageManager // Инициализируется после создания world
let puddleManager // Инициализируется после создания world
let canManager // Инициализируется после создания world
let buildingManager // Инициализируется после создания world
let wallManager // Инициализируется после создания world
let zipLineManager // Инициализируется после создания world

// shotsArr импортируется из Player.js, но также управляется через BulletManager
let shotsArr = []

const groundColor = GROUND_COLORS
let selectGroundColor = 0
// textStyles теперь в gameConfig

const walls = []
const traps = []
const enemies = []
// Массивы частиц теперь управляются через ParticleManager
let physParticles = []
let bounceParticles = []
let trails = []
const moneyDrop = []
// Массивы окружения теперь управляются через отдельные менеджеры
let buildings = []
const zipLines = []
const grenades = []
let puddles = []
let garbages = []
let particleManager // Инициализируется после создания world
let spawnManager // Инициализируется после создания world
let eventManager // Инициализируется после создания canvas
let hudManager // Инициализируется после создания hud
let cameraManager // Инициализируется после создания world
let playerDamageManager // Менеджер урона игроку
let gameManager // Главный координатор всех систем
let scoreManager // Менеджер очков и рейтинга
let collisionDetector // Детектор коллизий
let enemyManager // Менеджер врагов
let grenadeManager // Менеджер гранат
let trapManager // Менеджер ловушек
let moneyManager // Менеджер денег
let powerUpManager // Менеджер пауэр-апов
let dogEnemyManager // Менеджер собаки-врага
let explosionManager // Менеджер взрывов
let meleeKillManager // Менеджер ближнего боя
let menuManager // Менеджер меню
let storeManager // Менеджер магазина
let endScreenManager // Менеджер экрана окончания
let currentBoss = null
let bgCar = null
let currentDogEnemy = null
let currentCan = null
let activePowerUp = null
let activeGrenade = null

// Инициализация менеджера физики
const physicsManager = new PhysicsManager()
let engine // Для обратной совместимости
let fg
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
    
    // Извлечение ресурсов для обратной совместимости
    const {
        textures, woods, build1, build2, buildZiplineTexture, club,
        laserBeamTexture, inBuildTexture, inFloorTexture, inClubTexture, bgCarTexture,
        enemiesTexture, dogEnemy, bossGun, bossLauncher, bossVan, bossSmg,
        particles, bigExplode, physParticlesTexture, bounceParticlesTexture,
        bochka, canTexture, windowTexture, doorTexture, puddleTexture, garbageTexture,
        activeItems, menuButtons, menuIcons, menuPause, menuUI, bg
    } = resources

    // Удаление загрузочного экрана
    resourceLoader.removeLoaderScreen(app)
    init()
    
    // Установка текстур в менеджер частиц после инициализации
    if (particleManager && physParticlesTexture && bounceParticlesTexture) {
        particleManager.setTextures({ physParticlesTexture, bounceParticlesTexture })
    }
    
    // Установка текстур и параметров в менеджер врагов после загрузки ресурсов
    if (enemyManager && enemiesTexture) {
        enemyManager.setTextures(enemiesTexture, enemyParams)
    }
    
    // Установка текстур и параметров в менеджер боссов после загрузки ресурсов
    if (bossManager && bossGun && bossLauncher && bossVan && bossSmg) {
        bossManager.setTextures(
            {
                bossGun,
                bossLauncher,
                bossVan,
                bossSmg
            },
            enemyParams,
            particles,
            activeItems,
            menuIcons
        )
    }
    
    // Установка текстур и параметров в менеджер гранат после загрузки ресурсов
    if (grenadeManager && activeItems && bounceParticlesTexture && particles) {
        grenadeManager.activeItems = activeItems
        grenadeManager.bounceParticlesTexture = bounceParticlesTexture
        grenadeManager.particles = particles
    }
    
    // Установка текстур и параметров в менеджер ловушек после загрузки ресурсов
    if (trapManager && bochka && windowTexture && doorTexture) {
        trapManager.setTextures({
            bochka: bochka,
            windowTexture: windowTexture,
            doorTexture: doorTexture
        })
    }
    
    // Установка текстур и параметров в менеджер денег после загрузки ресурсов
    if (moneyManager && menuIcons) {
        moneyManager.menuIcons = menuIcons
    }
    
    // Установка текстур и параметров в менеджер пауэр-апов после загрузки ресурсов
    if (powerUpManager && menuIcons) {
        powerUpManager.menuIcons = menuIcons
    }
    
    // Установка текстур и параметров в менеджер собаки-врага после загрузки ресурсов
    if (dogEnemyManager && dogEnemy && enemyParams) {
        dogEnemyManager.setTextures(dogEnemy, enemyParams)
    }
    
    // Установка текстур и параметров в менеджер взрывов после загрузки ресурсов
    if (explosionManager && bigExplode && bochka) {
        explosionManager.setTextures({
            bigExplode: bigExplode,
            bochka: bochka
        })
    }
    
    // Установка текстур и параметров в менеджер меню после загрузки ресурсов
    if (menuManager && menuButtons && menuIcons && menuUI) {
        menuManager.menuButtons = menuButtons
        menuManager.menuIcons = menuIcons
        menuManager.menuUI = menuUI
    }
    
    // Установка текстур и параметров в менеджер магазина после загрузки ресурсов
    if (storeManager && menuButtons && menuIcons && menuUI && activeItems) {
        storeManager.menuButtons = menuButtons
        storeManager.menuIcons = menuIcons
        storeManager.menuUI = menuUI
        storeManager.activeItems = activeItems
    }
    
    // Установка текстур и параметров в менеджер экрана окончания после загрузки ресурсов
    if (endScreenManager && menuButtons) {
        endScreenManager.menuButtons = menuButtons
    }

    function init() {
        world = new PIXI.Container()
        world.name = 'world'
        app.stage.addChild(world)
        world.sortableChildren = true;
        world.scale.set(gameScale)
        fg = new Group(9, true)
        world.addChild(new Layer(fg));

        hud = new PIXI.Container()
        hud.name = 'hud'
        app.stage.addChild(hud)
        hud.sortableChildren = true;
        hud.parentGroup = hudLayer
        hud.zOrder = 9

        woodsBG = new PIXI.Container()
        woodsBG.name = 'woodsBG'
        world.addChild(woodsBG)

        ground = new PIXI.Container()
        ground.name = 'ground'
        world.addChild(ground)
        
        // Инициализация менеджера частиц
        // Текстуры будут установлены после загрузки ресурсов
        particleManager = new ParticleManager(world, engine, physicsManager, ground)
        // Обновление ссылок на массивы для обратной совместимости
        const particleArrays = particleManager.getParticleArrays()
        physParticles = particleArrays.physParticles
        bounceParticles = particleArrays.bounceParticles
        trails = particleArrays.trails
        
        // Инициализация менеджера пуль
        bulletManager = new BulletManager(world, gameState, particleManager)
        // Обновление ссылок на массивы для обратной совместимости
        const bulletArrays = bulletManager.getBulletArrays()
        // playerBullets и shotsArr импортируются из Player.js, но обновим ссылки
        enemyBullets = bulletArrays.enemyBullets
        // shotsArr будет обновляться в BulletManager, но ссылка остается для Player.js
        
        // Инициализация менеджеров окружения и сущностей
        backgroundManager = new BackgroundManager(world, WORLD_WIDTH, WORLD_HEIGHT, gameHeight, bg)
        // Фон создается через BackgroundManager (после инициализации)
        background = backgroundManager.createBg(bg)
        backgroundManager.updateState({
            gameStart: gameState.gameStart,
            playerSpeed: playerSpeed,
            gameSpeed: gameSpeed,
            zeroLeft: zeroLeft
        })
        
        groundManager = new GroundManager(world, ground, woodsBG, engine, physicsManager, WORLD_WIDTH, WORLD_HEIGHT, { textures }, woods)
        groundManager.updateState({
            isBuilding: isBuilding,
            zeroLeft: zeroLeft
        })
        groundManager.setSelectGroundColor(selectGroundColor)
        
        bgCarManager = new BgCarManager(world, ground, zeroLeft, zeroRight)
        bgCarManager.setTextures(bgCarTexture)
        
        garbageManager = new GarbageManager(world, isClub, enemyBullets, playerBullets, soundPlayer, (char, particleType) => {
            if (particleManager) {
                particleManager.createParticle(char, particleType, null, null)
            }
        }, zeroLeft)
        garbageManager.setTextures(garbageTexture)
        
        puddleManager = new PuddleManager(world, gameState, player, playerState, buildings, soundPlayer, (points) => {
            if (scoreManager) scoreManager.addPoints(points)
        }, (pos, type) => {
            if (particleManager) {
                particleManager.createParticle(pos, type, null, null)
            }
        }, (ms) => {
            return new Promise(resolve => setTimeout(resolve, ms))
        }, zeroRight, playerPos)
        puddleManager.setTextures(puddleTexture)
        
        canManager = new CanManager(world, engine, physicsManager, gameState, player, playerState, enemies, currentDogEnemy, currentBoss, traps, soundPlayer, (points) => {
            if (scoreManager) scoreManager.addPoints(points)
        }, (enemy, damage) => {
            if (enemyManager) enemyManager.damageEnemy(enemy, damage)
        }, (char, particleType) => {
            if (particleManager) {
                particleManager.createParticle(char, particleType, null, null)
            }
        }, (barrel) => {
            // barrelDead callback
        }, WORLD_HEIGHT)
        canManager.setTextures(canTexture)
        
        buildingManager = new BuildingManager(world, engine, physicsManager, ground, secondFloor, walls, buildings, zipLines, traps, player, playerState, zeroLeft, zeroRight, WORLD_WIDTH, WORLD_HEIGHT, fg)
        buildingManager.setTextures({
            build1,
            build2,
            buildZiplineTexture,
            club,
            inBuildTexture,
            inFloorTexture,
            inClubTexture,
            windowTexture,
            doorTexture,
            laserBeamTexture
        })
        buildingManager.setCallbacks({
            createBoss: (type, pos) => {
                if (bossManager) bossManager.createBoss(type, pos)
            }
        })
        
        wallManager = new WallManager(world, player, ground, zeroLeft, zeroRight, afterBuilding, textures, inBuildTexture, inClubTexture, inFloorTexture)
        
        // Инициализация менеджера ловушек (текстуры будут установлены после загрузки ресурсов)
        trapManager = new TrapManager(
            world,
            null, // player - будет установлен позже
            playerState,
            gameState,
            enemies,
            currentDogEnemy,
            playerBullets,
            zeroRight,
            afterBuilding,
            ground,
            fg,
            null // bochka - будет установлен позже
        )
        
        // Установка колбэков для TrapManager
        trapManager.setCallbacks({
            addPoints: addPoints,
            damagePlayer: () => {
                if (playerDamageManager) {
                    playerDamageManager.damagePlayer()
                }
            },
            damageEnemy: damageEnemy,
            soundPlayer: soundPlayer,
            createParticles: (char, particleType) => {
                if (particleManager) {
                    particleManager.createParticle(char, particleType, null, null)
                }
            },
            createExplode: null, // Будет установлен после инициализации explosionManager
            sleep: sleep,
            gun: gun
        })
        
        zipLineManager = new ZipLineManager(world, zipLines, player, playerState, soundPlayer, (anim) => {
            if (playerInstance) playerInstance.playAnim(anim)
        }, playerSpeed, skinStore, storage, zeroLeft)
        zipLineManager.setTextures(buildZiplineTexture)
        
        // Установка колбэков после инициализации всех менеджеров
        groundManager.setCallbacks({
            createGarbage: (posX, posY) => {
                if (garbageManager) {
                    garbageManager.createGarbage(posX, posY)
                }
            },
            spawnEntity: () => {
                if (spawnManager) {
                    spawnManager.spawnEntity()
                }
            }
        })
        
        wallManager.setCallbacks({
            createEnemy: (pos, onSecondFloor) => {
                if (enemyManager) {
                    enemyManager.createEnemy(pos, onSecondFloor)
                }
            },
            createGarbage: (posX, posY) => {
                if (garbageManager) {
                    garbageManager.createGarbage(posX, posY)
                }
            }
        })
        
        // Обновление ссылок на массивы для обратной совместимости
        buildings = buildingManager.getArrays().buildings
        zipLines = zipLineManager.getZipLines ? zipLineManager.getZipLines() : zipLines
        traps = trapManager ? trapManager.getTraps() : traps
        // puddles и garbages управляются через менеджеры
        
        // Инициализация менеджера спавна
        spawnManager = new SpawnManager(
            gameState,
            world,
            enemies,
            buildings,
            currentBoss,
            currentDogEnemy,
            activePowerUp,
            bgCar,
            currentCan,
            isBuilding,
            isClub,
            afterBuilding,
            zeroRight,
            WORLD_WIDTH
        )
        
        // Инициализация менеджера HUD
        hudManager = new HUDManager(hud, gameState, gameWidth, gameHeight, textStyles)
        
        // Инициализация менеджера камеры
        cameraManager = new CameraManager(world, gameState, WORLD_WIDTH)
        cameraManager.setSleepCallback(sleep)
        
        // Инициализация менеджера урона игроку
        playerDamageManager = new PlayerDamageManager(playerState, gameState)
        
        // Инициализация менеджера очков
        scoreManager = new ScoreManager(gameState, hudManager, initSpeed)
        scoreManager.setUpdatePlayerSpeedCallback((newSpeed) => {
            playerDefaultSpeed = newSpeed
        })
        
        // Инициализация детектора коллизий
        collisionDetector = new CollisionDetector()
        
        // Инициализация менеджера врагов (текстуры будут установлены после загрузки ресурсов)
        enemyManager = new EnemyManager(
            world,
            gameState,
            enemies,
            playerBullets,
            player,
            playerState,
            traps,
            buildings,
            currentBoss,
            zeroLeft,
            WORLD_WIDTH,
            secondFloor,
            playerPos
        )
        
        // Инициализация менеджера боссов (текстуры будут установлены после загрузки ресурсов)
        bossManager = new BossManager(
            world,
            gameState,
            enemies,
            walls,
            traps,
            playerBullets,
            null, // player - будет установлен позже
            playerState,
            zeroLeft,
            zeroRight,
            WORLD_WIDTH,
            playerPos,
            hud,
            gameWidth,
            gameHeight,
            textStyles
        )
        
        // Инициализация менеджера гранат (текстуры будут установлены после загрузки ресурсов)
        grenadeManager = new GrenadeManager(
            world,
            engine,
            physicsManager,
            null, // player - будет установлен позже
            playerState,
            enemies,
            traps,
            currentDogEnemy,
            currentBoss,
            zeroLeft,
            null, // activeItems - будет установлен позже
            null, // bounceParticlesTexture - будет установлен позже
            null  // particles - будет установлен позже
        )
        
        // Установка колбэков для GrenadeManager (explosionManager будет установлен позже)
        grenadeManager.setCallbacks({
            damagePlayer: damagePlayer,
            createExplode: null, // Будет установлен после инициализации explosionManager
            damageEnemy: damageEnemy,
            barrelDead: barrelDead,
            soundPlayer: soundPlayer,
            sleep: sleep
        })
        
        // Обновление ссылок на массивы для обратной совместимости
        grenades = grenadeManager.getGrenades()
        
        // Инициализация менеджера денег (текстуры будут установлены после загрузки ресурсов)
        moneyManager = new MoneyManager(
            world,
            engine,
            physicsManager,
            null, // player - будет установлен позже
            gameState,
            zeroLeft,
            null // menuIcons - будет установлен позже
        )
        
        // Установка колбэков для MoneyManager
        moneyManager.setCallbacks({
            soundPlayer: soundPlayer
        })
        
        // Обновление ссылок на массивы для обратной совместимости
        moneyDrop = moneyManager.getMoneyDrop()
        
        // Инициализация менеджера собаки-врага (текстуры будут установлены после загрузки ресурсов)
        dogEnemyManager = new DogEnemyManager(
            world,
            null, // player - будет установлен позже
            playerState,
            playerBullets,
            buildings,
            zeroRight,
            playerPos,
            secondFloor,
            fg,
            gameSpeed
        )
        
        // Установка колбэков для DogEnemyManager
        dogEnemyManager.setCallbacks({
            damagePlayer: damagePlayer,
            damageEnemy: damageEnemy,
            soundPlayer: soundPlayer,
            gun: gun
        })
        
        // Обновление ссылок на переменные для обратной совместимости
        currentDogEnemy = dogEnemyManager.getCurrentDogEnemy()
        
        // Инициализация менеджера пауэр-апов (текстуры будут установлены после загрузки ресурсов)
        powerUpManager = new PowerUpManager(
            world,
            null, // player - будет установлен позже
            playerState,
            gameState,
            zeroLeft,
            zeroRight,
            playerPos,
            fg,
            null, // menuIcons - будет установлен позже
            storage
        )
        
        // Установка колбэков для PowerUpManager
        powerUpManager.setCallbacks({
            soundPlayer: soundPlayer,
            HUDupdatePowerUp: HUDupdatePowerUp,
            HUDbullets: HUDbullets,
            gun: gun
        })
        
        // Обновление ссылок на переменные для обратной совместимости
        activePowerUp = powerUpManager.getActivePowerUp()
        
        // Инициализация менеджера взрывов (текстуры будут установлены после загрузки ресурсов)
        explosionManager = new ExplosionManager(world)
        
        // Установка колбэков для ExplosionManager
        explosionManager.setCallbacks({
            cameraShake: (intensity, duration) => {
                if (cameraManager) {
                    cameraManager.cameraShake(intensity, duration)
                }
            },
            soundPlayer: soundPlayer
        })
        
        // Обновление колбэков для GrenadeManager и TrapManager с ExplosionManager
        if (grenadeManager) {
            grenadeManager.setCallbacks({
                damagePlayer: damagePlayer,
                createExplode: (target, offsetX, offsetY, isBig, silence) => {
                    if (explosionManager) {
                        explosionManager.createExplode(target, offsetX, offsetY, isBig, silence)
                    }
                },
                damageEnemy: damageEnemy,
                barrelDead: barrelDead,
                soundPlayer: soundPlayer,
                sleep: sleep
            })
        }
        
        if (trapManager) {
            trapManager.setCallbacks({
                addPoints: addPoints,
                damagePlayer: damagePlayer,
                damageEnemy: damageEnemy,
                soundPlayer: soundPlayer,
                createParticles: (char, particleType) => {
                    if (particleManager) {
                        particleManager.createParticle(char, particleType, null, null)
                    }
                },
                createExplode: (target, offsetX, offsetY, isBig, silence) => {
                    if (explosionManager) {
                        explosionManager.createExplode(target, offsetX, offsetY, isBig, silence)
                    }
                },
                sleep: sleep,
                gun: gun
            })
        }
        
        // Инициализация менеджера экрана окончания (текстуры будут установлены после загрузки ресурсов)
        endScreenManager = new EndScreenManager(
            app,
            gameState,
            storage,
            gameWidth,
            gameHeight,
            textStyles,
            null, // menuButtons - будет установлен позже
            storageManager
        )
        
        // Установка колбэков для EndScreenManager
        endScreenManager.setCallbacks({
            restartGame: restartGame,
            music: music,
            removeHud: () => {
                if (hud && app.stage) {
                    app.stage.removeChild(hud)
                }
            },
            clearTimeouts: () => {
                timeouts.length = 0
            }
        })
        
        // Установка колбэков для PlayerDamageManager
        if (playerDamageManager) {
            playerDamageManager.setCallbacks({
                cameraShake: (intensity, duration) => {
                    if (cameraManager) {
                        cameraManager.cameraShake(intensity, duration)
                    }
                },
                soundPlayer: soundPlayer,
                player: null, // Будет установлен в startGame
                hud: hud,
                world: world,
                createParticles: (char, particleType, floor) => {
                    if (particleManager) {
                        particleManager.createParticle(char, particleType, floor, null)
                    }
                },
                sleep: sleep,
                endGame: () => {
                    if (endScreenManager) {
                        endScreenManager.createEndScreen()
                    }
                },
                HUDupdatePowerUp: HUDupdatePowerUp,
                HUDremoveShield: HUDremoveShield,
                getSecondFloor: () => secondFloor,
                setPlayerSpeed: (speed) => {
                    playerSpeed = speed
                }
            })
        }
        
        // Инициализация главного менеджера игры
        gameManager = new GameManager()
        gameManager.setManagers({
            gameState,
            physicsManager,
            particleManager,
            bulletManager,
            // environmentManager удален, используем отдельные менеджеры
            backgroundManager,
            groundManager,
            bgCarManager,
            garbageManager,
            puddleManager,
            canManager,
            buildingManager,
            wallManager,
            zipLineManager,
            spawnManager,
            eventManager: null, // Будет установлен позже
            hudManager,
            cameraManager,
            storageManager,
            resourceLoader: null, // Будет установлен позже
            scoreManager,
            collisionDetector,
            enemyManager,
            grenadeManager,
            trapManager,
            moneyManager,
            powerUpManager,
            dogEnemyManager,
            explosionManager,
            meleeKillManager,
            menuManager,
            storeManager,
            endScreenManager,
            playerDamageManager
        })
        gameManager.setGameObjects({
            world,
            hud,
            app,
            player: null // Будет установлен позже
        })
        
        if (menuManager) {
            menuManager.createMenu()
        }

        selectGroundColor = random(0,groundColor.length - 1)
        groundManager.setSelectGroundColor(selectGroundColor)
        for (let i = 0; i <= 3; i++) {
            groundManager.createFloor(i)
        }
        playerPos = ground.getLocalBounds().y + 70
        secondFloor = ground.getLocalBounds().y - 120
        
        // Initialize player instance
        playerInstance = new Player()
    }

    function startGame() {
        updateGunFromSkin(storage.selectedSkin, storage, getPercent, skinStore);

        HUDbullets()
        HUDpoints()
        HUDpause()
        if (playerInstance) {
            const playerSkin = playerState.currentSkin || skinStore[Number(storage.selectedSkin)].param
            player = playerInstance.createPlayer(playerSkin, -100, playerPos)
            world.addChild(player)
        }
        
        // Обновление ссылки на игрока в PlayerDamageManager
        if (playerDamageManager) {
            playerDamageManager.setCallbacks({
                player: player
            })
        }

        music = soundPlayer.startMusic()
        
        // Инициализация менеджера событий
        eventManager = new EventManager()
        eventManager.setKeyHandler(events)
        eventManager.setSwipeHandler((swipeMsg) => {
            const keyCode = eventManager.mapSwipeToKey(swipeMsg)
            if (keyCode) {
                events({ code: keyCode })
            }
        })
        eventManager.init(app.renderer.view)
        
        // Инициализация обработчика ввода (для свайпов)
        const inputHandler = new InputHandler(
            app.renderer.view,
            gameState,
            playerState,
            storage
        )
        
        // Установка колбэков для InputHandler (все действия вызывают events)
        inputHandler.setCallbacks({
            onReload: () => events({ code: 'KeyR' }),
            onRoll: () => events({ code: 'Space' }),
            onShot: () => events({ code: 'KeyF' }),
            onGrenade: () => events({ code: 'KeyE' }),
            onStimpack: () => events({ code: 'KeyW' }),
            onToggleSpeed: () => events({ code: 'KeyQ' }),
            onMeleeKill: () => {
                if (meleeKillManager && meleeKillManager.hasMeleeKill()) {
                    meleeKillManager.handleMeleeKill(false, false)
                }
            }
        })
        
        // Старый обработчик оставлен для обратной совместимости
        document.addEventListener('keyup', events)
        app.ticker.maxFPS = 60
        app.ticker.minFPS = 60
        app.ticker.add(ticker)
        if (Math.floor(app.ticker.FPS) <= 35) {
            defaultGameSpeed = 2
            slowGameSpeed = 0.2
        }
        gameSpeed = defaultGameSpeed
        if (scoreManager) {
            scoreManager.startScoreTimer()
        } else {
            scoreTimer()
        }
        // Запуск таймера частиц следа через ParticleManager
        if (particleManager) {
            particleManager.setCallbacks({
                player: player,
                playerState: playerState,
                playerSpeed: playerSpeed,
                gameState: gameState,
                soundPlayer: soundPlayer
            })
            particleManager.startTrailTimer()
        }
    }

    function restartGame() {
        music.destroy()
        music = null
        app.stage.removeChild(app.stage.getChildByName('endScreen'))
        app.stage.removeChild(world)
        app.ticker.remove(ticker)
        zeroLeft = 0
        zeroRight = WORLD_WIDTH
        gameSpeed = defaultGameSpeed

        playerState.state = ''
        playerState.afterRoll = true
        playerState.inCover = false
        playerState.invincible = false
        playerState.inZipLine = false
        playerState.inBossFight = false
        playerState.health = 3
        playerState.activePowerUps.length = 0
        playerState.stimpack = false
        playerState.skillCD = false
        gameState.reset()
        player = null
        if (bulletManager) {
            bulletManager.clear()
        }
        // Обновление ссылок на массивы
        if (bulletManager) {
            const bulletArrays = bulletManager.getBulletArrays()
            enemyBullets = bulletArrays.enemyBullets
        }

        initSpeed = 5
        playerDefaultSpeed = initSpeed
        playerSpeed = playerDefaultSpeed
        distance = 0

        background = null
        bgPosition = 0
        bgSpeed = BG_SPEED;

        world = null
        ground = null
        hud = null
        floorPosition = 0
        isFence = false
        isBuilding = false
        afterBuilding = 0
        isClub = false
        buildingType = 0

        triggerDelay = false
        gun.currentAmmo = 5
        gun.ammo = 5
        gun.angle = 0.4
        gun.type = 'pistol'

        walls.length = 0
        if (trapManager) {
            trapManager.clear()
        }
        // Обновление ссылок на массивы для обратной совместимости
        traps = trapManager ? trapManager.getTraps() : []
        enemies.length = 0
        if (particleManager) {
            particleManager.stopTrailTimer()
            particleManager.clear()
        }
        buildings.length = 0
        zipLines.length = 0
        if (grenadeManager) {
            grenadeManager.clear()
        }
        // Обновление ссылок на массивы для обратной совместимости
        grenades = grenadeManager ? grenadeManager.getGrenades() : []
        activeGrenade = null
        puddles.length = 0
        garbages.length = 0
        currentBoss = null
        bgCar = null
        if (dogEnemyManager) {
            dogEnemyManager.clear()
        }
        currentDogEnemy = null
        currentCan = null
        if (powerUpManager) {
            powerUpManager.clear()
        }
        activePowerUp = null

        gameState.isPause = false
        gameState.gameStart = false
        gameState.gameEnd = false
        init()
    }

    function ticker(delta) {
        if (gameState.gameEnd || gameState.isPause) return
        if (player && player.x > 10) {
            gameState.gameStart = true
        }
        if (playerState.rollId !== null && playerState.state !== 'rollEnd') {
            console.log('stopRoll')
            playerState.rollId.stop()
            playerState.rollId = null
        }
        hud.getChildByName('fps').text = Math.floor(app.ticker.FPS)
        physicsManager.update();
        // Обновление ближнего боя через MeleeKillManager
        if (meleeKillManager) {
            meleeKillManager.updateState({
                defaultGameSpeed: defaultGameSpeed,
                gameSpeed: gameSpeed
            })
            meleeKillManager.updateMeleeKill()
            // Синхронизация meleeKill для обратной совместимости
            meleeKill = meleeKillManager.getMeleeKill()
        }
        const currentPoints = gameState.updatePoints()
        if (currentPoints !== gameState.points || gameState.pointsToAdd > 0) {
            hud.getChildByName('points').text = gameState.points;
        }
        hud.getChildByName('scale').text = `x${gameState.multiplier.toFixed(1)}`;
        updateScore()
        // Обновление мусора через GarbageManager
        if (garbageManager) {
            garbageManager.updateGarbage()
        }
        // Use the Player module's updatePlayer method
        if (playerInstance) {
            playerInstance.updatePlayer(delta, gameState.gameEnd, gameState.gameStart, gameSpeed, enemyBullets, world, soundPlayer, () => {
                if (playerDamageManager) {
                    playerDamageManager.damagePlayer()
                }
            })
        }
        // Обновление фона и пола через менеджеры
        if (backgroundManager) {
            backgroundManager.updateState({
                gameStart: gameState.gameStart,
                playerSpeed: playerSpeed,
                gameSpeed: gameSpeed,
                zeroLeft: zeroLeft
            })
            backgroundManager.updateBg()
        }
        if (groundManager) {
            groundManager.updateState({
                isBuilding: isBuilding,
                zeroLeft: zeroLeft
            })
            groundManager.updateFloor()
        }
        if (bulletManager) {
            bulletManager.updateBullets(zeroLeft, zeroRight, WORLD_WIDTH, gameSpeed)
        }
        updateWall()
        updateEnemies()
        // Обновление ловушек через TrapManager
        if (trapManager) {
            trapManager.updateState({
                player: player,
                playerState: playerState,
                zeroRight: zeroRight,
                afterBuilding: afterBuilding,
                currentDogEnemy: currentDogEnemy
            })
            trapManager.updateTraps()
        }
        if (particleManager) {
            particleManager.updateParticles(zeroLeft)
            particleManager.updateBounceParticles()
            particleManager.updateTrailParticles(zeroLeft)
            // Обновление состояния для trailTimer
            particleManager.updateTrailState({
                playerSpeed: playerSpeed,
                player: player,
                playerState: playerState
            })
        }
        // Обновление денег через MoneyManager
        if (moneyManager) {
            moneyManager.updateState({
                player: player,
                zeroLeft: zeroLeft
            })
            moneyManager.updateDropMoney()
        }
        updateBuildings()
        // Обновление зиплайнов через ZipLineManager
        if (zipLineManager) {
            zipLineManager.updateState({
                player: player,
                playerState: playerState,
                zeroLeft: zeroLeft
            })
            zipLineManager.updateZiplines()
        }
        // Обновление луж через PuddleManager
        if (puddleManager) {
            puddleManager.updateState({
                player: player,
                playerState: playerState,
                zeroLeft: zeroLeft
            })
            puddleManager.updatePuddles()
        }
        if (grenadeManager && grenadeManager.getActiveGrenade()) {
            grenadeManager.updateGrenade()
        }
        // Обновление пауэр-апов через PowerUpManager
        if (powerUpManager) {
            powerUpManager.updateState({
                player: player,
                zeroLeft: zeroLeft,
                zeroRight: zeroRight
            })
            powerUpManager.updatePowerUp()
            // Синхронизация activePowerUp для обратной совместимости
            activePowerUp = powerUpManager.getActivePowerUp()
        }
        // Обновление банки через CanManager
        if (canManager && currentCan) {
            canManager.updateState({
                zeroLeft: zeroLeft,
                zeroRight: zeroRight,
                player: player,
                playerState: playerState
            })
            canManager.updateCan()
            currentCan = canManager.getCurrentCan()
        }
        // Обновление собаки-врага через DogEnemyManager
        if (dogEnemyManager) {
            dogEnemyManager.updateState({
                player: player,
                playerState: playerState,
                playerBullets: playerBullets,
                buildings: buildings,
                zeroRight: zeroRight,
                zeroLeft: zeroLeft,
                gameSpeed: gameSpeed
            })
            dogEnemyManager.updateDogEnemy()
            // Синхронизация currentDogEnemy для обратной совместимости
            currentDogEnemy = dogEnemyManager.getCurrentDogEnemy()
        }
        // Обновление состояния GrenadeManager
        if (grenadeManager) {
            grenadeManager.updateState({
                player: player,
                playerState: playerState,
                zeroLeft: zeroLeft,
                currentDogEnemy: currentDogEnemy,
                currentBoss: currentBoss
            })
            if (grenadeManager.getGrenades().length > 0) {
                grenadeManager.updateGrenades()
            }
            // Синхронизация activeGrenade для обратной совместимости
            activeGrenade = grenadeManager.getActiveGrenade()
        }
        // Обновление фоновой машины через BgCarManager
        if (bgCarManager) {
            bgCarManager.updateState({
                zeroLeft: zeroLeft,
                zeroRight: zeroRight
            })
            bgCarManager.updateBgCar()
            bgCar = bgCarManager.getBgCar()
        }
        if (currentBoss) {
            updateBoss()
        }
        if (playerState.inZipLine) {
            if (particleManager) {
                particleManager.spawnTrailParticle(player, null, true)
            }
            if (playerState.inZipLine === 'top') {
                player.y -= (5 * defaultGameSpeed)
                if (player.y < secondFloor) {
                    playerState.inZipLine = ''
                    player.rotation = 0
                    playerSpeed = playerDefaultSpeed
                    player.y = secondFloor
                    playerState.secondFloor = true
                    const e = {
                        code: 'Space'
                    }
                    events(e)
                }
            } else {
                player.y += (5 * defaultGameSpeed)
                if (player.y > playerPos) {
                    playerState.inZipLine = ''
                    player.rotation = 0
                    playerSpeed = playerDefaultSpeed
                    player.y = playerPos
                    playerState.secondFloor = false
                    if (playerInstance) playerInstance.playAnim('')
                }
            }
        }
        // Обновление анимаций выстрелов
        if (bulletManager && bulletManager.shotsArr.length > 0) {
            bulletManager.shotsArr.forEach(item => {
                item.x += (playerSpeed / 2)
            })
            // Синхронизация с shotsArr из Player.js для обратной совместимости
            shotsArr = bulletManager.shotsArr
        }
        
        // Синхронизация playerBullets с BulletManager для обратной совместимости
        if (bulletManager) {
            const bulletArrays = bulletManager.getBulletArrays()
            // playerBullets импортируется из Player.js, но обновляем ссылку для синхронизации
            // Это нужно для того, чтобы код, использующий playerBullets, работал корректно
            // Примечание: playerBullets может использоваться в Player.js, поэтому нужно быть осторожным
        }
        const detectedWall = detectWall()
        if (detectedWall && !playerState.inCover) {
            if (((playerState.state === 'roll' || playerState.state === 'rollEnd') && !playerState.leaveCover) || (detectedWall.forBoss && !currentBoss.params.dead)) {
                playerState.inBossFight = detectedWall.forBoss
                playerState.inCover = true
                playerSpeed = 0
                player.x = detectedWall.coverX
                if (playerInstance) playerInstance.playAnim('idle')
            }
        }
    }



    function spawnEntity() {
        if (Math.random() < 0.05 && powerUpManager && !powerUpManager.hasActivePowerUp()) {
            powerUpManager.createPowerUp()
        }
        if (Math.random() < 0.05 && dogEnemyManager && !dogEnemyManager.hasDogEnemy() && gameState.points > 2000) {
            dogEnemyManager.createDogEnemy()
        }
        if (Math.random() < 0.5 && !bgCar) {
            createBgCar()
        }
        if (Math.random() < 0.2) {
            // Создание лужи через PuddleManager
            if (puddleManager) {
                puddleManager.updateState({
                    zeroRight: zeroRight,
                    playerPos: playerPos
                })
                puddleManager.createPuddle()
            }
        }
        if (!isClub && !currentBoss) {
            const randomBuild = Math.floor(Math.random() * (10 - 1 + 1) + 1)
            switch (true) {
                case randomBuild <= buildingChance:
                    if (isBuilding) {
                        spawnBuilding('continue')
                    } else {
                        if (buildings.length === 0) {
                            const testClub = Math.floor(Math.random() * (10 - 1 + 1) + 1)
                            isBuilding = true
                            if (testClub === 1) {
                                isClub = true
                                createClub()
                                return
                            }
                            spawnBuilding('start')
                        }
                    }
                    break
                default:
                    if (isBuilding) {
                        isBuilding = false
                        spawnBuilding('end')
                    }
                    break
            }
        }
        if (Math.random() < 0.5) {
            createEnemy()
        }
        if (Math.random() < 0.1 && !currentCan) {
            // Создание банки через CanManager
            if (canManager) {
                canManager.createCan(zeroRight, playerPos, storage, fg)
                currentCan = canManager.getCurrentCan()
            }
        }
        if (!isBuilding && !currentBoss && (afterBuilding < zeroRight - WORLD_WIDTH / 2)) {
            if (Math.random() < Math.min(gameState.points / 40000, 0.1) && gameState.points > 2000) {
                console.log('boss')
                createBoss(random(1,3))
                return
            }
            if (Math.random() < 0.3) {
                console.log('bochka')
                if (trapManager) {
                    trapManager.createBarrel()
                }
                return
            }
            if (Math.random() < 0.5) {
                console.log('wall')
                createWall()
                return
            }
        }
    }

    // Функции setMeleeSelector и HUDmeleeKill теперь в MeleeKillManager
    // Оставлены для обратной совместимости, но больше не используются

    function createGarbage(posX, posY, type) {
        if (isClub) return
        const rand = type || random(1, 10)
        const garbage = new PIXI.Sprite(garbageTexture.textures[`trash${rand}`])
        garbage.type = rand
        garbage.anchor.set(0,1)
        garbage.position.set(posX, posY)
        world.addChild(garbage)
        garbages.push(garbage)
    }

    function updateGarbage() {
        garbages.forEach((garbage, idx) => {
            if (garbage.x + garbage.width < zeroLeft) {
                world.removeChild(garbage)
                garbages.splice(idx, 1)
                return;
            }
            if (garbage.type === 3 || garbage.type === 4) {
                enemyBullets.forEach(bullet => {
                    const b = bullet.getBounds()
                    const g = garbage.getBounds()
                    if (g.x > b.x && b.x + b.width > g.x && g.y > b.y && b.y + b.height > g.y) {
                        soundPlayer.glassBreak()
                        for (let i = 0; i <= 8; i++) {
                            if (particleManager) {
                                particleManager.createParticle(garbage, 'bottle', null, null)
                            }
                        }
                        world.removeChild(garbage)
                        garbages.splice(idx, 1)
                        return
                    }
                })
                playerBullets.forEach(bullet => {
                    const b = bullet.getBounds()
                    const g = garbage.getBounds()
                    if (g.x > b.x && b.x + b.width > g.x && g.y > b.y && b.y + b.height > g.y) {
                        soundPlayer.glassBreak()
                        for (let i = 0; i <= 8; i++) {
                            if (particleManager) {
                                particleManager.createParticle(garbage, 'bottle', null, null)
                            }
                        }
                        world.removeChild(garbage)
                        garbages.splice(idx, 1)
                        return
                    }
                })
            }
        })
    }

    function createPuddle() {
        if (buildings.length > 0) {
            const activeBuilding = buildings[0]
            const lastBuilding = buildings[buildings.length - 1].getLocalBounds()
            if ((lastBuilding.x + lastBuilding.width > zeroRight && activeBuilding.getLocalBounds().x < zeroRight) && (activeBuilding.secondFloor || activeBuilding.club)) {
                return
            }
        }
        const rand = random(1, 2)
        const puddle = new PIXI.Sprite(puddleTexture.textures[`puddle${rand}`])
        puddle.anchor.set(0.5)
        puddle.position.set(zeroRight + puddle.width, playerPos + 24)
        world.addChild(puddle)
        puddles.push(puddle)
    }

    function updatePuddles() {
        puddles.forEach((puddle, idx) => {
            if (puddle.x + puddle.width < zeroLeft) {
                world.removeChild(puddle)
                puddles.splice(idx, 1)
                return;
            }
            if (puddle.dead) return
            if (player.x + 40 > puddle.x + 20 && puddle.x + puddle.width > player.x) {
                puddle.dead = true
                if (playerState.state === 'roll' || playerState.state === 'rollEnd') {
                    addPoints(20)
                    gameState.scoreStreak += 1
                    playerSpeed = playerDefaultSpeed * 1.5
                    soundPlayer.waterStep()
                    for (let i = 0; i <= 20; i++) {
                        if (particleManager) {
                            particleManager.createParticle({x: puddle.x, y: puddle.y - 10}, 'drop', null, null)
                        }
                    }
                } else {
                    soundPlayer.waterStep()
                    for (let i = 0; i <= 14; i++) {
                        if (particleManager) {
                            particleManager.createParticle({x: puddle.x - 20, y: puddle.y - 10}, 'drop', null, null)
                        }
                    }
                    sleep(250).then(() => {
                        soundPlayer.waterStep()
                        for (let i = 0; i <= 14; i++) {
                            if (particleManager) {
                                particleManager.createParticle({x: puddle.x + 20, y: puddle.y - 10}, 'drop', null, null)
                            }
                        }
                    })
                }
            }
        })
    }

    function createCan() {
        const can = new PIXI.Sprite(canTexture.textures.pixelCan)
        can.width = 8
        can.height = 16
        can.position;
        can.anchor.set(0, 0.5)
        can.health = storage.upgrades.can + 1
        can.parentGroup = fg
        can.zOrder = 6
        can.body = Matter.Bodies.rectangle(zeroRight, playerPos + 20, 8, 16, {isStatic: false, restitution: 0.2, frictionAir: 0.01, chamfer: { radius: [5,5,0,0] }});
        world.addChild(can)
        Matter.World.add(engine.world, can.body);
        currentCan = can
    }

    function updateCan() {
        currentCan.position = currentCan.body.position
        currentCan.rotation = currentCan.body.angle
        if ((currentCan.x > zeroRight + 300) || (currentCan.y > WORLD_HEIGHT) || (currentCan.x < zeroLeft) || (currentCan.health <= 0)) {
            world.removeChild(currentCan)
            Matter.World.remove(engine.world, currentCan.body)
            currentCan = null
            return
        }
        //CAN TOUCHED
        if (player.x + 40 > currentCan.x + 40 && player.x < currentCan.x + 20 && currentCan.y > player.y && player.y + player.height > currentCan.y && (playerState.state === 'roll' || playerState.state === 'rollEnd') && !currentCan.touched) {
            currentCan.dealDamage = false
            soundPlayer.canDrop()
            Matter.Body.applyForce(currentCan.body, {x: currentCan.body.position.x, y: currentCan.body.position.y + 7.5}, {x: random(0.005, 0.01, true, true) , y: -random(0.002, 0.00, true, true)});
        }
        //CAN DAMAGE
        if (!currentCan.dealDamage && currentCan.body.speed > 1) {
            enemies.forEach(enemy => {
                const b = enemy.getBounds()
                const can = currentCan.getBounds()
                if (can.x > b.x && b.x + b.width > can.x && can.y > b.y && b.y + b.height > can.y && !enemy.params.dead) {
                    currentCan.dealDamage = true
                    currentCan.health -= 1
                    gameState.scoreStreak += 2.5
                    addPoints(50)
                    damageEnemy(enemy, Math.floor(currentCan.body.speed))
                    currentCan.body.speed = 0.5
                    Matter.Body.applyForce(currentCan.body, {x: currentCan.body.position.x, y: currentCan.body.position.y + 7.5}, {x: -random(0.005, 0.01, true, true) , y: -random(0.002, 0.006, true, true)});
                }
            })
            if (currentDogEnemy) {
                const b = currentDogEnemy.getBounds()
                const can = currentCan.getBounds()
                if (can.x > b.x && b.x + b.width > can.x && can.y > b.y && b.y + b.height > can.y && !currentDogEnemy.params.dead) {
                    currentCan.dealDamage = true
                    currentCan.health -= 1
                    gameState.scoreStreak += 2.5
                    damageEnemy(currentDogEnemy, Math.floor(currentCan.body.speed))
                    currentCan.body.speed = 0.5
                    Matter.Body.applyForce(currentCan.body, {x: currentCan.body.position.x, y: currentCan.body.position.y + 7.5}, {x: -random(0.005, 0.01, true, true) , y: -random(0.002, 0.006, true, true)});
                }
            }
            if (currentBoss) {
                const b = currentBoss.getBounds()
                const can = currentCan.getBounds()
                if (can.x > b.x && b.x + b.width > can.x && can.y > b.y && b.y + b.height > can.y && !currentBoss.params.dead) {
                    currentCan.dealDamage = true
                    currentCan.health -= 1
                    gameState.scoreStreak += 2.5
                    addPoints(50)
                    damageEnemy(currentBoss, Math.floor(currentCan.body.speed), true)
                    currentCan.body.speed = 0.5
                    Matter.Body.applyForce(currentCan.body, {x: currentCan.body.position.x, y: currentCan.body.position.y + 7.5}, {x: -random(0.005, 0.01, true, true) , y: -random(0.002, 0.006, true, true)});
                }
            }
            traps.forEach(trap => {
                const b = trap.getBounds()
                const can = currentCan.getBounds()
                if (can.x > b.x && b.x + b.width > can.x && can.y > b.y && b.y + b.height > can.y && !trap.dead) {
                    currentCan.dealDamage = true
                    currentCan.health -= 1
                    gameState.scoreStreak += 2.5
                    addPoints(50)
                    currentCan.body.speed = 0.5
                    Matter.Body.applyForce(currentCan.body, {x: currentCan.body.position.x, y: currentCan.body.position.y + 7.5}, {x: -random(0.005, 0.01, true, true) , y: -random(0.002, 0.006, true, true)});
                    if (trap.type) {
                        if (trap.type === 'window') soundPlayer.glassBreak()
                        trap.play()
                        trap.dead = true
                    } else {
                        barrelDead(trap)
                    }
                }
            })
        }
    }


    function updatePlayer(delta) {
        if (gameState.gameEnd) return
        if (playerState.activePowerUps.length > 0) {
            playerState.activePowerUps.forEach((powerUp, idx) => {
                if (Date.now() > powerUp.expired) {
                    switch (true) {
                        case powerUp.type === 'boostAmmo':
                            gun.ammo = gun.ammo / 2
                        break
                        case powerUp.type === 'boostGun':
                            gun.damage = gun.damage / 2
                        break
                    }
                    playerState.activePowerUps.splice(idx, 1)
                    HUDupdatePowerUp()
                    console.log('endPW')
                }
            })
        }
        if (gameStart) {
            const dtX = 1 - Math.exp(-delta / 5)
            const dtY = 1 - Math.exp(-delta / 20)
            world.pivot.x = ((player.x - 60) - world.pivot.x) * dtX + world.pivot.x;
            world.pivot.y = (-world.pivot.y) * dtY + world.pivot.y;
        }
        player.x += (0.5 * playerSpeed) * gameSpeed;
        zeroLeft = player.x - 100
        zeroRight = player.x + WORLD_WIDTH
        enemyBullets.forEach((bullet, idx) => {
            if (player.x + 40 > bullet.x && player.x < bullet.x && player.y - player.height / 2 < bullet.y && player.y + player.height / 2 > bullet.y) {
                if (playerState.state === 'roll' || playerState.state === 'rollEnd' || (playerState.inCover && playerState.state !== 'shot')) return soundPlayer.bulletSkip()
                world.removeChild(bullet)
                enemyBullets.splice(idx, 1)
                if (playerState.invincible) {
                    return
                }
                if (playerDamageManager) {
                    playerDamageManager.damagePlayer()
                }
            }
        })
    }




    function deleteWallsAroundBuilding(pos) {
        walls.forEach((wall, idx) => {
            if (wall.x + 100 > pos) {
                world.removeChild(wall)
                walls.splice(idx, 1)
            }
        })
    }

    function spawnBuilding(type) {
        const randBuild = buildingType > 0 ? buildingType : Math.floor(Math.random() * (2 - 1 + 1) + 1)
        switch (true) {
            case randBuild === 1:
                buildingType = 1
                createBuildingZipline(type)
            break
            case randBuild === 2:
                buildingType = 2
                createBuilding(type)
            break
        }
        if (type === 'end') {
            buildingType = 0
        }
    }

    function createBuildingZipline(type) {
        const buildContainer = new PIXI.Container()
        buildContainer.secondFloor = true
        let buildBack
        let buildFront
        let buildConnect
        let buildZipline
        let position = zeroRight + 300
        let lastBuilding
        if (buildings.length > 0 && type !== 'start') {
            lastBuilding = buildings[buildings.length - 1]
            const LBbounds = lastBuilding.getLocalBounds()
            position = LBbounds.x + LBbounds.width
        }
        deleteWallsAroundBuilding(position)
        if (type === 'start') {
            buildBack = new PIXI.Sprite(build2.textures.Build2FOne)
            buildFront = new PIXI.Sprite(build2.textures.Build2FOneClose)
            buildBack.anchor.set(0.5)
            buildBack.position.set(position + buildBack.width / 2, ground.getLocalBounds().y - 118)
            buildZipline = new PIXI.Sprite(buildZiplineTexture.textures.Zipline2FStart)
            buildZipline.position.set((position - buildZipline.width) + 40, buildBack.y - buildBack.height / 2 )
            buildZipline.zIndex = 1
            world.addChild(buildZipline)
            zipLines.push(buildZipline)
            if (trapManager) trapManager.createWindow(position + 11)
            if (Math.random() < 0.5) {
                if (trapManager) trapManager.createDoor(position + buildBack.width - 72, true)
            }
            if (Math.random() < 0.5) {
                createCoverInBuild(position + buildBack.width - 180, true)
            }
        } else {
            const rand = Math.random()
            if (!lastBuilding.outroof) {
                if (rand < 0.5) {
                    buildConnect = new PIXI.Sprite(build2.textures.Build2fOneConnect)
                    buildBack = new PIXI.Sprite(build2.textures.Build2FTwo)
                    buildFront = new PIXI.Sprite(build2.textures.Build2FTwoClose)
                    buildBack.anchor.set(0.5)
                    buildBack.position.set(position + buildBack.width / 2, ground.getLocalBounds().y - 118)
                    if (Math.random() < 0.5) {
                        createCoverInBuild(buildBack.x - 50, true)
                    }
                    if (type === 'end') {
                        if (trapManager) trapManager.createWindow(position + buildBack.width - 93)
                    } else {
                        if (Math.random() < 0.5) {
                            if (trapManager) trapManager.createDoor(position + buildBack.width - 72)
                        }
                    }
                } else {
                    buildBack = new PIXI.Sprite(build2.textures.Build2Outroof)
                    buildContainer.outroof = true
                    buildBack.anchor.set(0.5)
                    buildBack.position.set(position + buildBack.width / 2, ground.getLocalBounds().y - 3)
                    if (Math.random() < 0.5) {
                        createCoverInBuild(position + buildBack.width - 250, true, true)
                    }
                    if (Math.random() < 0.5) {
                        createCoverInBuild(position + 150, true, true)
                    }
                }
            } else {
                if (rand < 0.5) {
                    buildBack = new PIXI.Sprite(build2.textures.Build2FThree)
                    buildFront = new PIXI.Sprite(build2.textures.Build2FThreeClose)
                    buildBack.anchor.set(0.5)
                    buildBack.position.set(position + buildBack.width / 2 - 120, ground.getLocalBounds().y - 119)
                    if (Math.random() < 0.5) {
                        createCoverInBuild(position + buildBack.width - 360, true)
                    }
                    if (Math.random() < 0.5) {
                        createCoverInBuild(position + 210, true)
                    }
                    if (Math.random() < 0.5) {
                        if (trapManager) trapManager.createWindow(position - 108)
                    } else {
                        if (trapManager) trapManager.createDoor(position - 88, true)
                    }
                    if (type === 'end') {
                        if (trapManager) trapManager.createWindow(position + buildBack.width - 212)
                    }
                } else {
                    buildBack = new PIXI.Sprite(build2.textures.Build2Outroof)
                    buildConnect = new PIXI.Sprite(build2.textures.Build2fOneConnect)
                    buildContainer.outroof = true
                    buildBack.anchor.set(0.5)
                    buildBack.position.set(position + buildBack.width / 2, ground.getLocalBounds().y - 3)
                    if (Math.random() < 0.5) {
                        createCoverInBuild(position + buildBack.width - 250, true, true)
                    }
                    if (Math.random() < 0.5) {
                        createCoverInBuild(position + 150, true, true)
                    }
                }
            }
        }
        if (type === 'end') {
            if (buildContainer.outroof) {
                buildZipline = new PIXI.Sprite(buildZiplineTexture.textures.Zipline1FEnd)
                buildZipline.position.set(buildBack.x + buildBack.width / 2 - 96, buildBack.y - buildBack.height / 2 - 74 )
                buildZipline.end = true
            } else {
                buildZipline = new PIXI.Sprite(buildZiplineTexture.textures.Zipline2FEnd)
                buildZipline.position.set(buildBack.x + buildBack.width / 2, buildBack.y - buildBack.height / 2 )
                buildZipline.end = true
            }
            buildZipline.zIndex = 1
            world.addChild(buildZipline)
            zipLines.push(buildZipline)
            afterBuilding = buildBack.x + buildBack.width / 2
        }
        if (buildFront) {
            buildFront.anchor.set(0.5)
            buildFront.position.set(buildBack.x, buildBack.y)
            buildFront.parentGroup = fg
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
        const resetSpawnZones = [
            {
                x: bounds.x - 50,
                w: bounds.x + 150
            },
            {
                x: bounds.x + bounds.width - 50,
                w: bounds.x + bounds.width + 150
            }
        ]
        buildContainer.resetSpawnZones = resetSpawnZones
        buildContainer.body = Matter.Bodies.rectangle(buildBack.x, secondFloor + 50, buildBack.width + 20, 40, {isStatic: true});
        Matter.World.add(engine.world, buildContainer.body);
        world.addChild(buildContainer)
        buildings.push(buildContainer)
    }

    function updateZiplines() {
        zipLines.forEach((b, idx) => {
            if (b.position.x + b.width < zeroLeft) {
                world.removeChild(b)
                zipLines.splice(idx, 1)
                return;
            }
            if (playerState.inZipLine || b.used) return
            if (b.position.x + (b.end ? b.width - 20 : -10) < player.x && b.position.x + (b.end ? b.width : 0) > player.x) {
                b.used = true
                soundPlayer.zipLine()
                playerState.inZipLine = b.end ? "bot" : "top"
                playerSpeed = 0
                playAnim('zipLine')
                player.rotation = skinStore[Number(storage.selectedSkin)].noRotate ? 0 : 4.8
            }
        })
    }

    function createBuilding(type) {
        const buildContainer = new PIXI.Container()
        let buildBack
        let buildFront
        let buildConnect
        let position = zeroRight + 300
        if (buildings.length > 0 && type !== 'start') {
            const lastBuilding = buildings[buildings.length - 1].getLocalBounds()
            position = lastBuilding.x + lastBuilding.width
        }
        deleteWallsAroundBuilding(position)
        if (type === 'start') {
            buildBack = new PIXI.Sprite(build1.textures.Build1FOne)
            buildFront = new PIXI.Sprite(build1.textures.Build1FOneClose)
            if (trapManager) trapManager.createDoor(position + 32)
            if (Math.random() < 0.5) {
                if (trapManager) trapManager.createDoor(position + buildBack.width - 72)
            }
            if (Math.random() < 0.5) {
                createCoverInBuild(position + buildBack.width / 2)
            }
        } else {
            const rand = Math.random()
            if (rand < 0.5) {
                buildBack = new PIXI.Sprite(build1.textures.Build1FTwo)
                buildFront = new PIXI.Sprite(build1.textures.Build1FTwoClose)
                if (Math.random() < 0.5) {
                    createCoverInBuild(position + buildBack.width - 150)
                }
                if (Math.random() < 0.5) {
                    if (trapManager) trapManager.createDoor(position + buildBack.width - 72)
                }
            } else {
                buildBack = new PIXI.Sprite(build1.textures.Build1FThree)
                buildFront = new PIXI.Sprite(build1.textures.Build1FThreeClose)
                if (Math.random() < 0.5) {
                    createCoverInBuild(position + buildBack.width - 150)
                }
                if (Math.random() < 0.5) {
                    createCoverInBuild(position + buildBack.width - 340)
                }
                if (Math.random() < 0.5) {
                    if (trapManager) trapManager.createDoor(position + buildBack.width - 72)
                }
            }
            if (type !== 'end') {
                if (rand < 0.5) {
                    buildConnect = new PIXI.Sprite(build1.textures.Build1FTwoConnection)
                } else {
                    buildConnect = new PIXI.Sprite(build1.textures.Build1FThreeConnection)
                }
            }
        }
        buildBack.anchor.set(0.5)
        buildFront.anchor.set(0.5)
        buildFront.parentGroup = fg
        buildFront.zOrder = 10
        buildBack.position.set(position + buildBack.width / 2, ground.getLocalBounds().y - 97)
        buildFront.position.set(position + buildFront.width / 2, buildBack.y)
        if (buildConnect) {
            buildConnect.anchor.set(0.5)
            buildConnect.position.set(position + buildConnect.width / 2, buildBack.y)
            buildContainer.addChild(buildConnect)
        }
        if (type === 'end') {
            afterBuilding = buildBack.x + buildBack.width / 2
        }
        buildContainer.addChild(buildBack)
        buildContainer.addChild(buildFront)
        const bounds = buildContainer.getLocalBounds()
        const resetSpawnZones = [
            {
                x: bounds.x - 50,
                w: bounds.x + 150
            },
            {
                x: bounds.x + bounds.width - 50,
                w: bounds.x + bounds.width + 150
            }
        ]
        buildContainer.resetSpawnZones = resetSpawnZones
        buildContainer.body = Matter.Bodies.rectangle(buildBack.x, secondFloor + 50, buildBack.width + 20, 40, {isStatic: true});
        Matter.World.add(engine.world, buildContainer.body);
        world.addChild(buildContainer)
        buildings.push(buildContainer)
    }

    function createCoverInBuild(pos, isSecondFloor, isRoof) {
        let wall
        if (isRoof) {
            const randomWall = Math.floor(Math.random() * (1 + 1))
            wall = new PIXI.Sprite(inFloorTexture.textures[`Floor-${randomWall}`])
            wall.coverX = pos - 34
        } else {
            const randomWall = Math.floor(Math.random() * (2 + 1))
            wall = new PIXI.Sprite(inBuildTexture.textures[`inhouse-${randomWall}`])
            wall.coverX = pos - 20
        }
        wall.bound = 0
        wall.anchor.set(0.5, 1)
        wall.position.set(pos, isSecondFloor ? isRoof ? ground.getLocalBounds().y - 115 : ground.getLocalBounds().y - 110 : ground.getLocalBounds().y + 78)
        wall.height = wall.height * 2
        wall.width = wall.width * 2
        wall.zIndex = 1
        world.addChild(wall)
        walls.push(wall)
    }

    function updateBuildings() {
        buildings.forEach((build, idx) => {
            const b = build.getBounds()
            if (b.x + b.width < 0) {
                if (build.club) {
                    isClub = false
                    isBuilding = false
                }
                world.removeChild(build)
                if (build.body) Matter.World.remove(engine.world, build.body)
                buildings.splice(idx, 1)
            }
        })
    }

    // randomRGB перенесена в utils/GameUtils.js

    function createClub() {
        let position = zeroRight + 300
        const clubContainer = new PIXI.Container()
        const clubBack = new PIXI.Sprite(club.textures.clubBack)
        const clubFront = new PIXI.Sprite(club.textures.clubFront)
        deleteWallsAroundBuilding(zeroRight + clubBack.width / 2)
        for (let i = 1; i <= 17; i++) {
            const rand = Math.floor(Math.random() * (9 - 1 + 1) + 1)
            const laserBeam = new PIXI.AnimatedSprite(laserBeamTexture.animations[`render${rand}`])
            laserBeam.position.set(position + 526 + (i * 44), WORLD_HEIGHT - 434)
            laserBeam.tint = randomRGB()
            laserBeam.scale.y = `1.0${rand}`
            laserBeam.parentGroup = fg
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
        clubFront.parentGroup = fg
        clubFront.zOrder = 10
        clubBack.position.set(position + clubBack.width / 2, ground.getLocalBounds().y - 97)
        clubFront.position.set(position + clubFront.width / 2, clubBack.y)
        clubContainer.club = true

        if (Math.random() < 0.5) {
            createCoverInClub(position + 190, 0)
        }
        if (Math.random() < 0.5) {
            createCoverInClub(position + 410, 1)
        }
        if (Math.random() < 0.5) {
            createCoverInClub(position + 540, 1)
        }
        if (Math.random() < 0.1) {
            createBoss(4, clubBack.x + 130)
        } else {
            if (Math.random() < 0.5) {
                createCoverInClub(position + 840, 0)
            }
            if (Math.random() < 0.5) {
                createCoverInClub(position + 1300, 0)
            }
        }
        if (Math.random() < 0.5) {
            createCoverInClub(position + 1600, 2)
        }
        if (Math.random() < 0.5) {
            createCoverInClub(position + 1900, 2)
        }

        clubContainer.addChild(clubBack)
        clubContainer.addChild(clubFront)
        const bounds = clubContainer.getLocalBounds()
        const resetSpawnZones = [
            {
                x: bounds.x - 50,
                w: bounds.x + 100
            },
            {
                x: clubBack.x - 450,
                w: clubBack.x - 350
            },
            {
                x: clubBack.x + 400,
                w: clubBack.x + 500
            },
            {
                x: bounds.x + bounds.width - 50,
                w: bounds.x + bounds.width + 50
            }
        ]
        clubContainer.resetSpawnZones = resetSpawnZones
        world.addChild(clubContainer)
        buildings.push(clubContainer)
    }

    function createCoverInClub(pos, type, forBoss) {
        const wall = new PIXI.Sprite(inClubTexture.textures[`inClub-${type}`])
        switch (true) {
            case type === 0:
                wall.bound = 50
                wall.coverX = pos - 42
                wall.position.set(pos, ground.getLocalBounds().y + 31)
            break
            case type === 1:
                wall.bound = 80
                wall.coverX = pos - 26
                wall.position.set(pos, ground.getLocalBounds().y + 25)
            break
            case type === 2:
                wall.bound = 80
                wall.coverX = pos - 30
                wall.position.set(pos, ground.getLocalBounds().y + 33)
            break
        }
        if (forBoss) {
            wall.forBoss = true
        }
        wall.anchor.set(0.5)
        wall.height = wall.height * 2
        wall.width = wall.width * 2
        wall.zIndex = 1
        world.addChild(wall)
        walls.push(wall)
    }

    // Функции updateDropMoney и spawnDropMoney теперь в MoneyManager
    // Оставлены для обратной совместимости, но больше не используются



    // Функции grenadeBounce, grenadeExplode, updateGrenade теперь в GrenadeManager
    // Оставлены для обратной совместимости, но больше не используются



    async function enemyShooting(char) {
        const warning = new PIXI.Sprite(particles.textures.detection)
        warning.zIndex = 20
        warning.anchor.set(0.5)
        warning.tint = 16776960
        warning.scale.x = 1.5
        warning.scale.y = 2
        warning.position.set(char.x, char.y - 40)
        char.params.warning = warning
        if (char.params.longRange) {
            const longDetector = PIXI.Sprite.from(PIXI.Texture.WHITE);
            longDetector.zIndex = 20
            longDetector.anchor.set(1)
            longDetector.tint = 16711680
            longDetector.scale.x = 14
            longDetector.scale.y = 0.1
            longDetector.position.set(char.x - char.width / 2 + 10, char.y - 6)
            char.params.longDetector = longDetector
            world.addChild(longDetector)
        }
        world.addChild(warning)
        if (char.params.canCover) {
            char.params.inCover = false
            char.tint = player.color
            char.anchor.y = 0.5
        }
        //prepare
        await sleep(Math.max(random(char.params.warningMin, char.params.warningMax, true, true) - (gameState.points / 100), 100))
        if (char.params.dead) return
        warning.tint = 16711680
        //shoot
        await sleep(200)
        if (char.params.dead) return
        world.removeChild(warning)
        if (char.params.longRange) {
            world.removeChild(char.params.longDetector)
        }
        if (char.params.rapidFire) {
            const fireTimes = random(1, char.params.rapidFire)
            enemyShotAnim(char, fireTimes)
            await shotRapid(char, char.params.offsetX || 0, char.params.offsetY || 0, fireTimes, char.params.gun, 100)
        } else {
            enemyShotAnim(char, 1)
            shot(char, char.params.offsetX || 0, char.params.offsetY || 0, char.params.gun)
            await sleep(200)
        }
        //reload
        if (char.params.canCover) {
            char.params.inCover = true
            char.tint = 11776947
            char.anchor.y = 0.7
        }
        await sleep(Math.max(random(char.params.reloadMin, char.params.reloadMax, true, true) - (gameState.points / 100), 200))
        if (char.params.dead) return
        char.params.detect = false
    }

    function enemyShotAnim(char, times) {
        char.textures = char.params.animset.shot
        char.play()
        sleep(times * 200).then(() => {
            if (char.params.dead) return
            char.textures = char.params.animset.idle
            char.play()
        })
    }

    function bossReward() {
        const rewardContainer = new PIXI.Container()
        const rand = random(1,3)
        let icon
        let text
        switch (true) {
            case rand === 1:
                icon = new PIXI.Sprite(activeItems.textures.stimpack)
                text = new PIXI.Text('+1', textStyles.default80)
                icon.scale.set(2)
                storage.activeItems.stimpack += 1
                HUDupdateSkills()
            break
            case rand === 2:
                icon = new PIXI.Sprite(activeItems.textures.handGrenadeIcon)
                text = new PIXI.Text('+1', textStyles.default80)
                icon.scale.set(1.5)
                storage.activeItems.grenades += 1
                HUDupdateSkills()
            break
            case rand === 3:
                icon = new PIXI.Sprite(menuIcons.textures.money)
                text = new PIXI.Text('+500', textStyles.default80)
                icon.scale.set(1.5)
                gameState.collectedMoney += 500
            break
        }
        icon.anchor.set(0.5)
        text.anchor.set(0.5)
        icon.position.set(0,0)
        text.position.set(0, icon.y + icon.height / 2 + 30)
        rewardContainer.addChild(icon)
        rewardContainer.addChild(text)
        rewardContainer.position.set(gameWidth / 2, gameHeight / 2)

        hud.addChild(rewardContainer)

        const move = setInterval(() => {
            rewardContainer.position.y -= 1
            rewardContainer.alpha -= 0.01
            if (rewardContainer.alpha <= 0) {
                clearInterval(move)
                hud.removeChild(rewardContainer)
            }
        }, 10)
    }

    function createBoss(propType, propPos) {
        let randomPos = propPos || Math.floor(zeroRight + random(300, 750))

        enemies.forEach((enemy, idx) => {
            if (enemy.x > randomPos - 400 && enemy.x < randomPos + 50) {
                world.removeChild(enemy)
                enemies.splice(idx, 1)
            }
        })

        walls.forEach((wall, idx) => {
            if (wall.x > randomPos - 400 && wall.x < randomPos + 200) {
                world.removeChild(wall)
                walls.splice(idx, 1)
            }
        })

        traps.forEach((trap, idx) => {
            if (!trap.type) {
                const t = trap.getLocalBounds()
                if (t.x > randomPos - 400 && t.x < randomPos + 200) {
                    world.removeChild(trap)
                    traps.splice(idx, 1)
                }
            }
        })

        let type
        const randType = propType || random(1, 4)
        switch (true) {
            case randType === 1:
                type = 'bossGun'
            break
            case randType === 2:
                type = 'bossLauncher'
            break
            case randType === 3:
                type = 'bossVan'
            break
            case randType === 4:
                type = 'bossSmg'
            break
        }

        if (propType === 4) {
            createCoverInClub(randomPos - (WORLD_WIDTH / 1.8), 0, true)
        } else {
            createWall(randomPos - (WORLD_WIDTH / 1.8), true)
        }
        const boss = new PIXI.AnimatedSprite(eval(type).animations.idle)
        boss.anchor.set(0.5)
        boss.animationSpeed = 0.15
        boss.position.set(type === 'bossVan' ? randomPos + 25 : randomPos, playerPos - (type === 'bossVan' ? 36 : 10))
        boss.params = {
            animset: eval(type).animations
        }
        Object.keys(enemyParams[type]).forEach(item => {
            boss.params[item] = enemyParams[type][item]
        })
        boss.zIndex = 10
        boss.type = type
        currentBoss = boss
        world.addChild(currentBoss)
        boss.play()
    }

    async function bossShooting() {
        const warning = new PIXI.Sprite(particles.textures.detection)
        warning.zIndex = 20
        warning.anchor.set(0.5)
        warning.tint = 16776960
        warning.scale.x = 1.5
        warning.scale.y = 2
        warning.position.set(currentBoss.x, currentBoss.y - 40)
        currentBoss.params.warning = warning
        world.addChild(warning)
        let fireTimes = 1
        if (currentBoss.params.rapidFire) {
            fireTimes = Math.floor(Math.random() * (currentBoss.params.rapidFire - 1 + 1)) + 1
        }
        let walking
        //prepare
        await sleep(Math.max(random(currentBoss.params.warningMin, currentBoss.params.warningMax, true, true) - (gameState.points / 100), 100))
        if (!currentBoss || currentBoss.params.dead) return
        warning.tint = 16711680
        //shoot
        await sleep(200)
        world.removeChild(warning)
        if (!currentBoss || currentBoss.params.dead) return
        switch (true) {
            case currentBoss.type === 'bossVan':
                currentBoss.textures = currentBoss.params.animset.fromIdle
                currentBoss.play()
                await sleep(200)
                if (!currentBoss || currentBoss.params.dead) return
                currentBoss.textures = currentBoss.params.animset.shot
                currentBoss.play()
                shotRapid(currentBoss, 36, 12, fireTimes, 'smg')
                await sleep(50)
                shotRapid(currentBoss, 34, 40, fireTimes, 'smg')
                await sleep(100)
                await shotRapid(currentBoss, 106, 20, fireTimes, 'smg')
                if (!currentBoss || currentBoss.params.dead) return
                currentBoss.textures = currentBoss.params.animset.toIdle
                currentBoss.play()
                await sleep(200)
                if (!currentBoss || currentBoss.params.dead) return
                currentBoss.textures = currentBoss.params.animset.idle
                currentBoss.play()
            break
            case currentBoss.type === 'bossGun':
                enemyShotAnim(currentBoss, fireTimes)
                await shotRapid(currentBoss, 6, 14, fireTimes, 'rifle')
                await sleep(100)
                if (currentBoss.params.walk) {
                    if (!currentBoss || currentBoss.params.dead) return
                    currentBoss.textures = currentBoss.params.animset.walk
                    currentBoss.play()
                    walking = setInterval(() => {
                        if (gameState.isPause) return
                        if (!currentBoss || currentBoss.params.dead) return
                        currentBoss.x -= 1
                    }, 10)
                }
            break
            case currentBoss.type === 'bossSmg':
                enemyShotAnim(currentBoss, fireTimes)
                await shotRapid(currentBoss, 0, -2, fireTimes, 'smg', 150)
            break
            case currentBoss.type === 'bossLauncher':
                enemyShotAnim(currentBoss, fireTimes)
                if (grenadeManager) {
                    grenadeManager.shotGrenade(currentBoss, 0, 0)
                }
                await sleep(200)
            break
        }
        //reload
        await sleep(Math.max(random(currentBoss.params.reloadMin, currentBoss.params.reloadMax, true, true) - (gameState.points / 100), 100))
        if (!currentBoss || currentBoss.params.dead) return
        if (currentBoss.params.walk) {
            clearInterval(walking)
            currentBoss.textures = currentBoss.params.animset.idle
            currentBoss.play()
        }
        bossShooting()
    }

    async function shotRapid(char, offsetX, offsetY, times, gun, cd) {
        const shotTime = cd ? cd :200
        const repeat = setInterval(() => {
            if (isPause) return
            if (char.params.dead) return
            shot(char, offsetX, offsetY, gun)
        }, shotTime)
        return new Promise(function(resolve) {
            sleep(times * shotTime).then(() => {
                clearInterval(repeat)
                resolve()
            })
        });
    }

    // Функции updateGrenades, shotGrenade, activateGrenade теперь в GrenadeManager
    // Оставлены для обратной совместимости, но больше не используются

    function updateBoss() {
        if (currentBoss.x + currentBoss.width < zeroLeft) {
            world.removeChild(currentBoss)
            currentBoss = null
            return
        }
        if (currentBoss.params.dead) {
            playerState.inBossFight = false
            return
        }
        if (!currentBoss.params.detect) {
            if (currentBoss.x - player.x < (WORLD_WIDTH)) {
                currentBoss.params.detect = true
                bossShooting()
            }
        }
        if (!currentBoss.skip && currentBoss.params.melee) {
            if (player.x + 20 > currentBoss.x) {
                currentBoss.skip = true
                playerState.inBossFight = false
                if (playerDamageManager) {
                    playerDamageManager.damagePlayer()
                }
            }
        }
        playerBullets.forEach((bullet, idx) => {
            const b = bullet.getBounds()
            const boss = currentBoss.getBounds()
            if (b.x + b.width > boss.x && boss.x + boss.width > b.x && b.y + b.height > boss.y && boss.y + boss.height > b.y) {
                world.removeChild(bullet)
                playerBullets.splice(idx, 1)
                if (currentBoss.x - player.x < 200) {
                    damageEnemy(currentBoss,gun.damage * 2, currentBoss.type !== 'bossSmg')
                } else {
                    damageEnemy(currentBoss, gun.damage, currentBoss.type !== 'bossSmg')
                }
            }
        })
    }

    // Функции updateDogEnemy и createDogEnemy теперь в DogEnemyManager
    // Оставлены для обратной совместимости, но больше не используются

    function createEnemy(pos, canCover) {
        let randomPos = pos || Math.floor(zeroRight + Math.floor(Math.random() * (250 - 50 + 1) + 50))
        let isSecondFloor = false

        buildings.forEach(build => {
            build.resetSpawnZones.forEach(zone => {
                // console.log(`${zone.x} > ${randomPos} < ${zone.w}`)
                if (randomPos + 30 > zone.x && randomPos < zone.w) {
                    if (zone.w - randomPos < randomPos - zone.x) {
                        randomPos = zone.w + 50
                    } else {
                        randomPos = zone.x - 50
                    }
                    // console.log('popal' + randomPos)
                }
            })
        })

        const findDuplicate = enemies.findIndex(enemy => randomPos + 30 > enemy.x && randomPos < enemy.x + enemy.width)
        if (findDuplicate >= 0) return

        if (currentBoss) {
            if (randomPos + 30 > currentBoss.x && randomPos < currentBoss.x + currentBoss.width) return
        }

        if (buildings.length > 0) {
            const activeBuilding = buildings[0]
            const lastBuilding = buildings[buildings.length - 1].getLocalBounds()
            if ((lastBuilding.x + lastBuilding.width > randomPos && activeBuilding.getLocalBounds().x < randomPos) && activeBuilding.secondFloor) {
                isSecondFloor = true
            }
        }

        const rand = random(1, 100)
        let enemyType = 'default'
        switch(true) {
            case rand > Math.max(200 - gameState.points / 100, 80):
                enemyType = 'shield'
                break
            case rand > Math.max(150 - gameState.points / 100, 75):
                enemyType = 'silence'
                break
            case rand > Math.max(130 - gameState.points / 100, 60):
                enemyType = 'shotgun'
                break
            case rand > Math.max(115 - gameState.points / 100, 50):
                enemyType = 'smg'
                break
            case rand > Math.max(95 - gameState.points / 100, 20):
                enemyType = 'nigga'
                break
            case rand > 0:
                enemyType = 'default'
                break
        }
        const enemy = new PIXI.AnimatedSprite(enemiesTexture.animations[`${enemyType}Idle`])
        enemy.params = {}
        Object.keys(enemyParams[enemyType]).forEach(item => {
            enemy.params[item] = enemyParams[enemyType][item]
        })
        enemy.params.animset = {}
        enemy.params.animset.idle = enemiesTexture.animations[`${enemyType}Idle`]
        enemy.params.animset.shot = enemiesTexture.animations[`${enemyType}Shot`]
        enemy.params.animset.death = enemiesTexture.animations[`${enemyType}Death`]
        enemy.params.animset.deathCrit = enemiesTexture.animations[`${enemyType}DeathCrit`]
        if (enemy.params.shield) {
            enemy.params.animset.idleAlt = enemiesTexture.animations[`${enemyType}IdleAlt`]
            enemy.params.animset.shotAlt = enemiesTexture.animations[`${enemyType}ShotAlt`]
            enemy.params.animset.knock = enemiesTexture.animations[`${enemyType}Knock`]
        }
        enemy.anchor.set(0.5)
        if (canCover) {
            enemy.params.canCover = true
            enemy.params.inCover = true
            enemy.anchor.y = 0.7
            enemy.tint = 11776947
        }
        enemy.scale.set(2)
        enemy.animationSpeed = 0.2
        enemy.zIndex = 8
        enemy.position.set(randomPos, isSecondFloor ? secondFloor : playerPos)
        enemy.secondFloor = isSecondFloor
        world.addChild(enemy)
        enemy.play()
        enemies.push(enemy)
    }

    function damageEnemy(enemy, damage, isBoss) {
        enemy.params.health -= damage
        addPoints(5)
        gameState.scoreStreak += 0.5
        //particles
        if (isBoss || (enemy.params.shield && !enemy.params.knocked)) {
            soundPlayer.damageMetal()
        } else {
            soundPlayer.damageFlesh()
        }
        for (let i = 0; i < random(8,20); i++) {
            if (particleManager) {
                particleManager.createParticle(enemy, isBoss || (enemy.params.shield && !enemy.params.knocked) ? 'spark' : 'blood', enemy.secondFloor, null)
            }
        }
        //dead
        if (enemy.params.health <= 0) {
            if (enemy.params.detect) {
                world.removeChild(enemy.params.warning)
                if (enemy.params.longDetector) {
                    world.removeChild(enemy.params.longDetector)
                }
            }
            if (enemy.params.deathType) {
                switch (true) {
                    case enemy.params.deathType === 'smallExplode':
                        if (explosionManager) {
                            explosionManager.createExplode(enemy, 0, 0, false)
                        }
                    break
                    case enemy.params.deathType === 'bigExplode':
                        if (explosionManager) {
                            explosionManager.createExplode(enemy, -28, -24, true)
                        }
                    break
                }
            }
            if (cameraManager) {
                cameraManager.cameraShake(1, 400)
            }
            enemy.params.dead = true
            gameState.scoreStreak += enemy.params.points / 10
            addPoints(enemy.params.points)
            enemy.loop = false
            if (damage > gun.damage || isBoss) {
                addPoints(10)
                enemy.textures = enemy.params.animset.deathCrit || enemy.params.animset.death
                for (let i = 0; i < random(8,20); i++) {
                    if (particleManager) {
                        particleManager.createParticle(enemy, 'blood', enemy.secondFloor, null)
                    }
                }
            } else {
                enemy.textures = enemy.params.animset.death
            }
            if (enemy.params.moneyDrop) {
                for (let i = 0; i <= random(0,enemy.params.moneyDrop); i++) {
                    if (moneyManager) {
                        moneyManager.spawnDropMoney(enemy)
                    }
                }
            }
            if (isBoss) bossReward()
            enemy.play()
            return
        }
        //shield
        if (enemy.params.shield && !enemy.params.knocked && enemy.params.health <= 2) {
            enemy.params.knocked = true
            enemy.textures = enemy.params.animset.knock
            enemy.play()
            enemy.params.animset.idle = enemy.params.animset.idleAlt
            enemy.params.animset.shot = enemy.params.animset.shotAlt
            sleep(150).then(() => {
                if (enemy.params.health <= 0) return
                enemy.textures = enemy.params.animset.idle
                enemy.play()
            })
        }
    }

    function updateEnemies() {
        enemies.forEach((enemy, idx) => {
            if (!enemy.params.dead) {
                //detect player
                if (!enemy.params.detect) {
                    const checkTraps = traps.find(trap => {
                        if (!trap.dead && trap.type) {
                            if (trap.x > enemy.x - (WORLD_WIDTH) && trap.x < enemy.x) {
                                return true
                            }
                        } else {
                            return false
                        }
                    })
                    if (!checkTraps) {
                        if (enemy.x - player.x < getPercent(WORLD_WIDTH,enemy.params.detectRange) && enemy.y - 20 <= player.y) {
                            enemy.params.detect = true
                            enemyShooting(enemy)
                        }
                    }
                }
                //check player bullets
                playerBullets.forEach((bullet, idx) => {
                    if (enemy.x - enemy.width / 2 < bullet.x + bullet.width && enemy.x + enemy.width / 2 > bullet.x && enemy.y - enemy.height / 2 < bullet.y && enemy.y + enemy.height / 2 > bullet.y) {
                        if (enemy.params.inCover) return
                        world.removeChild(bullet)
                        playerBullets.splice(idx, 1)
                        if (enemy.x - player.x < getPercent(WORLD_WIDTH, 30)) {
                            damageEnemy(enemy,gun.damage * 2)
                        } else {
                            damageEnemy(enemy,gun.damage)
                        }
                    }
                })
                //check player collision
                if (!enemy.skip && (player.x > enemy.x - 30 && player.x + 40 < enemy.x + enemy.width)) {
                    if ((!meleeKillManager || !meleeKillManager.hasMeleeKill()) && (playerState.state === 'roll' || playerState.state === 'rollEnd')) {
                        if (playerState.invincible) {
                            damageEnemy(enemy, 10)
                        } else {
                            if (meleeKillManager) {
                                meleeKillManager.createMeleeKillUI(enemy)
                            }
                        }
                    } else {
                        if (enemy.params.inCover) return
                        gameState.points -= 250 * gameState.multiplier
                        if (gameState.points < 0) {
                            gameState.points = 0
                        }
                        gameState.scoreStreak -= 20
                    }
                    enemy.skip = true
                }
            }
            if (enemy.x + enemy.width < zeroLeft) {
                world.removeChild(enemy)
                enemies.splice(idx, 1)
            }
        })
    }

    function createBgCar() {
        const car = new PIXI.Container()
        const carBack = new PIXI.Sprite(bgCarTexture.textures.carBack)
        const carFront = new PIXI.Sprite(bgCarTexture.textures.carFront)
        carBack.anchor.set(0.5)
        carFront.anchor.set(0.5)
        carBack.tint = randomRGB()
        if (Math.random() < 0.5) {
            car.side = 1
            car.position.set(zeroRight, ground.getLocalBounds().y + 56)
        } else {
            carBack.scale.set(-1, 1)
            carFront.scale.set(-1, 1)
            car.side = -1
            car.position.set(zeroLeft - 100, ground.getLocalBounds().y + 56)
        }
        car.speed = random(4, 10)
        car.zIndex = -1
        car.addChild(carBack)
        car.addChild(carFront)
        world.addChild(car)
        bgCar = car
    }

    function updateBgCar() {
        const b = bgCar.getBounds()
        if (bgCar.side > 0) {
            bgCar.x -= bgCar.speed
            if (b.x + b.width < 0) {
                world.removeChild(bgCar)
                bgCar = null
            }
        } else {
            bgCar.x += bgCar.speed
            if (b.x > zeroRight) {
                world.removeChild(bgCar)
                bgCar = null
            }
        }
    }

    function createFloor(idx) {
        const part = new PIXI.Container()
        const floor = new PIXI.Sprite(textures.textures.ground)
        floor.anchor.set(0,1)
        floor.position.set((floorPosition + idx) * floor.width, WORLD_HEIGHT)
        floor.tint = groundColor[selectGroundColor]
        let bgWall
        const randomWall = Math.floor(Math.random() * (10 - 1 + 1) + 1)
        if (randomWall < fenceChance) {
            if (!isFence) {
                bgWall = new PIXI.Sprite(textures.textures.groundFenceStart)
            } else {
                bgWall = new PIXI.Sprite(textures.textures.groundFenceMiddle)
            }
            isFence = true
        } else {
            if (isFence) {
                bgWall = new PIXI.Sprite(textures.textures.groundFenceEnd)
            } else {
                bgWall = new PIXI.Sprite(textures.textures.groundWall)
            }
            isFence = false
        }
        if (Math.random() > 0.5) createWood(floor.x, floor.y - floor.height)
        if (Math.random() > 0.75 && isBuilding) {
            const posX = random(10, 100)
            const posY = random(94, 104)
            if (garbageManager) {
                garbageManager.createGarbage(floor.x + floor.width + posX, floor.y + posY)
            }
        }
        if (Math.random() > 0.75 && isBuilding) {
            const posX = random(10, 100)
            const posY = random(65, 75)
            if (garbageManager) {
                garbageManager.createGarbage(floor.x + floor.width + posX, floor.y + posY)
            }
        }
        floor.body = Matter.Bodies.rectangle(floor.x, floor.y - floor.height + 44, floor.width + 20, 40, {isStatic: true});
        bgWall.anchor.set(0,1)
        bgWall.position.set((floorPosition + idx) * bgWall.width, floor.y - floor.height)
        part.addChild(floor)
        part.addChild(bgWall)
        ground.addChild(part)
        Matter.World.add(engine.world, floor.body);
    }

    function updateFloor() {
        if (zeroLeft - ground.getLocalBounds().x > 192) {
            floorPosition++
            Matter.World.remove(engine.world, ground.getChildAt(0).children[0].body);
            ground.removeChildAt(0)
            createFloor(3)
            spawnEntity()
        }
        woodsBGarr.forEach((wood, idx) => {
            const w = wood.getBounds()
            if (w.x + w.width < 0) {
                woodsBG.removeChild(wood)
                woodsBGarr.splice(idx, 1)
            }
        })
    }

    function createWood(posX, posY) {
        const wood = new PIXI.AnimatedSprite(woods.animations[`wood${random(1,4)}_part`])
        wood.scale.set(random(0.8,1.5,true, true))
        wood.anchor.set(0,1)
        wood.position.set(posX, posY + 60)
        wood.animationSpeed = 0.1
        wood.play()

        woodsBGarr.push(wood)
        woodsBG.addChild(wood)
    }

    function createBg(img) {
        const tiling = new PIXI.TilingSprite(img, WORLD_WIDTH + 100, gameHeight + 100)
        // tiling.scale.set(0.8)
        tiling.anchor.set(0.5, 1)
        tiling.zIndex = -10
        tiling.tilePosition.y = gameHeight
        tiling.position.set(WORLD_WIDTH / 2, WORLD_HEIGHT)
        world.addChild(tiling)
        return tiling
    }

    function updateBg() {
        if (gameStart) {
            bgPosition -= (bgSpeed * playerSpeed) * gameSpeed
            background.x = zeroLeft + WORLD_WIDTH / 2
            background.tilePosition.x = bgPosition
        }
    }

    // Функции updatePowerUp и createPowerUp теперь в PowerUpManager
    // Оставлены для обратной совместимости, но больше не используются


    // Функции barrelDead, updateTraps, createWindow, createDoor теперь в TrapManager
    // Оставлены для обратной совместимости, но больше не используются

    function detectWall() {
        let p = player.getBounds()
        return walls.find(w => {
            let wall = w.getBounds()
            if (p.x > (wall.x - wall.width / 2) + w.bound && p.x < (wall.x - wall.width / 2) + 40 + w.bound) {
                return w
            }
        })
    }

    function createWall(pos, forBoss) {
        let wall
        const randomPos = pos || zeroRight + random(100, 250)
        if (!pos && !forBoss) {
            const rand = random(1, 10)
            if (rand > 5) {
                createEnemy(randomPos + 60, true)
            }
        }
        if (afterBuilding > randomPos - 100) {
            return
        }
        if (walls.length > 0) {
            const wallSize = walls[walls.length - 1].getLocalBounds()
            if (randomPos > wallSize.x - 100 &&
                randomPos < wallSize.x + wallSize.width + 100) {
                return
            }
        }
        const randomWall = random(1, 10)
        if (randomWall < 4) {
            wall = new PIXI.Sprite(textures.textures.coverTrash)
            wall.position.set(randomPos, ground.getLocalBounds().y + 36)
            wall.bound = -20
            wall.coverX = randomPos - 28
        } else {
            wall = new PIXI.Sprite(textures.textures.wall)
            wall.position.set(randomPos, ground.getLocalBounds().y + 36)
            wall.bound = 0
            wall.coverX = randomPos - 20
        }
        if (forBoss) {
            wall.forBoss = true
        }
        wall.anchor.set(0.5)
        world.addChild(wall)
        if (Math.random() < 0.5 && randomWall < 4) {
            const pos = random(10, wall.width / 2)
            if (garbageManager) {
                garbageManager.createGarbage(wall.x - wall.width / 2 + pos, wall.y, 4)
            }
        }
        walls.push(wall)
    }

    function updateWall() {
        walls.forEach((wall, idx) => {
            if (wall.x + 100 < zeroLeft) {
                world.removeChild(wall)
                walls.splice(idx, 1)
            }
        })
    }

    function shot(char, offsetX, offsetY, eventGun, friendly) {
        if (bulletManager) {
            const textures = { particles }
            bulletManager.shot(
                char,
                offsetX,
                offsetY,
                eventGun,
                friendly,
                textures,
                friendly ? gun : null,
                friendly ? playerState : null,
                soundPlayer,
                spawnBounceParticle,
                sleep
            )
            // Обновление ссылок на массивы для обратной совместимости
            if (friendly) {
                const bulletArrays = bulletManager.getBulletArrays()
                // Обновляем shotsArr для синхронизации
                shotsArr = bulletArrays.shotsArr
                // playerBullets импортируется из Player.js и управляется там
                // Но пули добавляются через BulletManager, поэтому нужно синхронизировать
                // Примечание: playerBullets может использоваться в Player.js, поэтому синхронизация происходит через импорт
            }
        }
    }

    function spawnBullet(x, y, char) {
        if (bulletManager) {
            const textures = { particles }
            const isPlayer = !char
            return bulletManager.spawnBullet(
                x,
                y,
                char,
                isPlayer ? gun : null,
                isPlayer,
                textures,
                isPlayer ? playerState.activePowerUps : []
            )
        }
        return null
    }

    function updateBullets() {
        // Обновление пуль теперь в BulletManager.updateBullets()
        // Функция оставлена для обратной совместимости
        if (bulletManager) {
            bulletManager.updateBullets(zeroLeft, zeroRight, WORLD_WIDTH, gameSpeed)
        }
    }

    function playAnim(anim) {
        if (!player) return;

        player.loop = !anim || anim === 'idle';
        player.animationSpeed = (anim === 'reload' && gun.reloadAnim) ? gun.reloadAnim : 0.2;

        if (gun.noStop && anim === 'shot' && !playerState.inCover) {
            if (playerState.state) {
                updatePlayerState(anim, playerState.currentSkin.animations.run, player.color);
            } else {
                playerState.state = anim;
            }
            return;
        }

        if (!anim || (anim === 'shotEnd' && gun.noStop)) {
            resetPlayerState();
        } else {
            player.tint = (anim === 'roll' || anim === 'rollEnd' || (playerState.inCover && anim !== 'shot')) ? player.shadow : player.color;
            if (anim === 'idle' || anim === 'zipLine') {
                if (anim === 'idle') player.anchor.y = 0.7;
                updatePlayerState('', playerState.currentSkin.animations[anim], player.tint);
            } else {
                updatePlayerState(anim, playerState.currentSkin.animations[anim], player.tint);
            }
        }
    }

    function updatePlayerState(state, textures, tint) {
        playerState.state = state;
        player.textures = textures;
        player.tint = tint;
        player.play();
    }

    function resetPlayerState() {
        playerState.state = '';
        player.textures = playerState.currentSkin.animations.run;
        player.tint = player.color;
        player.play();
    }


    function events(e) {
        if (playerState.health === 0 || gameState.gameEnd || gameState.isPause || gameState.isMenu || !gameState.gameStart) return
        if (playerState.inZipLine) return
        switch (true) {
            //RELOAD
            case e.code === 'KeyR':
                if ((!playerState.state || playerState.state === 'rollEnd') && gun.currentAmmo < gun.ammo && (!meleeKillManager || !meleeKillManager.hasMeleeKill())) {
                    soundPlayer.gunReload(gun.type)
                    playAnim('reload')
                    playerSpeed = 0
                    switch (true) {
                        case gun.type === 'shotgun':
                            for (let i = 0; i < gun.ammo - gun.currentAmmo; i++) {
                                if (particleManager) {
                                    particleManager.spawnBounceParticle(player, 'shell', 16711680)
                                }
                            }
                        break
                        case gun.type === 'revolver':
                            for (let i = 0; i < gun.ammo - gun.currentAmmo; i++) {
                                if (particleManager) {
                                    particleManager.spawnBounceParticle(player, 'shell')
                                }
                            }
                        break
                        default:
                            if (particleManager) {
                                particleManager.spawnBounceParticle(player, 'mag')
                            }
                        break
                    }
                    player.onComplete = () => {
                        HUDbullets()
                        gun.currentAmmo = gun.ammo
                        if (playerState.inCover) {
                            playAnim('idle')
                            return
                        }
                        playerSpeed = playerDefaultSpeed
                        playAnim()
                    }
                }
            break
            //ROLL
            case e.code === 'Space':
                if (!playerState.state && !playerState.inBossFight && (!meleeKillManager || !meleeKillManager.hasMeleeKill())) {
                    gameState.scoreStreak += 1
                    soundPlayer.slide()
                    playAnim('roll')
                    playerSpeed = playerDefaultSpeed * 1.5
                    if (playerState.inCover) {
                        playerState.inCover = false
                        player.anchor.y = 0.5
                        playerState.leaveCover = true
                    }
                    player.onComplete = () => {
                        playerState.leaveCover = false
                        if (playerState.inZipLine || playerState.state !== 'roll') return
                        playAnim('rollEnd')
                        sleep(550, true).then(() => {
                            console.log('resolve')
                            if (playerState.inCover || playerState.inZipLine) {
                                gameState.scoreStreak += 1
                            } else {
                                if (meleeKillManager && meleeKillManager.hasMeleeKill()) return
                                playerSpeed = playerDefaultSpeed
                                playAnim()
                            }
                            playerState.rollId = null
                        })
                        if (meleeKillManager && meleeKillManager.hasMeleeKill()) playerState.rollId.pause()
                    };
                }
            break
            //SHOT
            case e.code === 'KeyF':
                if (meleeKillManager && meleeKillManager.hasMeleeKill()) {
                    meleeKillManager.handleMeleeKill(false, false)
                    return
                }
                if ((!playerState.state || playerState.state === 'rollEnd') && !triggerDelay) {
                    if (gun.currentAmmo <= 0) {
                        soundPlayer.pistolEmpty()
                        return;
                    }
                    triggerDelay = true
                    sleep(gun.shotTrigger).then(() => {
                        triggerDelay = false
                    })
                    if (playerState.inCover) {
                        // player.y = playerState.secondFloor ? secondFloor : playerPos
                        player.anchor.y = 0.5
                        player.tint = player.color
                    }
                    gun.currentAmmo--
                    hud.getChildByName('magazine').removeChildAt(0)
                    hud.getChildByName('magazine').x -= 16
                    playAnim('shot')
                    shot(player, gun.offsetX, gun.offsetY, gun.type, true)
                    if (playerState.stimpack) {
                        sleep(100).then(() => {
                            shot(player, gun.offsetX, gun.offsetY, gun.type, true)
                        })
                    }
                    if (!gun.noStop) {
                        playerSpeed = 0
                        player.onComplete = () => {
                            if (playerState.inCover) {
                                playAnim('idle')
                                return
                            }
                            playerSpeed = playerDefaultSpeed
                            playAnim()
                        }
                    } else {
                        if (playerState.inCover) {
                            player.onComplete = () => {
                                playAnim('idle')
                            }
                            return
                        }
                        playerSpeed = playerDefaultSpeed
                        playAnim()
                    }
                }
            break
            //THROW GRENADE
            case e.code === 'KeyE':
                if (playerState.skillCD || storage.activeItems.grenades === 0) return;
                storage.activeItems.grenades -= 1
                playerState.skillCD = true
                hud.getChildByName('skills').alpha = 0.3
                if (grenadeManager) {
                    grenadeManager.grenadeBounce()
                }
                HUDupdateSkills()
                sleep(6000).then(() => {
                    hud.getChildByName('skills').alpha = 1
                    playerState.skillCD = false
                })
            break
            //USE STIMPACK
            case e.code === 'KeyW':
                if (playerState.skillCD || storage.activeItems.stimpack === 0) return;
                storage.activeItems.stimpack -= 1
                playerState.skillCD = true
                hud.getChildByName('skills').alpha = 0.3
                playerState.stimpack = true
                soundPlayer.useSkill()
                HUDupdateSkills()
                HUDcreateShield()
                sleep(15000).then(() => {
                    HUDremoveShield()
                    hud.getChildByName('skills').alpha = 1
                    playerState.skillCD = false
                    playerState.stimpack = false
                })
            break
            case e.code === 'KeyQ':
                if (playerSpeed) {
                    playerSpeed = 0
                } else {
                    playerSpeed = playerDefaultSpeed
                }
            break
        }
    }

    function HUDbullets() {
        const oldMagazine = hud.getChildByName('magazine')
        if (oldMagazine) {
            hud.removeChild(oldMagazine)
        }
        const magazine = new PIXI.Container()
        for (let i = 0; i < gun.ammo; i++) {
            const bullet = new PIXI.Sprite(activeItems.textures.bullet)
            bullet.position.x = i * (bullet.width + 2)
            magazine.addChild(bullet)
        }
        magazine.name = 'magazine'
        magazine.position.set(20, gameHeight - 60)
        hud.addChild(magazine)
    }

    function HUDpoints() {
        const pointsStyle = new PIXI.TextStyle({
            fontFamily: 'ACastle3',
            fontSize: 56,
            fontStyle: 'italic',
            fontWeight: 'bold',
            fill: ['#ffffff', '#00ff99'], // gradient
            stroke: '#4a1850',
            strokeThickness: 5,
            dropShadow: true,
            dropShadowColor: '#000000',
            dropShadowBlur: 4,
            dropShadowAngle: Math.PI / 6,
            dropShadowDistance: 6,
            wordWrap: true,
            wordWrapWidth: 440,
            lineJoin: 'round',
        });
        const points = new PIXI.Text('0', pointsStyle);
        points.anchor.set(1, 0)
        points.x = gameWidth - 20
        points.y = 40
        points.name = 'points'

        const scaleStyle = new PIXI.TextStyle({
            fontFamily: 'ACastle3',
            fontSize: 32,
            fontStyle: 'italic',
            fontWeight: 'bold',
            fill: ['#ffffff', '#00ff99'], // gradient
            stroke: '#4a1850',
            strokeThickness: 5,
            dropShadow: true,
            dropShadowColor: '#000000',
            dropShadowBlur: 4,
            dropShadowAngle: Math.PI / 6,
            dropShadowDistance: 6,
            wordWrap: true,
            wordWrapWidth: 440,
            lineJoin: 'round',
        });
        const scale = new PIXI.Text('x0', scaleStyle);
        scale.anchor.set(1, 0)
        scale.x = gameWidth - 20
        scale.y = 90
        scale.name = 'scale'

        const scoreStyle = new PIXI.TextStyle({
            fontFamily: 'ACastle3',
            fontSize: 100,
            fontStyle: 'italic',
            fontWeight: 'bold',
            fill: ['#ffffff', '#00ff99'], // gradient
            stroke: '#4a1850',
            strokeThickness: 5,
            dropShadow: true,
            dropShadowColor: '#000000',
            dropShadowBlur: 4,
            dropShadowAngle: Math.PI / 6,
            dropShadowDistance: 6,
            wordWrap: true,
            wordWrapWidth: 440,
            lineJoin: 'round',
        });
        const score = new PIXI.Text('F', scoreStyle);
        score.anchor.set(1, 0)
        score.x = gameWidth - 20
        score.y = 140
        score.name = 'score'

        const hearts = new PIXI.Container()
        for (let i = 0; i < playerState.health; i++) {
            const heart = new PIXI.Sprite(activeItems.textures.heart)
            heart.position.x = (2 - i) * (heart.width / 2 + 10)
            hearts.addChild(heart)
        }
        hearts.name = 'hearts'
        hearts.position.set(20, 46)
        hearts.zIndex = 1

        const skills = new PIXI.Container()
        skills.position.set(20, hearts.y + 50)
        skills.name = 'skills'
        const stimpack = new PIXI.Sprite(activeItems.textures.stimpack)
        stimpack.scale.set(0.9)
        stimpack.position.set(0, 0)
        const stimpackText = new PIXI.Text(storage.activeItems.stimpack, textStyles.default30);
        stimpackText.name = 'stimpackText'
        stimpackText.position.set(stimpack.x + stimpack.width, stimpack.y + stimpack.height / 2)

        const handGrenade = new PIXI.Sprite(activeItems.textures.handGrenadeIcon)
        handGrenade.scale.set(0.6)
        handGrenade.position.set(-6, stimpack.y + 40)
        const handGrenadeText = new PIXI.Text(storage.activeItems.grenades, textStyles.default30);
        handGrenadeText.name = 'handGrenadeText'
        handGrenadeText.position.set(handGrenade.x + handGrenade.width, handGrenade.y + handGrenade.height / 2)

        const powerUps = new PIXI.Container()
        powerUps.name = 'powerUps'
        powerUps.position.set(90, 120)

        skills.addChild(stimpackText)
        skills.addChild(stimpack)
        skills.addChild(handGrenadeText)
        skills.addChild(handGrenade)
        hud.addChild(powerUps)
        hud.addChild(skills)
        hud.addChild(hearts)
        hud.addChild(score)
        hud.addChild(scale);
        hud.addChild(points);

        const fps = new PIXI.Text(app.ticker.FPS, textStyles.default40);
        fps.name = 'fps'
        fps.position.set(5, 100)
        hud.addChild(fps);
    }

    function HUDupdateSkills() {
        hud.getChildByName('skills').getChildByName('stimpackText').text = storage.activeItems.stimpack
        hud.getChildByName('skills').getChildByName('handGrenadeText').text = storage.activeItems.grenades
    }
    function HUDremoveShield() {
        const shield = hud.getChildByName('shield')
        if (shield) {
            hud.removeChild(hud.getChildByName('shield'))
        }
    }
    function HUDcreateShield() {
        const shield = new PIXI.Sprite(activeItems.textures.goldHeart)
        shield.name = 'shield'
        shield.position.set(20 + (playerState.health) * (shield.width / 2 + 8), 46)
        hud.addChild(shield)
    }

    function HUDupdatePowerUp() {
        const powerUps = hud.getChildByName('powerUps')
        powerUps.removeChildren(0, powerUps.children.length)
        if (playerState.activePowerUps.length === 0) return
        playerState.activePowerUps.forEach((item, idx) => {
            const powerUp = new PIXI.Sprite(menuIcons.textures[item.type])
            powerUp.scale.set(0.5)
            powerUp.position.set(50 * idx, 0)
            powerUps.addChild(powerUp)
        })
    }

    function addPoints(points) {
        if (scoreManager) {
            scoreManager.addPoints(points)
        } else {
            gameState.addPoints(points)
        }
    }

    function scoreTimer() {
        // Теперь управляется через ScoreManager
        if (scoreManager) {
            scoreManager.startScoreTimer()
        } else {
            // Fallback на старую логику
            const interval = setInterval(() => {
                if (gameState.isPause) return
                if (gameState.gameEnd || gameState.isMenu) {
                    clearInterval(interval)
                    return;
                }
                if (gameState.scoreStreak <= 0) return
                gameState.decreaseStreak()
                playerDefaultSpeed = initSpeed + gameState.points / 10000
            }, 500)
        }
    }

    function HUDpause() {
        const hudPause = new PIXI.Container()
        hud.addChild(hudPause)

        const pause = new PIXI.Sprite(menuPause.textures.pause)
        pause.eventMode = 'static'
        pause.anchor.set(1)
        pause.position.set(gameWidth - 20, gameHeight - 20)
        hudPause.addChild(pause)

        const pauseMenu = new PIXI.Container()
        hudPause.addChild(pauseMenu)
        pauseMenu.visible = false

        const bg = new PIXI.Graphics();
        bg.beginFill(0x000);
        bg.alpha = 0.4
        bg.drawRect(0, 0, gameWidth, gameHeight);
        pauseMenu.addChild(bg)

        const play = new PIXI.Sprite(menuPause.textures.play)
        play.eventMode = 'static'
        play.anchor.set(1)
        play.position.set(gameWidth - 20, gameHeight - 20)
        pauseMenu.addChild(play)

        const heading = new PIXI.Text('PAUSE', textStyles.default80);
        heading.anchor.set(0.5, 1)
        heading.position.set(gameWidth / 2, gameHeight / 4)
        pauseMenu.addChild(heading)

        const distance = new PIXI.Text(`record: ${storage.record}`, textStyles.default40);
        distance.anchor.set(0, 1)
        distance.position.set(20, gameHeight - 20)
        pauseMenu.addChild(distance)

        const leave = new PIXI.Sprite(menuUI.textures.shortexit)
        leave.eventMode = 'static'
        leave.anchor.set(0.5)
        leave.scale.set(0.5)
        leave.position.set(gameWidth / 2, gameHeight / 2)
        pauseMenu.addChild(leave)

        const leaveMenu = new PIXI.Container()
        hudPause.addChild(leaveMenu)
        leaveMenu.visible = false
        const leaveText = new PIXI.Text('leaving?', textStyles.default56);
        leaveText.anchor.set(0.5, 0)
        leaveText.position.set(gameWidth / 2, gameHeight / 2.5)
        leaveMenu.addChild(leaveText)
        const leaveDesc = new PIXI.Text('your run progress will be lost are you sure?', textStyles.default30);
        leaveDesc.anchor.set(0.5, 0)
        leaveDesc.position.set(gameWidth / 2, leaveText.y + leaveText.height + 20)
        leaveMenu.addChild(leaveDesc)

        const cancelButton = new PIXI.Sprite(menuUI.textures.exitclear)
        cancelButton.eventMode = 'static'
        cancelButton.anchor.set(1, 0)
        cancelButton.scale.set(0.5, 0.4)
        cancelButton.position.set(gameWidth / 2 - 10, leaveDesc.y + leaveDesc.height + 20)
        leaveMenu.addChild(cancelButton)
        const cancelButtonText = new PIXI.Text('leave', textStyles.default40);
        cancelButtonText.anchor.set(0.5)
        cancelButtonText.position.set(cancelButton.x - cancelButton.width / 2, cancelButton.y + cancelButton.height / 2 + 2)
        leaveMenu.addChild(cancelButtonText)

        const stayButton = new PIXI.Sprite(menuUI.textures.stayclear)
        stayButton.eventMode = 'static'
        stayButton.anchor.set(0)
        stayButton.scale.set(0.5, 0.4)
        stayButton.position.set(gameWidth / 2 + 10, leaveDesc.y + leaveDesc.height + 20)
        leaveMenu.addChild(stayButton)
        const stayButtonText = new PIXI.Text('stay', textStyles.default40);
        stayButtonText.anchor.set(0.5)
        stayButtonText.position.set(stayButton.x + stayButton.width / 2, stayButton.y + stayButton.height / 2 + 2)
        leaveMenu.addChild(stayButtonText)

        const timerMenu = new PIXI.Container()
        hudPause.addChild(timerMenu)
        timerMenu.visible = false
        const bgTimer = new PIXI.Graphics();
        bgTimer.beginFill(0x000);
        bgTimer.alpha = 0.4
        bgTimer.drawRect(0, 0, gameWidth, gameHeight);
        timerMenu.addChild(bgTimer)
        const timerText = new PIXI.Text('0', textStyles.default180);
        timerText.anchor.set(0.5)
        timerText.position.set(gameWidth / 2, gameHeight / 2)
        timerMenu.addChild(timerText)

        pause.on('pointerdown', () => {
            if (meleeKillManager && meleeKillManager.hasMeleeKill()) return
            const allAnimated = world.children.filter(item => item.animationSpeed)
            allAnimated.forEach(item => {
                item.stop()
            })
            music.set('paused', true)
            gameState.isPause = true
            hud.getChildByName('magazine').visible = false
            pauseMenu.visible = true
            leave.visible = true
            pause.visible = false
            timeouts.forEach(item => {
                item.pause()
            })
        })

        play.on('pointerdown', () => {
            pauseMenu.visible = false
            leaveMenu.visible = false
            timerMenu.visible = true
            let timer = 3
            timerText.text = timer
            const delay = setInterval(() => {
                timer--
                timerText.text = timer
                if (timer <= 0) {
                    clearInterval(delay)
                    hud.getChildByName('magazine').visible = true
                    timerMenu.visible = false
                    const allAnimated = world.children.filter(item => item.animationSpeed)
                    allAnimated.forEach(item => {
                        item.play()
                    })
                    music.set('paused', false)
                    gameState.isPause = false
                    pause.visible = true
                    timeouts.forEach(item => {
                        item.resume()
                    })
                }
            }, 1000)
        })

        leave.on('pointerdown', () => {
            leaveMenu.visible = true
            leave.visible = false
        })

        cancelButton.on('pointerdown', () => {
            if (endScreenManager) {
                timeouts.length = 0
                endScreenManager.createEndScreen(true)
            }
        })

        stayButton.on('pointerdown', () => {
            leaveMenu.visible = false
            leave.visible = true
        })
    }

    function updateScore() {
        if (scoreManager) {
            scoreManager.updateScore(playerState.stimpack)
        } else {
            // Fallback на старую логику
            const score = gameState.updateScore(playerState.stimpack)
            const scoreElement = hud.getChildByName('score')
            if (scoreElement) {
                scoreElement.text = score
                const scoreColors = {
                    'F': ["#ffffff","#ff0000"],
                    'E': ["#ffffff","#ff5858"],
                    'D': ["#ffffff","#ffa4d5"],
                    'C': ["#ffffff","#83b9ff"],
                    'B': ["#ffffff","#b0ff89"],
                    'A': ["#ffffff","#9eff11"],
                    'A+': ["#ffffff","#ffec6e"],
                    'S': ["#ffffff","#ffcd00"],
                    'S+': ["#ffffff","#ffa33c"],
                    'S++': ["#ffffff","#ff6200"]
                }
                if (scoreColors[score]) {
                    scoreElement.style._fill = scoreColors[score]
                }
            }
        }
    }

    // async function getData() {
    //     return
    //     try {
    //         await bridge.send('VKWebAppInit')
    //         const checkAcc = await bridge.send('VKWebAppStorageGetKeys', {count: 1})
    //         console.log(checkAcc)
    //         if (checkAcc.keys.length === 0) {
    //             await bridge.send("VKWebAppStorageSet", {key: 'storage', value: JSON.stringify(baseStorage)})
    //         }
    //         const getStorageFromVk = await bridge.send("VKWebAppStorageGet",{keys: ['storage']})
    //         console.log(getStorageFromVk)
    //         const parse = JSON.parse(getStorageFromVk.keys[0].value)
    //         storage = parse
    //         console.log(parse)
    //     } catch (e) {
    //         console.log(e)
    //     }
    // }

    async function getData() {
        await storageManager.load()
        // Обновляем ссылку на storage после загрузки
        storage = storageManager.getStorage()
    }

    // Функция createSwipes теперь в InputHandler
    // Оставлена для обратной совместимости, но больше не используется
}

// getPercent перенесена в utils/GameUtils.js

// async function sleep(time) {
//     return new Promise((resolve, reject) => {
//         setTimeout(() => {
//             resolve(true);
//         }, time);
//     });
// }

async function sleep(time, isRoll) {
    const idx = timeouts.length
    return new Promise((resolve, reject) => {
        const timer = new Timer(function(e) {
            timeouts.splice(idx ,1)
            resolve(true);
        }, time);
        if (isRoll) {
            console.log('rollId Created')
            playerState.rollId = timer
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
