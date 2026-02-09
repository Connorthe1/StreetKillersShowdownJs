/**
 * Bullet.js
 * 
 * Классы и менеджер для пуль
 * 
 * Содержит:
 * - Класс Bullet (базовый класс для пуль)
 * - Класс PlayerBullet (пули игрока)
 * - Класс EnemyBullet (пули врагов)
 * - Класс BulletManager (управление всеми пулями)
 * - Методы: spawnBullet(), updateBullets(), shot()
 * - Логика движения пуль
 * - Обработка столкновений и удаления пуль
 */

import * as PIXI from 'pixi.js'
import { getPercent } from '../utils/GameUtils.js'
import { BULLET_SPEED } from '../core/GameConfig.js'
import {soundPlayer} from "../playSound";

/**
 * Менеджер для управления пулями
 */
export class BulletManager {
    constructor(world, gameState, resources, timer, eventBus) {
        this.world = world
        this.gameState = gameState
        this.resources = resources
        this.timer = timer
        this.eventBus = eventBus

        // Массивы пуль
        this.playerBullets = []
        this.enemyBullets = []
        this.shotsArr = [] // Анимации выстрелов
        this.grenadesArr = []
        
        this.bulletSpeed = BULLET_SPEED

        eventBus.on('bullet:shot', ({character, offsetX, offsetY, friendly}) => {
            this.shot(character, offsetX, offsetY, friendly)
        })

        eventBus.on('bullet:shotRapid', ({character, offsetX, offsetY, friendly, times, cd}) => {
            this.shotRapid(character, offsetX, offsetY, friendly, times, cd)
        })
    }

    spawnBullet(x, y, char, isFriendly) {
        const bullet = new PIXI.Sprite(this.resources.particles.textures.bullet)

        const gunParams = char.gun || char.params

        bullet.anchor.set(0.5)
        bullet.zIndex = 11
        bullet.scale.x = 1.5
        bullet.scale.y = 2
        bullet.position.set(!isFriendly ? x - 14 : x + 14, y)

        // Применение эффекта пауэр-апа
        if (isFriendly && char.activePowerUps.some(item => item.type === 'boostGun')) {
            bullet.tint = 16731469
        }
        
        // Угол полета пули
        let rotate = Math.random() * (gunParams.angle ?? 0.4)
        rotate *= Math.round(Math.random()) ? 1 : -1
        bullet.rotation = rotate
        
        this.world.addChild(bullet)
        
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
        
        const createdBullets = []
        
        if (friendly) {
            // Пули игрока
            if (character.activePowerUps.some(item => item.type === 'boostGun')) {
                shot.tint = 16757683
            }
            shot.position.set(character.sprite.x + offsetX, character.sprite.y - offsetY)
            
            if (character.gun?.noStop) {
                this.shotsArr.push(shot)
                this.timer.sleep(150).then(() => {
                    this.shotsArr.splice(0, 1)
                })
            }
            
            // Создание пуль (для дробовика - 3 пули)
            const bulletCount = gunType === 'shotgun' ? 3 : 1
            for (let i = 0; i < bulletCount; i++) {
                const bullet = this.spawnBullet(
                    shot.x - 10,
                    shot.y,
                    character,
                    friendly
                )
                if (bullet) createdBullets.push(bullet)
            }
        } else {
            // Пули врага
            shot.position.set(((character.sprite.x + 4) - character.sprite.width / 2) + offsetX, (character.sprite.y - 10) + offsetY)
            
            const bulletCount = gunType === 'shotgun' ? 3 : 1
            for (let i = 0; i < bulletCount; i++) {
                const bullet = this.spawnBullet(
                    shot.x + 10,
                    shot.y,
                    character,
                    friendly,
                )
                if (bullet) createdBullets.push(bullet)
            }
        }
        
        // Создание отскакивающей частицы (гильза)
        if (gunType !== 'shotgun' && gunType !== 'revolver') {
            this.eventBus.emit('particle:bounce', { coords: character.sprite, type: 'shell' })
        }

        this.world.addChild(shot)
        shot.play()

        this.timer.sleep(150).then(() => {
            this.world.removeChild(shot)
        })

        return createdBullets
    }

    shotGrenade(character, offsetX, offsetY) {
        const grenade = new PIXI.Sprite(this.resources.bounceParticlesTexture.textures.grenade)
        grenade.scale.set(-1.5)
        grenade.position.set(character.sprite.x + offsetX, character.sprite.y - offsetY)
        grenade.lifeTime = 100
        grenade.type = 'grenade'

        grenade.body = Matter.Bodies.rectangle(grenade.x, grenade.y, 12, 4, {isStatic: false, restitution: 0.5});
        this.world.addChild(grenade)

        Matter.World.add(this.engine.world, grenade.body);
        let randomMassX = Math.random() * (0.2 - 0.1) + 0.1
        Matter.Body.applyForce(grenade.body, grenade.body.position, {x: -randomMassX / 100, y: -0.0005});

        this.grenadesArr.push(grenade)
    }

