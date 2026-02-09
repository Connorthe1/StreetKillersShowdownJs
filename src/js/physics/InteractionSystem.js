export class InteractionSystem {
    update({ player, spawn }) {
        this.check(player, spawn.wallManager.walls, 'player:wall');
        this.check(player, spawn.trapManager.traps, 'player:trap');
        this.check(player, spawn.puddleManager.puddles, 'player:puddle');
        if (spawn.canManager.sprite) this.check(player, spawn.canManager, 'player:can');
        if (spawn.powerUpManager.sprite) this.check(player, spawn.powerUpManager, 'player:powerUp');
        this.check(spawn.trapManager.traps, spawn.enemyManager.enemies, 'trap:enemy');
        this.check(player, spawn.enemyManager.enemies, 'player:enemy');
        if (spawn.bossManager.sprite) this.check(player, spawn.bossManager, 'player:boss');
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
            case 'player:trap':
                return this.collideXFromStart
            case 'player:puddle':
                return this.collideXWidth
            case 'player:can':
                return this.collideXFromStart
            case 'player:powerUp':
                return this.collideXFromStart
            case 'trap:enemy':
                return this.collideWatch
            case 'player:enemy':
                return this.collideWatch
            case 'player:boss':
                return this.collideWatch
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
                b.activate(a)
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
                    a.handleMelee(b, collideResult.distance)
                }
                break;
            case 'player:boss':
                if (collideResult.result) {
                    b.activate(collideResult)
                    a.handleMelee(b, collideResult.distance)
                }
                break;
        }
    }
}
