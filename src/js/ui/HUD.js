/**
 * HUD.js
 * 
 * Менеджер игрового интерфейса (HUD)
 * 
 * Содержит:
 * - Создание и обновление элементов HUD
 * - Управление отображением очков, патронов, здоровья
 * - Управление отображением навыков и пауэр-апов
 * - Управление паузой
 * - Обновление рейтинга (score)
 */

import * as PIXI from 'pixi.js'

/**
 * Менеджер HUD
 */
export class HUDManager {
    constructor(app, storage, hud, gameState, gameWidth, gameHeight, textStyles, resources, eventBus) {
        this.hud = hud
        this.gameState = gameState
        this.gameWidth = gameWidth
        this.gameHeight = gameHeight
        this.textStyles = textStyles
        this.resources = resources
        this.app = app
        this.storage = storage
        this.eventBus = eventBus

        eventBus.on('hud:createBulletsDisplay', gun => {
            this.createBulletsDisplay(gun)
        })

        eventBus.on('hud:removeBullet', () => {
            this.removeBullet()
        })

        eventBus.on('hud:setSkillsAlpha', val => {
            this.setSkillsAlpha(val)
        })

        eventBus.on('hud:updateSkills', storage => {
            this.updateSkills(storage)
        })

        eventBus.on('hud:createShield', health => {
            this.createShield(health)
        })

        eventBus.on('hud:removeShield', () => {
            this.removeShield()
        })

        eventBus.on('hud:updatePowerUps', activePowerUps => {
            this.updatePowerUps(activePowerUps)
        })
    }
    
    /**
     * Создает отображение патронов
     */
    createBulletsDisplay(gun) {
        const oldMagazine = this.hud.getChildByName('magazine')
        if (oldMagazine) {
            this.hud.removeChild(oldMagazine)
        }
        
        const magazine = new PIXI.Container()
        for (let i = 0; i < gun.ammo; i++) {
            const bullet = new PIXI.Sprite(this.resources.activeItems.textures.bullet)
            bullet.position.x = i * (bullet.width + 2)
            magazine.addChild(bullet)
        }
        magazine.name = 'magazine'
        magazine.position.set(20, this.gameHeight - 60)
        this.hud.addChild(magazine)
    }
    
    /**
     * Обновляет отображение патронов (удаляет один патрон)
     */
    removeBullet() {
        const magazine = this.hud.getChildByName('magazine')
        if (magazine && magazine.children.length > 0) {
            magazine.removeChildAt(0)
            magazine.x -= 16
        }
    }
    
    /**
     * Создает основной HUD (очки, рейтинг, здоровье, навыки)
     */
    createMainHUD(playerState) {
        // Стиль для очков
        const pointsStyle = new PIXI.TextStyle({
            fontFamily: 'ACastle3',
            fontSize: 56,
            fontStyle: 'italic',
            fontWeight: 'bold',
            fill: ['#ffffff', '#00ff99'],
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
        })
        
        const points = new PIXI.Text('0', pointsStyle)
        points.anchor.set(1, 0)
        points.x = this.gameWidth - 20
        points.y = 40
        points.name = 'points'
        
        const scaleStyle = new PIXI.TextStyle({
            fontFamily: 'ACastle3',
            fontSize: 32,
            fontStyle: 'italic',
            fontWeight: 'bold',
            fill: ['#ffffff', '#00ff99'],
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
        })
        
        const scale = new PIXI.Text('x0', scaleStyle)
        scale.anchor.set(1, 0)
        scale.x = this.gameWidth - 20
        scale.y = 90
        scale.name = 'scale'
        
        // Стиль для рейтинга
        const scoreStyle = new PIXI.TextStyle({
            fontFamily: 'ACastle3',
            fontSize: 100,
            fontStyle: 'italic',
            fontWeight: 'bold',
            fill: ['#ffffff', '#00ff99'],
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
        })
        
        const score = new PIXI.Text('F', scoreStyle)
        score.anchor.set(1, 0)
        score.x = this.gameWidth - 20
        score.y = 140
        score.name = 'score'
        
        // Сердца (здоровье)
        const hearts = new PIXI.Container()
        for (let i = 0; i < playerState.health; i++) {
            const heart = new PIXI.Sprite(this.resources.activeItems.textures.heart)
            heart.position.x = (2 - i) * (heart.width / 2 + 10)
            hearts.addChild(heart)
        }
        hearts.name = 'hearts'
        hearts.position.set(20, 46)
        hearts.zIndex = 1
        
        // Навыки
        const skills = this.createSkillsDisplay()
        
        // Пауэр-апы
        const powerUps = new PIXI.Container()
        powerUps.name = 'powerUps'
        powerUps.position.set(90, 120)
        
        // FPS
        const fps = new PIXI.Text(this.app.ticker.FPS, this.textStyles.default40)
        fps.name = 'fps'
        fps.position.set(5, 100)
        
        // Добавление всех элементов
        this.hud.addChild(powerUps)
        this.hud.addChild(skills)
        this.hud.addChild(hearts)
        this.hud.addChild(score)
        this.hud.addChild(scale)
        this.hud.addChild(points)
        this.hud.addChild(fps)
    }
    
