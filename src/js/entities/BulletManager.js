/**
 * BulletManager.js
 *
 * Менеджер пуль (по аналогии с EnemyManager).
 * Управляет массивами пуль, спавном через spawnBullet, обновлением и очисткой.
 */

import * as PIXI from 'pixi.js'
import { Bullet } from './Bullet.js'
import { BULLET_SPEED } from '../core/GameConfig.js'
import { soundPlayer } from '../playSound.js'

export class BulletManager {
    constructor(world, gameState, resources, timer, eventBus) {
        this.world = world
        this.gameState = gameState
        this.resources = resources
        this.timer = timer
        this.eventBus = eventBus

        this.playerBullets = []
        this.enemyBullets = []
        this.shotsArr = []
        this.grenadesArr = []

        this.bulletSpeed = BULLET_SPEED

        eventBus.on('bullet:shot', ({ character, offsetX, offsetY, friendly }) => {
            this.shot(character, offsetX, offsetY, friendly)
        })

        eventBus.on('bullet:shotRapid', ({ character, offsetX, offsetY, friendly, times, cd }) => {
            this.shotRapid(character, offsetX, offsetY, friendly, times, cd)
        })
    }

    /**
     * Создаёт инстанс Bullet и добавляет в массив playerBullets или enemyBullets.
     */
    spawnBullet(x, y, char, isFriendly) {
        const bullet = new Bullet(
            this.world,
            this.resources,
            this.eventBus,
            this.gameState,
            this.bulletSpeed
        ).create(x, y, char, isFriendly)

        if (isFriendly) {
            this.playerBullets.push(bullet)
        } else {
            this.enemyBullets.push(bullet)
        }

        return bullet
    }

    async shotRapid(character, offsetX, offsetY, friendly = false, times, cd = 200) {
        for (let i = 0; i < times; i++) {
            this.shot(character, offsetX, offsetY, friendly)
            if (i < times - 1) {
                await this.timer.sleep(cd)
                if (this.gameState.isPause) return
                if (!character.isAlive) return
            }
        }
    }

    shot(character, offsetX, offsetY, friendly = false) {
        const shot = new PIXI.AnimatedSprite(this.resources.particles.animations.gunShot)
        shot.anchor.set(0.5)
        shot.scale.x = 1.2
        shot.scale.y = 1.2
        shot.animationSpeed = 0.2
        shot.zIndex = 11

        const gunType = character.gun?.type || character.params.type

        if (soundPlayer) {
            soundPlayer.gunShot(gunType, gunType === 'smg' || gunType === 'rifle')
        }

        if (friendly) {
            if (character.activePowerUps?.some(item => item.type === 'boostGun')) {
                shot.tint = 16757683
            }
            shot.position.set(character.sprite.x + offsetX, character.sprite.y - offsetY)

            if (character.gun?.noStop) {
                this.shotsArr.push(shot)
                this.timer.sleep(150).then(() => {
                    this.shotsArr.splice(0, 1)
                })
            }

            const bulletCount = gunType === 'shotgun' ? 3 : 1
            for (let i = 0; i < bulletCount; i++) {
                this.spawnBullet(shot.x - 10, shot.y, character, friendly)
            }
        } else {
            shot.position.set(
                character.sprite.x + 4 - character.sprite.width / 2 + offsetX,
                character.sprite.y - 10 + offsetY
            )

            const bulletCount = gunType === 'shotgun' ? 3 : 1
            for (let i = 0; i < bulletCount; i++) {
                this.spawnBullet(shot.x + 10, shot.y, character, friendly)
            }
        }

        if (gunType !== 'shotgun' && gunType !== 'revolver') {
            this.eventBus.emit('particle:bounce', { coords: character.sprite, type: 'shell' })
        }

        this.world.addChild(shot)
        shot.play()

        this.timer.sleep(150).then(() => {
            this.world.removeChild(shot)
        })
    }

    shotGrenade(character, offsetX, offsetY) {
        const grenade = new PIXI.Sprite(this.resources.bounceParticlesTexture.textures.grenade)
        grenade.scale.set(-1.5)
        grenade.position.set(character.sprite.x + offsetX, character.sprite.y - offsetY)
        grenade.lifeTime = 100
        grenade.type = 'grenade'

        grenade.body = Matter.Bodies.rectangle(grenade.x, grenade.y, 12, 4, {
            isStatic: false,
            restitution: 0.5
        })
        this.world.addChild(grenade)

        Matter.World.add(this.engine.world, grenade.body)
        const randomMassX = Math.random() * (0.2 - 0.1) + 0.1
        Matter.Body.applyForce(grenade.body, grenade.body.position, {
            x: -randomMassX / 100,
            y: -0.0005
        })

        this.grenadesArr.push(grenade)
    }

    updateBullets(worldCoords, gameSpeed) {
        this.enemyBullets.forEach(b => b.update(worldCoords, gameSpeed))
        this.enemyBullets = this.enemyBullets.filter(b => !b.toDestroy)

        this.playerBullets.forEach(b => b.update(worldCoords, gameSpeed))
        this.playerBullets = this.playerBullets.filter(b => !b.toDestroy)

        if (this.shotsArr.length > 0) {
            this.shotsArr.forEach(() => {})
        }
    }

    clear() {
        this.playerBullets.forEach(bullet => bullet.destroy())
        this.playerBullets = []

        this.enemyBullets.forEach(bullet => bullet.destroy())
        this.enemyBullets = []

        this.shotsArr.forEach(shot => {
            this.world.removeChild(shot)
        })
        this.shotsArr = []
    }
}
