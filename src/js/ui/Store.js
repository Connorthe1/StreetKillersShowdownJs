/**
 * Store.js
 * 
 * Менеджер магазина
 * 
 * Содержит:
 * - Создание магазина (createStore)
 * - Управление апгрейдами
 * - Управление скинами
 * - Покупка предметов
 * - Прокручиваемые списки (Scrollbox)
 */

import * as PIXI from 'pixi.js'

/**
 * Менеджер магазина
 */
export class StoreManager {
    constructor(menu, storage, gameWidth, gameHeight, textStyles, menuButtons, menuIcons, menuUI, activeItems, storeUpgrades, skinStore, Scrollbox) {
        this.menu = menu
        this.storage = storage
        this.gameWidth = gameWidth
        this.gameHeight = gameHeight
        this.textStyles = textStyles
        this.menuButtons = menuButtons
        this.menuIcons = menuIcons
        this.menuUI = menuUI
        this.activeItems = activeItems
        this.storeUpgrades = storeUpgrades
        this.skinStore = skinStore
        this.Scrollbox = Scrollbox
        
        // Магазин
        this.store = null
        
        // Callbacks
        this.createMenuCallback = null
        this.storageManager = null
    }
    
    /**
     * Устанавливает колбэки
     */
    setCallbacks(callbacks) {
        if (callbacks.createMenu) this.createMenuCallback = callbacks.createMenu
        if (callbacks.storageManager) this.storageManager = callbacks.storageManager
    }
    
    /**
     * Создает магазин
     */
    createStore() {
        if (!this.menuButtons || !this.menuIcons || !this.menuUI || !this.activeItems) {
            console.warn('Store textures not available')
            return null
        }
        
        const store = new PIXI.Container()
        store.name = 'store'
        this.menu.addChild(store)
        this.store = store
        
        // Фон
        let bg = new PIXI.Graphics()
        bg.eventMode = 'static'
        bg.beginFill(0x000)
        bg.alpha = 0.9
        bg.drawRect(0, 0, this.gameWidth, this.gameHeight)
        store.addChild(bg)
        
        // Обновление денег
        this.updateMoney()
        
        // Кнопки переключения
        const skinButton = new PIXI.Sprite(this.menuUI.textures.skin)
        skinButton.width = (this.gameWidth / 2) - 30
        skinButton.height = 120
        skinButton.eventMode = 'static'
        skinButton.anchor.set(1, 0)
        skinButton.position.set(this.gameWidth - 20, 20)
        store.addChild(skinButton)
        
        const upgrades = new PIXI.Sprite(this.menuUI.textures.upgrade)
        upgrades.width = (this.gameWidth / 2) - 30
        upgrades.height = 120
        upgrades.eventMode = 'static'
        upgrades.anchor.set(0, 0)
        upgrades.position.set(20, 20)
        store.addChild(upgrades)
        
        // Кнопка выхода
        const exit = new PIXI.Sprite(this.menuUI.textures.back)
        exit.scale.set(1)
        exit.eventMode = 'static'
        exit.anchor.set(1, 1)
        exit.position.set(this.gameWidth - 20, this.gameHeight - 20)
        store.addChild(exit)
        
        // Прокручиваемый список апгрейдов
        const scrollUpgrades = new this.Scrollbox({
            boxWidth: this.gameWidth,
            boxHeight: this.gameHeight - 290,
            fade: true,
            scrollbarSize: 2
        })
        scrollUpgrades.position.set(0, 160)
        scrollUpgrades.visible = true
        
        // Прокручиваемый список скинов
        const scrollSkins = new this.Scrollbox({
            boxWidth: this.gameWidth,
            boxHeight: this.gameHeight - 290,
            scrollbarSize: 2
        })
        scrollSkins.visible = false
        scrollSkins.position.set(0, 160)
        
        // Данные для одноразовых предметов
        const storeUsed = [
            {
                name: 'STIMPACK',
                initPrice: 1200,
                scale: 1.5,
                icon: this.activeItems.textures.stimpack,
                idName: "stimpack"
            },
            {
                name: 'HAND GRENADE',
                initPrice: 1000,
                scale: 1.1,
                icon: this.activeItems.textures.handGrenadeIcon,
                idName: "grenades"
            }
        ]
        
        // Функция перезагрузки апгрейдов
        const reloadStoreUpgrades = () => {
            scrollUpgrades.content.removeChildren(0, scrollUpgrades.content.children.length)
            
            // Заголовок апгрейдов
            const topMenu = new PIXI.Container()
            scrollUpgrades.content.addChild(topMenu)
            const topMenuBg = new PIXI.Sprite(this.menuButtons.textures.button)
            topMenuBg.tint = 5197647
            topMenuBg.width = this.gameWidth
            topMenuBg.height = 50
            topMenu.addChild(topMenuBg)
            const upgradeText = new PIXI.Text('UPGRADES', this.textStyles.default40)
            upgradeText.position.set(this.gameWidth / 2, 20)
            upgradeText.anchor.set(0.5, 0)
            topMenu.addChild(upgradeText)
            
            // Апгрейды
            this.storeUpgrades.forEach((item, idx) => {
                const upgrade = this.createUpgradeItem(item, idx, scrollUpgrades)
                scrollUpgrades.content.addChild(upgrade)
            })
            
            // Заголовок одноразовых предметов
            const topMenuUsed = new PIXI.Container()
            scrollUpgrades.content.addChild(topMenuUsed)
            topMenuUsed.position.set(0, this.storeUpgrades.length * 110)
            const topMenuBgUsed = new PIXI.Sprite(this.menuButtons.textures.button)
            topMenuBgUsed.tint = 5197647
            topMenuBgUsed.width = this.gameWidth
            topMenuBgUsed.height = 50
            topMenuUsed.addChild(topMenuBgUsed)
            const upgradeTextUsed = new PIXI.Text('SINGLE USE', this.textStyles.default40)
            upgradeTextUsed.position.set(this.gameWidth / 2, 20)
            upgradeTextUsed.anchor.set(0.5, 0)
            topMenuUsed.addChild(upgradeTextUsed)
            
            // Одноразовые предметы
            storeUsed.forEach((item, idx) => {
                const upgrade = this.createUsedItem(item, idx, scrollUpgrades)
                scrollUpgrades.content.addChild(upgrade)
            })
            
            scrollUpgrades.update()
        }
        
        // Функция перезагрузки скинов
        const reloadSkinStore = () => {
            scrollSkins.content.removeChildren(0, scrollSkins.content.children.length)
            
            this.skinStore.forEach((item, idx) => {
                const skin = this.createSkinItem(item, idx, scrollSkins)
                scrollSkins.content.addChild(skin)
            })
            
            scrollSkins.update()
        }
        
        // Обработчики событий
        skinButton.on('pointerdown', () => {
            scrollUpgrades.content.removeChildren(0, scrollUpgrades.content.children.length)
            scrollUpgrades.visible = false
            scrollSkins.visible = true
            reloadSkinStore()
        })
        
        upgrades.on('pointerdown', () => {
            scrollSkins.content.removeChildren(0, scrollSkins.content.children.length)
            scrollUpgrades.visible = true
            scrollSkins.visible = false
            reloadStoreUpgrades()
        })
        
        exit.on('pointerdown', () => {
            this.menu.removeChildren(0, this.menu.children.length)
            if (this.createMenuCallback) {
                this.createMenuCallback()
            }
            if (this.storageManager) {
                this.storageManager.save()
            }
        })
        
        store.addChild(scrollUpgrades)
        store.addChild(scrollSkins)
        
        // Инициализация апгрейдов
        reloadStoreUpgrades()
        
        return store
    }
    
