import * as PIXI from 'pixi.js'
import { Stage } from '@pixi/layers'
import { initGameConfig } from './core/GameConfig.js'
import { StorageManager } from './storage/StorageManager.js'
import { ResourceLoader } from './resources/ResourceLoader.js'
import { EventBus } from './utils/EventBus.js'
import { Game } from './Game.js'

const isMobile = /Mobi|Android/i.test(navigator.userAgent)
const gameWidth = isMobile ? screen.width : document.documentElement.clientWidth
const gameHeight = isMobile ? screen.height : document.documentElement.clientHeight
const gameConfig = initGameConfig(gameWidth, gameHeight)

window.onload = async function () {
    const app = new PIXI.Application({
        width: gameWidth,
        height: gameHeight,
        backgroundColor: 'black',
        resolution: window.devicePixelRatio,
        useContextAlpha: false,
        antialias: false,
    })
    globalThis.__PIXI_APP__ = app
    app.stage = new Stage()
    app.stage.sortableChildren = true
    document.body.appendChild(app.view)
    PIXI.BaseTexture.defaultOptions.scaleMode = 0

    const resourceLoader = new ResourceLoader()
    await resourceLoader.loadLoaderScreen(app, gameWidth, gameHeight)
    const resources = await resourceLoader.loadAllAssets()
    resourceLoader.removeLoaderScreen(app)

    const game = new Game(app, {
        resources,
        gameConfig,
        gameWidth,
        gameHeight,
        storageManager: new StorageManager(),
        eventBus: new EventBus(),
    })
    game.init()
}
