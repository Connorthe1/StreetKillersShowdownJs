import * as PIXI from "pixi.js";
import enemyParams from "../../enemyParams";
import {getPercent, random} from "../../utils/GameUtils";
import {soundPlayer} from "../../playSound";

export class Enemy {
    constructor(world, resources, worldCoords, timer, gameState, eventBus) {
        this.world = world
        this.resources = resources
        this.worldCoords = worldCoords
        this.timer = timer
        this.gameState = gameState
        this.eventBus = eventBus

        this.sprite = null
        this.isAlive = true
        this.toDestroy = false
        this.seesBarrier = false
        this.skip = false
        this.params = {}
        this.animset = {}
    }

    create(pos, canCover, enemyType) {
        const enemy = new PIXI.AnimatedSprite(this.resources.enemiesTexture.animations[`${enemyType}Idle`])
        enemy.anchor.set(0.5)

        if (enemyParams[enemyType]) {
            Object.keys(enemyParams[enemyType]).forEach(item => {
                this.params[item] = enemyParams[enemyType][item]
            })
        }

        this.animset.idle = this.resources.enemiesTexture.animations[`${enemyType}Idle`]
        this.animset.shot = this.resources.enemiesTexture.animations[`${enemyType}Shot`]
        this.animset.death = this.resources.enemiesTexture.animations[`${enemyType}Death`]
        this.animset.deathCrit = this.resources.enemiesTexture.animations[`${enemyType}DeathCrit`]

        if (this.params.shield) {
            this.animset.idleAlt = this.resources.enemiesTexture.animations[`${enemyType}IdleAlt`]
            this.animset.shotAlt = this.resources.enemiesTexture.animations[`${enemyType}ShotAlt`]
            this.animset.knock = this.resources.enemiesTexture.animations[`${enemyType}Knock`]
        }

        this.params.color = enemy.tint
        this.params.shadow = 11776947

        if (canCover) {
            this.params.canCover = true
            this.params.inCover = true
            enemy.anchor.y = 0.7
            enemy.tint = this.params.shadow
        }

        enemy.scale.set(2)
        enemy.animationSpeed = 0.2
        enemy.zIndex = 8
        enemy.position.set(pos.x, pos.y)
        enemy.play()

        this.sprite = enemy
        this.addToWorld()

        return this
    }

    activate() {
        if (!this.params.detect && !this.seesBarrier && !this.skip && this.isAlive) {
            this.params.detect = true
            this.shot()
        }
    }

    handleMelee() {
        this.skip = true
    }

    async shot() {
        const warning = new PIXI.Sprite(this.resources.particles.textures.detection)
        warning.zIndex = 20
        warning.anchor.set(0.5)
        warning.tint = 16776960
        warning.scale.x = 1.5
        warning.scale.y = 2
        warning.position.set(this.sprite.x, this.sprite.y - 40)
        this.params.warning = warning
        if (this.params.longRange) {
            const longDetector = PIXI.Sprite.from(PIXI.Texture.WHITE);
            longDetector.zIndex = 20
            longDetector.anchor.set(1)
            longDetector.tint = 16711680
            longDetector.scale.x = 14
            longDetector.scale.y = 0.1
            longDetector.position.set(this.sprite.x - this.sprite.width / 2 + 10, this.sprite.y - 6)
            this.params.longDetector = longDetector
            this.world.addChild(longDetector)
        }
        this.world.addChild(warning)

        if (this.params.canCover) {
            this.params.inCover = false
            this.sprite.tint = this.params.color
            this.sprite.anchor.y = 0.5
        }
        //prepare
        await this.timer.sleep(Math.max(random(this.params.warningMin, this.params.warningMax, true, true) - (this.gameState.points / 100), 100))
        if (!this.isAlive) return
        warning.tint = 16711680
        //shoot
        await this.timer.sleep(200)
        if (!this.isAlive) return
        this.world.removeChild(warning)

        if (this.params.longRange) {
            this.world.removeChild(this.params.longDetector)
        }

        const shotParams = {character: this, offsetX: this.params.offsetX || 0, offsetY: this.params.offsetY || 0}

        if (this.params.rapidFire) {
            const fireTimes = random(1, this.params.rapidFire)
            this.shotAnim(fireTimes)
            this.shotRapid(shotParams, fireTimes, 100)
            await this.timer.sleep(100 * fireTimes)
        } else {
            this.shotAnim(1)
            this.eventBus.emit('bullet:shot', shotParams)
            await this.timer.sleep(200)
        }
        //reload
        if (this.params.canCover) {
            this.params.inCover = true
            this.sprite.tint = this.params.shadow
            this.sprite.anchor.y = 0.7
        }
        await this.timer.sleep(Math.max(random(this.params.reloadMin, this.params.reloadMax, true, true) - (this.gameState.points / 100), 200))
        if (!this.isAlive) return
        this.params.detect = false
    }

