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
import { random } from '../utils/GameUtils.js'
import enemyParams from "../enemyParams";

/**
 * Менеджер боссов
 */
export class BossManager {
    constructor(world, gameState, worldCoords, resources, sleep, eventBus) {
        this.world = world
        this.gameState = gameState
        this.worldCoords = worldCoords
        this.resources = resources
        this.eventBus = eventBus
        this.sleep = sleep

        // Текущий босс
        this.currentBoss = null
    }

    createBoss(bossType = null, pos = null) {
        if (this.currentBoss) return

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
        
        boss.params = {
            animset: bossTextureSet.animations
        }
        
        // Копирование параметров
        if (enemyParams[type]) {
            Object.keys(enemyParams[type]).forEach(item => {
                boss.params[item] = enemyParams[type][item]
            })
        }
        
        boss.zIndex = 10
        boss.type = type
        this.currentBoss = boss

        this.world.addChild(boss)
        boss.play()
    }
    
    /**
     * Обновляет босса
     * @param {number} gameSpeed - скорость игры
     */
    updateBoss(gameSpeed) {
        if (!this.currentBoss) return
        
        // Удаление босса за левой границей
        if (this.currentBoss.x + this.currentBoss.width < this.zeroLeft) {
            if (this.world) {
                this.world.removeChild(this.currentBoss)
            }
            this.currentBoss = null
            return
        }
        
        // Проверка смерти босса
        if (this.currentBoss.params.dead) {
            if (this.playerState) {
                this.playerState.inBossFight = false
            }
            return
        }
        
        // Обнаружение игрока
        if (!this.currentBoss.params.detect && this.player) {
            if (this.currentBoss.x - this.player.x < this.WORLD_WIDTH) {
                this.currentBoss.params.detect = true
                this.bossShooting()
            }
        }
        
        // Ближний бой с боссом
        if (!this.currentBoss.skip && 
            this.currentBoss.params.melee && 
            this.player && 
            this.player.x + 20 > this.currentBoss.x) {
            this.currentBoss.skip = true
            if (this.playerState) {
                this.playerState.inBossFight = false
            }
            if (this.damagePlayerCallback) {
                this.damagePlayerCallback()
            }
        }
        
        // Проверка коллизии с пулями игрока
        if (this.playerBullets && this.player) {
            this.playerBullets.forEach((bullet, idx) => {
                const b = bullet.getBounds ? bullet.getBounds() : bullet
                const boss = this.currentBoss.getBounds ? this.currentBoss.getBounds() : this.currentBoss
                
                if (b.x + b.width > boss.x && 
                    boss.x + boss.width > b.x && 
                    b.y + b.height > boss.y && 
                    boss.y + boss.height > b.y) {
                    
                    if (this.world) {
                        this.world.removeChild(bullet)
                    }
                    this.playerBullets.splice(idx, 1)
                    
                    if (this.damageEnemyCallback && this.gun) {
                        const damage = this.currentBoss.x - this.player.x < 200 ? 
                            this.gun.damage * 2 : this.gun.damage
                        this.damageEnemyCallback(
                            this.currentBoss, 
                            damage, 
                            this.currentBoss.type !== 'bossSmg'
                        )
                    }
                }
            })
        }
    }
    
    /**
     * Стрельба босса (асинхронная функция)
     */
    async bossShooting() {
        if (!this.currentBoss || !this.particles || !this.sleepCallback) return
        
        // Создание предупреждения
        const warning = new PIXI.Sprite(this.particles.textures.detection)
        warning.zIndex = 20
        warning.anchor.set(0.5)
        warning.tint = 16776960
        warning.scale.x = 1.5
        warning.scale.y = 2
        warning.position.set(this.currentBoss.x, this.currentBoss.y - 40)
        this.currentBoss.params.warning = warning
        
        if (this.world) {
            this.world.addChild(warning)
        }
        
        let fireTimes = 1
        if (this.currentBoss.params.rapidFire) {
            fireTimes = Math.floor(Math.random() * (this.currentBoss.params.rapidFire - 1 + 1)) + 1
        }
        
        let walking = null
        
        // Подготовка
        const warningTime = Math.max(
            random(
                this.currentBoss.params.warningMin, 
                this.currentBoss.params.warningMax, 
                true, 
                true
            ) - (this.gameState.points / 100), 
            100
        )
        await this.sleepCallback(warningTime)
        
        if (!this.currentBoss || this.currentBoss.params.dead) return
        
        warning.tint = 16711680
        
        // Выстрел
        await this.sleepCallback(200)
        
        if (this.world) {
            this.world.removeChild(warning)
        }
        
        if (!this.currentBoss || this.currentBoss.params.dead) return
        
        // Разные паттерны атак для разных типов боссов
        switch (this.currentBoss.type) {
            case 'bossVan':
                await this.handleBossVanAttack(fireTimes)
                break
            case 'bossGun':
                await this.handleBossGunAttack(fireTimes, () => { walking = this.startBossWalking() })
                if (walking) {
                    this.walkingInterval = walking
                }
                break
            case 'bossSmg':
                await this.handleBossSmgAttack(fireTimes)
                break
            case 'bossLauncher':
                await this.handleBossLauncherAttack(fireTimes)
                break
        }
        
        // Перезарядка
        const reloadTime = Math.max(
            random(
                this.currentBoss.params.reloadMin, 
                this.currentBoss.params.reloadMax, 
                true, 
                true
            ) - (this.gameState.points / 100), 
            100
        )
        await this.sleepCallback(reloadTime)
        
        if (!this.currentBoss || this.currentBoss.params.dead) return
        
        // Остановка ходьбы
        if (this.walkingInterval) {
            clearInterval(this.walkingInterval)
            this.walkingInterval = null
            if (this.currentBoss && !this.currentBoss.params.dead) {
                this.currentBoss.textures = this.currentBoss.params.animset.idle
                this.currentBoss.play()
            }
        }
        
        // Рекурсивный вызов для следующего цикла стрельбы
        if (this.currentBoss && !this.currentBoss.params.dead) {
            this.bossShooting()
        }
    }
    
