import { soundPlayer } from './playSound.js'
import * as PIXI from 'pixi.js'
import { Layer, Group } from '@pixi/layers'
import { Player } from './core/Player.js'
import { GAME_SCALE, DEFAULT_GAME_SPEED, SLOW_GAME_SPEED } from './core/GameConfig.js'
import { GameState } from './core/GameState.js'
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
import { InteractionSystem } from './physics/InteractionSystem'
import { GameTimer } from './core/GameTimer'

export class Game {
    constructor(app, options) {
        const { resources, gameConfig, gameWidth, gameHeight, storageManager, eventBus } = options
        const { WORLD_WIDTH, WORLD_HEIGHT, textStyles } = gameConfig

        this.app = app
        this.resources = resources
        this.storageManager = storageManager
        this.storage = storageManager.getStorage()
        this.eventBus = eventBus
        this.gameWidth = gameWidth
        this.gameHeight = gameHeight
        this.textStyles = textStyles

        this.gameSpeed = {
            current: DEFAULT_GAME_SPEED,
            default: DEFAULT_GAME_SPEED,
            slow: SLOW_GAME_SPEED,
        }

        this.worldCoords = {
            zeroLeft: 0,
            zeroRight: WORLD_WIDTH,
            firstFloor: null,
            secondFloor: null,
            ground: null,
            worldWidth: WORLD_WIDTH,
            worldHeight: WORLD_HEIGHT,
        }

        this.physics = new PhysicsManager()
        this.music = null
        this.player = null
        this.inputHandler = null
        this.managers = {}

        this.world = null
        this.groundContainer = null
        this.hudContainer = null
        this.foregroundContainer = null

        this.tickerFn = (delta) => this.tick(delta)

        this.setupRendering()
        this.registerEvents()
    }

    setupRendering() {
        this.physics.init(1)
        this.hudLayer = new Group(99, true)
        this.app.stage.addChild(new Layer(this.hudLayer))
    }

    registerEvents() {
        const { eventBus } = this

        eventBus.on('endScreen:stopMusic', () => this.music?.stop())
        eventBus.on('endScreen:restart', () => this.restart())
        eventBus.on('gameSpeed:default', () => { this.gameSpeed.current = this.gameSpeed.default })
        eventBus.on('gameSpeed:slow', () => { this.gameSpeed.current = this.gameSpeed.slow })
        eventBus.on('game:pause', () => this.pause())
        eventBus.on('game:resume', () => this.resume())
        eventBus.on('menu:startGame', () => this.start())
    }

    init() {
        this.world = new PIXI.Container()
        this.world.name = 'world'
        this.world.sortableChildren = true
        this.world.scale.set(GAME_SCALE)
        this.app.stage.addChild(this.world)

        this.hudContainer = new PIXI.Container()
        this.hudContainer.name = 'hud'
        this.hudContainer.sortableChildren = true
        this.hudContainer.parentGroup = this.hudLayer
        this.hudContainer.zOrder = 99
        this.app.stage.addChild(this.hudContainer)

        this.foregroundContainer = new Group(9, true)
        this.world.addChild(new Layer(this.foregroundContainer))

        this.groundContainer = new PIXI.Container()
        this.groundContainer.name = 'ground'
        this.world.addChild(this.groundContainer)

        this.createManagers()
        this.managers.menu.createMenu()
    }

    createManagers() {
        const m = this.managers

        m.timer = new GameTimer()
        m.gameState = new GameState(this.eventBus)

        m.ground = new GroundManager(
            this.world, this.groundContainer, this.physics,
            this.resources, this.worldCoords
        )

        const bounds = this.groundContainer.getLocalBounds()
        this.worldCoords.firstFloor = bounds.y + 70
        this.worldCoords.secondFloor = bounds.y - 120
        this.worldCoords.ground = bounds.y

        m.particle = new ParticleManager(
            this.world, this.physics, this.groundContainer,
            this.resources, m.gameState, this.eventBus
        )
        m.bullet = new BulletManager(
            this.world, m.gameState, this.resources,
            m.timer, this.eventBus, this.physics
        )
        m.background = new BackgroundManager(
            this.world, this.worldCoords, this.gameHeight,
            this.resources, m.gameState
        )

        this.player = new Player(
            this.world, m.gameState, this.resources,
            this.storage, this.worldCoords, m.timer, this.eventBus
        )

        m.spawn = new SpawnManager(
            m.gameState, this.physics, this.foregroundContainer,
            this.world, this.worldCoords, this.resources,
            m.timer, this.storage, this.eventBus
        )
        m.zipLine = new ZipLineManager(
            this.world, this.worldCoords, this.resources, this.eventBus
        )
        m.hud = new HUDManager(
            this.app, this.storage, this.hudContainer, m.gameState,
            this.gameWidth, this.gameHeight, this.textStyles,
            this.resources, this.eventBus
        )
        m.camera = new CameraManager(
            this.world, m.gameState, this.worldCoords, this.eventBus
        )
        m.meleeKill = new MeleeKillManager(
            this.hudContainer, m.gameState, this.gameWidth,
            this.gameHeight, m.timer, this.eventBus
        )
        m.explosion = new ExplosionManager(
            this.world, this.resources, this.eventBus
        )
        m.grenade = new HandGrenade(
            this.world, this.physics, this.worldCoords,
            this.resources, m.timer, this.eventBus
        )
        m.money = new MoneyManager(
            this.world, this.physics, this.worldCoords,
            this.resources, this.eventBus
        )
        m.endScreen = new EndScreenManager(
            this.app, m.gameState, this.gameWidth, this.gameHeight,
            this.textStyles, this.resources, this.storageManager, this.eventBus
        )
        m.menu = new MenuManager(
            this.app, m.gameState, this.gameWidth, this.gameHeight,
            this.textStyles, this.resources, this.storageManager,
            m.timer, this.eventBus
        )
        m.interaction = new InteractionSystem()
    }