    updateBullets(worldCoords, gameSpeed) {
        // Обновление пуль врагов
        this.enemyBullets.forEach((b, idx) => {
            b.position.x -= (Math.cos(b.rotation) * this.bulletSpeed) * gameSpeed
            b.position.y -= (Math.sin(b.rotation) * this.bulletSpeed) * gameSpeed
            
            if (b.position.x < worldCoords.zeroLeft + 50 || b.position.x > worldCoords.zeroRight + 100) {
                // Создание частиц при исчезновении
                for (let i = 0; i <= 3; i++) {
                    this.eventBus.emit('particle:default', { coords: b, type: 'spark', floor: undefined, size: 1 })
                }
                this.world.removeChild(b)
                this.enemyBullets.splice(idx, 1)
            }
        })
        
        // Обновление пуль игрока
        this.playerBullets.forEach((b, idx) => {
            b.position.x += (Math.cos(b.rotation) * this.bulletSpeed) * gameSpeed
            b.position.y += (Math.sin(b.rotation) * this.bulletSpeed) * gameSpeed
            
            if (b.position.x < worldCoords.zeroLeft || b.x - b.width * 2 > worldCoords.zeroLeft + getPercent(worldCoords.worldWidth, 90)) {
                this.world.removeChild(b)
                this.gameState.decreaseStreak(0.5)
                // Создание частиц при исчезновении
                for (let i = 0; i <= 3; i++) {
                    this.eventBus.emit('particle:default', { coords: b, type: 'spark', floor: undefined, size: 1 })
                }
                this.playerBullets.splice(idx, 1)
            }
        })

        // this.grenadesArr.forEach((g, idx) => {
        //     if (g.dead) return
        //     if ((player.x + 40 > b.x && b.x + b.width > player.x) && playerState.state === 'shot' && b.body.speed > 2) {
        //         activateGrenade(b, idx, true)
        //         return
        //     }
        //     g.lifeTime--
        //     if (g.lifeTime <= 0) {
        //         g.dead = true
        //         activateGrenade(b, idx)
        //         return
        //     }
        //     g.position = b.body.position
        //     g.rotation = b.body.angle
        // })
        
        // Обновление анимаций выстрелов
        if (this.shotsArr.length > 0) {
            this.shotsArr.forEach(item => {
                // item.x += (playerSpeed / 2)
                // Анимации выстрелов двигаются вместе с игроком
                // (обновляется в ticker через playerSpeed)
            })
        }
    }

    // async function activateGrenade(grenade,idx, now) {
    //     if (now) {
    //         damagePlayer()
    //         createExplode(grenade, 0, 0, false)
    //         Matter.World.remove(engine.world, grenade.body)
    //         world.removeChild(grenade)
    //         grenades.splice(idx, 1)
    //         return
    //     }
    //     const warning = new PIXI.Sprite(particles.textures.detection)
    //     warning.zIndex = 20
    //     warning.anchor.set(0.5)
    //     warning.tint = 16776960
    //     warning.scale.x = 1.5
    //     warning.scale.y = 2
    //     warning.position.set(grenade.x, grenade.y - 40)
    //     world.addChild(warning)
    //     await sleep(300)
    //     warning.tint = 16711680
    //     await sleep(200)
    //     if (playerState.state === 'shot') {
    //         damagePlayer()
    //     }
    //     createExplode(grenade, 0, 0)
    //     Matter.World.remove(engine.world, grenade.body)
    //     world.removeChild(warning)
    //     world.removeChild(grenade)
    //     grenades.splice(idx, 1)
    // }



    /**
     * Очищает все пули
     */
    clear() {
        this.playerBullets.forEach(bullet => {
            this.world.removeChild(bullet)
        })
        this.playerBullets = []
        
        this.enemyBullets.forEach(bullet => {
            this.world.removeChild(bullet)
        })
        this.enemyBullets = []
        
        this.shotsArr.forEach(shot => {
            this.world.removeChild(shot)
        })
        this.shotsArr = []
    }
    
    /**
     * Получает массивы пуль (для обратной совместимости)
     */
    getBulletArrays() {
        return {
            playerBullets: this.playerBullets,
            enemyBullets: this.enemyBullets,
            shotsArr: this.shotsArr
        }
    }
}