    /**
     * Создает отображение навыков
     */
    createSkillsDisplay() {
        const skills = new PIXI.Container()
        skills.position.set(20, 96) // hearts.y + 50
        skills.name = 'skills'
        
        const stimpack = new PIXI.Sprite(this.resources.activeItems.textures.stimpack)
        stimpack.scale.set(0.9)
        stimpack.position.set(0, 0)
        
        const stimpackText = new PIXI.Text(this.storage.activeItems.stimpack, this.textStyles.default30)
        stimpackText.name = 'stimpackText'
        stimpackText.position.set(stimpack.x + stimpack.width, stimpack.y + stimpack.height / 2)
        
        const handGrenade = new PIXI.Sprite(this.resources.activeItems.textures.handGrenadeIcon)
        handGrenade.scale.set(0.6)
        handGrenade.position.set(-6, stimpack.y + 40)
        
        const handGrenadeText = new PIXI.Text(this.storage.activeItems.grenades, this.textStyles.default30)
        handGrenadeText.name = 'handGrenadeText'
        handGrenadeText.position.set(handGrenade.x + handGrenade.width, handGrenade.y + handGrenade.height / 2)
        
        skills.addChild(stimpackText)
        skills.addChild(stimpack)
        skills.addChild(handGrenadeText)
        skills.addChild(handGrenade)
        
        return skills
    }
    
    /**
     * Обновляет отображение навыков
     */
    updateSkills() {
        const skills = this.hud.getChildByName('skills')
        if (!skills) return
        
        const stimpackText = skills.getChildByName('stimpackText')
        const handGrenadeText = skills.getChildByName('handGrenadeText')
        
        if (stimpackText) {
            stimpackText.text = this.storage.activeItems.stimpack
        }
        if (handGrenadeText) {
            handGrenadeText.text = this.storage.activeItems.grenades
        }
    }
    
    /**
     * Обновляет отображение очков
     */
    updatePoints() {
        const pointsElement = this.hud.getChildByName('points')
        if (pointsElement) {
            const currentPoints = this.gameState.updatePoints()
            if (currentPoints !== this.gameState.points || this.gameState.pointsToAdd > 0) {
                pointsElement.text = this.gameState.points
            }
        }
    }
    
    /**
     * Обновляет отображение множителя
     */
    updateMultiplier() {
        const scaleElement = this.hud.getChildByName('scale')
        if (scaleElement) {
            scaleElement.text = `x${this.gameState.multiplier.toFixed(1)}`
        }
    }
    
    /**
     * Обновляет отображение рейтинга
     */
    updateScore(score) {
        const scoreElement = this.hud.getChildByName('score')
        if (!scoreElement) return
        
        scoreElement.text = score
        
        // Обновление цвета в зависимости от рейтинга
        const scoreColors = {
            'F': ["#ffffff", "#ff0000"],
            'E': ["#ffffff", "#ff5858"],
            'D': ["#ffffff", "#ffa4d5"],
            'C': ["#ffffff", "#83b9ff"],
            'B': ["#ffffff", "#b0ff89"],
            'A': ["#ffffff", "#9eff11"],
            'A+': ["#ffffff", "#ffec6e"],
            'S': ["#ffffff", "#ffcd00"],
            'S+': ["#ffffff", "#ffa33c"],
            'S++': ["#ffffff", "#ff6200"]
        }
        
        if (scoreColors[score]) {
            scoreElement.style._fill = scoreColors[score]
        }
    }
    
