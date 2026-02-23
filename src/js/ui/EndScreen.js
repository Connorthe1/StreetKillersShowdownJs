/**
 * EndScreen.js
 * 
 * Менеджер экрана окончания игры
 * 
 * Содержит:
 * - Создание экрана окончания (createEndScreen)
 * - Отображение результатов
 * - Анимация подсчета очков и денег
 * - Кнопка выхода
 * - Взаимодействие через EventBus (эмиты, без колбэков)
 */

import * as PIXI from 'pixi.js'
import {soundPlayer} from "../playSound";

/**
 * Менеджер экрана окончания игры
 */
export class EndScreenManager {
    constructor(app, gameState, gameWidth, gameHeight, textStyles, resources, storageManager, eventBus) {
        this.app = app
        this.gameState = gameState
        this.gameWidth = gameWidth
        this.gameHeight = gameHeight
        this.textStyles = textStyles
        this.resources = resources
        this.storageManager = storageManager
        this.eventBus = eventBus

        this.endScreen = null

        this.eventBus.on('endScreen:create', (payload) => {
            this.createEndScreen(payload?.toRestart ?? payload ?? false)
        })
    }

    /**
     * Создает экран окончания игры
     * @param {boolean} toRestart - перезапустить игру сразу
     */
    async createEndScreen(toRestart = false) {
        this.eventBus.emit('endScreen:stopMusic')
        this.eventBus.emit('endScreen:clearTimeouts')
        this.gameState.gameEnd = true
        this.app.stage.removeChild(this.app.stage.getChildByName('hud'))

        if (toRestart) {
            this.eventBus.emit('endScreen:restart')
            return null
        }

        if (this.storageManager) {
            this.storageManager.updateRecord(this.gameState.points)
        }
        
        // Создание экрана окончания
        const endScreen = new PIXI.Container()
        let skip = false
        this.app.stage.addChild(endScreen)
        this.endScreen = endScreen
        
        // Фон
        let bg = new PIXI.Graphics()
        bg.eventMode = 'static'
        bg.beginFill(0x000)
        bg.alpha = 0.3
        bg.drawRect(0, 0, this.gameWidth, this.gameHeight)
        endScreen.addChild(bg)
        endScreen.name = 'endScreen'
        
        // Пропуск анимации
        bg.on('pointerdown', (event) => {
            if (skip) return
            skip = true
        })
        
        const center = this.gameWidth / 2
        
        // Заголовок "RESULTS"
        const results = new PIXI.Text('results', this.textStyles.default100)
        results.anchor.set(0.5)
        results.position.set(center, 100)
        endScreen.addChild(results)
        
        // Задержка перед показом результатов
        await new Promise(resolve => {
            let delay = 0
            const interval = setInterval(() => {
                delay++
                if (skip) {
                    clearInterval(interval)
                    resolve()
                }
                if (delay > 10) {
                    resolve()
                    clearInterval(interval)
                }
            }, 10)
        })
        
        // Финальный счет
        const finalScore = new PIXI.Text('final score:', this.textStyles.default40)
        finalScore.anchor.set(0.5)
        finalScore.position.set(center, results.y + 70)
        endScreen.addChild(finalScore)
        
        const finalScoreValue = new PIXI.Text('0', this.textStyles.default60)
        finalScoreValue.anchor.set(0.5)
        finalScoreValue.position.set(center, finalScore.y + 40)
        endScreen.addChild(finalScoreValue)
        
        // Анимация подсчета очков
        let initScore = 0
        const scoreUpdate = Math.floor(this.gameState.points / 100)
        await new Promise(resolve => {
            const interval = setInterval(() => {
                if (skip) {
                    initScore = this.gameState.points
                    clearInterval(interval)
                    resolve()
                }
                initScore += Math.max(1, scoreUpdate)
                if (initScore >= this.gameState.points) {
                    resolve()
                    initScore = this.gameState.points
                    clearInterval(interval)
                }
                finalScoreValue.text = initScore
            }, 10)
        })
        
        // Деньги за дистанцию
        const distanceMoney = new PIXI.Text('distance money:', this.textStyles.default40)
        distanceMoney.anchor.set(0.5)
        distanceMoney.position.set(center, finalScoreValue.y + 70)
        endScreen.addChild(distanceMoney)
        
        const distanceMoneyValue = new PIXI.Text('0$', this.textStyles.green60)
        distanceMoneyValue.anchor.set(0.5)
        distanceMoneyValue.position.set(center, distanceMoney.y + 40)
        endScreen.addChild(distanceMoneyValue)
        
        // Анимация подсчета денег за дистанцию
        let initDMoney = 0
        const pointsToMoney = Math.floor(this.gameState.points / 50)
        const dMoneyUpdate = Math.floor(pointsToMoney / 200)
        await new Promise(resolve => {
            const interval = setInterval(() => {
                if (skip) {
                    initDMoney = pointsToMoney
                    clearInterval(interval)
                    resolve()
                }
                initDMoney += Math.max(1, dMoneyUpdate)
                if (initDMoney >= pointsToMoney) {
                    resolve()
                    initDMoney = pointsToMoney
                    clearInterval(interval)
                }
                distanceMoneyValue.text = `${initDMoney}$`
            }, 10)
        })
        
        // Собранные деньги
        const collectedMoney = new PIXI.Text('collected money:', this.textStyles.default40)
        collectedMoney.anchor.set(0.5)
        collectedMoney.position.set(center, distanceMoneyValue.y + 70)
        endScreen.addChild(collectedMoney)
        
        const collectedMoneyValue = new PIXI.Text('0$', this.textStyles.green60)
        collectedMoneyValue.anchor.set(0.5)
        collectedMoneyValue.position.set(center, collectedMoney.y + 40)
        endScreen.addChild(collectedMoneyValue)
        
        // Анимация подсчета собранных денег
        let initCMoney = 0
        const collectedToMoney = this.gameState.collectedMoney || 0
        const cMoneyUpdate = Math.floor(collectedToMoney / 200)
        await new Promise(resolve => {
            const interval = setInterval(() => {
                if (skip) {
                    initCMoney = collectedToMoney
                    clearInterval(interval)
                    resolve()
                }
                initCMoney += Math.max(1, cMoneyUpdate)
                if (initCMoney >= collectedToMoney) {
                    resolve()
                    initCMoney = collectedToMoney
                    clearInterval(interval)
                }
                collectedMoneyValue.text = `${initCMoney}$`
            }, 10)
        })
        
        // Добавление денег в хранилище
        if (this.storageManager) {
            this.storageManager.addMoney(pointsToMoney + collectedToMoney)
        }
        
        // Рейтинг
        const score = new PIXI.Text('F', this.textStyles.default180)
        score.scale.set(5)
        score.rotation = -0.2
        score.anchor.set(0.5)
        score.position.set(center, collectedMoneyValue.y + 100)
        endScreen.addChild(score)
        
        // Анимация рейтинга
        let scale = 5
        await new Promise(resolve => {
            const interval = setInterval(() => {
                scale -= 0.1
                score.scale.set(scale)
                if (scale <= 1) {
                    resolve()
                    clearInterval(interval)
                }
            }, 10)
        })
        
        // Сохранение данных
        if (this.storageManager) {
            await this.storageManager.save()
        }
        
        // Кнопка выхода
        const exit = new PIXI.Sprite(this.resources.menuButtons.textures.exit)
        exit.scale.set(0.7, 0.6)
        exit.eventMode = 'static'
        exit.anchor.set(0.5, 0)
        exit.position.set(center, score.y + 80)
        endScreen.addChild(exit)
        
        exit.on('pointerdown', () => this.eventBus.emit('endScreen:restart'))
        
        return endScreen
    }
    
    /**
     * Удаляет экран окончания
     */
    removeEndScreen() {
        if (this.endScreen && this.app.stage) {
            this.app.stage.removeChild(this.endScreen)
        }
        this.endScreen = null
    }
    
    /**
     * Очищает экран окончания
     */
    clear() {
        this.removeEndScreen()
    }
}
