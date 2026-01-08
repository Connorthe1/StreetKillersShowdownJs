/**
 * Menu.js
 * 
 * Главное меню игры
 * 
 * Содержит:
 * - Создание главного меню (createMenu)
 * - Управление элементами меню
 * - Кнопки: старт, магазин, миссии, настройки
 * - Отображение рекорда, денег, золота
 * - Управление магазином (StoreManager создается внутри)
 */

import * as PIXI from 'pixi.js'
import { StoreManager } from './Store.js'

/**
 * Менеджер главного меню
 */
export class MenuManager {
    constructor(app, gameState, storage, gameWidth, gameHeight, textStyles, resources, storageManager) {
        this.app = app
        this.gameState = gameState
        this.storage = storage
        this.gameWidth = gameWidth
        this.gameHeight = gameHeight
        this.textStyles = textStyles
        this.resources = resources  // Main textures object
        this.storageManager = storageManager
        
        // Меню
        this.menu = null
        
        // StoreManager (внутренний)
        this.storeManager = null
        
        // Callbacks
        this.startGameCallback = null
        this.sleepCallback = null
    }
    
    /**
     * Устанавливает колбэки
     */
    setCallbacks(callbacks) {
        if (callbacks.startGame) this.startGameCallback = callbacks.startGame
        if (callbacks.sleep) this.sleepCallback = callbacks.sleep
    }
    
    /**
     * Создает главное меню
     */
    createMenu() {
        if (!this.resources) {
            console.warn('Menu textures not available')
            return null
        }
        
        // Удаляем старое меню, если оно существует
        if (this.menu && this.app.stage) {
            this.app.stage.removeChild(this.menu)
        }
        
        this.gameState.isMenu = true
        this.gameState.gameStart = false
        this.gameState.gameEnd = false
        
        const menu = new PIXI.Container()
        this.app.stage.addChild(menu)
        this.menu = menu
        
        const main = new PIXI.Container()
        main.name = 'main'
        menu.addChild(main)
        
        // Фон
        let bg = new PIXI.Graphics()
        bg.eventMode = 'static'
        bg.beginFill(0x000)
        bg.alpha = 0.6
        bg.drawRect(0, 0, this.gameWidth, this.gameHeight)
        main.addChild(bg)
        
        // Текст "Tap to start"
        const startText = new PIXI.Text('Tap to start', this.textStyles.default56)
        startText.anchor.set(0.5)
        startText.zIndex = 1
        startText.x = this.gameWidth / 2
        startText.y = this.gameHeight - 220
        main.addChild(startText)
        
        // Верхнее меню
        const topMenu = this.createTopMenu()
        main.addChild(topMenu)
        
        // Кнопка магазина
        const store = new PIXI.Sprite(this.resources.menuButtons.textures.shop)
        store.eventMode = 'static'
        store.anchor.set(1, 0)
        store.position.set(this.gameWidth - 20, 60)
        main.addChild(store)
        
        // Кнопка миссий
        const missions = new PIXI.Sprite(this.resources.menuButtons.textures.missions)
        missions.scale.set(0.8)
        missions.eventMode = 'static'
        missions.anchor.set(0, 0)
        missions.position.set(20, 60)
        main.addChild(missions)
        
        // Кнопка настроек
        const settings = new PIXI.Sprite(this.resources.menuUI.textures.settingsicon)
        settings.scale.set(0.6)
        settings.eventMode = 'static'
        settings.anchor.set(1, 1)
        settings.position.set(this.gameWidth - 20, this.gameHeight - 20)
        main.addChild(settings)
        
        // Обработчики событий
        store.on('pointerdown', () => {
            main.visible = false
            if (!this.storeManager) {
                // Инициализируем StoreManager при первом открытии магазина
                this.storeManager = new StoreManager(
                    menu,
                    this.storage,
                    this.gameWidth,
                    this.gameHeight,
                    this.textStyles,
                    this.resources
                )
                this.storeManager.setCallbacks({
                    createMenu: () => {
                        this.createMenu()
                    },
                    storageManager: this.storageManager
                })
            }
            if (this.storeManager) {
                this.storeManager.createStore()
            }
        })
        
        bg.on('pointerdown', (event) => {
            if (!this.gameState.isMenu) return
            this.gameState.isMenu = false
            
            const menuLeft = setInterval(() => {
                menu.x -= 20
            }, 10)
            
            if (this.sleepCallback) {
                this.sleepCallback(300).then(() => {
                    clearInterval(menuLeft)
                    if (this.startGameCallback) {
                        this.startGameCallback()
                    }
                    this.app.stage.removeChild(menu)
                    this.menu = null
                })
            }
        })
        
        return menu
    }
    
    /**
     * Создает верхнее меню (рекорд, деньги, золото)
     */
    createTopMenu() {
        const topMenu = new PIXI.Container()
        const topMenuBg = new PIXI.Sprite(this.resources.menuButtons.textures.button)
        topMenuBg.tint = 5197647
        topMenuBg.width = this.gameWidth
        topMenuBg.height = 50
        topMenu.addChild(topMenuBg)
        
        // Иконка кубка и рекорд
        const cup = new PIXI.Sprite(this.resources.menuIcons.textures.cup)
        cup.position.set(16, 16)
        topMenu.addChild(cup)
        
        const topDistance = new PIXI.Text(this.storage.record.toString(), this.textStyles.default30)
        topDistance.position.set(52, 20)
        topMenu.addChild(topDistance)
        
        // Деньги
        const money = new PIXI.Text(this.storage.money, this.textStyles.default30)
        money.position.set(this.gameWidth - 16, 20)
        money.anchor.set(1, 0)
        topMenu.addChild(money)
        
        const moneyIcon = new PIXI.Sprite(this.resources.menuIcons.textures.money)
        moneyIcon.scale.set(0.45)
        moneyIcon.anchor.set(1, 0)
        moneyIcon.position.set(money.x - money.width - 10, 14)
        topMenu.addChild(moneyIcon)
        
        // Золото
        const gold = new PIXI.Text(this.storage.gold, this.textStyles.default30)
        gold.position.set(moneyIcon.x - moneyIcon.width - 20, 20)
        gold.anchor.set(1, 0)
        topMenu.addChild(gold)
        
        const goldIcon = new PIXI.Sprite(this.resources.menuIcons.textures.goldbar)
        goldIcon.scale.set(0.3)
        goldIcon.anchor.set(1, 0)
        goldIcon.position.set(gold.x - gold.width - 10, 16)
        topMenu.addChild(goldIcon)
        
        return topMenu
    }
    
    /**
     * Получает меню
     */
    getMenu() {
        return this.menu
    }
    
    /**
     * Удаляет меню
     */
    removeMenu() {
        if (this.menu && this.app.stage) {
            this.app.stage.removeChild(this.menu)
        }
        this.menu = null
    }
    
    /**
     * Очищает меню
     */
    clear() {
        if (this.storeManager) {
            this.storeManager.clear()
            this.storeManager = null
        }
        this.removeMenu()
    }
}