    /**
     * Обработка атаки босса-фургона
     */
    async handleBossVanAttack(fireTimes) {
        if (!this.currentBoss || this.currentBoss.params.dead) return
        
        this.currentBoss.textures = this.currentBoss.params.animset.fromIdle
        this.currentBoss.play()
        await this.sleepCallback(200)
        
        if (!this.currentBoss || this.currentBoss.params.dead) return
        
        this.currentBoss.textures = this.currentBoss.params.animset.shot
        this.currentBoss.play()
        
        if (this.shotRapidCallback) {
            this.shotRapidCallback(this.currentBoss, 36, 12, fireTimes, 'smg')
            await this.sleepCallback(50)
            this.shotRapidCallback(this.currentBoss, 34, 40, fireTimes, 'smg')
            await this.sleepCallback(100)
            await this.shotRapidCallback(this.currentBoss, 106, 20, fireTimes, 'smg')
        }
        
        if (!this.currentBoss || this.currentBoss.params.dead) return
        
        this.currentBoss.textures = this.currentBoss.params.animset.toIdle
        this.currentBoss.play()
        await this.sleepCallback(200)
        
        if (!this.currentBoss || this.currentBoss.params.dead) return
        
        this.currentBoss.textures = this.currentBoss.params.animset.idle
        this.currentBoss.play()
    }
    
    /**
     * Обработка атаки босса с винтовкой
     */
    async handleBossGunAttack(fireTimes, setWalkingCallback) {
        if (!this.currentBoss || this.currentBoss.params.dead) return
        
        if (this.enemyShotAnimCallback) {
            this.enemyShotAnimCallback(this.currentBoss, fireTimes)
        }
        
        if (this.shotRapidCallback) {
            await this.shotRapidCallback(this.currentBoss, 6, 14, fireTimes, 'rifle')
        }
        
        await this.sleepCallback(100)
        
        if (this.currentBoss.params.walk && !this.currentBoss.params.dead) {
            this.currentBoss.textures = this.currentBoss.params.animset.walk
            this.currentBoss.play()
            if (setWalkingCallback) {
                setWalkingCallback()
            }
        }
    }
    
    /**
     * Обработка атаки босса с SMG
     */
    async handleBossSmgAttack(fireTimes) {
        if (!this.currentBoss || this.currentBoss.params.dead) return
        
        if (this.enemyShotAnimCallback) {
            this.enemyShotAnimCallback(this.currentBoss, fireTimes)
        }
        
        if (this.shotRapidCallback) {
            await this.shotRapidCallback(this.currentBoss, 0, -2, fireTimes, 'smg', 150)
        }
    }
    
    /**
     * Обработка атаки босса с гранатометом
     */
    async handleBossLauncherAttack(fireTimes) {
        if (!this.currentBoss || this.currentBoss.params.dead) return
        
        if (this.enemyShotAnimCallback) {
            this.enemyShotAnimCallback(this.currentBoss, fireTimes)
        }
        
        if (this.shotGrenadeCallback) {
            this.shotGrenadeCallback(this.currentBoss, 0, 0)
        }
        
        await this.sleepCallback(200)
    }
    
    /**
     * Запускает ходьбу босса
     */
    startBossWalking() {
        if (!this.currentBoss || this.currentBoss.params.dead) return null
        
        return setInterval(() => {
            if (this.gameState.isPause) return
            if (!this.currentBoss || this.currentBoss.params.dead) {
                if (this.walkingInterval) {
                    clearInterval(this.walkingInterval)
                    this.walkingInterval = null
                }
                return
            }
            this.currentBoss.x -= 1
        }, 10)
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
    
    /**
     * Получает текущего босса
     */
    getCurrentBoss() {
        return this.currentBoss
    }

    clear() {
        if (this.walkingInterval) {
            clearInterval(this.walkingInterval)
            this.walkingInterval = null
        }
        
        if (this.currentBoss && this.world) {
            this.world.removeChild(this.currentBoss)
        }
        this.currentBoss = null
    }
}
