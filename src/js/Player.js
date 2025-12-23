import * as PIXI from 'pixi.js'

// Player-specific state
export const playerState = {
    state: '',
    afterRoll: true,
    inCover: false,
    invincible: false,
    inZipLine: false,
    inBossFight: false,
    health: 3,
    currentSkin: 0,
    activePowerUps: [],
    skillCD: false,
    stimpack: false,
    rollId: null,
}

// Player speed and movement
export let playerDefaultSpeed = 5
export let playerSpeed = playerDefaultSpeed
export let initSpeed = 5
export let playerPos = null // Will be set externally
export let secondFloor = null // Will be set externally

// Player reference
export let player = null

// Player bullets array
export const playerBullets = []

// Gun configuration
export const gun = {
    ammo: 5,
    currentAmmo: 5,
    angle: 0.4,
    type: 'pistol',
    noStop: false,
    damage: 1,
    reloadTime: 1100,
    shotDelay: 150,
    shotTrigger: 300,
    offsetX: 30,
    offsetY: 12
}

// Shots array
export const shotsArr = []

// Melee kill system
export let meleeKill = null
export let meleeKillSelectorSide = true
export let meleeKillSelectorSpeed = 6
export let meleeKillStreak = 0
export let meleeKillStreakTimer = null

// Trigger delay
export let triggerDelay = false

export class Player {
    constructor(playerPosition, secondFloorPosition) {
        playerPos = playerPosition
        secondFloor = secondFloorPosition
    }

    createPlayer(currentSkin) {
        player = new PIXI.AnimatedSprite(currentSkin.animations.run)
        player.color = player.tint
        player.shadow = 11776947
        player.anchor.set(0.5)
        player.scale.x = 2
        player.scale.y = 2
        player.animationSpeed = 0.2
        player.autoUpdate = true
        player.loop = true
        player.parentGroup = null // Will be set externally
        player.zOrder = 5
        player.position.set(-100, playerPos)
        // world.addChild(player) - Will be added externally
        player.play()
        
        return player
    }

    updatePlayer(delta, gameEnd, gameStart, gameSpeed, enemyBullets, damagePlayerFunction) {
        if (gameEnd) return
        
        // Update active power-ups
        if (playerState.activePowerUps.length > 0) {
            playerState.activePowerUps.forEach((powerUp, idx) => {
                if (Date.now() > powerUp.expired) {
                    switch (true) {
                        case powerUp.type === 'boostAmmo':
                            gun.ammo = gun.ammo / 2
                        break
                        case powerUp.type === 'boostGun':
                            gun.damage = gun.damage / 2
                        break
                    }
                    playerState.activePowerUps.splice(idx, 1)
                    console.log('endPW')
                }
            })
        }
        
        // Update player position based on game state
        if (gameStart) {
            const dtX = 1 - Math.exp(-delta / 5)
            const dtY = 1 - Math.exp(-delta / 20)
        }
        
        if (player) {
            player.x += (0.5 * playerSpeed) * gameSpeed;
        }
        
        // Check for enemy bullet collisions
        if (player) {
            enemyBullets.forEach((bullet, idx) => {
                if (bullet) {
                    const b = bullet.getBounds()
                    const p = player.getBounds()
                    
                    if (p && b && p.x + 40 > b.x && p.x < b.x && p.y - player.height / 2 < b.y && p.y + player.height / 2 > b.y) {
                        enemyBullets.splice(idx, 1)
                        if (playerState.invincible) {
                            return
                        }
                        damagePlayerFunction()
                    }
                }
            })
        }
    }

    playAnim(anim) {
        if (!player) return;

        player.loop = !anim || anim === 'idle';
        player.animationSpeed = (anim === 'reload' && gun.reloadAnim) ? gun.reloadAnim : 0.2;

        if (gun.noStop && anim === 'shot' && !playerState.inCover) {
            if (playerState.state) {
                this.updatePlayerState(anim, playerState.currentSkin.animations.run, player.color);
            } else {
                playerState.state = anim;
            }
            return;
        }

        if (!anim || (anim === 'shotEnd' && gun.noStop)) {
            this.resetPlayerState();
        } else {
            player.tint = (anim === 'roll' || anim === 'rollEnd' || (playerState.inCover && anim !== 'shot')) ? player.shadow : player.color;
            if (anim === 'idle' || anim === 'zipLine') {
                if (anim === 'idle') player.anchor.y = 0.7;
                this.updatePlayerState('', playerState.currentSkin.animations[anim], player.tint);
            } else {
                this.updatePlayerState(anim, playerState.currentSkin.animations[anim], player.tint);
            }
        }
    }

    updatePlayerState(state, textures, tint) {
        playerState.state = state;
        player.textures = textures;
        player.tint = tint;
        player.play();
    }

    resetPlayerState() {
        playerState.state = '';
        player.textures = playerState.currentSkin.animations.run;
        player.tint = player.color;
        player.play();
    }
}

// Function to update gun based on skin
export function updateGunFromSkin(selectedSkinIdx, storage, getPercent) {
    // This function assumes skinStore is imported elsewhere
    // Implementation would be completed when skinStore is accessible
    if (typeof skinStore !== 'undefined' && skinStore[Number(selectedSkinIdx)]) {
        if (skinStore[Number(selectedSkinIdx)].gunAmmo) {
            gun.ammo = skinStore[Number(selectedSkinIdx)].gunAmmo
            gun.currentAmmo = skinStore[Number(selectedSkinIdx)].gunAmmo
        }
        if (skinStore[Number(selectedSkinIdx)].gunAngle) {
            gun.angle = skinStore[Number(selectedSkinIdx)].gunAngle
        }
        if (skinStore[Number(selectedSkinIdx)].speedAmp) {
            playerDefaultSpeed += skinStore[Number(selectedSkinIdx)].speedAmp
            playerSpeed = playerDefaultSpeed
            initSpeed = playerDefaultSpeed
        }
        if (skinStore[Number(selectedSkinIdx)].noStop) {
            gun.noStop = true
        }
        if (skinStore[Number(selectedSkinIdx)].offsetX) {
            gun.offsetX = skinStore[Number(selectedSkinIdx)].offsetX
        }
        if (skinStore[Number(selectedSkinIdx)].offsetY) {
            gun.offsetY = skinStore[Number(selectedSkinIdx)].offsetY
        }
        if (skinStore[Number(selectedSkinIdx)].reloadTime) {
            gun.reloadTime = skinStore[Number(selectedSkinIdx)].reloadTime
            gun.reloadAnim = skinStore[Number(selectedSkinIdx)].reloadAnim
        }
        if (skinStore[Number(selectedSkinIdx)].gunDamage) {
            gun.damage = skinStore[Number(selectedSkinIdx)].gunDamage
        }
        if (skinStore[Number(selectedSkinIdx)].gunShotDelay) {
            gun.shotDelay = skinStore[Number(selectedSkinIdx)].gunShotDelay
        }
        if (skinStore[Number(selectedSkinIdx)].melee) {
            gun.melee = skinStore[Number(selectedSkinIdx)].melee
        }
        gun.type = skinStore[Number(selectedSkinIdx)].gun
        playerState.currentSkin = skinStore[Number(selectedSkinIdx)].param
        if (getPercent) {
            gun.angle = getPercent(gun.angle, 100 - 10 * storage.upgrades.accuracy)
            gun.shotTrigger = getPercent(gun.shotTrigger, 100 - 10 * storage.upgrades.gunTrigger)
        }
    }
}