    async shotRapid(params, times, cd) {
        const rapidParams = {
            ...params,
            times,
            cd
        }
        this.eventBus.emit('bullet:shotRapid', rapidParams)
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

    damage(source) {
        if (!this.isAlive) return

        const isBullet = !!source.owner
        const inCritZone = isBullet && this.sprite.x - source.owner.sprite.x < getPercent(this.worldCoords.worldWidth, 50)
        const damage = inCritZone ? source.damage * 2 : source.damage

        this.params.health -= damage

        console.log('damage:', damage, 'hp:', this.params.health)

        this.gameState.increaseStreak(0.5)
        this.gameState.addPoints(5)

        // Звуки
        if (this.params.shield && !this.params.knocked) {
            soundPlayer.damageMetal()
        } else {
            soundPlayer.damageFlesh()
        }

        // Частицы
        const particleType = this.params.shield && !this.params.knocked ? 'spark' : 'blood'
        for (let i = 0; i < random(8, 20); i++) {
            this.eventBus.emit('particle:default', {coords: this.sprite, type: particleType, floor: this.sprite.y === this.worldCoords.secondFloor})
        }


        // Смерть
        if (this.params.health <= 0) {
            const isCrit = isBullet ? damage > source.owner.gun.damage : damage > 2
            this.death(isCrit)
            return
        }

        // Обработка щита
        if (this.params.shield && !this.params.knocked && this.params.health <= 2) {
            this.params.knocked = true
            this.textures = this.animset.knock
            this.sprite.play()
            this.animset.idle = this.animset.idleAlt
            this.animset.shot = this.animset.shotAlt

            this.timer.sleep(150).then(() => {
                if (this.params.health <= 0) return
                this.sprite.textures = this.animset.idle
                this.sprite.play()
            })
        }
    }

    /**
     * Обрабатывает смерть врага
     */
    death(isCrit) {
        // Удаление предупреждений
        if (this.params.warning) {
            this.world.removeChild(this.params.warning)
        }
        if (this.params.longDetector) {
            this.world.removeChild(this.params.longDetector)
        }

        // Тряска камеры
        this.eventBus.emit('camera:shake', {intensity: 1, duration: 400})

        this.isAlive = false

        this.gameState.increaseStreak(this.params.points / 10)
        this.gameState.addPoints(this.params.points)
        this.gameState.addKills(1)

        this.sprite.loop = false

        // Критический урон
        if (isCrit) {
            this.gameState.addPoints(10)

            this.sprite.textures = this.animset.deathCrit || this.animset.death

            for (let i = 0; i < random(8, 20); i++) {
                this.eventBus.emit('particle:default', {coords: this.sprite, type: 'blood', floor: this.sprite.y === this.worldCoords.secondFloor})
            }
        } else {
            this.sprite.textures = this.animset.death
        }

        if (this.params.moneyDrop) {
            for (let i = 0; i <= random(0, this.params.moneyDrop); i++) {
                this.eventBus.emit('money:drop', this.sprite)
            }
        }

        this.sprite.play()
    }

    update() {
        if (this.toDestroy) return

        if (this.isOutOfBounds()) {
            this.destroy()
        }
    }

    isOutOfBounds() {
        const enemy = this.sprite.getBounds()

        return enemy.x + enemy.width < 0
    }

    destroy() {
        this.world.removeChild(this.sprite)
        this.toDestroy = true
    }

    addToWorld() {
        this.world.addChild(this.sprite)
    }

    setBarrier(value) {
        this.seesBarrier = value
    }

    getDetectRange() {
        return getPercent(this.worldCoords.worldWidth, this.params.detectRange)
    }
}