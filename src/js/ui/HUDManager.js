/**
 * HUDManager.js
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
    constructor(hud, gameState, gameWidth, gameHeight, textStyles) {
        this.hud = hud
        this.gameState = gameState
        this.gameWidth = gameWidth
        this.gameHeight = gameHeight
        this.textStyles = textStyles
        
        // Текстуры (устанавливаются позже)
        this.activeItems = null
        this.menuIcons = null
        this.menuPause = null
        this.menuUI = null
    }
    
    /**
     * Устанавливает текстуры для HUD
     */
    setTextures(textures) {
        this.activeItems = textures.activeItems
        this.menuIcons = textures.menuIcons
        this.menuPause = textures.menuPause
        this.menuUI = textures.menuUI
    }
    
    /**
     * Создает отображение патронов
     */
    createBulletsDisplay(gun) {
        if (!this.activeItems) {
            console.warn('ActiveItems textures not available')
            return
        }
        
        const oldMagazine = this.hud.getChildByName('magazine')
        if (oldMagazine) {
            this.hud.removeChild(oldMagazine)
        }
        
        const magazine = new PIXI.Container()
        for (let i = 0; i < gun.ammo; i++) {
            const bullet = new PIXI.Sprite(this.activeItems.textures.bullet)
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
    createMainHUD(playerState, storage, app) {
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
        points.y = 20
        points.name = 'points'
        
        const scale = new PIXI.Text('x1.0', pointsStyle)
        scale.anchor.set(1, 0)
        scale.x = this.gameWidth - 20
        scale.y = 80
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
        if (this.activeItems) {
            for (let i = 0; i < playerState.health; i++) {
                const heart = new PIXI.Sprite(this.activeItems.textures.heart)
                heart.position.x = (2 - i) * (heart.width / 2 + 10)
                hearts.addChild(heart)
            }
        }
        hearts.name = 'hearts'
        hearts.position.set(20, 46)
        hearts.zIndex = 1
        
        // Навыки
        const skills = this.createSkillsDisplay(storage)
        
        // Пауэр-апы
        const powerUps = new PIXI.Container()
        powerUps.name = 'powerUps'
        powerUps.position.set(90, 120)
        
        // FPS
        const fps = new PIXI.Text(app.ticker.FPS, this.textStyles.default40)
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
    createSkillsDisplay(storage) {
        if (!this.activeItems) {
            console.warn('ActiveItems textures not available')
            return new PIXI.Container()
        }
        
        const skills = new PIXI.Container()
        skills.position.set(20, 96) // hearts.y + 50
        skills.name = 'skills'
        
        const stimpack = new PIXI.Sprite(this.activeItems.textures.stimpack)
        stimpack.scale.set(0.9)
        stimpack.position.set(0, 0)
        
        const stimpackText = new PIXI.Text(storage.activeItems.stimpack, this.textStyles.default30)
        stimpackText.name = 'stimpackText'
        stimpackText.position.set(stimpack.x + stimpack.width, stimpack.y + stimpack.height / 2)
        
        const handGrenade = new PIXI.Sprite(this.activeItems.textures.handGrenadeIcon)
        handGrenade.scale.set(0.6)
        handGrenade.position.set(-6, stimpack.y + 40)
        
        const handGrenadeText = new PIXI.Text(storage.activeItems.grenades, this.textStyles.default30)
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
    updateSkills(storage) {
        const skills = this.hud.getChildByName('skills')
        if (!skills) return
        
        const stimpackText = skills.getChildByName('stimpackText')
        const handGrenadeText = skills.getChildByName('handGrenadeText')
        
        if (stimpackText) {
            stimpackText.text = storage.activeItems.stimpack
        }
        if (handGrenadeText) {
            handGrenadeText.text = storage.activeItems.grenades
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
    updateScore(stimpackActive) {
        const score = this.gameState.updateScore(stimpackActive)
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
    createShield(playerState) {
        if (!this.activeItems) {
            console.warn('ActiveItems textures not available')
            return
        }
        
        // Удаляем старый щит, если есть
        this.removeShield()
        
        const shield = new PIXI.Sprite(this.activeItems.textures.goldHeart)
        shield.name = 'shield'
        shield.position.set(20 + (playerState.health) * (shield.width / 2 + 8), 46)
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
    updatePowerUps(playerState) {
        if (!this.menuIcons) {
            console.warn('MenuIcons textures not available')
            return
        }
        
        const powerUps = this.hud.getChildByName('powerUps')
        if (!powerUps) return
        
        powerUps.removeChildren(0, powerUps.children.length)
        
        if (playerState.activePowerUps.length === 0) return
        
        playerState.activePowerUps.forEach((item, idx) => {
            const powerUp = new PIXI.Sprite(this.menuIcons.textures[item.type])
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
        console.warn('HUDManager.createMeleeKillUI() устарел. Используйте MeleeKillUIManager.createMeleeKillUI()')
        return null
    }
}

