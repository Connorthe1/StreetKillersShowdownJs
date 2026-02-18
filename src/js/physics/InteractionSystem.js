export class InteractionSystem {
    update({ player, spawn, bullets, explosion }) {
        this.check(player, spawn.wallManager.walls, 'player:wall');
        this.check(player, spawn.trapManager.traps, 'player:trap');
        this.check(player, spawn.puddleManager.puddles, 'player:puddle');
        if (spawn.canManager.sprite) this.check(player, spawn.canManager, 'player:can');
        if (spawn.powerUpManager.sprite) this.check(player, spawn.powerUpManager, 'player:powerUp');
        this.check(spawn.trapManager.traps, spawn.enemyManager.enemies, 'trap:enemy');
        this.check(player, spawn.enemyManager.enemies, 'player:enemy');
        this.check(bullets.playerBullets, spawn.enemyManager.enemies, 'bullet:enemy');
        if (spawn.bossManager.sprite) this.check(bullets.playerBullets, spawn.bossManager, 'bullet:boss');
        this.check(bullets.enemyBullets, player, 'bullet:player');
        this.check(bullets.playerBullets, spawn.trapManager.traps, 'bullet:trap');

        // Коллизии взрывов (квадратная зона) со всеми целями
        if (explosion.activeExplosion) {
            this.check(explosion.activeExplosion, player, 'explosion:player');
            this.check(explosion.activeExplosion, spawn.enemyManager.enemies, 'explosion:enemy');
            if (spawn.bossManager.sprite) this.check(explosion.activeExplosion, spawn.bossManager, 'explosion:boss');
            this.check(explosion.activeExplosion, spawn.trapManager.traps, 'explosion:trap');
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
                return this.collideWall
            case 'player:puddle':
                return this.collideXWidth
            case 'player:can':
            case 'player:powerUp':
            case 'player:trap':
                return this.collideXFromStart
            case 'trap:enemy':
            case 'player:enemy':
                return this.collideWatch
            case 'bullet:enemy':
            case 'bullet:player':
            case 'bullet:boss':
            case 'bullet:trap':
                return this.collideBullets
            case 'explosion:player':
            case 'explosion:enemy':
            case 'explosion:boss':
            case 'explosion:trap':
                return this.collideExplosionArea
        }
    }

    collideExplosionArea(explosion, target) {
        const targetBounds = target.sprite ? target.sprite.getBounds() : target.getBounds()

        if (targetBounds.left < explosion.right &&
            targetBounds.right > explosion.left &&
            targetBounds.bottom < explosion.top &&
            targetBounds.top > explosion.bottom) {
            return true
        }

        return true
    }

    collideBullets(bullet, target) {
        const bulletBounds = bullet.sprite ? bullet.sprite.getBounds() : bullet.getBounds()
        const targetBounds = target.sprite ? target.sprite.getBounds() : target.getBounds()

        if (bulletBounds.x > targetBounds.left + 20 &&
            bulletBounds.x < targetBounds.right &&
            bulletBounds.y + 10 > targetBounds.top &&
            bulletBounds.y - 10 < targetBounds.bottom) {
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
        const wallBounds = wall.getBounds()

        if (playerBounds.x > (wallBounds.x - wallBounds.width / 2) + wall.bound && playerBounds.x < (wallBounds.x - wallBounds.width / 2) + 40 + wall.bound) {
            return true
        }
    }

    collideWatch(a, b) {
        const aBounds = a.sprite ? a.sprite.getBounds() : a.getBounds()
        const bBounds = b.sprite ? b.sprite.getBounds() : b.getBounds()

        const distance = bBounds.x - aBounds.x
        const result = distance >= 0 && distance < b.getDetectRange()

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
                if (!b.isAlive || a.isRollState()) return
                b.activate()
                break;
            case 'player:puddle':
                b.activate(a)
                break;
            case 'player:can':
                b.handlePlayer(a)
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
                if (b.isAlive) {
                    a.destroy()
                    b.damage(a)
                }
                break;
            case 'bullet:boss':
                if (b.isAlive) {
                    a.destroy()
                    b.damage(a)
                }
                break;
            case 'bullet:player':
                if (a.skip) return
                if (b.isRollState() || !b.isCoverPeek() || b.invincible) return a.setSkip()
                a.destroy()
                b.damage()
                break;
            case 'bullet:trap':
                if (b.isAlive) {
                    a.destroy()
                    b.activate(a)
                }
                break;
            case 'explosion:player':
                if (b.isRollState() || b.invincible) return
                b.damage(a)
                break;
            case 'explosion:enemy':
                if (b.isAlive) b.damage(a)
                break;
            case 'explosion:boss':
                if (b.isAlive) b.damage(a)
                break;
            case 'explosion:trap':
                if (b.damage) b.damage(a); else b.destroy?.()
                break;
        }
    }
}
