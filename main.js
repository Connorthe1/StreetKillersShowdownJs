const CANVAS_WIDTH = 550;
const CANVAS_HEIGHT = 850;
let zeroLeft = 0
let zeroRight = CANVAS_WIDTH
let gameSpeed = 1

let playerState = {
    state: '',
    afterRoll: true,
    inCover: false,
    invincible: false,
    inZipLine: false,
    inBossFight: false,
}
let player
const playerPos = CANVAS_HEIGHT - 200
const secondFloor = CANVAS_HEIGHT - 390
let meleeKill = null
let meleeKillSelectorSide = true
let meleeKillSelectorSpeed = 2
let meleeKillStreak = 0
let meleeKillStreakTimer = null

const playerBullets = []
const enemyBullets = []
const bulletSpeed = 15

let playerDefaultSpeed = 2
let playerSpeed = playerDefaultSpeed
let distance = 0

let background
let bgPosition = 0
let bgSpeed = 0.2;

let ground
let floorPosition = 0
const fenceChance = 4
let isFence = false
let isBuilding = false
let afterBuilding = true
let isClub = false
const buildingChance = 2
let buildingType = 0

const enemyParams = {
    default: {
        angle: 0.1,
        warningMin: 600,
        warningMax: 1000,
        reloadMin: 600,
        reloadMax: 1000,
        health: 2,
        dead: false,
        detect: false,
        warning: null,
        detectRange: 300,
    },
    bossGun: {
        angle: 0.1,
        warningMin: 400,
        warningMax: 800,
        reloadMin: 300,
        reloadMax: 500,
        health: 5,
        dead: false,
        detect: false,
        warning: null,
        rapidFire: 7,
        melee: true,
        walk: true
    },
    bossSmg: {
        angle: 0.4,
        warningMin: 300,
        warningMax: 600,
        reloadMin: 200,
        reloadMax: 400,
        health: 5,
        dead: false,
        detect: false,
        warning: null,
        rapidFire: 10,
    },
    bossLauncher: {
        angle: 0.1,
        warningMin: 400,
        warningMax: 800,
        reloadMin: 300,
        reloadMax: 500,
        health: 5,
        dead: false,
        detect: false,
        warning: null,
    },
    bossVan: {
        angle: 0.1,
        warningMin: 300,
        warningMax: 500,
        reloadMin: 200,
        reloadMax: 400,
        health: 8,
        dead: false,
        detect: false,
        warning: null,
        rapidFire: 7,
        deathType: 'bigExplode'
    },
}

const gun = {
    ammo: 5,
    angle: 0.2,
}

const walls = []
const traps = []
const enemies = []
const physParticles = []
const bounceParticles = []
const buildings = []
const trails = []
const zipLines = []
let currentBoss = null

let engine
let fg

