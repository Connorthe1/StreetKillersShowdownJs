/**
 * PauseMenu.js
 * 
 * Менеджер меню паузы
 * 
 * Содержит:
 * - Создание меню паузы (createPauseMenu)
 * - Управление паузой игры
 * - Кнопки: продолжить, выйти
 * - Таймер обратного отсчета
 */

import * as PIXI from 'pixi.js'

/**
 * Менеджер меню паузы
 */
export class PauseMenuManager {
    constructor(hud, gameState, storage, gameWidth, gameHeight, textStyles, menuPause, menuUI, world) {
        this.hud = hud
        this.gameState = gameState
        this.storage = storage
        this.gameWidth = gameWidth
        this.gameHeight = gameHeight
        this.textStyles = textStyles
        this.menuPause = menuPause
        this.menuUI = menuUI
        this.world = world
        
        // Меню паузы
        this.hudPause = null
        this.pauseMenu = null
        this.leaveMenu = null
        this.timerMenu = null
        
        // Callbacks
        this.meleeKill = null
        this.music = null
        this.timeouts = null
        this.endGameCallback = null
    }
    
    /**
     * Устанавливает колбэки
     */
    setCallbacks(callbacks) {
        if (callbacks.meleeKill) this.meleeKill = callbacks.meleeKill
        if (callbacks.music) this.music = callbacks.music
        if (callbacks.timeouts) this.timeouts = callbacks.timeouts
        if (callbacks.endGame) this.endGameCallback = callbacks.endGame
    }
    
