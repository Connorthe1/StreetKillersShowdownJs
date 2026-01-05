/**
 * ResourceLoader.js
 * 
 * Загрузка и управление ресурсами
 * 
 * Содержит:
 * - Класс ResourceLoader
 * - Метод loadAllAssets() - загрузка всех текстур, анимаций, звуков
 * - Кэширование загруженных ресурсов
 * - Управление загрузочным экраном
 * - Экспорт загруженных ресурсов для использования в других модулях
 */

import * as PIXI from 'pixi.js'
import {default as sounds} from '../sounds.js'
import skinStore from '../skinStore.json'

/**
 * Класс для загрузки игровых ресурсов
 */
export class ResourceLoader {
    constructor() {
        this.resources = {}
        this.loaderData = null
    }
    
    /**
     * Загружает загрузочный экран
     * @param {PIXI.Application} app - экземпляр приложения PIXI
     * @param {number} gameWidth - ширина экрана
     * @param {number} gameHeight - высота экрана
     * @returns {Promise<Object>} объект с loaderGif и logo
     */
    async loadLoaderScreen(app, gameWidth, gameHeight) {
        const loaderView = new PIXI.Container()
        app.stage.addChild(loaderView)
        
        const loaderGif = await PIXI.Assets.load('./assets/loading/loader.json')
        const logo = await PIXI.Assets.load('./assets/loading/logopng.png')
        
        const logoSprite = new PIXI.Sprite(logo)
        logoSprite.width = gameWidth
        logoSprite.height = gameHeight
        loaderView.addChild(logoSprite)
        
        const loaderSprite = new PIXI.AnimatedSprite(loaderGif.animations.loader)
        loaderSprite.animationSpeed = 0.5
        loaderSprite.anchor.set(0.5)
        loaderSprite.position.set(gameWidth / 2, gameHeight - gameHeight / 4)
        loaderSprite.play()
        loaderView.addChild(loaderSprite)
        
        this.loaderData = {
            loaderView,
            loaderGif,
            logo
        }
        
        return this.loaderData
    }
    
    /**
     * Загружает все игровые ресурсы
     * @returns {Promise<Object>} объект со всеми загруженными ресурсами
     */
    async loadAllAssets() {
        // Загрузка шрифта
        await PIXI.Assets.load('./assets/fonts/anothercastle3.ttf')
        
        // Загрузка звуков
        PIXI.Assets.addBundle('sounds', sounds)
        await PIXI.Assets.loadBundle('sounds')
        
        // Загрузка текстур
        const textures = await PIXI.Assets.load('./assets/textures/textures.json')
        const woods = await PIXI.Assets.load('./assets/textures/woods.json')
        const build1 = await PIXI.Assets.load('./assets/textures/build1.json')
        const build2 = await PIXI.Assets.load('./assets/textures/build2.json')
        const buildZiplineTexture = await PIXI.Assets.load('./assets/textures/buildZipline.json')
        const club = await PIXI.Assets.load('./assets/textures/club.json')
        const laserBeamTexture = await PIXI.Assets.load('./assets/textures/laserBeam.json')
        const inBuildTexture = await PIXI.Assets.load('./assets/textures/inBuild.json')
        const inFloorTexture = await PIXI.Assets.load('./assets/textures/inFloor.json')
        const inClubTexture = await PIXI.Assets.load('./assets/textures/inClub.json')
        const bgCarTexture = await PIXI.Assets.load('./assets/textures/bgCar.json')
        
        // Загрузка персонажей
        skinStore[0].param = await PIXI.Assets.load('./assets/character/character.json')
        skinStore[1].param = await PIXI.Assets.load('./assets/character/characterPremium.json')
        skinStore[2].param = await PIXI.Assets.load('./assets/character/characterPremiumNigga.json')
        skinStore[3].param = await PIXI.Assets.load('./assets/character/characterLogo.json')
        skinStore[4].param = await PIXI.Assets.load('./assets/character/characterCowboy.json')
        skinStore[5].param = await PIXI.Assets.load('./assets/character/characterAnime.json')
        
        // Загрузка врагов
        const enemiesTexture = await PIXI.Assets.load('./assets/enemies/enemies.json')
        const dogEnemy = await PIXI.Assets.load('./assets/enemies/dog.json')
        const bossGun = await PIXI.Assets.load('./assets/enemies/bossGun.json')
        const bossLauncher = await PIXI.Assets.load('./assets/enemies/bossLauncher.json')
        const bossVan = await PIXI.Assets.load('./assets/enemies/bossVan.json')
        const bossSmg = await PIXI.Assets.load('./assets/enemies/bossSmg.json')
        
        // Загрузка частиц
        const particles = await PIXI.Assets.load('./assets/particles/particles.json')
        const bigExplode = await PIXI.Assets.load('./assets/particles/bigExplode.json')
        const physParticlesTexture = await PIXI.Assets.load('./assets/particles/physParticles.json')
        const bounceParticlesTexture = await PIXI.Assets.load('./assets/particles/bounceParticles.json')
        
        // Загрузка сущностей
        const bochka = await PIXI.Assets.load('./assets/entity/bochka.json')
        const canTexture = await PIXI.Assets.load('./assets/entity/can.json')
        const windowTexture = await PIXI.Assets.load('./assets/entity/window.json')
        const doorTexture = await PIXI.Assets.load('./assets/entity/door.json')
        const puddleTexture = await PIXI.Assets.load('./assets/entity/puddle.json')
        const garbageTexture = await PIXI.Assets.load('./assets/entity/garbage.json')
        
        // Загрузка UI
        const activeItems = await PIXI.Assets.load('./assets/hud/activeItems.json')
        const menuButtons = await PIXI.Assets.load('./assets/hud/menuButtons.json')
        const menuIcons = await PIXI.Assets.load('./assets/hud/menuIcons.json')
        const menuPause = await PIXI.Assets.load('./assets/hud/menuPause.json')
        const menuUI = await PIXI.Assets.load('./assets/hud/menuUI.json')
        
        // Загрузка фона
        const bg = await PIXI.Assets.load('./assets/BG.png')
        
        // Сохранение всех ресурсов
        this.resources = {
            // Текстуры
            textures,
            woods,
            build1,
            build2,
            buildZiplineTexture,
            club,
            laserBeamTexture,
            inBuildTexture,
            inFloorTexture,
            inClubTexture,
            bgCarTexture,
            
            // Персонажи (уже в skinStore)
            skinStore,
            
            // Враги
            enemiesTexture,
            dogEnemy,
            bossGun,
            bossLauncher,
            bossVan,
            bossSmg,
            
            // Частицы
            particles,
            bigExplode,
            physParticlesTexture,
            bounceParticlesTexture,
            
            // Сущности
            bochka,
            canTexture,
            windowTexture,
            doorTexture,
            puddleTexture,
            garbageTexture,
            
            // UI
            activeItems,
            menuButtons,
            menuIcons,
            menuPause,
            menuUI,
            
            // Фон
            bg
        }
        
        return this.resources
    }
    
    /**
     * Получает загруженные ресурсы
     * @returns {Object} объект с ресурсами
     */
    getResources() {
        return this.resources
    }
    
    /**
     * Получает данные загрузочного экрана
     * @returns {Object} объект с данными загрузочного экрана
     */
    getLoaderData() {
        return this.loaderData
    }
    
    /**
     * Удаляет загрузочный экран
     * @param {PIXI.Application} app - экземпляр приложения PIXI
     */
    removeLoaderScreen(app) {
        if (this.loaderData && this.loaderData.loaderView) {
            app.stage.removeChild(this.loaderData.loaderView)
        }
    }
}