window.onload = async function () {
    const app = new PIXI.Application({
        width: CANVAS_WIDTH,
        height: CANVAS_HEIGHT,
        backgroundColor: 'black',
    })
    app.stage = new PIXI.layers.Stage()
    document.body.appendChild(app.view)
    engine = Matter.Engine.create();
    engine.timing.timeScale = 0.5;
    app.stage.sortableChildren = true;
    const loader = PIXI.Assets

    fg = new PIXI.layers.Group(9)
    app.stage.addChild(new PIXI.layers.Layer(fg));

    PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;


    const textures = await loader.load('./src/textures/textures.json');
    const build1 = await loader.load('./src/textures/build1.json');
    const build2 = await loader.load('./src/textures/build2.json');
    const buildZiplineTexture = await loader.load('./src/textures/buildZipline.json');
    const club = await loader.load('./src/textures/club.json');
    const laserBeamTexture = await loader.load('./src/textures/laserBeam.json');
    const inBuildTexture = await loader.load('./src/textures/inBuild.json');
    const inFloorTexture = await loader.load('./src/textures/inFloor.json');
    const inClubTexture = await loader.load('./src/textures/inClub.json');
    const character = await loader.load('./src/character/character.json');
    const defaultEnemy = await loader.load('./src/enemies/defaultEnemy.json');
    const bossGun = await loader.load('./src/enemies/bossGun.json');
    const bossLauncher = await loader.load('./src/enemies/bossLauncher.json');
    const bossVan = await loader.load('./src/enemies/bossVan.json');
    const bossSmg = await loader.load('./src/enemies/bossSmg.json');
    const particles = await loader.load('./src/particles/particles.json');
    const bigExplode = await loader.load('./src/particles/bigExplode.json');
    const physParticlesTexture = await loader.load('./src/particles/physParticles.json');
    const bounceParticlesTexture = await loader.load('./src/particles/bounceParticles.json');
    const bochka = await loader.load('./src/entity/bochka.json');
    const windowTexture = await loader.load('./src/entity/window.json');
    const doorTexture = await loader.load('./src/entity/door.json');
    // await character.parse();

    const bg = await loader.load('./src/BG.png')
    init()

    function init() {
        background = createBg(bg)
        ground = new PIXI.Container()
        app.stage.addChild(ground)
        for (let i = 0; i <= 3; i++) {
            createFloor(i, 0)
        }
        createPlayer()
        document.addEventListener('keyup', events)

        createBoss('bossSmg')
        app.ticker.add(ticker)
        trailTimer()
    }

    function ticker(delta) {
        Matter.Engine.update(engine);
        if (meleeKill) {
            meleeKill.pivot.x = -(player.x - 100)
            const UiBounds = meleeKill.getBounds()
            const selector = meleeKill.getChildAt(2)
            if (meleeKillSelectorSide) {
                selector.x += meleeKillSelectorSpeed + meleeKillStreak
            } else {
                selector.x -= meleeKillSelectorSpeed + meleeKillStreak
            }
            if (selector.x + selector.width >= UiBounds.x + UiBounds.width) {
                meleeKillSelectorSide = false
            }
            if (selector.x <= UiBounds.x) {
                meleeKillSelectorSide = true
            }
        }
        updatePlayer()
        updateBg()
        updateFloor()
        updateBullets()
        updateWall()
        updateEnemies()
        updateTraps()
        updatePhysParticles()
        updateBounceParticles()
        updateBuildings()
        updateTrailParticle()
        updateZiplines()
        if (currentBoss) {
            updateBoss()
        }
        if (playerState.inZipLine) {
            spawnTrailParticle(player)
            if (playerState.inZipLine === 'top') {
                player.y -= 1.5
            } else {
                player.y += 1.5
            }
        }
        const detectedWall = detectWall()
        if (detectedWall && !playerState.inCover) {
            if (playerState.state === 'roll' || playerState.state === 'rollEnd' || detectedWall.forBoss) {
                playerState.inBossFight = detectedWall.forBoss
                playerState.inCover = true
                playerSpeed = 0
                playAnim('idle')
            }
        }
    }

    function trailTimer() {
        setInterval(() => {
            if (playerSpeed > 0) {
                spawnTrailParticle(player)
                if (playerState.state === 'roll' || playerState.state === 'rollEnd') {
                    spawnTrailParticle(player)
                    spawnTrailParticle(player)
                    spawnTrailParticle(player)
                }
            }
        }, 100)
    }

    function spawnEntity() {
        if (!isClub) {
            const randomBuild = Math.floor(Math.random() * (10 - 1 + 1) + 1)
            switch (true) {
                case randomBuild <= buildingChance:
                    if (isBuilding) {
                        spawnBuilding('continue')
                    } else {
                        if (buildings.length === 0) {
                            const testClub = Math.floor(Math.random() * (10 - 1 + 1) + 1)
                            isBuilding = true
                            afterBuilding = false
                            if (testClub === 1) {
                                isClub = true
                                createClub()
                                return
                            }
                            spawnBuilding('start')
                        }
                    }
                    break
                default:
                    if (isBuilding) {
                        isBuilding = false
                        spawnBuilding('end')
                    }
                    break
            }
        }
        const rand = Math.floor(Math.random() * (3 - 1 + 1) + 1)
        switch (true) {
            case rand === 1 && !isBuilding && afterBuilding :
                createBochka()
            break
            case rand === 2 && !isBuilding && afterBuilding :
                createWall()
            break
            case rand === 3 :
                createEnemy()
            break
        }
    }

    function setMeleeSelector(skip) {
        if (!skip) {
            const greenBarPosition = meleeKill.getChildAt(1).getBounds()
            const selectorPosition = meleeKill.getChildAt(2).getBounds()
            if (selectorPosition.x + selectorPosition.width / 2 > greenBarPosition.x && selectorPosition.x + selectorPosition.width / 2 < greenBarPosition.x + greenBarPosition.width) {
                damageEnemy(meleeKill.enemy, 100)
                meleeKillStreak += 0.5
            } else {
                damagePlayer()
            }
        } else {
            damagePlayer()
        }
        gameSpeed = 1
        app.stage.removeChild(meleeKill)
        meleeKill = null
        clearTimeout(meleeKillStreakTimer)
        setTimeout(() => {
            if (meleeKillStreak > 0) {
                meleeKillStreak -= 0.5
            }
        }, 5000)
    }

    function UImeleeKill(enemy) {
        gameSpeed = 0.2
        meleeKill = new PIXI.Container()
        const redBar = PIXI.Sprite.from(PIXI.Texture.WHITE);
        redBar.height = 50
        redBar.width = CANVAS_WIDTH / 2
        redBar.anchor.set(0.5)
        redBar.position.set(CANVAS_WIDTH / 2, CANVAS_HEIGHT / 2)
        redBar.tint = 16731469
        const greenBar = PIXI.Sprite.from(PIXI.Texture.WHITE);
        greenBar.height = 50
        greenBar.width = CANVAS_WIDTH / 8
        greenBar.anchor.set(0, 0.5)
        const greenBarPosition = Math.floor(Math.random() * ((redBar.x + redBar.width / 2 - greenBar.width) - (redBar.x - redBar.width / 2)) + (redBar.x - redBar.width / 2))
        greenBar.position.set(greenBarPosition, CANVAS_HEIGHT / 2)
        greenBar.tint = 6088284
        const selector = PIXI.Sprite.from(PIXI.Texture.WHITE);
        selector.height = 90
        selector.width = 10
        selector.anchor.set(0, 0.5)
        const selectorPosition = Math.floor(Math.random() * ((redBar.x + redBar.width / 2 - greenBar.width) - (redBar.x - redBar.width / 2)) + (redBar.x - redBar.width / 2))
        selector.position.set(selectorPosition, CANVAS_HEIGHT / 2)
        meleeKill.enemy = enemy
        meleeKill.addChild(redBar)
        meleeKill.addChild(greenBar)
        meleeKill.addChild(selector)
        meleeKill.zIndex = 99
        app.stage.addChild(meleeKill)
        meleeKillStreakTimer = setTimeout(() => {
            if (meleeKill) {
                setMeleeSelector(true)
            }
        }, 2500)
    }

    function damagePlayer() {
        playerState.invincible = true
        player.tint = 16737894
        setTimeout(() => {
            playerState.invincible = false
            player.tint = player.color
        }, 200)
        console.log('damaged')
    }

    function updatePlayer() {
        app.stage.pivot.x = player.x - 100
        player.x += (0.5 * playerSpeed) * gameSpeed;
        zeroLeft = player.x - 100
        zeroRight = player.x - 100 + CANVAS_WIDTH
        enemyBullets.forEach((bullet, idx) => {
            if (player.x + player.width > bullet.x && player.x < bullet.x && player.y - player.height / 2 < bullet.y && player.y + player.height / 2 > bullet.y) {
                if (playerState.state === 'roll' || playerState.state === 'rollEnd' || (playerState.inCover && playerState.state !== 'shot')) return
                app.stage.removeChild(bullet)
                enemyBullets.splice(idx, 1)
                if (playerState.invincible) {
                    return
                }
                damagePlayer()
            }
        })
    }

    function createPlayer() {
        player = new PIXI.AnimatedSprite(character.animations.run)
        player.color = player.tint
        player.shadow = 11776947
        player.anchor.set(0.5)
        player.scale.x = 2
        player.scale.y = 2
        player.animationSpeed = 0.2
        player.loop = true
        player.parentGroup = fg
        player.zOrder = 10
        player.position.set(100, playerPos)
        app.stage.addChild(player)
        player.play()
    }

    function spawnTrailParticle(pos) {
        const rectangle = PIXI.Sprite.from(PIXI.Texture.WHITE);
        const randomParams = Math.floor(Math.random() * (3 + 1))
        switch (true) {
            case randomParams === 0:
                rectangle.tint = 16777215;
                rectangle.width = 1;
                rectangle.height = 1;
                if (playerState.inZipLine) {
                    rectangle.position.set(pos.x + 5, pos.y - pos.height / 2 + 18)
                } else {
                    rectangle.position.set(pos.x - 15, pos.y + 18)
                }
                rectangle.scaleSize = 0.1
                rectangle.initY = rectangle.y
            break
            case randomParams === 1:
                rectangle.tint = 14869218;
                rectangle.width = 2;
                rectangle.height = 2;
                if (playerState.inZipLine) {
                    rectangle.position.set(pos.x + 5, pos.y - pos.height / 2 + 20)
                } else {
                    rectangle.position.set(pos.x - 10, pos.y + 20)
                }
                rectangle.scaleSize = 0.09
                rectangle.initY = rectangle.y
            break
            case randomParams === 2:
                rectangle.tint = 13027014;
                rectangle.width = 3;
                rectangle.height = 3;
                if (playerState.inZipLine) {
                    rectangle.position.set(pos.x + 5, pos.y - pos.height / 2 + 22)
                } else {
                    rectangle.position.set(pos.x - 20, pos.y + 22)
                }
                rectangle.scaleSize = 0.07
                rectangle.initY = rectangle.y
            break
            case randomParams === 3:
                rectangle.tint = 11250603;
                rectangle.width = 4;
                rectangle.height = 4;
                if (playerState.inZipLine) {
                    rectangle.position.set(pos.x + 5, pos.y - pos.height / 2 + 16)
                } else {
                    rectangle.position.set(pos.x - 12, pos.y + 16)
                }
                rectangle.scaleSize = 0.08
                rectangle.initY = rectangle.y
            break
        }
        rectangle.endSize = Math.floor(Math.random() * (10 - 5 + 1) + 5)
        rectangle.alpha = 0.7
        app.stage.addChild(rectangle);
        trails.push(rectangle)
    }

    function updateTrailParticle() {
        trails.forEach((item, idx) => {
            if (item.x < zeroLeft || item.y - item.height < item.initY - item.endSize ) {
                app.stage.removeChild(item)
                trails.splice(idx, 1)
                return
            }
            item.width += item.scaleSize / 2
            item.height += item.scaleSize / 2
            item.y -= item.scaleSize
            item.x -= item.scaleSize
        })
    }

    function deleteWallsAroundBuilding(pos) {
        walls.forEach((wall, idx) => {
            if (wall.x + 100 > pos) {
                app.stage.removeChild(wall)
                walls.splice(idx, 1)
            }
        })
    }

    function spawnBuilding(type) {
        const randBuild = buildingType > 0 ? buildingType : Math.floor(Math.random() * (2 - 1 + 1) + 1)
        switch (true) {
            case randBuild === 1:
                buildingType = 1
                createBuildingZipline(type)
            break
            case randBuild === 2:
                buildingType = 2
                createBuilding(type)
            break
        }
        if (type === 'end') {
            buildingType = 0
        }
    }

    function createBuildingZipline(type) {
        const buildContainer = new PIXI.Container()
        buildContainer.secondFloor = true
        let buildBack
        let buildFront
        let buildConnect
        let buildZipline
        let position = zeroRight + 100
        let lastBuilding
        if (buildings.length > 0 && type !== 'start') {
            lastBuilding = buildings[buildings.length - 1]
            const LBbounds = lastBuilding.getLocalBounds()
            position = LBbounds.x + LBbounds.width
        }
        deleteWallsAroundBuilding(position)
        if (type === 'start') {
            buildBack = new PIXI.Sprite(build2.textures.Build2FOne)
            buildFront = new PIXI.Sprite(build2.textures.Build2FOneClose)
            buildBack.anchor.set(0.5)
            buildBack.position.set(position + buildBack.width / 2, 464)
            buildZipline = new PIXI.Sprite(buildZiplineTexture.textures.Zipline2FStart)
            buildZipline.position.set((position - buildZipline.width) + 40, 220 )
            buildZipline.zIndex = 1
            app.stage.addChild(buildZipline)
            zipLines.push(buildZipline)
            createWindow(position + 11)
            if (Math.random() < 0.5) {
                createDoor(position + buildBack.width - 72, true)
            }
            if (Math.random() < 0.5) {
                createCoverInBuild(position + buildBack.width - 180, true)
            }
        } else {
            const rand = Math.random()
            if (!lastBuilding.outroof) {
                if (rand < 0.5) {
                    buildConnect = new PIXI.Sprite(build2.textures.Build2fOneConnect)
                    buildBack = new PIXI.Sprite(build2.textures.Build2FTwo)
                    buildFront = new PIXI.Sprite(build2.textures.Build2FTwoClose)
                    buildBack.anchor.set(0.5)
                    buildBack.position.set(position + buildBack.width / 2, 464)
                    if (Math.random() < 0.5) {
                        createCoverInBuild(buildBack.x - 50, true)
                    }
                    if (type === 'end') {
                        createWindow(position + buildBack.width - 93)
                    } else {
                        if (Math.random() < 0.5) {
                            createDoor(position + buildBack.width - 72)
                        }
                    }
                } else {
                    buildBack = new PIXI.Sprite(build2.textures.Build2Outroof)
                    buildContainer.outroof = true
                    buildBack.anchor.set(0.5)
                    buildBack.position.set(position + buildBack.width / 2, 580)
                    if (Math.random() < 0.5) {
                        createCoverInBuild(position + buildBack.width - 150, true, true)
                    }
                    if (Math.random() < 0.5) {
                        createCoverInBuild(position + 150, true, true)
                    }
                }
            } else {
                if (rand < 0.5) {
                    buildBack = new PIXI.Sprite(build2.textures.Build2FThree)
                    buildFront = new PIXI.Sprite(build2.textures.Build2FThreeClose)
                    buildBack.anchor.set(0.5)
                    buildBack.position.set(position + buildBack.width / 2 - 120, 464)
                    if (Math.random() < 0.5) {
                        createCoverInBuild(position + buildBack.width - 360, true)
                    }
                    if (Math.random() < 0.5) {
                        createCoverInBuild(position + 210, true)
                    }
                    if (Math.random() < 0.5) {
                        createWindow(position - 108)
                    } else {
                        createDoor(position - 88, true)
                    }
                    if (type === 'end') {
                        createWindow(position + buildBack.width - 212)
                    }
                } else {
                    buildBack = new PIXI.Sprite(build2.textures.Build2Outroof)
                    buildConnect = new PIXI.Sprite(build2.textures.Build2fOneConnect)
                    buildContainer.outroof = true
                    buildBack.anchor.set(0.5)
                    buildBack.position.set(position + buildBack.width / 2, 580)
                    if (Math.random() < 0.5) {
                        createCoverInBuild(position + buildBack.width - 150, true, true)
                    }
                    if (Math.random() < 0.5) {
                        createCoverInBuild(position + 150, true, true)
                    }
                }
            }
        }
        if (type === 'end') {
            if (buildContainer.outroof) {
                buildZipline = new PIXI.Sprite(buildZiplineTexture.textures.Zipline1FEnd)
                buildZipline.position.set(buildBack.x + buildBack.width / 2 - 96, buildBack.y - buildBack.height / 2 - 74 )
                buildZipline.end = true
            } else {
                buildZipline = new PIXI.Sprite(buildZiplineTexture.textures.Zipline2FEnd)
                buildZipline.position.set(buildBack.x + buildBack.width / 2, buildBack.y - buildBack.height / 2 )
                buildZipline.end = true
            }
            buildZipline.zIndex = 1
            app.stage.addChild(buildZipline)
            zipLines.push(buildZipline)
        }
        if (buildFront) {
            buildFront.anchor.set(0.5)
            buildFront.position.set(buildBack.x, buildBack.y)
            buildFront.parentGroup = fg
            buildFront.zOrder = 5
            buildContainer.addChild(buildFront)
        }
        if (buildConnect) {
            if (buildContainer.outroof) {
                buildConnect.position.set(buildBack.x - buildBack.width - 54 , buildBack.y - buildBack.height / 2 - 42)
            } else {
                buildConnect.position.set((buildBack.x - buildBack.width * 1.5) - 4, buildBack.y - buildBack.height / 2)
            }
            buildContainer.addChild(buildConnect)
        }
        buildContainer.addChild(buildBack)
        const bounds = buildContainer.getLocalBounds()
        const resetSpawnZones = [
            {
                x: bounds.x - 100,
                w: bounds.x + 100
            },
            {
                x: bounds.x + bounds.width - 100,
                w: bounds.x + bounds.width + 100
            }
        ]
        buildContainer.resetSpawnZones = resetSpawnZones
        app.stage.addChild(buildContainer)
        buildings.push(buildContainer)
    }

    function updateZiplines() {
        zipLines.forEach((b, idx) => {
            if (b.position.x + b.width < zeroLeft) {
                app.stage.removeChild(b)
                zipLines.splice(idx, 1)
                return;
            }
            if (playerState.inZipLine || b.used) return
            if (b.position.x + (b.end ? b.width - 20 : -10) < player.x && b.position.x + (b.end ? b.width : 0) > player.x) {
                b.used = true
                playerState.inZipLine = b.end ? "bot" : "top"
                playerSpeed = 0
                playAnim('zipLine')
                player.rotation = 4.8
                setTimeout(() => {
                    playerState.inZipLine = ''
                    player.rotation = 0
                    playerSpeed = playerDefaultSpeed
                    if (b.end) {
                        player.y = playerPos
                        playerState.secondFloor = false
                        playAnim('')
                    } else {
                        player.y = secondFloor
                        playerState.secondFloor = true
                        const e = {
                            code: 'Space'
                        }
                        events(e)
                    }
                }, 1000)
            }
        })
    }

    function createBuilding(type) {
        const buildContainer = new PIXI.Container()
        let buildBack
        let buildFront
        let buildConnect
        let position = zeroRight + 100
        if (buildings.length > 0 && type !== 'start') {
            const lastBuilding = buildings[buildings.length - 1].getLocalBounds()
            position = lastBuilding.x + lastBuilding.width
        }
        deleteWallsAroundBuilding(position)
        if (type === 'start') {
            buildBack = new PIXI.Sprite(build1.textures.Build1FOne)
            buildFront = new PIXI.Sprite(build1.textures.Build1FOneClose)
            createDoor(position + 32)
            if (Math.random() < 0.5) {
                createDoor(position + buildBack.width - 72)
            }
            if (Math.random() < 0.5) {
                createCoverInBuild(position + buildBack.width / 2)
            }
        } else {
            const rand = Math.random()
            if (rand < 0.5) {
                buildBack = new PIXI.Sprite(build1.textures.Build1FTwo)
                buildFront = new PIXI.Sprite(build1.textures.Build1FTwoClose)
                if (Math.random() < 0.5) {
                    createCoverInBuild(position + buildBack.width - 150)
                }
                if (Math.random() < 0.5) {
                    createDoor(position + buildBack.width - 72)
                }
            } else {
                buildBack = new PIXI.Sprite(build1.textures.Build1FThree)
                buildFront = new PIXI.Sprite(build1.textures.Build1FThreeClose)
                if (Math.random() < 0.5) {
                    createCoverInBuild(position + buildBack.width - 150)
                }
                if (Math.random() < 0.5) {
                    createCoverInBuild(position + buildBack.width - 340)
                }
                if (Math.random() < 0.5) {
                    createDoor(position + buildBack.width - 72)
                }
            }
            if (type !== 'end') {
                if (rand < 0.5) {
                    buildConnect = new PIXI.Sprite(build1.textures.Build1FTwoConnection)
                } else {
                    buildConnect = new PIXI.Sprite(build1.textures.Build1FThreeConnection)
                }
            }
        }
        buildBack.anchor.set(0.5)
        buildFront.anchor.set(0.5)
        buildFront.parentGroup = fg
        buildFront.zOrder = 5
        buildBack.position.set(position + buildBack.width / 2, 485)
        buildFront.position.set(position + buildFront.width / 2, 485)
        if (buildConnect) {
            buildConnect.anchor.set(0.5)
            buildConnect.position.set(position + buildConnect.width / 2, 485)
            buildContainer.addChild(buildConnect)
        }
        buildContainer.addChild(buildBack)
        buildContainer.addChild(buildFront)
        const bounds = buildContainer.getLocalBounds()
        const resetSpawnZones = [
            {
                x: bounds.x - 100,
                w: bounds.x + 100
            },
            {
                x: bounds.x + bounds.width - 100,
                w: bounds.x + bounds.width + 100
            }
        ]
        buildContainer.resetSpawnZones = resetSpawnZones
        app.stage.addChild(buildContainer)
        buildings.push(buildContainer)
    }

    function createCoverInBuild(pos, isSecondFloor, isRoof) {
        let wall
        if (isRoof) {
            const randomWall = Math.floor(Math.random() * (1 + 1))
            wall = new PIXI.Sprite(inFloorTexture.textures[`Floor-${randomWall}`])
        } else {
            const randomWall = Math.floor(Math.random() * (2 + 1))
            wall = new PIXI.Sprite(inBuildTexture.textures[`inhouse-${randomWall}`])
        }
        wall.bound = 30
        wall.anchor.set(0.5)
        wall.position.set(pos, isSecondFloor ? isRoof ? 428 : 417 : CANVAS_HEIGHT - 245)
        wall.height = wall.height * 2
        wall.width = wall.width * 2
        wall.zIndex = 1
        app.stage.addChild(wall)
        walls.push(wall)
    }

    function updateBuildings() {
        buildings.forEach((build, idx) => {
            const b = build.getBounds()
            if (b.x + b.width < 0) {
                if (build.club) {
                    isClub = false
                    isBuilding = false
                }
                app.stage.removeChild(build)
                buildings.splice(idx, 1)
                if (buildings.length === 0) afterBuilding = true
            }
        })
    }

    function randomRGB() {
        const randomBetween = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
        const r = randomBetween(0, 255);
        const g = randomBetween(0, 255);
        const b = randomBetween(0, 255);
        return (r << 16) + (g << 8) + (b);
    }

    function createClub() {
        const clubContainer = new PIXI.Container()
        const clubBack = new PIXI.Sprite(club.textures.clubBack)
        const clubFront = new PIXI.Sprite(club.textures.clubFront)
        deleteWallsAroundBuilding(zeroRight + clubBack.width / 2)
        for (let i = 1; i <= 17; i++) {
            const rand = Math.floor(Math.random() * (9 - 1 + 1) + 1)
            const laserBeam = new PIXI.AnimatedSprite(laserBeamTexture.animations[`render${rand}`])
            laserBeam.position.set(zeroRight + 526 + (i * 44), 416)
            laserBeam.tint = randomRGB()
            laserBeam.scale.y = `1.0${rand}`
            laserBeam.parentGroup = fg
            laserBeam.zOrder = 4
            laserBeam.animationSpeed = 0.01 * rand + 0.01
            laserBeam.alpha = 0.9
            laserBeam.play()
            clubContainer.addChild(laserBeam)
        }
        if (Math.random() < 0.5) {
            spawnCoverInClub(zeroRight + 190, 0)
        }
        if (Math.random() < 0.5) {
            spawnCoverInClub(zeroRight + 410, 1)
        }
        if (Math.random() < 0.5) {
            spawnCoverInClub(zeroRight + 540, 1)
        }
        if (Math.random() < 0.5) {
            spawnCoverInClub(zeroRight + 840, 0)
        }
        if (Math.random() < 0.5) {
            spawnCoverInClub(zeroRight + 1300, 0)
        }
        if (Math.random() < 0.5) {
            spawnCoverInClub(zeroRight + 1600, 2)
        }
        if (Math.random() < 0.5) {
            spawnCoverInClub(zeroRight + 1900, 2)
        }
        clubBack.anchor.set(0.5)
        clubFront.anchor.set(0.5)
        clubFront.parentGroup = fg
        clubFront.zOrder = 5
        clubBack.position.set(zeroRight + clubBack.width / 2, 485)
        clubFront.position.set(zeroRight + clubFront.width / 2, 485)
        clubContainer.club = true
        clubContainer.addChild(clubBack)
        clubContainer.addChild(clubFront)
        const bounds = clubContainer.getLocalBounds()
        const resetSpawnZones = [
            {
                x: bounds.x - 100,
                w: bounds.x + 100
            },
            {
                x: clubBack.x + 400,
                w: clubBack.x + 500
            },
            {
                x: clubBack.x - 500,
                w: clubBack.x - 400
            },
            {
                x: bounds.x + bounds.width - 50,
                w: bounds.x + bounds.width + 50
            }
        ]
        clubContainer.resetSpawnZones = resetSpawnZones
        app.stage.addChild(clubContainer)
        buildings.push(clubContainer)
    }

    function spawnCoverInClub(pos, type) {
        const wall = new PIXI.Sprite(inClubTexture.textures[`inClub-${type}`])
        switch (true) {
            case type === 0:
                wall.bound = 30
                wall.position.set(pos, CANVAS_HEIGHT - 236)
            break
            case type === 1:
                wall.bound = 50
                wall.position.set(pos, CANVAS_HEIGHT - 240)
            break
            case type === 2:
                wall.bound = 30
                wall.position.set(pos, CANVAS_HEIGHT - 230)
            break
        }
        wall.anchor.set(0.5)
        wall.height = wall.height * 2
        wall.width = wall.width * 2
        wall.zIndex = 1
        app.stage.addChild(wall)
        walls.push(wall)
    }

    function spawnBounceParticle(char, particleType) {
        const particle = new PIXI.Sprite(bounceParticlesTexture.textures[particleType])
        particle.scale.x = 2
        particle.scale.y = 2
        if (secondFloor) {
            particle.edge = Math.floor(Math.random() * (490 - 470 + 1) + 470)
        } else {
            particle.edge = Math.floor(Math.random() * (680 - 660 + 1) + 660)
        }
        particle.anchor.set(0.5)
        particle.position.set(char.x, char.y)
        particle.lifeTime = 500

        particle.body = Matter.Bodies.rectangle(particle.x, particle.y, 1, 1, {isStatic: false, restitution: 1});
        particle.rotation = Math.floor(Math.random() * (6 + 1))
        app.stage.addChild(particle)

        Matter.World.add(engine.world, particle.body);
        let randomMassX = Math.random() * particle.body.mass
        const randomMassY = Math.random() * particle.body.mass
        randomMassX *= Math.round(Math.random()) ? 1 : -1;
        Matter.Body.applyForce(particle.body, particle.body.position, {x: randomMassX / 25, y: -randomMassY / 20});

        bounceParticles.push(particle)
    }

    function updateBounceParticles() {
        bounceParticles.forEach((b, idx) => {
            b.lifeTime--
            b.position = b.body.position
            if (b.body.speed > 0.2) {
                b.rotation += 0.1
            }
            if (b.lifeTime <= 0) {
                app.stage.removeChild(b)
                Matter.World.remove(engine.world, b.body)
                bounceParticles.splice(idx, 1)
            }
        })
    }

    function spawnPhysParticles(char, particleType, floor) {
        let particle
        switch (true) {
            case particleType === 'blood':
                const randomBlood = Math.floor(Math.random() * (4 + 1))
                particle = new PIXI.Sprite(physParticlesTexture.textures[`blood-${randomBlood}`])
                particle.scale.x = 2
                particle.scale.y = 2
            break
            case particleType === 'spark':
                particle = new PIXI.Sprite(physParticlesTexture.textures['spark'])
                const particleTint = Math.floor(Math.random() * (2 + 1))
                switch (true) {
                    case particleTint === 0:
                        particle.tint = 16777011
                        break
                    case particleTint === 1:
                        particle.tint = 16777164
                        break
                    case particleTint === 2:
                        particle.tint = 16771891
                        break
                }
                const randomSize = Math.floor(Math.random() * (4 + 3))
                particle.scale.x = randomSize
                particle.scale.y = randomSize
            break
        }
        particle.type = particleType
        if (floor) {
            particle.edge = Math.floor(Math.random() * (500 - 470 + 1) + 470)
        } else {
            particle.edge = Math.floor(Math.random() * (690 - 660 + 1) + 660)
        }
        particle.anchor.set(0.5)
        particle.position.set(char.x, char.y)
        particle.body = Matter.Bodies.rectangle(particle.x, particle.y, 1, 1, {isStatic: false, isSensor: true});
        // particle.rotation = Math.floor(Math.random() * (6 + 1))
        app.stage.addChild(particle)
        Matter.World.add(engine.world, particle.body);
        let randomMassX = Math.random() * particle.body.mass
        const randomMassY = Math.random() * particle.body.mass
        randomMassX *= Math.round(Math.random()) ? 1 : -1;
        Matter.Body.applyForce(particle.body, particle.body.position, {x: randomMassX / 25, y: -randomMassY / 25});
        physParticles.push(particle)
    }

    function updatePhysParticles() {
        physParticles.forEach((b, idx) => {
            if (!b.stop) {
                b.position = b.body.position;
                if (b.type !== 'blood') {
                    b.rotation = b.body.angle;
                }
                if (b.position.y > b.edge) {
                    b.stop = true
                    if (b.type === 'spark') {
                        b.scale.y = 3
                        b.scale.x = 3
                        return
                    }
                    b.scale.y = 1
                }
            }
            if (b.position.x < zeroLeft) {
                app.stage.removeChild(b)
                Matter.World.remove(engine.world, b.body);
                physParticles.splice(idx, 1)
            }
        })
    }

    async function enemyShooting(char) {
        const warning = new PIXI.Sprite(particles.textures.detection)
        warning.zIndex = 20
        warning.anchor.set(0.5)
        warning.tint = 16776960
        warning.scale.x = 1.5
        warning.scale.y = 2
        warning.position.set(char.x, char.y - 40)
        char.params.warning = warning
        app.stage.addChild(warning)
        //prepare
        await sleep(Math.floor(Math.random() * (char.params.warningMax - char.params.warningMin + 1)) + char.params.warningMin)
        if (char.params.dead) return
        warning.tint = 16711680
        //shoot
        await sleep(200)
        if (char.params.dead) return
        shot(char, 0, 0)
        enemyShotAnim(char, 1)
        app.stage.removeChild(warning)
        //reload
        await sleep(Math.floor(Math.random() * (char.params.reloadMax - char.params.reloadMin + 1)) + char.params.reloadMin)
        if (char.params.dead) return
        char.params.detect = false
    }

    function enemyShotAnim(char, times) {
        char.textures = char.params.animset.shot
        char.play()
        setTimeout(() => {
            if (char.params.dead) return
            char.textures = char.params.animset.idle
            char.play()
        }, times * 200)
    }

    function createBoss(type) {
        createWall(zeroRight - 300, true)
        const boss = new PIXI.AnimatedSprite(eval(type).animations.idle)
        boss.anchor.set(0.5)
        boss.animationSpeed = 0.15
        boss.zIndex = 8
        boss.position.set(zeroRight, playerPos - (type === 'bossVan' ? 36 : 10))
        boss.params = {
            animset: eval(type).animations
        }
        Object.keys(enemyParams[type]).forEach(item => {
            boss.params[item] = enemyParams[type][item]
        })
        boss.zIndex = 10
        boss.type = type
        currentBoss = boss
        app.stage.addChild(currentBoss)
        boss.play()
    }

    async function bossShooting() {
        const warning = new PIXI.Sprite(particles.textures.detection)
        warning.zIndex = 20
        warning.anchor.set(0.5)
        warning.tint = 16776960
        warning.scale.x = 1.5
        warning.scale.y = 2
        warning.position.set(currentBoss.x, currentBoss.y - 40)
        currentBoss.params.warning = warning
        app.stage.addChild(warning)
        let fireTimes = 1
        if (currentBoss.params.rapidFire) {
            fireTimes = Math.floor(Math.random() * (currentBoss.params.rapidFire - 1 + 1)) + 1
        }
        let walking
        //prepare
        await sleep(Math.floor(Math.random() * (currentBoss.params.warningMax - currentBoss.params.warningMin + 1)) + currentBoss.params.warningMin)
        if (!currentBoss || currentBoss.params.dead) return
        warning.tint = 16711680
        //shoot
        await sleep(200)
        app.stage.removeChild(warning)
        if (!currentBoss || currentBoss.params.dead) return
        switch (true) {
            case currentBoss.type === 'bossVan':
                currentBoss.textures = currentBoss.params.animset.fromIdle
                currentBoss.play()
                await sleep(200)
                if (!currentBoss || currentBoss.params.dead) return
                currentBoss.textures = currentBoss.params.animset.shot
                currentBoss.play()
                shotRapid(currentBoss, 36, 12, fireTimes)
                await sleep(50)
                shotRapid(currentBoss, 34, 40, fireTimes)
                await sleep(100)
                await shotRapid(currentBoss, 106, 20, fireTimes)
                if (!currentBoss || currentBoss.params.dead) return
                currentBoss.textures = currentBoss.params.animset.toIdle
                currentBoss.play()
                await sleep(200)
                if (!currentBoss || currentBoss.params.dead) return
                currentBoss.textures = currentBoss.params.animset.idle
                currentBoss.play()
            break
            case currentBoss.type === 'bossGun':
                enemyShotAnim(currentBoss, fireTimes)
                await shotRapid(currentBoss, 6, 16, fireTimes)
                if (currentBoss.params.walk && (currentBoss || !currentBoss.params.dead)) {
                    currentBoss.textures = currentBoss.params.animset.walk
                    currentBoss.play()
                    walking = setInterval(() => {
                        if (!currentBoss || currentBoss.params.dead) return
                        currentBoss.x -= 0.5
                    }, 10)
                }
            break
            case currentBoss.type === 'bossSmg':
                enemyShotAnim(currentBoss, fireTimes)
                await shotRapid(currentBoss, 0, -2, fireTimes)
            break
            case currentBoss.type === 'bossLauncher':
                enemyShotAnim(currentBoss, fireTimes)
                shotGrenade(currentBoss)
                await sleep(200)
            break
        }
        //reload
        await sleep(Math.floor(Math.random() * (currentBoss.params.reloadMax - currentBoss.params.reloadMin + 1)) + currentBoss.params.reloadMin)
        if (!currentBoss || currentBoss.params.dead) return
        if (currentBoss.params.walk) {
            clearInterval(walking)
            currentBoss.textures = currentBoss.params.animset.idle
            currentBoss.play()
        }
        bossShooting()
    }

    async function shotRapid(char, offsetX, offsetY, times) {
        const repeat = setInterval(() => {
            if (char.params.dead) return
            shot(char, offsetX, offsetY)
        }, 200)
        return new Promise(function(resolve) {
            setTimeout(function() {
                clearInterval(repeat)
                resolve()
            }, times * 250);
        });
    }

    function shotGrenade(char) {
        const grenade = new PIXI.Sprite(bounceParticlesTexture.textures.grenade)
        grenade.scale.set(2)
        grenade.anchor.set(0.5)
        grenade.position.set(char.x, char.y)

        grenade.body = Matter.Bodies.rectangle(grenade.x, grenade.y, 10, 4, {isStatic: false, restitution: 1});
        app.stage.addChild(grenade)

        Matter.World.add(engine.world, grenade.body);
        let randomMassX = Math.random() * grenade.body.mass
        Matter.Body.applyForce(grenade.body, grenade.body.position, {x: randomMassX / 25, y: 0});
        bounceParticles.push(grenade)
    }

    function updateBoss() {
        if (currentBoss.x + currentBoss.width < zeroLeft) {
            app.stage.removeChild(currentBoss)
            currentBoss = null
            return
        }
        if (currentBoss.params.dead) {
            playerState.inBossFight = false
            return
        }
        if (!currentBoss.params.detect) {
            if (playerState.inBossFight) {
                currentBoss.params.detect = playerState.inBossFight
                bossShooting()
            }
        }
        if (!currentBoss.skip && currentBoss.params.melee) {
            if (player.x + 20 > currentBoss.x) {
                currentBoss.skip = true
                playerState.inBossFight = false
                damagePlayer()
            }
        }
        playerBullets.forEach((bullet, idx) => {
            if (currentBoss.x + currentBoss.width > bullet.x && currentBoss.x < bullet.x && currentBoss.y - currentBoss.height / 2 < bullet.y && currentBoss.y + currentBoss.height / 2 > bullet.y) {
                app.stage.removeChild(bullet)
                playerBullets.splice(idx, 1)
                if (currentBoss.x - player.x < 200) {
                    damageEnemy(currentBoss,2, true)
                } else {
                    damageEnemy(currentBoss,1, true)
                }
            }
        })
    }

    function createEnemy() {
        let randomPos = zeroRight + Math.floor(Math.random() * (250 - 50 + 1) + 50)
        let isSecondFloor = false

        buildings.forEach(build => {
            build.resetSpawnZones.forEach(zone => {
                if (randomPos > zone.x && randomPos < zone.w) {
                    randomPos += 100
                    return
                }
            })
        })

        if (buildings.length > 0) {
            const building = buildings[0]
            if (building.secondFloor) {
                const firstBound = building.getLocalBounds()
                const lastBound = buildings[buildings.length - 1].getLocalBounds()
                console.log(randomPos)
                if (randomPos > firstBound.x && randomPos < lastBound.x + lastBound.width) {
                    console.log('second')
                    isSecondFloor = true
                }
            }
        }

        const enemy = new PIXI.AnimatedSprite(defaultEnemy.animations.idle)
        enemy.params = {}
        Object.keys(enemyParams.default).forEach(item => {
            enemy.params[item] = enemyParams.default[item]
        })
        enemy.params.animset = defaultEnemy.animations
        enemy.anchor.set(0.5)
        enemy.scale.x = 2
        enemy.scale.y = 2
        enemy.animationSpeed = 0.2
        enemy.zIndex = 8
        enemy.position.set(randomPos, isSecondFloor ? secondFloor : playerPos)
        enemy.secondFloor = isSecondFloor
        app.stage.addChild(enemy)
        enemy.play()
        enemies.push(enemy)
    }

    function damageEnemy(enemy, damage, isBoss) {
        enemy.params.health -= damage
        for (let i = 0; i < 20; i++) {
            spawnPhysParticles(enemy, isBoss ? 'spark' : 'blood', enemy.secondFloor)
        }
        if (enemy.params.health <= 0) {
            if (enemy.params.detect) {
                app.stage.removeChild(enemy.params.warning)
            }
            if (enemy.params.deathType) {
                switch (true) {
                    case enemy.params.deathType === 'smallExplode':
                        createExplode(enemy, 0, 0, false)
                    break
                    case enemy.params.deathType === 'bigExplode':
                        createExplode(enemy, -28, -24, true)
                    break
                }
            }
            enemy.params.dead = true
            enemy.loop = false
            if (damage > 1 || isBoss) {
                enemy.textures = enemy.params.animset.deathCrit || enemy.params.animset.death
                for (let i = 0; i < 20; i++) {
                    spawnPhysParticles(enemy, 'blood', enemy.secondFloor)
                }
            } else {
                enemy.textures = enemy.params.animset.death
            }
            enemy.play()
        }
    }

    function updateEnemies() {
        enemies.forEach((enemy, idx) => {
            if (!enemy.params.dead) {
                if (!enemy.params.detect) {
                    const checkTraps = traps.find(trap => {
                        if (!trap.dead && trap.type) {
                            if (trap.x + trap.width > enemy.x - enemy.params.detectRange && enemy.x + enemy.width > trap.x) {
                                return true
                            }
                        } else {
                            return false
                        }
                    })
                    if (!checkTraps) {
                        if (enemy.x - player.x < enemy.params.detectRange) {
                            enemy.params.detect = true
                            enemyShooting(enemy)
                        }
                    }
                }
                playerBullets.forEach((bullet, idx) => {
                    if (enemy.x + enemy.width > bullet.x && enemy.x < bullet.x && enemy.y - enemy.height / 2 < bullet.y && enemy.y + enemy.height / 2 > bullet.y) {
                        app.stage.removeChild(bullet)
                        playerBullets.splice(idx, 1)
                        if (enemy.x - player.x < 200) {
                            damageEnemy(enemy,2)
                        } else {
                            damageEnemy(enemy,1)
                        }
                    }
                })
                if (!enemy.skip && (player.x > enemy.x - 50 && player.x + player.width < enemy.x + enemy.width)) {
                    if (!meleeKill && (playerState.state === 'roll' || playerState.state === 'rollEnd')) {
                        UImeleeKill(enemy)
                    } else {
                        damagePlayer()
                    }
                    enemy.skip = true
                }
            }
            if (enemy.x + enemy.width < zeroLeft) {
                app.stage.removeChild(enemy)
                enemies.splice(idx, 1)
            }
        })
    }

    function createFloor(idx) {
        const part = new PIXI.Container()
        const floor = new PIXI.Sprite(textures.textures.ground)
        floor.position.set((floorPosition + idx) * floor.width, CANVAS_HEIGHT - floor.height + 60)
        let bgWall
        const randomWall = Math.floor(Math.random() * (10 - 1 + 1) + 1)
        if (randomWall < fenceChance) {
            if (!isFence) {
                bgWall = new PIXI.Sprite(textures.textures.groundFenceStart)
            } else {
                bgWall = new PIXI.Sprite(textures.textures.groundFenceMiddle)
            }
            isFence = true
        } else {
            if (isFence) {
                bgWall = new PIXI.Sprite(textures.textures.groundFenceEnd)
            } else {
                bgWall = new PIXI.Sprite(textures.textures.groundWall)
            }
            isFence = false
        }
        floor.body = Matter.Bodies.rectangle(floor.x, playerPos + 40, floor.width + 10, 40, {isStatic: true});
        bgWall.position.set((floorPosition + idx) * bgWall.width, CANVAS_HEIGHT - floor.height + 60)
        part.addChild(floor)
        part.addChild(bgWall)
        ground.addChild(part)
        Matter.World.add(engine.world, floor.body);
    }

    function updateFloor() {
        if (zeroLeft - ground.getLocalBounds().x >= 192) {
            floorPosition++
            Matter.World.remove(engine.world, ground.getChildAt(0).children[0].body);
            ground.removeChildAt(0)
            createFloor(3)
            spawnEntity()
        }
    }

    function createBg(img) {
        const tiling = new PIXI.TilingSprite(img, 550, 1920)
        tiling.position.set(0,-400)
        app.stage.addChild(tiling)
        return tiling
    }

    function updateBg() {
        bgPosition -= (bgSpeed * playerSpeed) * gameSpeed
        background.x = zeroLeft
        background.tilePosition.x = bgPosition
    }

    function createBochka() {
        const randomPos = zeroRight + Math.floor(Math.random() * (250 - 100 + 1) + 100)
        const bochkaContainer = new PIXI.Container()
        if (buildings.length > 0) {
            const buildStart = buildings[0]
            const buildEnd = buildings[buildings.length - 1]
            if (randomPos + 40 > buildStart.x - buildStart.width / 2 && randomPos < buildEnd.x + buildEnd.width / 2) {
                return
            }
        }
        const bochkaTop = new PIXI.AnimatedSprite(bochka.animations.bochkaTop)
        const bochkaDown = new PIXI.AnimatedSprite(bochka.animations.bochkaDown)
        bochkaTop.scale = 2
        bochkaDown.scale = 2
        bochkaTop.loop = false
        bochkaDown.loop = false
        bochkaTop.animationSpeed = 0.2
        bochkaDown.animationSpeed = 0.2
        bochkaDown.anchor.set(0.5)
        bochkaTop.anchor.set(0.5)
        bochkaDown.parentGroup = fg
        bochkaDown.zOrder = 5
        bochkaTop.position.set(randomPos, CANVAS_HEIGHT - 210)
        bochkaDown.position.set(randomPos, CANVAS_HEIGHT - 204)
        bochkaContainer.addChild(bochkaTop)
        bochkaContainer.addChild(bochkaDown)
        app.stage.addChild(bochkaContainer)
        traps.push(bochkaContainer)
    }

    function createExplode(target, offsetX, offsetY, isBig) {
        const explode = new PIXI.AnimatedSprite(isBig ? bigExplode.animations.explode : bochka.animations.smallExplode)
        explode.zIndex = target.zIndex
        explode.loop = false
        explode.anchor.set(0.5)
        explode.height = explode.height * 3
        explode.width = explode.width * 3
        explode.animationSpeed = isBig ? 0.25 : 0.4
        explode.position.set(target.x + offsetX, target.y + offsetY)
        app.stage.addChild(explode)
        explode.play()
        explode.onComplete = () => {
            app.stage.removeChild(explode)
        }
    }

    function barrelDead(barrel) {
        const b = barrel.getBounds()
        enemies.forEach(enemy => {
            const e = enemy.getBounds()
            if (e.x + e.width > b.x - 100 && e.x < b.x + 100) {
                if (enemy.params.dead) return
                damageEnemy(enemy, 4)
            }
        })
        const p = player.getBounds()
        if (p.x + p.width > b.x && p.x + 40 < b.x + 100) {
            damagePlayer()
        }
        barrel.dead = true
        barrel.children[0].textures = bochka.animations.bochkaTopDead
        barrel.children[1].textures = bochka.animations.bochkaDownDead
        barrel.children[0].play()
        barrel.children[1].play()
        for (let i = 0; i < 20; i++) {
            spawnPhysParticles(barrel.children[0], 'spark')
        }
        createExplode(barrel.children[0], -20, 10, false)
        createExplode(barrel.children[1], 20, 30, false)
    }

    function updateTraps() {
        traps.forEach((trap, idx) => {
            const trapB = trap.getBounds()
            if (!trap.dead) {
                const p = player.getBounds()
                if (p.x + p.width > trapB.x + 56 && p.x < trapB.x + 40) {
                    if (trap.type === 'window') {
                        trap.play()
                        trap.dead = true
                    } else {
                        if (playerState.state === 'roll' || playerState.state === 'rollEnd') return
                        barrelDead(trap)
                    }
                }
                playerBullets.forEach((bullet, bulletIdx) => {
                    const bulletBound = bullet.getBounds()
                    if (bulletBound.x > trapB.x && bulletBound.x < trapB.x + trapB.width && bulletBound.y > trapB.y && bulletBound.y < trapB.y + trapB.height) {
                        app.stage.removeChild(bullet)
                        playerBullets.splice(bulletIdx, 1)
                        if (trap.type === 'window') {
                            trap.play()
                            trap.dead = true
                        } else {
                            barrelDead(trap)
                        }
                    }
                })
            }
            if (trapB.x + trapB.width < 0) {
                app.stage.removeChild(trap)
                traps.splice(idx, 1)
            }
        })
    }

    function createWindow(pos) {
        const window = new PIXI.AnimatedSprite(windowTexture.animations.window)
        window.loop = false
        window.animationSpeed = 0.6
        window.anchor.set(0.5)
        window.position.set(pos, 445)
        window.zIndex = 1
        window.type = 'window'
        app.stage.addChild(window)
        traps.push(window)
    }

    function createDoor(pos, secondFloor) {
        const door = new PIXI.AnimatedSprite(doorTexture.animations.door)
        door.loop = false
        door.animationSpeed = 0.6
        door.anchor.set(0.5)
        door.position.set(pos, secondFloor ? 439 : 629)
        door.zIndex = 1
        door.type = 'window'
        app.stage.addChild(door)
        traps.push(door)
    }

    function detectWall() {
        let p = player.getBounds()
        return walls.find(w => {
            let wall = w.getBounds()
            if (p.x + p.width > wall.x + w.bound && p.x < wall.x) {
                return w
            }
        })
    }

    function createWall(pos, forBoss) {
        let wall
        const randomPos = pos || zeroRight + Math.floor(Math.random() * (250 - 100 + 1) + 100)

        if (buildings.length > 0) {
            const buildSize = buildings[buildings.length - 1].getLocalBounds()
            console.log(`${buildSize.x - 100} > ${randomPos} < ${buildSize.x + buildSize.width + 100}`)
            if (randomPos > buildSize.x - 100 &&
                randomPos < buildSize.x + buildSize.width + 100) {
                return
            }
        }
        if (walls.length > 0) {
            const wallSize = walls[walls.length - 1].getLocalBounds()
            if (randomPos > wallSize.x - 100 &&
                randomPos < wallSize.x + wallSize.width + 100) {
                return
            }
        }
        const randomWall = Math.floor(Math.random() * (10 - 1 + 1) + 1)
        if (randomWall < 4) {
            wall = new PIXI.Sprite(textures.textures.coverTrash)
            wall.position.set(randomPos, CANVAS_HEIGHT - 240)
            wall.bound = 20
        } else {
            wall = new PIXI.Sprite(textures.textures.wall)
            wall.position.set(randomPos, CANVAS_HEIGHT - 232)
            wall.bound = 30
        }
        if (forBoss) {
            wall.forBoss = true
        }
        wall.anchor.set(0.5)
        app.stage.addChild(wall)
        walls.push(wall)
    }

    function updateWall() {
        walls.forEach((wall, idx) => {
            if (wall.x + 100 < zeroLeft) {
                app.stage.removeChild(wall)
                walls.splice(idx, 1)
            }
        })
    }

    function shot(char, offsetX, offsetY) {
        const shot = new PIXI.AnimatedSprite(particles.animations.gunShot)
        shot.anchor.set(0.5)
        shot.scale.x = 1.2
        shot.scale.y = 1.2
        shot.animationSpeed = 0.2
        shot.zIndex = 11
        if (char) {
            shot.position.set(((char.x + 4) - char.width / 2) + offsetX, (char.y - 10) + offsetY)
            enemyBullets.push(spawnBullet(shot.x, shot.y, char))
        } else {
            shot.position.set(player.x + 30, player.y - 12)
            playerBullets.push(spawnBullet(shot.x, shot.y))
        }
        spawnBounceParticle(shot, 'shell')
        app.stage.addChild(shot)
        shot.play()
        setTimeout(() => {
            app.stage.removeChild(shot)
        }, 150)
    }

    function spawnBullet(x, y, char) {
        const bullet = new PIXI.Sprite(particles.textures.bullet)
        bullet.anchor.set(0.5)
        bullet.zIndex = 11
        bullet.scale.x = 1.5
        bullet.scale.y = 2
        bullet.position.set(char ? x - 14 : x + 14, y)
        let rotate = Math.random() * (char ? char.params.angle : gun.angle)
        rotate *= Math.round(Math.random()) ? 1 : -1;
        bullet.rotation = rotate
        app.stage.addChild(bullet)
        return bullet
    }

    function updateBullets() {
        enemyBullets.forEach((b, idx) => {
            b.position.x -= (Math.cos(b.rotation) * bulletSpeed) * gameSpeed;
            b.position.y -= (Math.sin(b.rotation) * bulletSpeed) * gameSpeed;

            if (b.position.x < zeroLeft || b.position.x > zeroRight) {
                app.stage.removeChild(b)
                enemyBullets.splice(idx, 1)
            }
        })
        playerBullets.forEach((b, idx) => {
            b.position.x += (Math.cos(b.rotation) * bulletSpeed) * gameSpeed;
            b.position.y += (Math.sin(b.rotation) * bulletSpeed) * gameSpeed;

            if (b.position.x < zeroLeft || b.position.x > zeroRight) {
                app.stage.removeChild(b)
                playerBullets.splice(idx, 1)
            }
        })
    }

    function playAnim(anim) {
        if (!anim) {
            playerState.state = ""
            player.textures = character.animations.run
            player.tint = player.color
            player.play()
        } else {
            if (anim === 'roll' || anim === 'rollEnd') {
                player.tint = player.shadow
            } else {
                if (playerState.inCover && anim !== 'shot') {
                    player.tint = player.shadow
                } else {
                    player.tint = player.color
                }
            }
            if (anim === 'idle' || anim === 'zipLine') {
                if (anim === 'idle') {
                    player.y = playerState.secondFloor ? secondFloor - 10 : playerPos - 10
                }
                playerState.state = ''
            } else {
                playerState.state = anim
            }
            player.textures = character.animations[anim]
            player.play()
        }
    }

    function events(e) {
        if (playerState.inZipLine) return
        switch (true) {
            //RELOAD
            case e.code === 'KeyR':
                if ((!playerState.state || playerState.state === 'rollEnd') && gun.ammo < 5) {
                    playAnim('reload')
                    playerSpeed = 0
                    spawnBounceParticle(player, 'mag')
                    setTimeout(() => {
                        gun.ammo = 5
                        if (playerState.inCover) {
                            playAnim('idle')
                            return
                        }
                        playerSpeed = playerDefaultSpeed
                        playAnim()
                    }, 1100)
                }
            break
            //ROLL
            case e.code === 'Space':
                if (!playerState.state && !playerState.inBossFight) {
                    playAnim('roll')
                    playerSpeed = playerDefaultSpeed + 1.5
                    const rollTime = 25
                    const rollEndTime = 65
                    let rollCounter = 0
                    const rollInterval = setInterval(() => {
                        if (!(gameSpeed < 1 && playerState.state === 'rollEnd')) {
                            rollCounter++
                        }
                        if (playerState.inZipLine || (playerState.state !== 'rollEnd' && playerState.state !== 'roll')) {
                            clearInterval(rollInterval)
                        }
                        if (rollCounter === rollTime) {
                            if (playerState.inCover) {
                                playerState.inCover = false
                                player.y = playerState.secondFloor ? secondFloor : playerPos
                            }
                            playAnim('rollEnd')
                        }
                        if (rollCounter >= rollEndTime) {
                            if (playerState.inCover === true) clearInterval(rollInterval)
                            playerSpeed = playerDefaultSpeed
                            playAnim()
                            clearInterval(rollInterval)
                        }

                    }, 10)
                }
            break
            //SHOT
            case e.code === 'KeyF':
                if (meleeKill) {
                    setMeleeSelector()
                    return
                }
                if ((!playerState.state || playerState.state === 'rollEnd') && gun.ammo > 0) {
                    if (playerState.inCover) {
                        player.y = playerState.secondFloor ? secondFloor : playerPos
                        player.tint = player.color
                    }
                    gun.ammo--
                    playAnim('shot')
                    shot()
                    playerSpeed = 0
                    setTimeout(() => {
                        if (playerState.inCover) {
                            playAnim('idle')
                            return
                        }
                        playerSpeed = playerDefaultSpeed
                        playAnim()
                    }, 150)
                }
            break
            case e.code === 'KeyQ':
                if (playerSpeed) {
                    playerSpeed = 0
                } else {
                    playerSpeed = playerDefaultSpeed
                }
                break
        }
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

