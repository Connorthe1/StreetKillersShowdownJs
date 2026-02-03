export class InteractionSystem {
    update({ player, spawn }) {
        this.check(player, spawn.wallManager.walls, 'player:wall');
        this.check(player, spawn.trapManager.traps, 'player:trap');
    }

    check(a, b, event) {
        const aList = Array.isArray(a) ? a : [a];
        const bList = Array.isArray(b) ? b : [b];

        const collide = this.getCollideType(event)

        for (const a of aList) {
            for (const b of bList) {
                if (collide(a, b)) {
                    this.handle(event, a, b);
                }
            }
        }
    }

    getCollideType(type) {
        switch (type) {
            case 'player:wall':
                return this.collideWall
            case 'player:trap':
                return this.collideX
        }
    }

    collideX(a, b) {
        const aBounds = a.sprite ? a.sprite.getBounds() : a.getBounds()
        const bBounds = b.sprite ? b.sprite.getBounds() : b.getBounds()

        if (aBounds.x > bBounds.x + (b.collisionOffset ? b.collisionOffset.left : 0) && aBounds.x < bBounds.x + (b.collisionOffset ? b.collisionOffset.right : 0)) {
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

    handle(type, a, b) {
        switch (type) {
            case 'player:wall':
                a.handleCover(b)
                break;
            case 'player:trap':
                b.activate(a)
                break;
        }
    }
}