    /**
     * Создает меню паузы
     */
    createPauseMenu() {
        if (!this.menuPause || !this.menuUI) {
            console.warn('Pause menu textures not available')
            return null
        }
        
        const hudPause = new PIXI.Container()
        this.hud.addChild(hudPause)
        this.hudPause = hudPause
        
        // Кнопка паузы
        const pause = new PIXI.Sprite(this.menuPause.textures.pause)
        pause.eventMode = 'static'
        pause.anchor.set(1)
        pause.position.set(this.gameWidth - 20, this.gameHeight - 20)
        hudPause.addChild(pause)
        
        // Меню паузы
        const pauseMenu = new PIXI.Container()
        hudPause.addChild(pauseMenu)
        pauseMenu.visible = false
        this.pauseMenu = pauseMenu
        
        // Фон меню паузы
        const bg = new PIXI.Graphics()
        bg.beginFill(0x000)
        bg.alpha = 0.4
        bg.drawRect(0, 0, this.gameWidth, this.gameHeight)
        pauseMenu.addChild(bg)
        
        // Кнопка продолжения
        const play = new PIXI.Sprite(this.menuPause.textures.play)
        play.eventMode = 'static'
        play.anchor.set(1)
        play.position.set(this.gameWidth - 20, this.gameHeight - 20)
        pauseMenu.addChild(play)
        
        // Заголовок
        const heading = new PIXI.Text('PAUSE', this.textStyles.default80)
        heading.anchor.set(0.5, 1)
        heading.position.set(this.gameWidth / 2, this.gameHeight / 4)
        pauseMenu.addChild(heading)
        
        // Рекорд
        const distance = new PIXI.Text(`record: ${this.storage.record}`, this.textStyles.default40)
        distance.anchor.set(0, 1)
        distance.position.set(20, this.gameHeight - 20)
        pauseMenu.addChild(distance)
        
        // Кнопка выхода
        const leave = new PIXI.Sprite(this.menuUI.textures.shortexit)
        leave.eventMode = 'static'
        leave.anchor.set(0.5)
        leave.scale.set(0.5)
        leave.position.set(this.gameWidth / 2, this.gameHeight / 2)
        pauseMenu.addChild(leave)
        
        // Меню подтверждения выхода
        const leaveMenu = new PIXI.Container()
        hudPause.addChild(leaveMenu)
        leaveMenu.visible = false
        this.leaveMenu = leaveMenu
        
        const leaveText = new PIXI.Text('leaving?', this.textStyles.default56)
        leaveText.anchor.set(0.5, 0)
        leaveText.position.set(this.gameWidth / 2, this.gameHeight / 2.5)
        leaveMenu.addChild(leaveText)
        
        const leaveDesc = new PIXI.Text('your run progress will be lost are you sure?', this.textStyles.default30)
        leaveDesc.anchor.set(0.5, 0)
        leaveDesc.position.set(this.gameWidth / 2, leaveText.y + leaveText.height + 20)
        leaveMenu.addChild(leaveDesc)
        
        // Кнопка подтверждения выхода
        const cancelButton = new PIXI.Sprite(this.menuUI.textures.exitclear)
        cancelButton.eventMode = 'static'
        cancelButton.anchor.set(1, 0)
        cancelButton.scale.set(0.5, 0.4)
        cancelButton.position.set(this.gameWidth / 2 - 10, leaveDesc.y + leaveDesc.height + 20)
        leaveMenu.addChild(cancelButton)
        
        const cancelButtonText = new PIXI.Text('leave', this.textStyles.default40)
        cancelButtonText.anchor.set(0.5)
        cancelButtonText.position.set(cancelButton.x - cancelButton.width / 2, cancelButton.y + cancelButton.height / 2 + 2)
        leaveMenu.addChild(cancelButtonText)
        
        // Кнопка отмены выхода
        const stayButton = new PIXI.Sprite(this.menuUI.textures.stayclear)
        stayButton.eventMode = 'static'
        stayButton.anchor.set(0, 0)
        stayButton.scale.set(0.5, 0.4)
        stayButton.position.set(this.gameWidth / 2 + 10, leaveDesc.y + leaveDesc.height + 20)
        leaveMenu.addChild(stayButton)
        
        const stayButtonText = new PIXI.Text('stay', this.textStyles.default40)
        stayButtonText.anchor.set(0.5)
        stayButtonText.position.set(stayButton.x + stayButton.width / 2, stayButton.y + stayButton.height / 2 + 2)
        leaveMenu.addChild(stayButtonText)
        
        // Меню таймера
        const timerMenu = new PIXI.Container()
        hudPause.addChild(timerMenu)
        timerMenu.visible = false
        this.timerMenu = timerMenu
        
        const bgTimer = new PIXI.Graphics()
        bgTimer.beginFill(0x000)
        bgTimer.alpha = 0.4
        bgTimer.drawRect(0, 0, this.gameWidth, this.gameHeight)
        timerMenu.addChild(bgTimer)
        
        const timerText = new PIXI.Text('0', this.textStyles.default180)
        timerText.anchor.set(0.5)
        timerText.position.set(this.gameWidth / 2, this.gameHeight / 2)
        timerMenu.addChild(timerText)
        
        // Обработчики событий
        pause.on('pointerdown', () => {
            if (this.meleeKill && this.meleeKill.isActive && this.meleeKill.isActive()) return
            
            // Остановка анимаций
            if (this.world) {
                const allAnimated = this.world.children.filter(item => item.animationSpeed)
                allAnimated.forEach(item => {
                    item.stop()
                })
            }
            
            // Пауза музыки
            if (this.music) {
                this.music.set('paused', true)
            }
            
            // Установка паузы
            this.gameState.isPause = true
            
            // Скрытие патронов
            const magazine = this.hud.getChildByName('magazine')
            if (magazine) {
                magazine.visible = false
            }
            
            // Показ меню паузы
            pauseMenu.visible = true
            leave.visible = true
            pause.visible = false
            
            // Пауза таймеров
            if (this.timeouts && Array.isArray(this.timeouts)) {
                this.timeouts.forEach(item => {
                    if (item.pause) item.pause()
                })
            }
        })
        
        play.on('pointerdown', () => {
            pauseMenu.visible = false
            leaveMenu.visible = false
            timerMenu.visible = true
            
            // Обратный отсчет
            let timer = 3
            timerText.text = timer
            const delay = setInterval(() => {
                timer--
                timerText.text = timer
                if (timer <= 0) {
                    clearInterval(delay)
                    
                    // Показ патронов
                    const magazine = this.hud.getChildByName('magazine')
                    if (magazine) {
                        magazine.visible = true
                    }
                    
                    // Скрытие таймера
                    timerMenu.visible = false
                    
                    // Возобновление анимаций
                    if (this.world) {
                        const allAnimated = this.world.children.filter(item => item.animationSpeed)
                        allAnimated.forEach(item => {
                            item.play()
                        })
                    }
                    
                    // Возобновление музыки
                    if (this.music) {
                        this.music.set('paused', false)
                    }
                    
                    // Снятие паузы
                    this.gameState.isPause = false
                    pause.visible = true
                    
                    // Возобновление таймеров
                    if (this.timeouts && Array.isArray(this.timeouts)) {
                        this.timeouts.forEach(item => {
                            if (item.resume) item.resume()
                        })
                    }
                }
            }, 1000)
        })
        
        leave.on('pointerdown', () => {
            leaveMenu.visible = true
            leave.visible = false
        })
        
        cancelButton.on('pointerdown', () => {
            if (this.endGameCallback) {
                this.endGameCallback(true)
            }
        })
        
        stayButton.on('pointerdown', () => {
            leaveMenu.visible = false
            leave.visible = true
        })
        
        return hudPause
    }
    
    /**
     * Получает меню паузы
     */
    getPauseMenu() {
        return this.hudPause
    }
    
    /**
     * Очищает меню паузы
     */
    clear() {
        if (this.hudPause && this.hud) {
            this.hud.removeChild(this.hudPause)
        }
        this.hudPause = null
        this.pauseMenu = null
        this.leaveMenu = null
        this.timerMenu = null
    }
}