    /**
     * Создает элемент апгрейда
     */
    createUpgradeItem(item, idx, scrollContainer) {
        const upgrade = new PIXI.Container()
        const upgradeSprite = new PIXI.Sprite(eval(item.icon))
        const upgradeUpgrade = new PIXI.Sprite(this.menuUI.textures.buy)
        const upgradeLevel = new PIXI.Text(
            item.maxLvl === this.storage.upgrades[item.idName] ? 'MAX' : `LV.${Math.min(this.storage.upgrades[item.idName] + 1, item.maxLvl)}`,
            this.textStyles.default30
        )
        const upgradeName = new PIXI.Text(item.name, this.textStyles.default30)
        
        upgrade.height = 100
        upgrade.position.set(0, 60 + 100 * idx)
        upgrade.addChild(upgradeSprite)
        upgrade.addChild(upgradeName)
        upgrade.addChild(upgradeUpgrade)
        upgrade.addChild(upgradeLevel)
        
        if (item.scale) upgradeSprite.scale.set(item.scale)
        upgradeSprite.position.set(10, 5)
        upgradeName.position.set(85, 10)
        
        upgradeUpgrade.anchor.set(1, 0)
        upgradeUpgrade.scale.set(1.1)
        upgradeUpgrade.position.set(this.gameWidth - 10, 0)
        upgradeLevel.anchor.set(0.5)
        upgradeLevel.position.set(upgradeUpgrade.x - upgradeUpgrade.width / 2, upgradeUpgrade.y + upgradeUpgrade.height / 2)
        
        // Индикаторы уровня
        for (let i = 0; i < item.maxLvl; i++) {
            const upgradeLevelIcon = new PIXI.Sprite(PIXI.Texture.WHITE)
            upgradeLevelIcon.width = upgradeLevelIcon.height = 10
            upgradeLevelIcon.tint = i < this.storage.upgrades[item.idName] ? 0x5cef13 : 0xd30c0c
            upgradeLevelIcon.position.set(15 * i, 76)
            upgrade.addChild(upgradeLevelIcon)
        }
        
        // Покупка апгрейда
        if (item.maxLvl > this.storage.upgrades[item.idName]) {
            upgradeUpgrade.eventMode = 'static'
            upgradeLevel.eventMode = 'passive'
            const upgradePrice = new PIXI.Text(
                item.initPrice + item.initPrice * this.storage.upgrades[item.idName],
                this.textStyles.default40
            )
            const upgradePriceIcon = new PIXI.Sprite(this.menuIcons.textures.money)
            upgrade.addChild(upgradePrice)
            upgrade.addChild(upgradePriceIcon)
            upgradePrice.position.set(85, 55)
            upgradePriceIcon.scale.set(0.5)
            upgradePriceIcon.position.set(upgradePrice.x + upgradePrice.width + 10, 50)
            
            upgradeUpgrade.on('pointerdown', () => {
                const price = item.initPrice + item.initPrice * this.storage.upgrades[item.idName]
                if (this.storage.money >= price) {
                    this.storage.money -= price
                    this.storage.upgrades[item.idName]++
                    scrollContainer.content.removeChildren(0, scrollContainer.content.children.length)
                    this.store.removeChild(this.store.getChildByName('moneyContainer'))
                    this.updateMoney()
                    // Перезагрузка будет вызвана извне
                }
            })
        }
        
        return upgrade
    }
    