    /**
     * Обновляет отображение FPS
     */
    updateFPS(fps) {
        const fpsElement = this.hud.getChildByName('fps')
        if (fpsElement) {
            fpsElement.text = Math.floor(fps)
        }
    }
    
    /**
     * Создает щит (stimpack активен)
     */
    createShield(health) {
        // Удаляем старый щит, если есть
        this.removeShield()
        
        const shield = new PIXI.Sprite(this.resources.activeItems.textures.goldHeart)
        shield.name = 'shield'
        shield.position.set(20 + (health) * (shield.width / 2 + 8), 46)
        this.hud.addChild(shield)
    }
    
    /**
     * Удаляет щит
     */
    removeShield() {
        const shield = this.hud.getChildByName('shield')
        if (shield) {
            this.hud.removeChild(shield)
        }
    }
    
    /**
     * Обновляет отображение пауэр-апов
     */
    updatePowerUps(activePowerUps) {
        const powerUps = this.hud.getChildByName('powerUps')
        if (!powerUps) return
        
        powerUps.removeChildren(0, powerUps.children.length)
        
        if (activePowerUps.length === 0) return
        
        activePowerUps.forEach((item, idx) => {
            const powerUp = new PIXI.Sprite(this.resources.menuIcons.textures[item.type])
            powerUp.scale.set(0.5)
            powerUp.position.set(50 * idx, 0)
            powerUps.addChild(powerUp)
        })
    }
    
    /**
     * Устанавливает прозрачность навыков (для CD)
     */
    setSkillsAlpha(alpha) {
        const skills = this.hud.getChildByName('skills')
        if (skills) {
            skills.alpha = alpha
        }
    }
    
    /**
     * Создает UI для ближнего боя
     * @deprecated Используйте MeleeKillUIManager.createMeleeKillUI() вместо этого
     * Метод оставлен для обратной совместимости, но будет удален в будущем
     */
    createMeleeKillUI(enemy, world) {
        console.warn('HUD.createMeleeKillUI() устарел. Используйте MeleeKillUIManager.createMeleeKillUI()')
        return null
    }
    
