import * as PIXI from "pixi.js";
import enemyParams from "../../enemyParams";
import {getPercent, random} from "../../utils/GameUtils";

export class Enemy {
    constructor(world, resources, worldCoords, sleep, gameState, eventBus) {
        this.world = world
        this.resources = resources
        this.worldCoords = worldCoords
        this.sleep = sleep
        this.gameState = gameState
        this.eventBus = eventBus

        this.sprite = null
        this.isAlive = true
        this.toDestroy = false
        this.seesBarrier = false
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

        if (canCover) {
            this.params.canCover = true
            this.params.inCover = true
            enemy.anchor.y = 0.7
            enemy.tint = 11776947
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

    activate(player) {
        if (!this.params.detect && !this.seesBarrier) {
            this.params.detect = true
            this.shot()
        }
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
            // this.sprite.tint = player.color
            this.sprite.anchor.y = 0.5
        }
        //prepare
        await this.sleep(Math.max(random(this.params.warningMin, this.params.warningMax, true, true) - (this.gameState.points / 100), 100))
        if (!this.isAlive) return
        warning.tint = 16711680
        //shoot
        await this.sleep(200)
        if (!this.isAlive) return
        this.world.removeChild(warning)

        if (this.params.longRange) {
            this.world.removeChild(this.params.longDetector)
        }

        const shotParams = {char: this.sprite, offsetX: this.params.offsetX || 0, offsetY: this.params.offsetY || 0, gun: this.params.gun}

        if (this.params.rapidFire) {
            const fireTimes = random(1, this.params.rapidFire)
            this.shotAnim(fireTimes)
            await this.shotRapid(shotParams, fireTimes, 100)
        } else {
            this.shotAnim(1)
            this.eventBus.emit('bullet:shot', shotParams)
            await this.sleep(200)
        }
        //reload
        if (this.params.canCover) {
            this.params.inCover = true
            this.sprite.tint = 11776947
            this.sprite.anchor.y = 0.7
        }
        await this.sleep(Math.max(random(this.params.reloadMin, this.params.reloadMax, true, true) - (this.gameState.points / 100), 200))
        if (!this.isAlive) return
        this.params.detect = false
    }

    shotRapid(params, times, cd) {
        const shotTime = cd ? cd :200
        const repeat = setInterval(() => {
            if (this.gameState.isPause) return
            if (!this.isAlive) return
            this.eventBus.emit('bullet:shot', params)
        }, shotTime)
        return new Promise(function(resolve) {
            this.sleep(times * shotTime).then(() => {
                clearInterval(repeat)
                resolve()
            })
        });
    }

    shotAnim(times) {
        this.sprite.textures = this.animset.shot
        this.sprite.play()
        this.sleep(times * 200).then(() => {
            if (!this.isAlive) return
            this.sprite.textures = this.animset.idle
            this.sprite.play()
        })
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

    setBarrier() {
        this.seesBarrier = true
    }

    getDetectRange() {
        return getPercent(this.worldCoords.worldWidth, this.params.detectRange)
    }
}