    /**
     * Создает элемент одноразового предмета
     */
    createUsedItem(item, idx, scrollContainer) {
        const upgrade = new PIXI.Container()
        const upgradeSprite = new PIXI.Sprite(item.icon)
        const upgradeUpgrade = new PIXI.Sprite(this.menuUI.textures.stayclear)
        const upgradeCount = new PIXI.Text(this.storage.activeItems[item.idName], this.textStyles.default30)
        const upgradeName = new PIXI.Text(item.name, this.textStyles.default30)
        const upgradePrice = new PIXI.Text(item.initPrice, this.textStyles.default40)
        const upgradePriceIcon = new PIXI.Sprite(this.menuIcons.textures.money)
        
        upgrade.height = 100
        upgrade.position.set(0, (this.storeUpgrades.length * 110 + 60) + 90 * idx)
        upgrade.addChild(upgradeSprite)
        upgrade.addChild(upgradeName)
        upgrade.addChild(upgradePrice)
        upgrade.addChild(upgradePriceIcon)
        upgrade.addChild(upgradeUpgrade)
        upgrade.addChild(upgradeCount)
        
        if (item.scale) upgradeSprite.scale.set(item.scale)
        upgradeSprite.position.set(10, 5)
        upgradeName.position.set(85, 10)
        upgradePrice.position.set(85, 45)
        upgradePriceIcon.scale.set(0.5)
        upgradePriceIcon.position.set(upgradePrice.x + upgradePrice.width + 10, 40)
        
        upgradeUpgrade.anchor.set(1, 0)
        upgradeUpgrade.width = upgradeUpgrade.height = 75
        upgradeUpgrade.position.set(this.gameWidth - 10, 0)
        upgradeCount.anchor.set(0.5)
        upgradeCount.position.set(upgradeUpgrade.x - upgradeUpgrade.width / 2, upgradeUpgrade.y + upgradeUpgrade.height / 2)
        
        upgradeUpgrade.eventMode = 'static'
        upgradeCount.eventMode = 'passive'
        
        upgradeUpgrade.on('pointerdown', () => {
            if (this.storage.money >= item.initPrice) {
                this.storage.money -= item.initPrice
                this.storage.activeItems[item.idName]++
                scrollContainer.content.removeChildren(0, scrollContainer.content.children.length)
                this.store.removeChild(this.store.getChildByName('moneyContainer'))
                this.updateMoney()
                // Перезагрузка будет вызвана извне
            }
        })
        
        return upgrade
    }
    