    start() {
        this.player.createPlayer(-100, this.worldCoords.firstFloor, this.foregroundContainer)
        this.player.setGunParams()

        this.managers.hud.init(this.player)
        this.music = soundPlayer.startMusic()

        this.inputHandler = new InputHandler(
            this.app.renderer.view, this.managers.gameState,
            this.storage, this.eventBus
        )

        this.app.ticker.maxFPS = 60
        this.app.ticker.minFPS = 60
        this.app.ticker.add(this.tickerFn)
        this.gameSpeed.current = this.gameSpeed.default
    }

    restart() {
        this.inputHandler?.destroy()
        this.inputHandler = null

        this.music?.destroy()
        this.music = null

        this.app.stage.removeChild(this.world)
        this.app.stage.removeChild(this.hudContainer)
        this.app.ticker.remove(this.tickerFn)

        this.resetWorldCoords()
        this.gameSpeed.current = this.gameSpeed.default

        const m = this.managers
        m.timer.clear()
        m.gameState.reset()
        m.camera.clear()
        m.bullet.clear()
        m.particle.clear()
        m.zipLine.clear()
        m.grenade.clear()
        m.money.clear()
        m.explosion.clear()
        m.meleeKill.clear()
        m.hud.clear()
        m.ground.clear()
        m.spawn.clear()
        m.menu.clear()

        this.eventBus.removeAll()
        this.registerEvents()

        this.world = null
        this.groundContainer = null
        this.hudContainer = null

        this.init()
    }

    tick(delta) {
        const { managers: m, player, worldCoords, gameSpeed } = this
        const elapsed = this.app.ticker.elapsedMS

        if (m.gameState.gameEnd || m.gameState.isPause) return
        m.timer.update(elapsed)

        if (!m.gameState.gameStart && m.menu.menu) {
            m.menu.menu.x -= 20
        }

        if (!m.gameState.gameStart && player.sprite.x > 10) {
            m.gameState.gameStart = true
            m.menu.clear()
        }

        m.hud.update()
        this.physics.update()
        m.meleeKill.update()
        m.gameState.update(elapsed, player.stimpack)
        player.update(gameSpeed.current, delta)
        m.background.updateBg(worldCoords.zeroLeft, player.speed, gameSpeed.current)
        m.ground.updateFloor(worldCoords.zeroLeft)
        m.bullet.update(worldCoords, gameSpeed.current)
        m.spawn.update(gameSpeed.current)
        m.camera.update(elapsed)
        m.grenade.update()
        m.money.update()
        m.particle.updateAllParticles(worldCoords.zeroLeft, player)

        m.interaction.update({
            player,
            spawn: m.spawn,
            bullets: m.bullet,
            explosion: m.explosion,
            melee: m.meleeKill,
            zipLine: m.zipLine,
            money: m.money,
        })
    }

    pause() {
        const allAnimated = this.world.children.filter(c => c.animationSpeed)
        allAnimated.forEach(c => c.stop())
        this.music?.set('paused', true)
        this.managers.gameState.isPause = true
    }

    resume() {
        const allAnimated = this.world.children.filter(c => c.animationSpeed)
        allAnimated.forEach(c => c.play())
        this.music?.set('paused', false)
        this.managers.gameState.isPause = false
    }

    resetWorldCoords() {
        this.worldCoords.zeroLeft = 0
        this.worldCoords.zeroRight = this.worldCoords.worldWidth
    }
}
