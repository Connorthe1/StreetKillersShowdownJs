import { soundPlayer } from './playSound.js'
import * as PIXI from 'pixi.js'
import { Layer, Group, Stage } from '@pixi/layers';
import * as Matter from 'matter-js'
import { Player } from './core/Player.js'
import { getPercent, random } from './utils/GameUtils.js'
import { GAME_SCALE, DEFAULT_GAME_SPEED, SLOW_GAME_SPEED, BG_SPEED, initGameConfig } from './core/GameConfig.js'
import { GameState } from './core/GameState.js'
import { StorageManager } from './storage/StorageManager.js'
import { ResourceLoader } from './resources/ResourceLoader.js'
import { PhysicsManager } from './physics/PhysicsManager.js'
import { ParticleManager } from './entities/Particle.js'
import { BulletManager } from './entities/Bullet.js'
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

// Экземпляр игрока
let playerInstance = null

// Алиасы для обратной совместимости (будут установлены после инициализации playerInstance)
let playerState, playerDefaultSpeed, playerSpeed, initSpeed, player, gun

// Функция для синхронизации playerSpeed с playerInstance
function setPlayerSpeed(speed) {
    if (playerInstance) {
        playerInstance.speed = speed
        playerSpeed = playerInstance.playerSpeed
    } else {
        playerSpeed = speed
    }
}

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
let defaultGameSpeed = DEFAULT_GAME_SPEED
let slowGameSpeed = SLOW_GAME_SPEED
let gameSpeed = DEFAULT_GAME_SPEED
const gameSpeedTODO = {
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
let ground
let hud

// Менеджеры окружения и сущностей
let backgroundManager // Инициализируется после создания world
let groundManager // Инициализируется после создания world
let zipLineManager // Инициализируется после создания world

let walls = []
let traps = []
let enemies = []
// Массивы частиц теперь управляются через ParticleManager
// Массивы окружения теперь управляются через отдельные менеджеры
let buildings = []
let puddles = []
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
let currentCan = null
let activePowerUp = null
let activeGrenade = null

// Инициализация менеджера физики
const physicsManager = new PhysicsManager()
const eventBus = new EventBus()
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
        particles,
        activeItems, menuIcons,
    } = resources

    // Удаление загрузочного экрана
    resourceLoader.removeLoaderScreen(app)
    init()

    function init() {
        world = new PIXI.Container()
        world.name = 'world'
        app.stage.addChild(world)
        world.sortableChildren = true;
        world.scale.set(GAME_SCALE)
        fg = new Group(9, true)
        world.addChild(new Layer(fg));

        hud = new PIXI.Container()
        hud.name = 'hud'
        app.stage.addChild(hud)
        hud.sortableChildren = true;
        hud.parentGroup = hudLayer
        hud.zOrder = 99

        ground = new PIXI.Container()
        ground.name = 'ground'
        world.addChild(ground)

        gameState = new GameState(eventBus)
        // Инициализация менеджера частиц
        particleManager = new ParticleManager(world, physicsManager, ground, resources, gameState, eventBus)

        bulletManager = new BulletManager(world, gameState, resources, sleep, eventBus)

        backgroundManager = new BackgroundManager(world, worldCoords, gameHeight, resources, gameState)

        groundManager = new GroundManager(world, ground, physicsManager, resources, worldCoords, eventBus)

        worldCoords.firstFloor = ground.getLocalBounds().y + 70
        worldCoords.secondFloor = ground.getLocalBounds().y - 120

        // Initialize player instance
        playerInstance = new Player(world, gameState, resources, storage, worldCoords, sleep, eventBus)
          // Инициализация менеджера спавна
        spawnManager = new SpawnManager(gameState, physicsManager, ground, fg, world, worldCoords, resources, sleep, storage, eventBus)
        
        zipLineManager = new ZipLineManager(world, worldCoords, resources, eventBus)
        
        // Инициализация менеджера HUD
        hudManager = new HUDManager(app, storage, hud, gameState, gameWidth, gameHeight, textStyles, resources, eventBus)
        
        // Инициализация менеджера камеры
        cameraManager = new CameraManager(world, gameState, worldCoords, sleep, eventBus)

        meleeKillManager = new MeleeKillManager(hud, gameState, gameWidth, gameHeight, eventBus)

        explosionManager = new ExplosionManager(world, resources, eventBus)

        grenadeManager = new GrenadeManager(world, physicsManager, worldCoords, resources, sleep, eventBus)

        moneyManager = new MoneyManager(world, physicsManager, worldCoords, resources, eventBus)
        
        // Инициализация менеджера экрана окончания
        endScreenManager = new EndScreenManager(app, gameState, gameWidth, gameHeight, textStyles, resources, storageManager, eventBus)

        eventBus.on('endScreen:clearTimeouts', () => {
            timeouts.length = 0
        })
        eventBus.on('endScreen:stopMusic', () => {
            music.stop()
        })
        eventBus.on('endScreen:removeHud', () => {
            if (hud && app.stage) app.stage.removeChild(hud)
        })
        eventBus.on('endScreen:restart', () => {
            restartGame()
        })

        // Инициализация менеджера меню
        menuManager = new MenuManager(app, gameState, storage, gameWidth, gameHeight, textStyles, resources, storageManager, sleep, eventBus)

        eventBus.on('menu:startGame', () => {
            startGame()
        })

        eventBus.emit('menu:create')
        
        // Установка алиасов для обратной совместимости
        playerState = playerInstance.playerState
        gun = playerInstance.gun
        
        // Функции для синхронизации скоростей
        const syncSpeeds = () => {
            playerDefaultSpeed = playerInstance.playerDefaultSpeed
            playerSpeed = playerInstance.playerSpeed
            initSpeed = playerInstance.initSpeed
        }
        syncSpeeds()
        // Функции для синхронизации других свойств
        const syncOther = () => {
        }
        syncOther()

    }

    function startGame() {
        player = playerInstance.createPlayer(-100, worldCoords.firstFloor, fg)
        playerInstance.updateGunFromSkin()

        if (hudManager) {
            hudManager.createBulletsDisplay(playerInstance.gun)
            hudManager.createMainHUD(playerState)
            hudManager.createPauseMenu({
                storage: storage,
                hasMeleeKill: () => meleeKillManager.hasMeleeKill(),
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
        const inputHandler = new InputHandler(app.renderer.view, gameState, playerState, storage, eventBus)

        // Старый обработчик оставлен для обратной совместимости
        app.ticker.maxFPS = 60
        app.ticker.minFPS = 60
        app.ticker.add(ticker)
        if (Math.floor(app.ticker.FPS) <= 35) {
            defaultGameSpeed = 2
            slowGameSpeed = 0.2
        }
        gameSpeed = defaultGameSpeed
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
        gameSpeed = defaultGameSpeed

        gameState.reset()
        player = null
        bulletManager.clear()

        distance = 0

        background = null
        bgPosition = 0
        bgSpeed = BG_SPEED;

        world = null
        ground = null
        hud = null

        walls.length = 0
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
        activePowerUp = null
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
        if (hudManager) {
            hudManager.update()
        }
        physicsManager.update();
        // Обновление ближнего боя через MeleeKillManager
        if (meleeKillManager) {
            meleeKillManager.updateMeleeKill()
        }
        if (gameState) {
            gameState.updateScore(playerInstance.stimpack)
        }
        // Use the Player module's updatePlayer method
        if (playerInstance) {
            playerInstance.updatePlayer(gameSpeed, delta)
        }
        // Обновление фона и пола через менеджеры
        if (backgroundManager) {
            backgroundManager.updateBg(worldCoords.zeroLeft, playerInstance.speed)
        }
        if (groundManager) {
            groundManager.updateFloor(worldCoords.zeroLeft)
        }
        if (bulletManager) {
            bulletManager.updateBullets(worldCoords, gameSpeed)
        }

        particleManager.updateAllParticles(worldCoords.zeroLeft, playerInstance)

        // updateWall()
        // updateEnemies()
        // updateBoss()

        const detectedWall = detectWall()
        if (detectedWall && !playerState.inCover) {
            if (((playerState.state === 'roll' || playerState.state === 'rollEnd') && !playerState.leaveCover) || (detectedWall.forBoss && !currentBoss.params.dead)) {
                playerState.inBossFight = detectedWall.forBoss
                playerState.inCover = true
                setPlayerSpeed(0)
                player.x = detectedWall.coverX
                if (playerInstance) playerInstance.playAnim('idle')
            }
        }
    }

    // Функции setMeleeSelector и HUDmeleeKill теперь в MeleeKillManager
    // Оставлены для обратной совместимости, но больше не используются

    function updatePuddles() {
        puddles.forEach((puddle, idx) => {
            if (puddle.x + puddle.width < worldCoords.zeroLeft) {
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
                    setPlayerSpeed(playerDefaultSpeed) * 1.5
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

    function updateCan() {
        currentCan.position = currentCan.body.position
        currentCan.rotation = currentCan.body.angle
        if ((currentCan.x > worldCoords.zeroRight + 300) || (currentCan.y > WORLD_HEIGHT) || (currentCan.x < worldCoords.zeroLeft) || (currentCan.health <= 0)) {
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
                        trapManager.barrelDead(trap)
                    }
                }
            })
        }
    }

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
                if (hudManager) {
                    hudManager.updateSkills(storage)
                }
            break
            case rand === 2:
                icon = new PIXI.Sprite(activeItems.textures.handGrenadeIcon)
                text = new PIXI.Text('+1', textStyles.default80)
                icon.scale.set(1.5)
                storage.activeItems.grenades += 1
                if (hudManager) {
                    hudManager.updateSkills(storage)
                }
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
        if (currentBoss.x + currentBoss.width < worldCoords.zeroLeft) {
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
                if (playerInstance) {
                    playerInstance.damagePlayer()
                }
            }
        }
        bulletManager.playerBullets.forEach((bullet, idx) => {
            const b = bullet.getBounds()
            const boss = currentBoss.getBounds()
            if (b.x + b.width > boss.x && boss.x + boss.width > b.x && b.y + b.height > boss.y && boss.y + boss.height > b.y) {
                world.removeChild(bullet)
                bulletManager.playerBullets.splice(idx, 1)
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
                bulletManager.playerBullets.forEach((bullet, idx) => {
                    if (enemy.x - enemy.width / 2 < bullet.x + bullet.width && enemy.x + enemy.width / 2 > bullet.x && enemy.y - enemy.height / 2 < bullet.y && enemy.y + enemy.height / 2 > bullet.y) {
                        if (enemy.params.inCover) return
                        world.removeChild(bullet)
                        bulletManager.playerBullets.splice(idx, 1)
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
            if (enemy.x + enemy.width < worldCoords.zeroLeft) {
                world.removeChild(enemy)
                enemies.splice(idx, 1)
            }
        })
    }

    function detectWall() {
        let p = player.getBounds()
        return walls.find(w => {
            let wall = w.getBounds()
            if (p.x > (wall.x - wall.width / 2) + w.bound && p.x < (wall.x - wall.width / 2) + 40 + w.bound) {
                return w
            }
        })
    }

    function updateWall() {
        walls.forEach((wall, idx) => {
            if (wall.x + 100 < worldCoords.zeroLeft) {
                world.removeChild(wall)
                walls.splice(idx, 1)
            }
        })
    }

    function shot(char, offsetX, offsetY, eventGun, friendly) {
        if (bulletManager) {
            bulletManager.shot(
                char,
                offsetX,
                offsetY,
                eventGun,
                friendly,
                sleep
            )
        }
    }

    // Функции HUDbullets, HUDpoints, HUDupdateSkills, HUDremoveShield, HUDcreateShield, HUDupdatePowerUp
    // теперь в HUD. Оставлены для обратной совместимости, но больше не используются.

    // Функция HUDpause теперь в HUD.createPauseMenu(). Оставлена для обратной совместимости, но больше не используется.

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
