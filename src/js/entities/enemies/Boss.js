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
import {getPercent, random} from '../../utils/GameUtils.js'
import enemyParams from "../../enemyParams";
import {soundPlayer} from "../../playSound";

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
           this.activate()
        })

        eventBus.on('boss:create', ({pos, type}) => {
            this.create(pos, type)
        })
    }

    create(pos = null, bossType = null) {
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
        switch (randType) {
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
            this.eventBus.emit('wall:createInClub', {pos: randomPos - (this.worldCoords.worldWidth / 1.8), type: 0, forBoss: this})
        } else {
            this.eventBus.emit('wall:create', {pos: randomPos - (this.worldCoords.worldWidth / 1.8), forBoss: this})
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
        if (!this.isAlive) return
        this.shot()
    }

    update(gameSpeed) {
        if (!this.sprite) return

        if (this.isWalking && this.isAlive) {
            this.sprite.x -= 0.5 * gameSpeed
        }
        
        // Удаление босса за левой границей
        if (this.isOutOfBounds()) {
            this.clear()
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

        this.activate()
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

        soundPlayer.gunShot('grenade')

        this.eventBus.emit('bullet:shotGrenade', {character: this.sprite, offsetX:0, offsetY: 0})
        
        await this.timer.sleep(200)
    }

    damage(source) {
        if (!this.isAlive) return

        this.params.health -= source.damage

        this.gameState.increaseStreak(0.5)
        this.gameState.addPoints(5)

        if (this.params.id === 'bossSmg') {
            soundPlayer.damageFlesh()
        } else {
            soundPlayer.damageMetal()
        }

        const particleType = this.params.id === 'bossSmg' ? 'blood' : 'spark'

        for (let i = 0; i < random(8, 20); i++) {
            this.eventBus.emit('particle:default', {coords: this.sprite, type: particleType, floor: this.sprite.y === this.worldCoords.secondFloor})
        }

        // Смерть
        if (this.params.health <= 0) {
            this.death()
        }

    }

    death() {
        if (this.params.warning) {
            this.world.removeChild(this.params.warning)
        }

        // Взрывы при смерти
        if (this.params.deathType) {
            switch (this.params.deathType) {
                case 'smallExplode':
                    this.eventBus.emit('explode:create', {target: this.sprite, offsetX: 0, offsetY: 0, isBig: false})
                    break
                case 'bigExplode':
                    this.eventBus.emit('explode:create', {target: this.sprite, offsetX: -28, offsetY: -24, isBig: true})
                    break
            }
        }

        this.eventBus.emit('camera:shake', {intensity: 1, duration: 400})

        this.isAlive = false

        this.gameState.increaseStreak(this.params.points / 10)
        this.gameState.addPoints(this.params.points + 10)

        this.sprite.loop = false

        // Критический урон
        this.sprite.textures = this.animset.deathCrit || this.animset.death

        for (let i = 0; i < random(8, 20); i++) {
            this.eventBus.emit('particle:default', {coords: this.sprite, type: 'blood', floor: this.sprite.y === this.worldCoords.secondFloor})
        }

        this.sprite.play()
        this.bossReward()

    }
    
    /**
     * Награда за победу над боссом
     */
    bossReward() {
        const rand = random(1, 3)

        this.eventBus.emit('hud:bossReward', rand)
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

    hasActiveBoss() {
        return !!(this.sprite && this.isAlive)
    }

    getBoss() {
        return this.sprite
    }

    clear() {
        this.world.removeChild(this.sprite)
        this.sprite = null
        this.isAlive = true
        this.params = null
        this.animset = null
        this.skip = false
        this.isWalking = false
    }
}