    /**
     * Создает меню паузы
     */
    createPauseMenu(callbacks) {
        const hudPause = new PIXI.Container()
        this.hud.addChild(hudPause)

        const pause = new PIXI.Sprite(this.resources.menuPause.textures.pause)
        pause.eventMode = 'static'
        pause.anchor.set(1)
        pause.position.set(this.gameWidth - 20, this.gameHeight - 20)
        hudPause.addChild(pause)

        const pauseMenu = new PIXI.Container()
        hudPause.addChild(pauseMenu)
        pauseMenu.visible = false

        const bg = new PIXI.Graphics()
        bg.beginFill(0x000)
        bg.alpha = 0.4
        bg.drawRect(0, 0, this.gameWidth, this.gameHeight)
        pauseMenu.addChild(bg)

        const play = new PIXI.Sprite(this.resources.menuPause.textures.play)
        play.eventMode = 'static'
        play.anchor.set(1)
        play.position.set(this.gameWidth - 20, this.gameHeight - 20)
        pauseMenu.addChild(play)

        const heading = new PIXI.Text('PAUSE', this.textStyles.default80)
        heading.anchor.set(0.5, 1)
        heading.position.set(this.gameWidth / 2, this.gameHeight / 4)
        pauseMenu.addChild(heading)

        const distance = new PIXI.Text(`record: ${callbacks.storage?.record || 0}`, this.textStyles.default40)
        distance.anchor.set(0, 1)
        distance.position.set(20, this.gameHeight - 20)
        pauseMenu.addChild(distance)

        const leave = new PIXI.Sprite(this.resources.menuUI.textures.shortexit)
        leave.eventMode = 'static'
        leave.anchor.set(0.5)
        leave.scale.set(0.5)
        leave.position.set(this.gameWidth / 2, this.gameHeight / 2)
        pauseMenu.addChild(leave)

        const leaveMenu = new PIXI.Container()
        hudPause.addChild(leaveMenu)
        leaveMenu.visible = false
        const leaveText = new PIXI.Text('leaving?', this.textStyles.default56)
        leaveText.anchor.set(0.5, 0)
        leaveText.position.set(this.gameWidth / 2, this.gameHeight / 2.5)
        leaveMenu.addChild(leaveText)
        const leaveDesc = new PIXI.Text('your run progress will be lost are you sure?', this.textStyles.default30)
        leaveDesc.anchor.set(0.5, 0)
        leaveDesc.position.set(this.gameWidth / 2, leaveText.y + leaveText.height + 20)
        leaveMenu.addChild(leaveDesc)

        const cancelButton = new PIXI.Sprite(this.resources.menuUI.textures.exitclear)
        cancelButton.eventMode = 'static'
        cancelButton.anchor.set(1, 0)
        cancelButton.scale.set(0.5, 0.4)
        cancelButton.position.set(this.gameWidth / 2 - 10, leaveDesc.y + leaveDesc.height + 20)
        leaveMenu.addChild(cancelButton)
        const cancelButtonText = new PIXI.Text('leave', this.textStyles.default40)
        cancelButtonText.anchor.set(0.5)
        cancelButtonText.position.set(cancelButton.x - cancelButton.width / 2, cancelButton.y + cancelButton.height / 2 + 2)
        leaveMenu.addChild(cancelButtonText)

        const stayButton = new PIXI.Sprite(this.resources.menuUI.textures.stayclear)
        stayButton.eventMode = 'static'
        stayButton.anchor.set(0)
        stayButton.scale.set(0.5, 0.4)
        stayButton.position.set(this.gameWidth / 2 + 10, leaveDesc.y + leaveDesc.height + 20)
        leaveMenu.addChild(stayButton)
        const stayButtonText = new PIXI.Text('stay', this.textStyles.default40)
        stayButtonText.anchor.set(0.5)
        stayButtonText.position.set(stayButton.x + stayButton.width / 2, stayButton.y + stayButton.height / 2 + 2)
        leaveMenu.addChild(stayButtonText)

        const timerMenu = new PIXI.Container()
        hudPause.addChild(timerMenu)
        timerMenu.visible = false
        const bgTimer = new PIXI.Graphics()
        bgTimer.beginFill(0x000)
        bgTimer.alpha = 0.4
        bgTimer.drawRect(0, 0, this.gameWidth, this.gameHeight)
        timerMenu.addChild(bgTimer)
        const timerText = new PIXI.Text('0', this.textStyles.default180)
        timerText.anchor.set(0.5)
        timerText.position.set(this.gameWidth / 2, this.gameHeight / 2)
        timerMenu.addChild(timerText)

        pause.on('pointerdown', () => {
            if (callbacks.hasMeleeKill && callbacks.hasMeleeKill()) return
            if (callbacks.pauseGame) callbacks.pauseGame()
            this.hud.getChildByName('magazine').visible = false
            pauseMenu.visible = true
            leave.visible = true
            pause.visible = false
            if (callbacks.pauseTimeouts) callbacks.pauseTimeouts()
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
                    this.hud.getChildByName('magazine').visible = true
                    timerMenu.visible = false
                    if (callbacks.resumeGame) callbacks.resumeGame()
                    pause.visible = true
                    if (callbacks.resumeTimeouts) callbacks.resumeTimeouts()
                }
            }, 1000)
        })

        leave.on('pointerdown', () => {
            leaveMenu.visible = true
            leave.visible = false
        })

        cancelButton.on('pointerdown', () => {
            if (callbacks.endGame) {
                callbacks.endGame(true)
            }
        })

        stayButton.on('pointerdown', () => {
            leaveMenu.visible = false
            leave.visible = true
        })
    }
}