    /**
     * Создает элемент скина
     */
    createSkinItem(item, idx, scrollContainer) {
        const ownedSkin = this.storage.ownedSkins.some(ownedIdx => ownedIdx === idx)
        
        const skin = new PIXI.Container()
        const skinSprite = new PIXI.Sprite(item.param.textures[item.icon])
        let skinBuyButton
        
        if (Number(this.storage.selectedSkin) === idx) {
            skinBuyButton = this.menuUI.textures.activebuy
        } else if (ownedSkin) {
            skinBuyButton = this.menuUI.textures.alreadybuy
        } else if (this.storage.money < item.price) {
            skinBuyButton = this.menuUI.textures.closebuy
        } else {
            skinBuyButton = this.menuUI.textures.openbuy
        }
        
        const skinBuy = new PIXI.Sprite(skinBuyButton)
        skinBuy.eventMode = 'static'
        const skinName = new PIXI.Text(item.name, this.textStyles.default40)
        const skinPrice = new PIXI.Text(`COST: ${ownedSkin ? 'owned' : item.price}`, this.textStyles.default40)
        const skinDescription = new PIXI.Text(item.desc, this.textStyles.default30)
        const skinBg = new PIXI.Sprite(PIXI.Texture.WHITE)
        skinBg.tint = 0
        skinBg.width = this.gameWidth
        skinBg.height = 10
        
        skin.position.set(this.gameWidth * idx, 0)
        skin.addChild(skinName)
        skin.addChild(skinSprite)
        skin.addChild(skinPrice)
        skin.addChild(skinBuy)
        skin.addChild(skinDescription)
        skin.addChild(skinBg)
        
        skinSprite.scale.set(Math.floor((this.gameHeight / skinSprite.height) / 2))
        skinName.anchor.set(0.5, 0)
        skinName.position.set(this.gameWidth / 2, 20)
        skinSprite.anchor.set(0.5, 0)
        skinSprite.position.set(this.gameWidth / 2, 10)
        skinPrice.position.set(20, skinSprite.y + skinSprite.height)
        skinBuy.anchor.set(1, 0)
        skinBuy.scale.set(0.7)
        skinBuy.position.set(this.gameWidth - 20, skinPrice.y - skinBuy.height / 2)
        skinDescription.position.set(20, skinPrice.y + 50)
        
        if (!ownedSkin) {
            const skinPriceIcon = new PIXI.Sprite(this.menuIcons.textures.money)
            skin.addChild(skinPriceIcon)
            skinPriceIcon.scale.set(0.5)
            skinPriceIcon.position.set(skinPrice.x + skinPrice.width + 10, skinPrice.y - 6)
        }
        
        skinBuy.on('pointerdown', () => {
            if (ownedSkin) {
                this.storage.selectedSkin = idx
            } else if (this.storage.money >= item.price) {
                this.storage.money -= item.price
                this.storage.ownedSkins.push(idx)
            }
            scrollContainer.content.removeChildren(0, scrollContainer.content.children.length)
            this.store.removeChild(this.store.getChildByName('moneyContainer'))
            this.updateMoney()
            // Перезагрузка будет вызвана извне
        })
        
        return skin
    }
    
    /**
     * Обновляет отображение денег
     */
    updateMoney() {
        const oldContainer = this.store.getChildByName('moneyContainer')
        if (oldContainer) {
            this.store.removeChild(oldContainer)
        }
        
        const moneyContainer = new PIXI.Container()
        moneyContainer.name = 'moneyContainer'
        moneyContainer.position.set(20, this.gameHeight - 70)
        
        const moneyIcon = new PIXI.Sprite(this.menuIcons.textures.money)
        moneyIcon.scale.set(0.6)
        moneyIcon.anchor.set(0, 1)
        moneyIcon.position.set(0, 0)
        moneyContainer.addChild(moneyIcon)
        
        const money = new PIXI.Text(this.storage.money, this.textStyles.default40)
        money.anchor.set(0, 0.5)
        money.position.set(moneyIcon.x + 45, moneyIcon.y - 18)
        moneyContainer.addChild(money)
        
        const goldIcon = new PIXI.Sprite(this.menuIcons.textures.goldbar)
        goldIcon.scale.set(0.4)
        goldIcon.anchor.set(0, 1)
        goldIcon.position.set(0, moneyIcon.y + 40)
        moneyContainer.addChild(goldIcon)
        
        const gold = new PIXI.Text(this.storage.gold, this.textStyles.default40)
        gold.anchor.set(0, 0.5)
        gold.position.set(goldIcon.x + 45, goldIcon.y - 18)
        moneyContainer.addChild(gold)
        
        this.store.addChild(moneyContainer)
    }
    
    /**
     * Получает магазин
     */
    getStore() {
        return this.store
    }
    
    /**
     * Очищает магазин
     */
    clear() {
        if (this.store && this.menu) {
            this.menu.removeChild(this.store)
        }
        this.store = null
    }
}
