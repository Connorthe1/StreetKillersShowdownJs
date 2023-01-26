class SoundPlayer {
    gunShot(gun, trail) {
        const randSound = random(0, 2)
        const sound = PIXI.sound.play(`shot${gun.charAt(0).toUpperCase() + gun.slice(1)}${randSound}`)
        sound.on('end', function() {
            if (trail) {
                PIXI.sound.play(`shot${gun.charAt(0).toUpperCase() + gun.slice(1)}Tail`);
            }
        });
    }
    pistolEmpty() {
        const randSound = random(0, 2)
        PIXI.sound.play(`pistolEmpty${randSound}`)
    }
    async pistolReload() {
        const randSound = random(0, 2)
        PIXI.sound.play(`pistolRemoveMag${randSound}`)
        await sleep(400)
        PIXI.sound.play(`pistolInsertMag${randSound}`)
        await sleep(400)
        PIXI.sound.play(`pistolCock${randSound}`)
    }
    async dogBarking() {
        const randSound1 = random(0, 2)
        PIXI.sound.play(`dogBark${randSound1}`)
        await sleep(400)
        const randSound2 = random(0, 2)
        PIXI.sound.play(`dogBark${randSound2}`)
    }
    bulletSkip() {
        const randSound = random(0, 2)
        PIXI.sound.play(`bulletSkip${randSound}`,  {volume: 0.2})
    }
    slide() {
        const randSound = random(0, 2)
        PIXI.sound.play(`slide${randSound}`, {volume: 0.6})
    }
    damageFlesh() {
        const randSound = random(0, 5)
        PIXI.sound.play(`bulletImpactFlesh${randSound}`, {volume: 0.08})
    }
    damageMetal() {
        const randSound = random(0, 2)
        PIXI.sound.play(`bulletImpactMetal${randSound}`, {volume: 0.08})
    }
    explosion() {
        const randSound = random(0, 1)
        PIXI.sound.play(`explosion${randSound}`, {volume: 0.8})
    }
    beep() {
        PIXI.sound.play('beep')
    }
    zipLine() {
        PIXI.sound.play('zipLine')
    }
    glassBreak() {
        const randSound = random(0, 1)
        PIXI.sound.play(`glassBreak${randSound}`, {volume: 0.5})
    }
    canDrop() {
        const randSound = random(0, 1)
        PIXI.sound.play(`canDrop${randSound}`, {volume: 0.5})
    }
    waterStep() {
        const randSound = random(0, 2)
        PIXI.sound.play(`waterStep${randSound}`, {volume: 1})
    }
    footStep() {
        const randSound = random(0, 3)
        PIXI.sound.play(`footStep${randSound}`, {volume: 1})
    }
}

const soundPlayer = new SoundPlayer()

function random(min, max, noFloor, noMin) {
    const res = Math.random() * (max - min + (noMin ? 0 : 1)) + min
    if (noFloor) {
        return res
    } else {
        return Math.floor(res)
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

export { soundPlayer }