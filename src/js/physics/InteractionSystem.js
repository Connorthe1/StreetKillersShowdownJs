export class InteractionSystem {
    update({ player, spawn, bullets, explosion, melee, zipLine, money }) {
        this.check(player, spawn.wallManager.walls, 'player:wall');
        this.check(player, spawn.trapManager.traps, 'player:trap');
        this.check(player, spawn.puddleManager.puddles, 'player:puddle');
        if (spawn.canManager.sprite) this.check(player, spawn.canManager, 'player:can');
        if (spawn.powerUpManager.sprite) this.check(player, spawn.powerUpManager, 'player:powerUp');
        this.check(spawn.trapManager.traps, spawn.enemyManager.enemies, 'trap:enemy');
        this.check(player, spawn.enemyManager.enemies, 'player:enemy');
        this.check(bullets.playerBullets, spawn.enemyManager.enemies, 'bullet:enemy');
        if (spawn.bossManager.isAlive && spawn.bossManager.sprite) this.check(bullets.playerBullets, spawn.bossManager, 'bullet:boss');
        this.check(bullets.enemyBullets, player, 'bullet:player');
        this.check(bullets.playerBullets, spawn.trapManager.traps, 'bullet:trap');
        this.check(bullets.grenadesArr, player, 'grenade:player');
        this.check(player, zipLine.zipLines, 'player:zipLine');
        this.check(player, money.moneyDrop, 'player:money');

        if (spawn.dogEnemyManager.sprite && spawn.dogEnemyManager.isAlive) this.check(bullets.playerBullets, spawn.dogEnemyManager, 'bullet:dog');
        if (spawn.dogEnemyManager.sprite && spawn.dogEnemyManager.isAlive) this.check(player, spawn.dogEnemyManager, 'player:dog');

        // Коллизии взрывов (квадратная зона) со всеми целями
        if (explosion.activeExplosion) {
            this.check(explosion.activeExplosion, player, 'explosion:player');
            this.check(explosion.activeExplosion, spawn.enemyManager.enemies, 'explosion:enemy');
            if (spawn.bossManager.sprite) this.check(explosion.activeExplosion, spawn.bossManager, 'explosion:boss');
            if (spawn.dogEnemyManager.sprite) this.check(explosion.activeExplosion, spawn.dogEnemyManager, 'explosion:dog');
            this.check(explosion.activeExplosion, spawn.trapManager.traps, 'explosion:trap');
            explosion.destroy()
        }
        if (melee.activeMelee) {
            this.check(melee.activeMelee, spawn.enemyManager.enemies, 'melee:enemy');
            if (spawn.bossManager.sprite) this.check(melee.activeMelee, spawn.bossManager, 'melee:boss');
            if (spawn.dogEnemyManager.sprite) this.check(melee.activeMelee, spawn.dogEnemyManager, 'melee:dog');
            melee.destroy()
        }
        if (spawn.canManager.sprite) {
            this.check(spawn.canManager, spawn.enemyManager.enemies, 'can:enemy');
            if (spawn.bossManager.sprite) this.check(spawn.canManager, spawn.bossManager, 'can:boss');
            if (spawn.dogEnemyManager.sprite) this.check(spawn.canManager, spawn.dogEnemyManager, 'can:dog');
            this.check(spawn.canManager, spawn.trapManager.traps, 'can:trap');
        }
    }

    check(a, b, event) {
        const aList = Array.isArray(a) ? a : [a];
        const bList = Array.isArray(b) ? b : [b];

        const collide = this.getCollideType(event)

        for (const a of aList) {
            for (const b of bList) {
                const collideResult = collide(a, b)
                if (collideResult) {
                    this.handle(event, a, b, collideResult);
                }
            }
        }
    }

    getCollideType(type) {
        switch (type) {
            case 'player:wall':
            case 'player:zipLine':
                return this.collideWall
            case 'player:puddle':
            case 'can:trap':
            case 'can:boss':
            case 'can:dog':
            case 'can:enemy':
                return this.collideXWidth
            case 'player:money':
            case 'player:can':
            case 'player:powerUp':
                return this.collideXFromPlayer
            case 'player:trap':
            case 'player:dog':
                return this.collideXFromStart
            case 'trap:enemy':
            case 'player:enemy':
                return this.collideWatch
            case 'bullet:enemy':
            case 'bullet:player':
            case 'bullet:boss':
            case 'bullet:trap':
            case 'bullet:dog':
            case 'grenade:player':
                return this.collideBullets
            case 'explosion:player':
            case 'explosion:enemy':
            case 'explosion:boss':
            case 'explosion:trap':
            case 'explosion:dog':
            case 'melee:boss':
            case 'melee:enemy':
            case 'melee:dog':
                return this.collideExplosionArea
        }
    }

    collideExplosionArea(explosion, target) {
        const targetBounds = target.sprite ? target.sprite.getBounds() : target.getBounds()

        if (targetBounds.left < explosion.right &&
            targetBounds.right > explosion.left &&
            targetBounds.bottom > explosion.top &&
            targetBounds.top < explosion.bottom) {
            return true
        }
    }

    collideBullets(bullet, target) {
        const bulletBounds = bullet.sprite ? bullet.sprite.getBounds() : bullet.getBounds()
        const targetBounds = target.sprite ? target.sprite.getBounds() : target.getBounds()

        if ((bulletBounds.x > targetBounds.left + 20 || bulletBounds.x + bulletBounds.width > targetBounds.left + 20) &&
            bulletBounds.x < targetBounds.right &&
            bulletBounds.y + 10 > targetBounds.top &&
            bulletBounds.y - 10 < targetBounds.bottom) {
            return true
        }
    }

    collideXFromPlayer(a, b) {
        const aBounds = a.sprite ? a.sprite.getBounds() : a.getBounds()
        const bBounds = b.sprite ? b.sprite.getBounds() : b.getBounds()

        if (aBounds.x + aBounds.width > bBounds.x + (b.collisionOffset ? b.collisionOffset.left : 0) && aBounds.x < bBounds.x + (b.collisionOffset ? b.collisionOffset.right : 0)) {
            return true
        }
    }

    collideXFromStart(a, b) {
        const aBounds = a.sprite ? a.sprite.getBounds() : a.getBounds()
        const bBounds = b.sprite ? b.sprite.getBounds() : b.getBounds()

        if (aBounds.x > bBounds.x + (b.collisionOffset ? b.collisionOffset.left : 0) && aBounds.x < bBounds.x + (b.collisionOffset ? b.collisionOffset.right : 0)) {
            return true
        }
    }

    collideXWidth(a, b) {
        const aBounds = a.sprite ? a.sprite.getBounds() : a.getBounds()
        const bBounds = b.sprite ? b.sprite.getBounds() : b.getBounds()

        if (aBounds.x > bBounds.x + (b.collisionOffset ? b.collisionOffset.left : 0) && aBounds.x < bBounds.x + bBounds.width + (b.collisionOffset ? b.collisionOffset.right : 0)) {
            return true
        }
    }

    collideWall(player, wall) {
        const playerBounds = player.sprite.getBounds()
        const wallBounds = wall.sprite.getBounds()

        if (playerBounds.x > (wallBounds.x - wallBounds.width / 2) + wall.bound && playerBounds.x < (wallBounds.x - wallBounds.width / 2) + 40 + wall.bound) {
            return true
        }
    }

    collideWatch(a, b) {
        const aBounds = a.sprite ? a.sprite.getBounds() : a.getBounds()
        const bBounds = b.sprite ? b.sprite.getBounds() : b.getBounds()

        const distance = bBounds.x - aBounds.x
        const result = (distance >= 0 && distance < b.getDetectRange()) && aBounds.y === bBounds.y

        return {
            distance,
            result
        }
    }

    handle(type, a, b, collideResult = null) {
        switch (type) {
            case 'player:wall':
                a.handleCover(b)
                break;
            case 'player:trap':
                if (!b.isAlive) return
                b.activate(a)
                break;
            case 'player:can':
            case 'player:puddle':
                b.activate(a)
                break;
            case 'player:powerUp':
                a.handlePowerUp(b)
                b.activate()
                break
            case 'trap:enemy':
                b.setBarrier(collideResult.result)
                break;
            case 'player:enemy':
                if (collideResult.result) {
                    b.activate(collideResult)
                    if (b.isAlive) a.handleMelee(b, collideResult.distance)
                }
                break;
            case 'bullet:enemy':
            case 'bullet:boss':
            case 'bullet:dog':
                if (b.isAlive) {
                    a.destroy()
                    b.damage(a)
                }
                break;
            case 'bullet:player':
                if (a.skip) return
                if (b.isRollState() || (b.inCover && !b.isShotState()) || b.invincible) return a.setSkip()
                a.destroy()
                b.damage()
                break;
            case 'bullet:trap':
                if (b.isAlive) {
                    a.destroy()
                    b.activate()
                }
                break;
            case 'player:dog':
                if (b.isAlive && !b.skip) {
                    a.damage()
                    b.setSkip()
                }
                break;
            case 'explosion:player':
                if (b.isRollState() || b.invincible || (b.inCover && !b.isShotState())) return
                b.damage(a)
                break;
            case 'explosion:enemy':
            case 'explosion:boss':
            case 'explosion:dog':
            case 'melee:boss':
            case 'melee:dog':
            case 'melee:enemy':
                if (b.isAlive) b.damage({damage: 5})
                break;
            case 'explosion:trap':
                if (b.isAlive) b.activate()
                break;
            case 'grenade:player':
                if (a.isAlive && b.isShotState() && a.body.speed > 2) a.activate(true)
                break;
            case 'player:zipLine':
                if (!b.skip) {
                    a.handleZipLine(b)
                    b.activate()
                }
                break
            case 'player:money':
                b.activate()
                break
            case 'can:boss':
            case 'can:dog':
            case 'can:enemy':
                if (a.touched) {
                    b.damage({damage: Math.floor(a.body.speed)})
                    a.hit()
                }
                break
            case 'can:trap':
                if (a.touched && b.isAlive) {
                    a.hit()
                    b.activate()
                }
                break
        }
    }
}
