export class InteractionSystem {
    update({ bullets, puddles, bottles, bricks }) {
        this.check(bullets, puddles, 'bullet:puddle');
        this.check(bullets, bottles, 'bullet:bottle');
        this.check(bullets, bricks, 'bullet:brick');
    }

    check(aList, bList, event) {
        for (const a of aList) {
            for (const b of bList) {
                if (this.collide(a, b)) {
                    this.handle(event, a, b);
                }
            }
        }
    }

    handle(type, bullet, target) {
        switch (type) {
            case 'bullet:puddle':
                bullet.destroy();
                target.splash();
                break;
            case 'bullet:bottle':
                bullet.destroy();
                target.break();
                break;
            case 'bullet:brick':
                bullet.destroy();
                target.hit();
                break;
        }
    }
}
