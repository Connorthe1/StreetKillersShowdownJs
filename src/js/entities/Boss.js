/**
 * Boss.js
 * 
 * Классы боссов и их менеджер
 * 
 * Содержит:
 * - Класс Boss (базовый класс босса, наследуется от Enemy)
 * - Подклассы: BossGun, BossLauncher, BossVan, BossSmg
 * - Методы: createBoss(), updateBoss(), bossShooting(), bossReward()
 * - Специальная логика боссов (паттерны атак, здоровье)
 * - Награды за победу над боссом
 */

import * as PIXI from 'pixi.js'
import {getPercent, random} from '../utils/GameUtils.js'
import enemyParams from "../enemyParams";

/**
 * Менеджер боссов
 */
export class BossManager {
    constructor(world, gameState, worldCoords, resources, timer, eventBus) {
        this.world = world
        this.gameState = gameState
        this.worldCoords = worldCoords
        this.resources = resources
        this.timer = timer
        this.eventBus = eventBus

        // Текущий босс
        this.sprite = null
        this.isAlive = true
        this.params = null
        this.animset = null
        this.skip = false
        this.isWalking = false

        eventBus.on('boss:activate', () => {
           this.shot()
        })
    }

    create(bossType = null, pos = null) {
        if (this.sprite) return

        let randomPos = pos || Math.floor(this.worldCoords.zeroRight + random(300, 750))
        
        // Очистка врагов в зоне босса
        this.eventBus.emit('enemy:bossClear', randomPos)
        
        // Очистка стен в зоне босса
        this.eventBus.emit('wall:bossClear', randomPos)
        
        // Очистка ловушек в зоне босса
        this.eventBus.emit('trap:bossClear', randomPos)
        
        // Определение типа босса
        let type
        const randType = bossType || random(1, 4)
        switch (1) {
            case 1:
                type = 'bossGun'
                break
            case 2:
                type = 'bossLauncher'
                break
            case 3:
                type = 'bossVan'
                break
            case 4:
                type = 'bossSmg'
                break
            default:
                type = 'bossGun'
        }
        
        // Создание укрытия/стены для босса
        if (bossType === 4) {
            this.eventBus.emit('wall:create', {pos: randomPos - (this.worldCoords.worldWidth / 1.8), type:0, forBoss: true})
        } else {
            this.eventBus.emit('wall:create', {pos: randomPos - (this.worldCoords.worldWidth / 1.8), forBoss: true})
        }

        // Получение текстур босса
        const bossTextureSet = this.resources[type]
        
        // Создание босса
        const boss = new PIXI.AnimatedSprite(bossTextureSet.animations.idle)
        boss.anchor.set(0.5)
        boss.animationSpeed = 0.15
        boss.position.set(
            type === 'bossVan' ? randomPos + 25 : randomPos,
            this.worldCoords.firstFloor - (type === 'bossVan' ? 36 : 10)
        )
        
        boss.zIndex = 10
        boss.play()

        this.animset = bossTextureSet.animations
        this.params = { id: type }

        // Копирование параметров
        if (enemyParams[type]) {
            Object.keys(enemyParams[type]).forEach(item => {
                this.params[item] = enemyParams[type][item]
            })
        }

        this.sprite = boss
        this.addToWorld()
    }

    activate() {
        // if (!this.params.detect) {
        //     this.params.detect = true
        //     this.shot()
        // }
    }

    update(gameSpeed) {
        if (!this.sprite) return

        if (this.isWalking && this.isAlive) {
            this.sprite.x -= 0.5 * gameSpeed
        }
        
        // Удаление босса за левой границей
        if (this.isOutOfBounds()) {
            this.destroy()
            return;
        }

        // Проверка смерти босса
        if (!this.isAlive) {
            this.eventBus.emit('player:bossEnd')
        }
    }
    
    /**
     * Стрельба босса (асинхронная функция)
     */
    async shot() {
        // Создание предупреждения
        const warning = new PIXI.Sprite(this.resources.particles.textures.detection)
        warning.zIndex = 20
        warning.anchor.set(0.5)
        warning.tint = 16776960
        warning.scale.x = 1.5
        warning.scale.y = 2
        warning.position.set(this.sprite.x, this.sprite.y - 40)

        this.params.warning = warning
        this.world.addChild(warning)
        
        let fireTimes = 1
        if (this.params.rapidFire) {
            fireTimes = Math.floor(Math.random() * (this.params.rapidFire - 1 + 1)) + 1
        }
        
        // Подготовка
        const warningTime = Math.max(
            random(
                this.params.warningMin,
                this.params.warningMax,
                true, 
                true
            ) - (this.gameState.points / 100), 
            100
        )
        await this.timer.sleep(warningTime)
        
        if (!this.sprite || !this.isAlive) return
        
        warning.tint = 16711680
        
        // Выстрел
        await this.timer.sleep(warningTime)

        this.world.removeChild(warning)
        
        if (!this.sprite || !this.isAlive) return
        
        // Разные паттерны атак для разных типов боссов
        switch (this.params.id) {
            case 'bossVan':
                await this.handleBossVanAttack(fireTimes)
                break
            case 'bossGun':
                await this.handleBossGunAttack(fireTimes)
                break
            case 'bossSmg':
                await this.handleBossSmgAttack(fireTimes)
                break
            case 'bossLauncher':
                await this.handleBossLauncherAttack(fireTimes)
                break
        }

        if (!this.sprite || !this.isAlive) return
        
        // Перезарядка
        const reloadTime = Math.max(
            random(
                this.params.reloadMin,
                this.params.reloadMax,
                true, 
                true
            ) - (this.gameState.points / 100), 
            100
        )
        await this.timer.sleep(reloadTime)
        
        if (!this.sprite || !this.isAlive) return
        
        // Остановка ходьбы
        if (this.params.id === 'bossGun') {
            this.isWalking = false
            this.sprite.textures = this.animset.idle
            this.sprite.play()
        }

        this.shot()
    }
    
