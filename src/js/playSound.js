import { sound, filters } from '@pixi/sound';
sound.volumeAll = 0.05

class SoundPlayer {
    gunShot(gun, trail) {
        if (gun === 'doubles') {
            gun = 'pistol'
        }
        const randSound = random(0, 2)
        const gunShot = sound.play(`shot${gun.charAt(0).toUpperCase() + gun.slice(1)}${randSound}`)
        gunShot.on('end', function() {
            if (trail) {
                sound.play(`shot${gun.charAt(0).toUpperCase() + gun.slice(1)}Tail`);
            }
        });
    }
    pistolEmpty() {
        const randSound = random(0, 2)
        sound.play(`pistolEmpty${randSound}`)
    }
    async gunReload(gun) {
        const randSound = random(0, 2)
        switch (true) {
            case gun === 'pistol':
                sound.play(`pistolRemoveMag${randSound}`)
                await sleep(400)
                sound.play(`pistolInsertMag${randSound}`)
                await sleep(400)
                sound.play(`pistolCock${randSound}`)
            break
            case gun === 'doubles':
                sound.play(`pistolRemoveMag${random(0, 2)}`)
                await sleep(400)
                sound.play(`pistolInsertMag${random(0, 2)}`)
                await sleep(300)
                sound.play(`pistolInsertMag${random(0, 2)}`)
                await sleep(400)
                sound.play(`pistolCock${random(0, 2)}`)
                await sleep(100)
                sound.play(`pistolCock${random(0, 2)}`)
            break
            case gun === 'shotgun':
                await sleep(200)
                sound.play(`shotShotgunLoad${random(0, 2)}`)
                await sleep(300)
                sound.play(`shotShotgunLoad${random(0, 2)}`)
                await sleep(350)
                sound.play(`shotShotgunCock${random(0, 1)}`)
            break
            case gun === 'revolver':
                sound.play(`shotRevolverRemoveMag${random(0, 1)}`)
                await sleep(200)
                sound.play(`shotRevolverLoad${random(0, 2)}`)
                await sleep(200)
                sound.play(`shotRevolverLoad${random(0, 2)}`)
                await sleep(200)
                sound.play(`shotRevolverLoad${random(0, 2)}`)
                await sleep(200)
                sound.play(`shotRevolverLoad${random(0, 2)}`)
                await sleep(200)
                sound.play(`shotRevolverCock${random(0, 2)}`)
            break
        }
    }
    async dogBarking() {
        const randSound1 = random(0, 2)
        sound.play(`dogBark${randSound1}`)
        await sleep(400)
        const randSound2 = random(0, 2)
        sound.play(`dogBark${randSound2}`)
    }
    bulletSkip() {
        const randSound = random(0, 2)
        sound.play(`bulletSkip${randSound}`,  {volume: 1})
    }
    slide() {
        const randSound = random(0, 2)
        sound.play(`slide${randSound}`, {volume: 0.6})
    }
    damageFlesh() {
        const randSound = random(0, 5)
        const randFilter = random(0, 0.05, true, true)
        sound.play(`bulletImpactFlesh${randSound}`, {volume: 2 ,filters: [new filters.DistortionFilter(randFilter)]})
    }
    damageMetal() {
        const randSound = random(0, 2)
        const randFilter = random(0, 0.05, true, true)
        sound.play(`bulletImpactMetal${randSound}`, {volume: 2 ,filters: [new filters.DistortionFilter(randFilter)]})
    }
    explosion() {
        const randSound = random(0, 1)
        sound.play(`explosion${randSound}`, {volume: 0.8})
    }
    beep() {
        sound.play('beep')
    }
    zipLine() {
        sound.play('zipLine')
    }
    glassBreak() {
        const randSound = random(0, 1)
        sound.play(`glassBreak${randSound}`, {volume: 0.5})
    }
    canDrop() {
        const randSound = random(0, 1)
        sound.play(`canDrop${randSound}`, {volume: 0.5})
    }
    waterStep() {
        const randSound = random(0, 2)
        sound.play(`waterStep${randSound}`, {volume: 1})
    }
    footStep() {
        const randSound = random(0, 3)
        sound.play(`footStep${randSound}`, {volume: 1})
    }
    powerUp() {
        sound.play('collectPowerUp')
    }
    coins() {
        const randSound = random(0, 3)
        sound.play(`coins${randSound}`, {volume: 3})
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