    /**
     * Обработка атаки босса-фургона
     */
    async handleBossVanAttack(fireTimes) {
        if (!this.sprite || !this.isAlive) return
        
        this.sprite.textures = this.animset.fromIdle
        this.sprite.play()
        await this.timer.sleep(200)
        
        if (!this.sprite || !this.isAlive) return
        
        this.sprite.textures = this.animset.shot
        this.sprite.play()

        this.eventBus.emit('bullet:shotRapid', {character: this, offsetX: 36, offsetY: 12, times: fireTimes})
        await this.timer.sleep(50)

        this.eventBus.emit('bullet:shotRapid', {character: this, offsetX: 34, offsetY: 40, times: fireTimes})
        await this.timer.sleep(100)

        this.eventBus.emit('bullet:shotRapid', {character: this, offsetX: 106, offsetY: 20, times: fireTimes})

        await this.timer.sleep(fireTimes * 200)
        
        if (!this.sprite || !this.isAlive) return
        
        this.sprite.textures = this.animset.toIdle
        this.sprite.play()
        await this.timer.sleep(200)
        
        if (!this.sprite || !this.isAlive) return
        
        this.sprite.textures = this.animset.idle
        this.sprite.play()
    }
    
    /**
     * Обработка атаки босса с винтовкой
     */
    async handleBossGunAttack(fireTimes) {
        if (!this.sprite || !this.isAlive) return

        this.eventBus.emit('bullet:shotRapid', {character: this, offsetX: 6, offsetY: 14, times: fireTimes})
        
        if (this.params.walk && this.isAlive) {
            this.isWalking = true
            this.sprite.textures = this.animset.walk
            this.sprite.play()
        }

        await this.timer.sleep(fireTimes * 200)
    }
    
    /**
     * Обработка атаки босса с SMG
     */
    async handleBossSmgAttack(fireTimes) {
        if (!this.sprite || !this.isAlive) return
        
        this.shotAnim(fireTimes)

        this.eventBus.emit('bullet:shotRapid', {character: this, offsetX: 0, offsetY: -2, times: fireTimes, cd: 150})

        await this.timer.sleep(fireTimes * 150)
    }
    
    /**
     * Обработка атаки босса с гранатометом
     */
    async handleBossLauncherAttack(fireTimes) {
        if (!this.sprite || !this.isAlive) return

        this.shotAnim(fireTimes)
        
        // if (this.shotGrenadeCallback) {
        //     this.shotGrenadeCallback(this.sprite, 0, 0)
        // }
        
        await this.timer.sleep(200)
    }
    
    /**
     * Награда за победу над боссом
     */
    bossReward() {
        if (!this.hud || !this.activeItems || !this.menuIcons || !this.textStyles) {
            console.warn('Required resources not available for boss reward')
            return
        }
        
        const rewardContainer = new PIXI.Container()
        const rand = random(1, 3)
        let icon
        let text
        
        switch (rand) {
            case 1:
                icon = new PIXI.Sprite(this.activeItems.textures.stimpack)
                text = new PIXI.Text('+1', this.textStyles.default80)
                icon.scale.set(2)
                if (this.storage) {
                    this.storage.activeItems.stimpack += 1
                }
                if (this.HUDupdateSkillsCallback) {
                    this.HUDupdateSkillsCallback()
                }
                break
            case 2:
                icon = new PIXI.Sprite(this.activeItems.textures.handGrenadeIcon)
                text = new PIXI.Text('+1', this.textStyles.default80)
                icon.scale.set(1.5)
                if (this.storage) {
                    this.storage.activeItems.grenades += 1
                }
                if (this.HUDupdateSkillsCallback) {
                    this.HUDupdateSkillsCallback()
                }
                break
            case 3:
                icon = new PIXI.Sprite(this.menuIcons.textures.money)
                text = new PIXI.Text('+500', this.textStyles.default80)
                icon.scale.set(1.5)
                this.gameState.collectedMoney += 500
                break
        }
        
        icon.anchor.set(0.5)
        text.anchor.set(0.5)
        icon.position.set(0, 0)
        text.position.set(0, icon.y + icon.height / 2 + 30)
        rewardContainer.addChild(icon)
        rewardContainer.addChild(text)
        rewardContainer.position.set(this.gameWidth / 2, this.gameHeight / 2)
        
        this.hud.addChild(rewardContainer)
        
        const move = setInterval(() => {
            rewardContainer.position.y -= 1
            rewardContainer.alpha -= 0.01
            if (rewardContainer.alpha <= 0) {
                clearInterval(move)
                if (this.hud) {
                    this.hud.removeChild(rewardContainer)
                }
            }
        }, 10)
    }

    shotAnim(times) {
        this.sprite.textures = this.animset.shot
        this.sprite.play()
        this.timer.sleep(times * 200).then(() => {
            if (!this.isAlive) return
            this.sprite.textures = this.animset.idle
            this.sprite.play()
        })
    }

    handleMelee() {
        this.skip = true
    }

    getDetectRange() {
        return getPercent(this.worldCoords.worldWidth, this.params.detectRange)
    }

    isOutOfBounds() {
        const boss = this.sprite.getBounds()

        return boss.x + boss.width < 0
    }

    addToWorld() {
        this.world.addChild(this.sprite)
    }

    destroy() {
        if (this.sprite) {
            this.world.removeChild(this.sprite)
        }
        this.params = null
        this.sprite = null
    }
}
