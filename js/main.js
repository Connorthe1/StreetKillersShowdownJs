import {default as enemyParams} from './enemyParams.js'
import {default as sounds} from './sounds.js'
import { soundPlayer } from './playSound.js'

let gameWidth
let gameHeight
if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|BB|PlayBook|IEMobile|Windows Phone|Kindle|Silk|Opera Mini/i.test(navigator.userAgent)) {
    gameWidth = screen.width
    gameHeight = screen.height
} else {
    gameWidth = document.documentElement.clientWidth;
    gameHeight = document.documentElement.clientHeight;
}
const CANVAS_WIDTH = gameWidth / 1.4;
const CANVAS_HEIGHT = gameHeight / 1.35;
let zeroLeft = 0
let zeroRight = CANVAS_WIDTH
let gameSpeed = 1

const playerState = {
    state: '',
    afterRoll: true,
    inCover: false,
    invincible: false,
    inZipLine: false,
    inBossFight: false,
    health: 3,
}
const gameState = {
    points: 0,
    pointsToAdd: 0,
    kills: 0,
    score: 'F',
    multiplier: 1,
    scoreStreak: 0
}
const canHealth = 1
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

let world
let ground
let hud
let stepSound = 0
let floorPosition = 0
const fenceChance = 4
let isFence = false
let isBuilding = false
let afterBuilding = 0
let isClub = false
const buildingChance = 2
let buildingType = 0

const gun = {
    currentAmmo: 5,
    ammo: 5,
    angle: 0.2,
    type: 'pistol'
}

const textStyles = {
    default180:  new PIXI.TextStyle({
        fontFamily: 'ACastle3',
        fontSize: 180,
        fill: '#ffffff',
        wordWrap: true,
        wordWrapWidth: gameWidth - 100,
        align: 'center',
    }),
    default60:  new PIXI.TextStyle({
        fontFamily: 'ACastle3',
        fontSize: 60,
        fill: '#ffffff',
        wordWrap: true,
        wordWrapWidth: gameWidth - 100,
        align: 'center',
    }),
    default80:  new PIXI.TextStyle({
        fontFamily: 'ACastle3',
        fontSize: 80,
        fill: '#ffffff',
        wordWrap: true,
        wordWrapWidth: gameWidth - 100,
        align: 'center',
    }),
    default100:  new PIXI.TextStyle({
        fontFamily: 'ACastle3',
        fontSize: 100,
        fill: '#ffffff',
        wordWrap: true,
        wordWrapWidth: gameWidth - 100,
        align: 'center',
    }),
    default40:  new PIXI.TextStyle({
        fontFamily: 'ACastle3',
        fontSize: 40,
        fill: '#ffffff',
        wordWrap: true,
        wordWrapWidth: gameWidth - 100,
        align: 'center',
    }),
    default30:  new PIXI.TextStyle({
        fontFamily: 'ACastle3',
        fontSize: 30,
        fill: '#ffffff',
        wordWrap: true,
        wordWrapWidth: gameWidth - 100,
        align: 'center',
        lineHeight: 20
    }),
    default56:  new PIXI.TextStyle({
        fontFamily: 'ACastle3',
        fontSize: 56,
        fill: '#ffffff',
        wordWrap: true,
        wordWrapWidth: gameWidth - 100,
        align: 'center',
    }),
    green60:  new PIXI.TextStyle({
        fontFamily: 'ACastle3',
        fontSize: 60,
        fill: '#81ff6e',
        wordWrap: true,
        wordWrapWidth: gameWidth - 100,
        align: 'center',
    }),
}

const walls = []
const traps = []
const enemies = []
const physParticles = []
const bounceParticles = []
const buildings = []
const trails = []
const zipLines = []
const grenades = []
const puddles = []
const garbages = []
let currentBoss = null
let bgCar = null
let currentDogEnemy = null
let currentCan = null

let engine
let fg
let hudLayer

let isPause = false
let isMenu = true
let gameStart = false
let gameEnd = false

window.onload = async function () {
    VK.init(function() {
        console.log('vk init')
        VK.api("storage.set", {key: 'money', value: 99, test_mode: 1}, function (data) {
            console.log(data.response)
        });
        VK.api("storage.get",{key: 'money', test_mode: 1}, function (data) {
            console.log(data.response)
        });
    }, function() {
        console.log('vk error')
    }, '5.131');
    console.log(gameWidth)
    console.log(gameHeight)
    const app = new PIXI.Application({
        width: gameWidth,
        height: gameHeight,
        backgroundColor: 'black',
    })
    app.stage = new PIXI.layers.Stage()
    document.body.appendChild(app.view)
    engine = Matter.Engine.create();
    engine.timing.timeScale = 0.5;
    app.stage.sortableChildren = true;
    const loader = PIXI.Assets

    hudLayer = new PIXI.layers.Group(99, true)
    app.stage.addChild(new PIXI.layers.Layer(hudLayer));

    PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
    PIXI.sound.volumeAll = 0.05

    const loaderView = new PIXI.Container()
    app.stage.addChild(loaderView)
    const loaderGif = await loader.load('./src/loading/loader.json');
    const logo = await loader.load('./src/loading/logopng.png');
    const logoSprite = new PIXI.Sprite(logo)
    logoSprite.width = gameWidth
    logoSprite.height = gameHeight
    loaderView.addChild(logoSprite)
    const loaderSprite = new PIXI.AnimatedSprite(loaderGif.animations.loader)
    loaderSprite.animationSpeed = 0.5
    loaderSprite.anchor.set(0.5)
    loaderSprite.position.set(gameWidth / 2, gameHeight - 200)
    loaderSprite.play()
    loaderView.addChild(loaderSprite)

    await loader.load('./src/fonts/anothercastle3.ttf');
    PIXI.Assets.addBundle('sounds', sounds);
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
    const enemiesTexture = await loader.load('./src/enemies/enemies.json');
    const dogEnemy = await loader.load('./src/enemies/dog.json');
    const bossGun = await loader.load('./src/enemies/bossGun.json');
    const bossLauncher = await loader.load('./src/enemies/bossLauncher.json');
    const bossVan = await loader.load('./src/enemies/bossVan.json');
    const bossSmg = await loader.load('./src/enemies/bossSmg.json');
    const particles = await loader.load('./src/particles/particles.json');
    const bigExplode = await loader.load('./src/particles/bigExplode.json');
    const physParticlesTexture = await loader.load('./src/particles/physParticles.json');
    const bounceParticlesTexture = await loader.load('./src/particles/bounceParticles.json');
    const bochka = await loader.load('./src/entity/bochka.json');
    const canTexture = await loader.load('./src/entity/can.json');
    const windowTexture = await loader.load('./src/entity/window.json');
    const doorTexture = await loader.load('./src/entity/door.json');
    const bgCarTexture = await loader.load('./src/textures/bgCar.json');
    const puddleTexture = await loader.load('./src/entity/puddle.json');
    const garbageTexture = await loader.load('./src/entity/garbage.json');
    const activeItems = await loader.load('./src/hud/activeItems.json');
    const menuButtons = await loader.load('./src/hud/menuButtons.json')
    const menuIcons = await loader.load('./src/hud/menuIcons.json')
    const menuPause = await loader.load('./src/hud/menuPause.json')
    const menuUI = await loader.load('./src/hud/menuUI.json')
    await PIXI.Assets.loadBundle('sounds')
    // await character.parse();

    const bg = await loader.load('./src/BG.png')
    app.stage.removeChild(loaderView)
    init()

    function init() {
        world = new PIXI.Container()
        world.name = 'world'
        app.stage.addChild(world)
        world.sortableChildren = true;
        world.scale.set(1.4)
        fg = new PIXI.layers.Group(9, true)
        world.addChild(new PIXI.layers.Layer(fg));

        hud = new PIXI.Container()
        hud.name = 'hud'
        app.stage.addChild(hud)
        hud.sortableChildren = true;
        hud.parentGroup = hudLayer
        hud.zOrder = 99

        background = createBg(bg)
        ground = new PIXI.Container()
        ground.name = 'ground'
        world.addChild(ground)
        createMenu()

        for (let i = 0; i <= 3; i++) {
            createFloor(i, 0)
        }
    }

    function startGame() {
        HUDbullets()
        HUDpoints()
        HUDpause()
        createPlayer()
        document.addEventListener('keyup', events)
        createBochka()
        app.ticker.add(ticker)
        scoreTimer()
        trailTimer()
    }

    function restartGame() {
        app.stage.removeChild(app.stage.getChildByName('endScreen'))
        app.stage.removeChild(world)
        app.ticker.remove(ticker)
        zeroLeft = 0
        zeroRight = CANVAS_WIDTH
        gameSpeed = 1

        playerState.state = ''
        playerState.afterRoll = true
        playerState.inCover = false
        playerState.invincible = false
        playerState.inZipLine = false
        playerState.inBossFight = false
        playerState.health = 3
        gameState.points = 0
        gameState.pointsToAdd = 0
        gameState.kills = 0
        gameState.score = 'F'
        gameState.multiplier = 1
        gameState.scoreStreak = 0
        player = null
        playerBullets.length = 0
        enemyBullets.length = 0

        playerDefaultSpeed = 2
        playerSpeed = playerDefaultSpeed
        distance = 0

        background = null
        bgPosition = 0
        bgSpeed = 0.2;

        world = null
        ground = null
        hud = null
        floorPosition = 0
        isFence = false
        isBuilding = false
        afterBuilding = 0
        isClub = false
        buildingType = 0

        gun.currentAmmo = 5
        gun.ammo = 5
        gun.angle = 0.2
        gun.type = 'pistol'

        walls.length = 0
        traps.length = 0
        enemies.length = 0
        physParticles.length = 0
        bounceParticles.length = 0
        buildings.length = 0
        trails.length = 0
        zipLines.length = 0
        grenades.length = 0
        puddles.length = 0
        garbages.length = 0
        currentBoss = null
        bgCar = null
        currentDogEnemy = null
        currentCan = null

        isPause = false
        gameStart = false
        gameEnd = false
        init()
    }
    async function endGame(toRestart) {
        gameEnd = true
        app.stage.removeChild(hud)
        if (toRestart) {
            restartGame()
            return
        }
        const endScreen = new PIXI.Container()
        let skip = false
        app.stage.addChild(endScreen)
        let bg = new PIXI.Graphics();
        bg.interactive = true
        bg.beginFill(0x000);
        bg.alpha = 0.3
        bg.drawRect(0, 0, gameWidth, gameHeight);
        endScreen.addChild(bg)
        endScreen.name = 'endScreen'

        bg.on('pointerdown', (event) => {
            if (skip) return
            skip = true
        });

        const center = gameWidth / 2

        //RESULTS
        const results = new PIXI.Text('results', textStyles.default100);
        results.anchor.set(0.5);
        results.position.set(center, 100)
        endScreen.addChild(results)

        await new Promise(resolve => {
            let delay = 0
            const interval = setInterval(() => {
                delay++
                if (skip) {
                    clearInterval(interval)
                }
                if (delay > 10) {
                    resolve()
                    clearInterval(interval)
                }
            }, 10);
        });

        //SCORE
        const finalScore = new PIXI.Text('final score:', textStyles.default40);
        finalScore.anchor.set(0.5);
        finalScore.position.set(center, results.y + 70)
        endScreen.addChild(finalScore)

        const finalScoreValue = new PIXI.Text('0', textStyles.default60);
        finalScoreValue.anchor.set(0.5);
        finalScoreValue.position.set(center, finalScore.y + 40)
        endScreen.addChild(finalScoreValue)

        let initScore = 0
        const scoreUpdate = Math.floor(gameState.points / 100)
        await new Promise(resolve => {
            const interval = setInterval(() => {
                if (skip) {
                    initScore = gameState.points
                    clearInterval(interval)
                }
                initScore += Math.max(1, scoreUpdate)
                if (initScore >= gameState.points) {
                    resolve('foo');
                    initScore = gameState.points
                    clearInterval(interval)
                }
                finalScoreValue.text = initScore
            }, 10);
        });

        //DISTANCE MONEY
        const distanceMoney = new PIXI.Text('distance money:', textStyles.default40);
        distanceMoney.anchor.set(0.5);
        distanceMoney.position.set(center, finalScoreValue.y + 70)
        endScreen.addChild(distanceMoney)

        const distanceMoneyValue = new PIXI.Text('0$', textStyles.green60);
        distanceMoneyValue.anchor.set(0.5);
        distanceMoneyValue.position.set(center, distanceMoney.y + 40)
        endScreen.addChild(distanceMoneyValue)

        let initDMoney = 0
        const pointsToMoney = Math.floor(gameState.points / 50)
        const dMoneyUpdate = Math.floor(pointsToMoney / 200)
        await new Promise(resolve => {
            const interval = setInterval(() => {
                if (skip) {
                    initDMoney = pointsToMoney
                    clearInterval(interval)
                }
                initDMoney += Math.max(1, dMoneyUpdate)
                if (initDMoney >= pointsToMoney) {
                    resolve('foo');
                    initDMoney = pointsToMoney
                    clearInterval(interval)
                }
                distanceMoneyValue.text = `${initDMoney}$`
            }, 10);
        });

        //COLLECTED MONEY
        const collectedMoney = new PIXI.Text('collected money:', textStyles.default40);
        collectedMoney.anchor.set(0.5);
        collectedMoney.position.set(center, distanceMoneyValue.y + 70)
        endScreen.addChild(collectedMoney)

        const collectedMoneyValue = new PIXI.Text('0$', textStyles.green60);
        collectedMoneyValue.anchor.set(0.5);
        collectedMoneyValue.position.set(center, collectedMoney.y + 40)
        endScreen.addChild(collectedMoneyValue)

        let initCMoney = 0
        const collectedToMoney = 1000
        const cMoneyUpdate = Math.floor(collectedToMoney / 200)
        await new Promise(resolve => {
            const interval = setInterval(() => {
                if (skip) {
                    initCMoney = collectedToMoney
                    clearInterval(interval)
                }
                initCMoney += Math.max(1, cMoneyUpdate)
                if (initCMoney >= collectedToMoney) {
                    resolve('foo');
                    initCMoney = collectedToMoney
                    clearInterval(interval)
                }
                collectedMoneyValue.text = `${initCMoney}$`
            }, 10);
        });

        //AVERAGE SCORE
        const score = new PIXI.Text('F', textStyles.default180);
        score.scale.set(5)
        score.rotation = -0.2
        score.anchor.set(0.5);
        score.position.set(center, collectedMoneyValue.y + 100)
        endScreen.addChild(score)

        let scale = 5
        await new Promise(resolve => {
            const interval = setInterval(() => {
                scale-= 0.1
                score.scale.set(scale)
                if (scale <= 1) {
                    resolve('foo');
                    clearInterval(interval)
                }
            }, 10);
        });

        //EXIT
        const exit = new PIXI.Sprite(menuButtons.textures.exit)
        exit.scale.set(0.7, 0.6)
        exit.interactive = true;
        exit.anchor.set(0.5, 0)
        exit.position.set(center, score.y + 80)
        endScreen.addChild(exit)

        exit.on('pointerdown', (event) => {
            restartGame()
        });
    }

    function ticker(delta) {
        if (gameEnd || isPause) return
        if (player.x > 100) {
            gameStart = true
        }
        Matter.Engine.update(engine);
        if (meleeKill) {
            const UiBounds = meleeKill.getLocalBounds()
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
        if (gameState.pointsToAdd > 0) {
            gameState.pointsToAdd--
            gameState.points++
            hud.getChildByName('points').text = gameState.points;
        }
        hud.getChildByName('scale').text = `x${gameState.multiplier.toFixed(1)}`;
        updateScore()
        updateGarbage()
        updatePlayer(delta)
        updateBg()
        updateFloor()
        updateBullets()
        updateWall()
        updateEnemies()
        updateTraps()
        updateParticles()
        updateBounceParticles()
        updateBuildings()
        updateTrailParticle()
        updateZiplines()
        updatePuddles()
        if (currentCan) {
            updateCan()
        }
        if (currentDogEnemy) {
            updateDogEnemy()
        }
        if (grenades.length > 0) {
            updateGrenades()
        }
        if (bgCar) {
            updateBgCar()
        }
        if (currentBoss) {
            updateBoss()
        }
        if (playerState.inZipLine) {
            spawnTrailParticle(player)
            if (playerState.inZipLine === 'top') {
                player.y -= 2.2
            } else {
                player.y += 2.2
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

    function createMenu() {
        isMenu = true
        gameStart = false
        gameEnd = false
        const menu = new PIXI.Container()
        app.stage.addChild(menu)
        menu.name = 'menu'
        let bg = new PIXI.Graphics();
        bg.interactive = true
        bg.beginFill(0x000);
        bg.alpha = 0.3
        bg.drawRect(0, 0, gameWidth, gameHeight);
        menu.addChild(bg)

        const startText = new PIXI.Text('Tap to start', textStyles.default56);
        startText.anchor.set(0.5);
        startText.zIndex = 1
        startText.x = gameWidth / 2
        startText.y = gameHeight - 220;
        menu.addChild(startText)

        //TOPMENU
        const topMenu = new PIXI.Container()
        menu.addChild(topMenu)
        const topMenuBg = new PIXI.Sprite(menuButtons.textures.button)
        topMenuBg.tint = 5197647
        topMenuBg.width = gameWidth
        topMenuBg.height = 50
        topMenu.addChild(topMenuBg)

        const cup = new PIXI.Sprite(menuIcons.textures.cup)
        cup.position.set(16, 16)
        topMenu.addChild(cup)
        const topDistance = new PIXI.Text('1337', textStyles.default30);
        topDistance.position.set(52, 20)
        topMenu.addChild(topDistance)

        const money = new PIXI.Text('1337', textStyles.default30);
        money.position.set(gameWidth - 16, 20)
        money.anchor.set(1,0)
        topMenu.addChild(money)
        const moneyIcon = new PIXI.Sprite(menuIcons.textures.money)
        moneyIcon.scale.set(0.45)
        moneyIcon.anchor.set(1,0)
        moneyIcon.position.set(money.x - money.width - 10, 14)
        topMenu.addChild(moneyIcon)

        const gold = new PIXI.Text('1337', textStyles.default30);
        gold.position.set(moneyIcon.x - moneyIcon.width - 20, 20)
        gold.anchor.set(1,0)
        topMenu.addChild(gold)
        const goldIcon = new PIXI.Sprite(menuIcons.textures.goldbar)
        goldIcon.scale.set(0.3)
        goldIcon.anchor.set(1,0)
        goldIcon.position.set(gold.x - gold.width - 10, 16)
        topMenu.addChild(goldIcon)


        //STORE
        const store = new PIXI.Sprite(menuButtons.textures.shop)
        store.interactive = true;
        store.anchor.set(1, 0)
        store.position.set(gameWidth - 20, 60)
        menu.addChild(store)

        //MISSIONS
        const missions = new PIXI.Sprite(menuButtons.textures.missions)
        missions.scale.set(0.8)
        missions.interactive = true;
        missions.anchor.set(0, 0)
        missions.position.set(20, 60)
        menu.addChild(missions)


        //SETTINGS
        const settings = new PIXI.Sprite(menuUI.textures.settingsicon)
        settings.scale.set(0.6)
        settings.interactive = true;
        settings.anchor.set(1, 1)
        settings.position.set(gameWidth - 20, gameHeight - 20)
        menu.addChild(settings)


        bg.on('pointerdown', (event) => {
            if (!isMenu) return
            isMenu = false
            const menuLeft = setInterval(() => {
                menu.x -= 20
            }, 10)
            sleep(300).then(() => {
                clearInterval(menuLeft)
                startGame()
                app.stage.removeChild(menu)
            })
        });
    }

    function trailTimer() {
        const interval = setInterval(() => {
            if (gameEnd || !player) {
                clearInterval(interval)
                stepSound = 0
                return
            }
            if (playerSpeed > 0 && !isPause) {
                spawnTrailParticle(player)
                if (playerState.state === 'roll' || playerState.state === 'rollEnd') {
                    spawnTrailParticle(player)
                    spawnTrailParticle(player)
                    spawnTrailParticle(player)
                } else {
                    stepSound++
                    if (stepSound > 3) {
                        soundPlayer.footStep()
                        stepSound = 0
                    }
                }
            }
        }, 100)
    }

    function spawnEntity() {
        if (Math.random() < 0.05 && !currentDogEnemy) {
            createDogEnemy()
        }
        if (Math.random() < 0.5 && !bgCar) {
            createBgCar()
        }
        if (Math.random() < 0.2) {
            createPuddle()
        }
        if (!isClub && !currentBoss) {
            const randomBuild = Math.floor(Math.random() * (10 - 1 + 1) + 1)
            switch (true) {
                case randomBuild <= buildingChance:
                    if (isBuilding) {
                        spawnBuilding('continue')
                    } else {
                        if (buildings.length === 0) {
                            const testClub = Math.floor(Math.random() * (10 - 1 + 1) + 1)
                            isBuilding = true
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
        if (Math.random() < 0.5) {
            createEnemy()
        }
        if (Math.random() < 0.1 && !currentCan) {
            createCan()
        }
        if (!isBuilding && !currentBoss && (afterBuilding < zeroRight - CANVAS_WIDTH / 2)) {
            if (Math.random() < 0.05) {
                console.log('boss')
                createBoss()
                return
            }
            if (Math.random() < 0.3) {
                console.log('bochka')
                createBochka()
                return
            }
            if (Math.random() < 0.5) {
                console.log('wall')
                createWall()
                return
            }
        }
    }

    function setMeleeSelector(skip) {
        if (!skip) {
            const greenBarPosition = meleeKill.getChildAt(1).getBounds()
            const selectorPosition = meleeKill.getChildAt(2).getBounds()
            if (selectorPosition.x + selectorPosition.width / 2 > greenBarPosition.x && selectorPosition.x + selectorPosition.width / 2 < greenBarPosition.x + greenBarPosition.width) {
                damageEnemy(meleeKill.enemy, 100)
                traps.forEach(trap => {
                    const t = trap.getLocalBounds()
                    if (player.x > t.x && player.x < t.x + t.width) {
                        trap.dead = true
                    }
                })
                addPoints(50 + meleeKillStreak * 10)
                gameState.scoreStreak += 3 + meleeKillStreak
                meleeKillStreak += 0.5
            } else {
                damagePlayer()
            }
        } else {
            damagePlayer()
        }
        gameSpeed = 1
        hud.removeChild(meleeKill)
        meleeKill = null
        clearTimeout(meleeKillStreakTimer)
        sleep(5000).then(() => {
            if (meleeKillStreak > 0) {
                meleeKillStreak -= 0.5
            }
        })
    }

    function HUDmeleeKill(enemy) {
        gameSpeed = 0.1
        meleeKill = new PIXI.Container()
        const redBar = PIXI.Sprite.from(PIXI.Texture.WHITE);
        redBar.height = 50
        redBar.width = gameWidth / 1.5
        redBar.anchor.set(0.5)
        redBar.position.set(gameWidth / 2, gameHeight / 2)
        redBar.tint = 16731469
        const greenBar = PIXI.Sprite.from(PIXI.Texture.WHITE);
        greenBar.height = 50
        greenBar.width = gameWidth / 6
        greenBar.anchor.set(0, 0.5)
        const greenBarPosition = Math.floor(Math.random() * ((redBar.x + redBar.width / 2 - greenBar.width) - (redBar.x - redBar.width / 2)) + (redBar.x - redBar.width / 2))
        greenBar.position.set(greenBarPosition, gameHeight / 2)
        greenBar.tint = 6088284
        const selector = PIXI.Sprite.from(PIXI.Texture.WHITE);
        selector.height = 90
        selector.width = 10
        selector.anchor.set(0, 0.5)
        const selectorPosition = Math.floor(Math.random() * ((redBar.x + redBar.width / 2 - greenBar.width) - (redBar.x - redBar.width / 2)) + (redBar.x - redBar.width / 2))
        selector.position.set(selectorPosition, gameHeight / 2)
        meleeKill.enemy = enemy
        meleeKill.addChild(redBar)
        meleeKill.addChild(greenBar)
        meleeKill.addChild(selector)
        hud.addChild(meleeKill)
        meleeKillStreakTimer = setTimeout(() => {
            if (meleeKill) {
                setMeleeSelector(true)
            }
        }, 2500)
    }

    function createGarbage(posX, posY, type) {
        if (isClub) return
        const rand = type || random(1, 10)
        const garbage = new PIXI.Sprite(garbageTexture.textures[`trash${rand}`])
        garbage.type = rand
        garbage.anchor.set(0.5)
        garbage.position.set(posX, posY)
        world.addChild(garbage)
        garbages.push(garbage)
    }

    function updateGarbage() {
        garbages.forEach((garbage, idx) => {
            if (garbage.x + garbage.width < zeroLeft) {
                world.removeChild(garbage)
                garbages.splice(idx, 1)
                return;
            }
            if (garbage.type === 3 || garbage.type === 4) {
                enemyBullets.forEach(bullet => {
                    const b = bullet.getBounds()
                    const g = garbage.getBounds()
                    if (g.x > b.x && b.x + b.width > g.x && g.y > b.y && b.y + b.height > g.y) {
                        soundPlayer.glassBreak()
                        for (let i = 0; i <= 8; i++) {
                            createParticles(garbage, 'bottle')
                        }
                        world.removeChild(garbage)
                        garbages.splice(idx, 1)
                        return
                    }
                })
                playerBullets.forEach(bullet => {
                    const b = bullet.getBounds()
                    const g = garbage.getBounds()
                    if (g.x > b.x && b.x + b.width > g.x && g.y > b.y && b.y + b.height > g.y) {
                        soundPlayer.glassBreak()
                        for (let i = 0; i <= 8; i++) {
                            createParticles(garbage, 'bottle')
                        }
                        world.removeChild(garbage)
                        garbages.splice(idx, 1)
                        return
                    }
                })
            }
        })
    }

    function createPuddle() {
        if (buildings.length > 0) {
            const activeBuilding = buildings[0]
            const lastBuilding = buildings[buildings.length - 1].getLocalBounds()
            if ((lastBuilding.x + lastBuilding.width > zeroRight && activeBuilding.getLocalBounds().x < zeroRight) && (activeBuilding.secondFloor || activeBuilding.club)) {
                return
            }
        }
        const rand = random(1, 2)
        const puddle = new PIXI.Sprite(puddleTexture.textures[`puddle${rand}`])
        puddle.anchor.set(0.5)
        puddle.position.set(zeroRight + puddle.width, playerPos + 24)
        world.addChild(puddle)
        puddles.push(puddle)
    }

    function updatePuddles() {
        puddles.forEach((puddle, idx) => {
            if (puddle.x + puddle.width < zeroLeft) {
                world.removeChild(puddle)
                puddles.splice(idx, 1)
                return;
            }
            if (puddle.dead) return
            if (player.x + player.width > puddle.x + 20 && puddle.x + puddle.width > player.x) {
                puddle.dead = true
                if (playerState.state === 'roll' || playerState.state === 'rollEnd') {
                    addPoints(20)
                    gameState.scoreStreak += 1
                    playerSpeed = playerDefaultSpeed + 2.5
                    soundPlayer.waterStep()
                    for (let i = 0; i <= 20; i++) {
                        createParticles({x: puddle.x, y: puddle.y - 10}, 'drop')
                    }
                } else {
                    soundPlayer.waterStep()
                    for (let i = 0; i <= 14; i++) {
                        createParticles({x: puddle.x - 20, y: puddle.y - 10}, 'drop')
                    }
                    sleep(250).then(() => {
                        soundPlayer.waterStep()
                        for (let i = 0; i <= 14; i++) {
                            createParticles({x: puddle.x + 20, y: puddle.y - 10}, 'drop')
                        }
                    })
                }
            }
        })
    }

    function createCan() {
        const can = new PIXI.Sprite(canTexture.textures.pixelCan)
        can.width = 8
        can.height = 16
        can.position;
        can.anchor.set(0, 0.5)
        can.health = canHealth
        can.parentGroup = fg
        can.zOrder = 6
        can.body = Matter.Bodies.rectangle(zeroRight, playerPos + 20, 8, 16, {isStatic: false, restitution: 0.2, frictionAir: 0.01, chamfer: { radius: [5,5,0,0] }});
        world.addChild(can)
        Matter.World.add(engine.world, can.body);
        currentCan = can
    }

    function updateCan() {
        currentCan.position = currentCan.body.position
        currentCan.rotation = currentCan.body.angle
        if ((currentCan.x > zeroRight + 300) || (currentCan.y > CANVAS_HEIGHT) || (currentCan.x < zeroLeft) || (currentCan.health <= 0)) {
            world.removeChild(currentCan)
            Matter.World.remove(engine.world, currentCan.body)
            currentCan = null
            return
        }
        //CAN TOUCHED
        if (player.x + player.width > currentCan.x + 40 && player.x < currentCan.x + 20 && currentCan.y > player.y && player.y + player.height > currentCan.y && (playerState.state === 'roll' || playerState.state === 'rollEnd') && !currentCan.touched) {
            currentCan.dealDamage = false
            soundPlayer.canDrop()
            Matter.Body.applyForce(currentCan.body, {x: currentCan.body.position.x, y: currentCan.body.position.y + 7.5}, {x: random(0.01, 0.014, true, true) , y: -random(0.002, 0.00, true, true)});
        }
        //CAN DAMAGE
        if (!currentCan.dealDamage && currentCan.body.speed > 1) {
            enemies.forEach(enemy => {
                const b = enemy.getBounds()
                const can = currentCan.getBounds()
                if (can.x > b.x && b.x + b.width > can.x && can.y > b.y && b.y + b.height > can.y && !enemy.params.dead) {
                    currentCan.dealDamage = true
                    currentCan.health -= 1
                    gameState.scoreStreak += 2.5
                    addPoints(50)
                    damageEnemy(enemy, Math.floor(currentCan.body.speed))
                    currentCan.body.speed = 0.5
                    Matter.Body.applyForce(currentCan.body, {x: currentCan.body.position.x, y: currentCan.body.position.y + 7.5}, {x: -random(0.01, 0.015, true, true) , y: -random(0.002, 0.006, true, true)});
                }
            })
            if (currentDogEnemy) {
                const b = currentDogEnemy.getBounds()
                const can = currentCan.getBounds()
                if (can.x > b.x && b.x + b.width > can.x && can.y > b.y && b.y + b.height > can.y && !currentDogEnemy.params.dead) {
                    currentCan.dealDamage = true
                    currentCan.health -= 1
                    gameState.scoreStreak += 2.5
                    damageEnemy(currentDogEnemy, Math.floor(currentCan.body.speed))
                    currentCan.body.speed = 0.5
                    Matter.Body.applyForce(currentCan.body, {x: currentCan.body.position.x, y: currentCan.body.position.y + 7.5}, {x: -random(0.01, 0.015, true, true) , y: -random(0.002, 0.006, true, true)});
                }
            }
            if (currentBoss) {
                const b = currentBoss.getBounds()
                const can = currentCan.getBounds()
                if (can.x > b.x && b.x + b.width > can.x && can.y > b.y && b.y + b.height > can.y && !currentBoss.params.dead) {
                    currentCan.dealDamage = true
                    currentCan.health -= 1
                    gameState.scoreStreak += 2.5
                    addPoints(50)
                    damageEnemy(currentBoss, Math.floor(currentCan.body.speed), true)
                    currentCan.body.speed = 0.5
                    Matter.Body.applyForce(currentCan.body, {x: currentCan.body.position.x, y: currentCan.body.position.y + 7.5}, {x: -random(0.01, 0.015, true, true) , y: -random(0.002, 0.006, true, true)});
                }
            }
            traps.forEach(trap => {
                const b = trap.getBounds()
                const can = currentCan.getBounds()
                if (can.x > b.x && b.x + b.width > can.x && can.y > b.y && b.y + b.height > can.y && !trap.dead) {
                    currentCan.dealDamage = true
                    currentCan.health -= 1
                    gameState.scoreStreak += 2.5
                    addPoints(50)
                    currentCan.body.speed = 0.5
                    Matter.Body.applyForce(currentCan.body, {x: currentCan.body.position.x, y: currentCan.body.position.y + 7.5}, {x: -random(0.01, 0.015, true, true) , y: -random(0.002, 0.006, true, true)});
                    if (trap.type) {
                        if (trap.type === 'window') soundPlayer.glassBreak()
                        trap.play()
                        trap.dead = true
                    } else {
                        barrelDead(trap)
                    }
                }
            })
        }
    }

    async function cameraShake(intensity, duration) {
        let time = 0
        const part = Math.floor((duration / 10) / 8)
        const defaultIntensity = intensity || 2
        const intensityStep = defaultIntensity / 4
        const timer = setInterval(() => {
            if (isPause || gameEnd) return
            time++
            switch (true) {
                case time > part * 7 : {
                    world.pivot.y -= defaultIntensity - intensityStep * 3
                    break
                }
                case time > part * 6 : {
                    world.pivot.y += defaultIntensity - intensityStep * 3
                    break
                }
                case time > part * 5 : {
                    world.pivot.y -= defaultIntensity - intensityStep * 2
                    break
                }
                case time > part * 4 : {
                    world.pivot.y += defaultIntensity - intensityStep * 2
                    break
                }
                case time > part * 3 : {
                    world.pivot.y += defaultIntensity - intensityStep
                    break
                }
                case time > part * 2 : {
                    world.pivot.y -= defaultIntensity - intensityStep
                    break
                }
                case time > part : {
                    world.pivot.y -= defaultIntensity
                    break
                }
                default: {
                    world.pivot.y += defaultIntensity
                    break
                }
            }
        }, 10)
        await sleep(duration)
        clearInterval(timer)
        world.pivot.y = player.y - CANVAS_HEIGHT + 200
    }

    function damagePlayer() {
        gameState.scoreStreak -= 30
        cameraShake(4, 600)
        playerState.invincible = true
        player.tint = 16737894
        playerState.health--
        hud.getChildByName('hearts').removeChildAt(0)
        if (playerState.health <= 0) {
            for (let i = 0; i <= 20; i++) {
                createParticles(player, 'blood', secondFloor === player.y)
            }
            world.removeChild(player)
            sleep(1000).then(() => {
                endGame()
            })
            return
        }
        sleep(200).then(() => {
            playerState.invincible = false
            if (playerState.inCover) {
                player.tint = player.shadow
            } else {
                player.tint = player.color
            }
        })
    }

    function updatePlayer(delta) {
        if (gameStart) {
            const dtX = 1 - Math.exp(-delta / 5)
            const dtY = 1 - Math.exp(-delta / 20)
            world.pivot.x = ((player.x - 60) - world.pivot.x) * dtX + world.pivot.x;
            world.pivot.y = ((player.y - CANVAS_HEIGHT + 200) - world.pivot.y) * dtY + world.pivot.y;
        }
        player.x += (0.5 * playerSpeed) * gameSpeed;
        zeroLeft = player.x - 100
        zeroRight = player.x - 100 + CANVAS_WIDTH
        enemyBullets.forEach((bullet, idx) => {
            if (player.x + player.width > bullet.x && player.x < bullet.x && player.y - player.height / 2 < bullet.y && player.y + player.height / 2 > bullet.y) {
                if (playerState.state === 'roll' || playerState.state === 'rollEnd' || (playerState.inCover && playerState.state !== 'shot')) return soundPlayer.bulletSkip()
                world.removeChild(bullet)
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
        player.zOrder = 5
        player.position.set(-100, playerPos)
        world.addChild(player)
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
        world.addChild(rectangle);
        trails.push(rectangle)
    }

    function updateTrailParticle() {
        trails.forEach((item, idx) => {
            if (item.x < zeroLeft || item.y - item.height < item.initY - item.endSize ) {
                world.removeChild(item)
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
                world.removeChild(wall)
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
        let position = zeroRight + 300
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
            buildBack.position.set(position + buildBack.width / 2, CANVAS_HEIGHT - 386)
            buildZipline = new PIXI.Sprite(buildZiplineTexture.textures.Zipline2FStart)
            buildZipline.position.set((position - buildZipline.width) + 40, CANVAS_HEIGHT - 630 )
            buildZipline.zIndex = 1
            world.addChild(buildZipline)
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
                    buildBack.position.set(position + buildBack.width / 2, CANVAS_HEIGHT - 386)
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
                    buildBack.position.set(position + buildBack.width / 2, CANVAS_HEIGHT - 270)
                    if (Math.random() < 0.5) {
                        createCoverInBuild(position + buildBack.width - 250, true, true)
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
                    buildBack.position.set(position + buildBack.width / 2 - 120, CANVAS_HEIGHT - 386)
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
                    buildBack.position.set(position + buildBack.width / 2, CANVAS_HEIGHT - 270)
                    if (Math.random() < 0.5) {
                        createCoverInBuild(position + buildBack.width - 250, true, true)
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
            world.addChild(buildZipline)
            zipLines.push(buildZipline)
            afterBuilding = buildBack.x + buildBack.width / 2
        }
        if (buildFront) {
            buildFront.anchor.set(0.5)
            buildFront.position.set(buildBack.x, buildBack.y)
            buildFront.parentGroup = fg
            buildFront.zOrder = 10
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
                x: bounds.x - 50,
                w: bounds.x + 150
            },
            {
                x: bounds.x + bounds.width - 50,
                w: bounds.x + bounds.width + 150
            }
        ]
        buildContainer.resetSpawnZones = resetSpawnZones
        world.addChild(buildContainer)
        buildings.push(buildContainer)
    }

    function updateZiplines() {
        zipLines.forEach((b, idx) => {
            if (b.position.x + b.width < zeroLeft) {
                world.removeChild(b)
                zipLines.splice(idx, 1)
                return;
            }
            if (playerState.inZipLine || b.used) return
            if (b.position.x + (b.end ? b.width - 20 : -10) < player.x && b.position.x + (b.end ? b.width : 0) > player.x) {
                b.used = true
                soundPlayer.zipLine()
                playerState.inZipLine = b.end ? "bot" : "top"
                playerSpeed = 0
                playAnim('zipLine')
                player.rotation = 4.8
                sleep(650).then(() => {
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
                })
            }
        })
    }

    function createBuilding(type) {
        const buildContainer = new PIXI.Container()
        let buildBack
        let buildFront
        let buildConnect
        let position = zeroRight + 300
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
        buildFront.zOrder = 10
        buildBack.position.set(position + buildBack.width / 2, CANVAS_HEIGHT - 365)
        buildFront.position.set(position + buildFront.width / 2, CANVAS_HEIGHT - 365)
        if (buildConnect) {
            buildConnect.anchor.set(0.5)
            buildConnect.position.set(position + buildConnect.width / 2, CANVAS_HEIGHT - 365)
            buildContainer.addChild(buildConnect)
        }
        if (type === 'end') {
            afterBuilding = buildBack.x + buildBack.width / 2
        }
        buildContainer.addChild(buildBack)
        buildContainer.addChild(buildFront)
        const bounds = buildContainer.getLocalBounds()
        const resetSpawnZones = [
            {
                x: bounds.x - 50,
                w: bounds.x + 150
            },
            {
                x: bounds.x + bounds.width - 50,
                w: bounds.x + bounds.width + 150
            }
        ]
        buildContainer.resetSpawnZones = resetSpawnZones
        world.addChild(buildContainer)
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
        wall.bound = 40
        wall.anchor.set(0.5)
        wall.position.set(pos, isSecondFloor ? isRoof ? CANVAS_HEIGHT - 422 : CANVAS_HEIGHT - 433 : CANVAS_HEIGHT - 245)
        wall.height = wall.height * 2
        wall.width = wall.width * 2
        wall.zIndex = 1
        world.addChild(wall)
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
                world.removeChild(build)
                buildings.splice(idx, 1)
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
        let position = zeroRight + 300
        const clubContainer = new PIXI.Container()
        const clubBack = new PIXI.Sprite(club.textures.clubBack)
        const clubFront = new PIXI.Sprite(club.textures.clubFront)
        deleteWallsAroundBuilding(zeroRight + clubBack.width / 2)
        for (let i = 1; i <= 17; i++) {
            const rand = Math.floor(Math.random() * (9 - 1 + 1) + 1)
            const laserBeam = new PIXI.AnimatedSprite(laserBeamTexture.animations[`render${rand}`])
            laserBeam.position.set(position + 526 + (i * 44), CANVAS_HEIGHT - 434)
            laserBeam.tint = randomRGB()
            laserBeam.scale.y = `1.0${rand}`
            laserBeam.parentGroup = fg
            if (Math.random() < 0.5) {
                laserBeam.zOrder = 4
            } else {
                laserBeam.zOrder = 6
            }
            laserBeam.animationSpeed = 0.01 * rand + 0.01
            laserBeam.alpha = 0.7
            laserBeam.play()
            clubContainer.addChild(laserBeam)
        }
        clubBack.anchor.set(0.5)
        clubFront.anchor.set(0.5)
        clubFront.parentGroup = fg
        clubFront.zOrder = 10
        clubBack.position.set(position + clubBack.width / 2, CANVAS_HEIGHT - 365)
        clubFront.position.set(position + clubFront.width / 2, CANVAS_HEIGHT - 365)
        clubContainer.club = true

        if (Math.random() < 0.5) {
            createCoverInClub(position + 190, 0)
        }
        if (Math.random() < 0.5) {
            createCoverInClub(position + 410, 1)
        }
        if (Math.random() < 0.5) {
            createCoverInClub(position + 540, 1)
        }
        if (Math.random() < 0.1) {
            createBoss(4, clubBack.x + 130)
        } else {
            if (Math.random() < 0.5) {
                createCoverInClub(position + 840, 0)
            }
            if (Math.random() < 0.5) {
                createCoverInClub(position + 1300, 0)
            }
        }
        if (Math.random() < 0.5) {
            createCoverInClub(position + 1600, 2)
        }
        if (Math.random() < 0.5) {
            createCoverInClub(position + 1900, 2)
        }

        clubContainer.addChild(clubBack)
        clubContainer.addChild(clubFront)
        const bounds = clubContainer.getLocalBounds()
        const resetSpawnZones = [
            {
                x: bounds.x - 50,
                w: bounds.x + 100
            },
            {
                x: clubBack.x - 450,
                w: clubBack.x - 350
            },
            {
                x: clubBack.x + 400,
                w: clubBack.x + 500
            },
            {
                x: bounds.x + bounds.width - 50,
                w: bounds.x + bounds.width + 50
            }
        ]
        clubContainer.resetSpawnZones = resetSpawnZones
        world.addChild(clubContainer)
        buildings.push(clubContainer)
    }

    function createCoverInClub(pos, type, forBoss) {
        const wall = new PIXI.Sprite(inClubTexture.textures[`inClub-${type}`])
        switch (true) {
            case type === 0:
                wall.bound = 40
                wall.position.set(pos, CANVAS_HEIGHT - 236)
            break
            case type === 1:
                wall.bound = 60
                wall.position.set(pos, CANVAS_HEIGHT - 240)
            break
            case type === 2:
                wall.bound = 40
                wall.position.set(pos, CANVAS_HEIGHT - 230)
            break
        }
        if (forBoss) {
            wall.forBoss = true
        }
        wall.anchor.set(0.5)
        wall.height = wall.height * 2
        wall.width = wall.width * 2
        wall.zIndex = 1
        world.addChild(wall)
        walls.push(wall)
    }

    function spawnBounceParticle(char, particleType) {
        const particle = new PIXI.Sprite(bounceParticlesTexture.textures[particleType])
        particle.scale.x = 2
        particle.scale.y = 2
        particle.anchor.set(0.5)
        particle.position.set(char.x, char.y)
        particle.lifeTime = 500

        particle.body = Matter.Bodies.rectangle(particle.x, particle.y, 2, 10, {isStatic: false, restitution: 0.5});
        particle.rotation = Math.floor(Math.random() * (6 + 1))
        world.addChild(particle)

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
            if (b.lifeTime <= 0) {
                world.removeChild(b)
                Matter.World.remove(engine.world, b.body)
                bounceParticles.splice(idx, 1)
            }
            b.position = b.body.position
            if (b.body.speed > 0.2) {
                b.rotation += 0.1
            } else {
                b.rotation = b.body.angle
            }
        })
    }

    function createParticles(char, particleType, floor, silence) {
        let particle
        switch (true) {
            case particleType === 'blood': {

                if (!silence) soundPlayer.damageFlesh()
                const randomBlood = random(0, 4)
                particle = new PIXI.Sprite(physParticlesTexture.textures[`blood-${randomBlood}`])
                particle.scale.x = 2
                particle.scale.y = 2
                break
            }
            case particleType === 'spark': {
                if (!silence) soundPlayer.damageMetal()
                particle = new PIXI.Sprite(physParticlesTexture.textures['spark'])
                const particleTint = random(0, 2)
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
                const randomSize = random(3, 4)
                particle.scale.x = randomSize
                particle.scale.y = randomSize
                break
            }
            case particleType === 'drop': {
                particle = PIXI.Sprite.from(PIXI.Texture.WHITE);
                const particleTint = random(0, 2)
                switch (true) {
                    case particleTint === 0:
                        particle.tint = 9424895
                        break
                    case particleTint === 1:
                        particle.tint = 15138815
                        break
                    case particleTint === 2:
                        particle.tint = 16777215
                        break
                }
                const randomSize = random(2, 4)
                particle.width = randomSize
                particle.height = randomSize
                break
            }
            case particleType === 'bottle': {
                particle = PIXI.Sprite.from(PIXI.Texture.WHITE);
                particle.tint = 32768
                const randomSize = random(2, 3)
                particle.width = randomSize
                particle.height = randomSize
                break
            }
        }
        particle.type = particleType
        if (floor) {
            particle.edge = Math.floor(Math.random() * ((CANVAS_HEIGHT - 350) - (CANVAS_HEIGHT - 380) + 1) + (CANVAS_HEIGHT - 380))
        } else {
            particle.edge = Math.floor(Math.random() * ((CANVAS_HEIGHT - 160) - (CANVAS_HEIGHT - 190) + 1) + (CANVAS_HEIGHT - 190))
        }
        particle.anchor.set(0.5)
        particle.position.set(char.x, char.y)
        particle.body = Matter.Bodies.rectangle(particle.x, particle.y, 1, 1, {isStatic: false, isSensor: true});
        world.addChild(particle)
        Matter.World.add(engine.world, particle.body);
        let randomMassX = Math.random() * particle.body.mass
        const randomMassY = Math.random() * particle.body.mass
        randomMassX *= Math.round(Math.random()) ? 1 : -1;
        Matter.Body.applyForce(particle.body, particle.body.position, {x: randomMassX / 25, y: -randomMassY / 25});
        physParticles.push(particle)
    }

    function updateParticles() {
        physParticles.forEach((b, idx) => {
            if (!b.stop) {
                b.position = b.body.position;
                if (b.type !== 'blood') {
                    b.rotation = b.body.angle;
                }
                if (b.position.y > b.edge) {
                    b.stop = true
                    switch (true) {
                        case b.type === 'spark': {
                            b.scale.y = 3
                            b.scale.x = 3
                            break
                        }
                        case b.type === 'blood': {
                            b.scale.y = 1
                            break
                        }
                    }
                }
            }
            if (b.position.x < zeroLeft) {
                world.removeChild(b)
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
        if (char.params.longRange) {
            const longDetector = PIXI.Sprite.from(PIXI.Texture.WHITE);
            longDetector.zIndex = 20
            longDetector.anchor.set(1)
            longDetector.tint = 16711680
            longDetector.scale.x = 14
            longDetector.scale.y = 0.1
            longDetector.position.set(char.x - char.width / 2 + 10, char.y - 6)
            char.params.longDetector = longDetector
            world.addChild(longDetector)
        }
        world.addChild(warning)
        if (char.params.canCover) {
            char.params.inCover = false
            char.tint = player.color
            char.anchor.y = 0.5
        }
        //prepare
        await sleep(Math.floor(Math.random() * (char.params.warningMax - char.params.warningMin + 1)) + char.params.warningMin)
        if (char.params.dead) return
        warning.tint = 16711680
        //shoot
        await sleep(200)
        if (char.params.dead) return
        world.removeChild(warning)
        if (char.params.longRange) {
            world.removeChild(char.params.longDetector)
        }
        if (char.params.rapidFire) {
            const fireTimes = random(1, char.params.rapidFire)
            enemyShotAnim(char, fireTimes)
            await shotRapid(char, char.params.offsetX || 0, char.params.offsetY || 0, fireTimes, char.params.gun, 100)
        } else {
            enemyShotAnim(char, 1)
            shot(char, char.params.offsetX || 0, char.params.offsetY || 0, char.params.gun)
            await sleep(200)
        }
        //reload
        if (char.params.canCover) {
            char.params.inCover = true
            char.tint = player.shadow
            char.anchor.y = 0.7
        }
        await sleep(Math.floor(Math.random() * (char.params.reloadMax - char.params.reloadMin + 1)) + char.params.reloadMin)
        if (char.params.dead) return
        char.params.detect = false
    }

    function enemyShotAnim(char, times) {
        char.textures = char.params.animset.shot
        char.play()
        sleep(times * 200).then(() => {
            if (char.params.dead) return
            char.textures = char.params.animset.idle
            char.play()
        })
    }

    function createBoss(propType, propPos) {
        let randomPos = propPos || Math.floor(zeroRight + random(300, 750))

        enemies.forEach((enemy, idx) => {
            if (enemy.x > randomPos - 400 && enemy.x < randomPos + 50) {
                world.removeChild(enemy)
                enemies.splice(idx, 1)
            }
        })

        walls.forEach((wall, idx) => {
            if (wall.x > randomPos - 400 && wall.x < randomPos + 200) {
                world.removeChild(wall)
                walls.splice(idx, 1)
            }
        })

        traps.forEach((trap, idx) => {
            if (!trap.type) {
                const t = trap.getLocalBounds()
                if (t.x > randomPos - 400 && t.x < randomPos + 200) {
                    world.removeChild(trap)
                    traps.splice(idx, 1)
                }
            }
        })

        let type
        const randType = propType || random(1, 4)
        switch (true) {
            case randType === 1:
                type = 'bossGun'
            break
            case randType === 2:
                type = 'bossLauncher'
            break
            case randType === 3:
                type = 'bossVan'
            break
            case randType === 4:
                type = 'bossSmg'
            break
        }

        if (propType === 4) {
            createCoverInClub(randomPos - (CANVAS_WIDTH / 1.8), 0, true)
        } else {
            createWall(randomPos - (CANVAS_WIDTH / 1.8), true)
        }
        const boss = new PIXI.AnimatedSprite(eval(type).animations.idle)
        boss.anchor.set(0.5)
        boss.animationSpeed = 0.15
        boss.position.set(randomPos, playerPos - (type === 'bossVan' ? 36 : 10))
        boss.params = {
            animset: eval(type).animations
        }
        Object.keys(enemyParams[type]).forEach(item => {
            boss.params[item] = enemyParams[type][item]
        })
        boss.zIndex = 10
        boss.type = type
        currentBoss = boss
        world.addChild(currentBoss)
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
        world.addChild(warning)
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
        world.removeChild(warning)
        if (!currentBoss || currentBoss.params.dead) return
        switch (true) {
            case currentBoss.type === 'bossVan':
                currentBoss.textures = currentBoss.params.animset.fromIdle
                currentBoss.play()
                await sleep(200)
                if (!currentBoss || currentBoss.params.dead) return
                currentBoss.textures = currentBoss.params.animset.shot
                currentBoss.play()
                shotRapid(currentBoss, 36, 12, fireTimes, 'smg')
                await sleep(50)
                shotRapid(currentBoss, 34, 40, fireTimes, 'smg')
                await sleep(100)
                await shotRapid(currentBoss, 106, 20, fireTimes, 'smg')
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
                await shotRapid(currentBoss, 6, 14, fireTimes, 'rifle')
                await sleep(100)
                if (currentBoss.params.walk) {
                    if (!currentBoss || currentBoss.params.dead) return
                    currentBoss.textures = currentBoss.params.animset.walk
                    currentBoss.play()
                    walking = setInterval(() => {
                        if (isPause) return
                        if (!currentBoss || currentBoss.params.dead) return
                        currentBoss.x -= 1
                    }, 10)
                }
            break
            case currentBoss.type === 'bossSmg':
                enemyShotAnim(currentBoss, fireTimes)
                await shotRapid(currentBoss, 0, -2, fireTimes, 'smg', 150)
            break
            case currentBoss.type === 'bossLauncher':
                enemyShotAnim(currentBoss, fireTimes)
                shotGrenade(currentBoss, 0, 0)
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

    async function shotRapid(char, offsetX, offsetY, times, gun, cd) {
        const shotTime = cd ? cd :200
        const repeat = setInterval(() => {
            if (isPause) return
            if (char.params.dead) return
            shot(char, offsetX, offsetY, gun)
        }, shotTime)
        return new Promise(function(resolve) {
            sleep(times * shotTime).then(() => {
                clearInterval(repeat)
                resolve()
            })
        });
    }

    function updateGrenades() {
        grenades.forEach((b, idx) => {
            if (b.dead) return
            if ((player.x + player.width > b.x && b.x + b.width > player.x) && playerState.state === 'shot') {
                activateGrenade(b, idx, true)
                return
            }
            b.lifeTime--
            if (b.lifeTime <= 0) {
                b.dead = true
                activateGrenade(b, idx)
                return
            }
            b.position = b.body.position
            b.rotation = b.body.angle
        })
    }

    function shotGrenade(char, offsetX, offsetY) {
        const grenade = new PIXI.Sprite(bounceParticlesTexture.textures.grenade)
        grenade.scale.set(-1.5)
        grenade.position.set(char.x + offsetX, char.y - offsetY)
        grenade.lifeTime = 100
        grenade.type = 'grenade'

        grenade.body = Matter.Bodies.rectangle(grenade.x, grenade.y, 12, 4, {isStatic: false, restitution: 0.5});
        world.addChild(grenade)

        Matter.World.add(engine.world, grenade.body);
        let randomMassX = Math.random() * (0.4 - 0.2) + 0.2
        Matter.Body.applyForce(grenade.body, grenade.body.position, {x: -randomMassX / 100, y: -0.001});
        grenades.push(grenade)
    }

    async function activateGrenade(grenade,idx, now) {
        if (now) {
            damagePlayer()
            createExplode(grenade, 0, 0)
            Matter.World.remove(engine.world, grenade.body)
            world.removeChild(grenade)
            grenades.splice(idx, 1)
            return
        }
        const warning = new PIXI.Sprite(particles.textures.detection)
        warning.zIndex = 20
        warning.anchor.set(0.5)
        warning.tint = 16776960
        warning.scale.x = 1.5
        warning.scale.y = 2
        warning.position.set(grenade.x, grenade.y - 40)
        world.addChild(warning)
        await sleep(300)
        warning.tint = 16711680
        await sleep(200)
        if (playerState.state === 'shot') {
            damagePlayer()
        }
        createExplode(grenade, 0, 0)
        Matter.World.remove(engine.world, grenade.body)
        world.removeChild(warning)
        world.removeChild(grenade)
        grenades.splice(idx, 1)
    }

    function updateBoss() {
        if (currentBoss.x + currentBoss.width < zeroLeft) {
            world.removeChild(currentBoss)
            currentBoss = null
            return
        }
        if (currentBoss.params.dead) {
            playerState.inBossFight = false
            return
        }
        if (!currentBoss.params.detect) {
            if (zeroRight > currentBoss.x) {
                currentBoss.params.detect = true
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
                world.removeChild(bullet)
                playerBullets.splice(idx, 1)
                if (currentBoss.x - player.x < 200) {
                    damageEnemy(currentBoss,2, currentBoss.type !== 'bossSmg')
                } else {
                    damageEnemy(currentBoss,1, currentBoss.type !== 'bossSmg')
                }
            }
        })
    }

    function updateDogEnemy() {
        if (!currentDogEnemy.params.dead) {
            if (!currentDogEnemy.skip) {
                if (player.x + player.width > currentDogEnemy.x) {
                    damagePlayer()
                    currentDogEnemy.skip = true
                }
            }
            currentDogEnemy.x -= currentDogEnemy.params.speed * gameSpeed
            playerBullets.forEach((bullet, idx) => {
                if (currentDogEnemy.x + currentDogEnemy.width > bullet.x && currentDogEnemy.x < bullet.x && currentDogEnemy.y - currentDogEnemy.height < bullet.y && currentDogEnemy.y + currentDogEnemy.height / 2 > bullet.y) {
                    world.removeChild(bullet)
                    playerBullets.splice(idx, 1)
                    damageEnemy(currentDogEnemy,1)
                }
            })
        }
        if (currentDogEnemy.x + 100 < zeroLeft) {
            world.removeChild(currentDogEnemy)
            currentDogEnemy = null
        }
    }

    function createDogEnemy() {
        soundPlayer.dogBarking()
        let randomPos = Math.floor(zeroRight + random(10, 10))
        let level = playerPos
        if (buildings.length > 0) {
            const activeBuilding = buildings[0]
            const lastBuilding = buildings[buildings.length - 1].getLocalBounds()
            if ((lastBuilding.x + lastBuilding.width > randomPos && activeBuilding.getLocalBounds().x < randomPos) && activeBuilding.secondFloor) {
                level = secondFloor
                level = secondFloor
            }
        }
        const dog = new PIXI.AnimatedSprite(dogEnemy.animations.idle)
        dog.anchor.set(0.5)
        dog.scale.set(2)
        dog.animationSpeed = 0.2
        dog.position.set(zeroRight + 100, level)
        dog.params = {}
        dog.zIndex = 1
        Object.keys(enemyParams.dog).forEach(item => {
            dog.params[item] = enemyParams.dog[item]
        })
        dog.params.speed = random(0.5, 1, true, true)
        dog.params.animset = dogEnemy.animations
        currentDogEnemy = dog
        world.addChild(currentDogEnemy)
        dog.play()
    }

    function createEnemy(pos, canCover) {
        let randomPos = pos || Math.floor(zeroRight + Math.floor(Math.random() * (250 - 50 + 1) + 50))
        let isSecondFloor = false

        buildings.forEach(build => {
            build.resetSpawnZones.forEach(zone => {
                // console.log(`${zone.x} > ${randomPos} < ${zone.w}`)
                if (randomPos + 30 > zone.x && randomPos < zone.w) {
                    if (zone.w - randomPos < randomPos - zone.x) {
                        randomPos = zone.w + 50
                    } else {
                        randomPos = zone.x - 50
                    }
                    // console.log('popal' + randomPos)
                }
            })
        })

        const findDuplicate = enemies.findIndex(enemy => randomPos + 30 > enemy.x && randomPos < enemy.x + enemy.width)
        if (findDuplicate >= 0) return

        if (currentBoss) {
            if (randomPos + 30 > currentBoss.x && randomPos < currentBoss.x + currentBoss.width) return
        }

        if (buildings.length > 0) {
            const activeBuilding = buildings[0]
            const lastBuilding = buildings[buildings.length - 1].getLocalBounds()
            if ((lastBuilding.x + lastBuilding.width > randomPos && activeBuilding.getLocalBounds().x < randomPos) && activeBuilding.secondFloor) {
                isSecondFloor = true
            }
        }

        const rand = random(1, 100)
        let enemyType = 'default'
        switch(true) {
            case rand > 99:
                enemyType = 'shield'
            break
            case rand > 95:
                enemyType = 'silence'
            break
            case rand > 90:
                enemyType = 'shotgun'
            break
            case rand > 85:
                enemyType = 'smg'
            break
            case rand > 80:
                enemyType = 'nigga'
            break
            case rand > 0:
                enemyType = 'default'
            break
        }
        const enemy = new PIXI.AnimatedSprite(enemiesTexture.animations[`${enemyType}Idle`])
        enemy.params = {}
        Object.keys(enemyParams[enemyType]).forEach(item => {
            enemy.params[item] = enemyParams[enemyType][item]
        })
        enemy.params.animset = {}
        enemy.params.animset.idle = enemiesTexture.animations[`${enemyType}Idle`]
        enemy.params.animset.shot = enemiesTexture.animations[`${enemyType}Shot`]
        enemy.params.animset.death = enemiesTexture.animations[`${enemyType}Death`]
        enemy.params.animset.deathCrit = enemiesTexture.animations[`${enemyType}DeathCrit`]
        if (enemy.params.shield) {
            enemy.params.animset.idleAlt = enemiesTexture.animations[`${enemyType}IdleAlt`]
            enemy.params.animset.shotAlt = enemiesTexture.animations[`${enemyType}ShotAlt`]
            enemy.params.animset.knock = enemiesTexture.animations[`${enemyType}Knock`]
        }
        enemy.anchor.set(0.5)
        if (canCover) {
            enemy.params.canCover = true
            enemy.params.inCover = true
            enemy.anchor.y = 0.7
            enemy.tint = player.shadow
        }
        enemy.scale.set(2)
        enemy.animationSpeed = 0.2
        enemy.zIndex = 8
        enemy.position.set(randomPos, isSecondFloor ? secondFloor : playerPos)
        enemy.secondFloor = isSecondFloor
        world.addChild(enemy)
        enemy.play()
        enemies.push(enemy)
    }

    function damageEnemy(enemy, damage, isBoss) {
        enemy.params.health -= damage
        addPoints(5)
        gameState.scoreStreak += 0.5
        for (let i = 0; i < 20; i++) {
            createParticles(enemy, isBoss || (enemy.params.shield && !enemy.params.knocked) ? 'spark' : 'blood', enemy.secondFloor)
        }
        if (enemy.params.health <= 0) {
            if (enemy.params.detect) {
                world.removeChild(enemy.params.warning)
                if (enemy.params.longDetector) {
                    world.removeChild(enemy.params.longDetector)
                }
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
            cameraShake(0.6, 400)
            enemy.params.dead = true
            gameState.scoreStreak += enemy.params.points / 10
            addPoints(enemy.params.points)
            enemy.loop = false
            if (damage > 1 || isBoss) {
                addPoints(10)
                enemy.textures = enemy.params.animset.deathCrit || enemy.params.animset.death
                for (let i = 0; i < 20; i++) {
                    createParticles(enemy, 'blood', enemy.secondFloor)
                }
            } else {
                enemy.textures = enemy.params.animset.death
            }
            enemy.play()
            return
        }
        if (enemy.params.shield && !enemy.params.knocked && enemy.params.health <= 2) {
            enemy.params.knocked = true
            enemy.textures = enemy.params.animset.knock
            enemy.play()
            enemy.params.animset.idle = enemy.params.animset.idleAlt
            enemy.params.animset.shot = enemy.params.animset.shotAlt
            sleep(150).then(() => {
                enemy.textures = enemy.params.animset.idle
                enemy.play()
            })
        }
    }

    function updateEnemies() {
        enemies.forEach((enemy, idx) => {
            if (!enemy.params.dead) {
                if (!enemy.params.detect) {
                    const checkTraps = traps.find(trap => {
                        if (!trap.dead && trap.type) {
                            if (trap.x > enemy.x - (CANVAS_WIDTH / 1.5) && trap.x < enemy.x) {
                                return true
                            }
                        } else {
                            return false
                        }
                    })
                    if (!checkTraps) {
                        if (enemy.x - player.x < (CANVAS_WIDTH / 1.5 + enemy.params.detectRange) && enemy.y - 20 <= player.y) {
                            enemy.params.detect = true
                            enemyShooting(enemy)
                        }
                    }
                }
                playerBullets.forEach((bullet, idx) => {
                    if (enemy.x + 10 < bullet.x + bullet.width && enemy.x + enemy.width > bullet.x && enemy.y - enemy.height / 2 < bullet.y && enemy.y + enemy.height / 2 > bullet.y) {
                        if (enemy.params.inCover) return
                        world.removeChild(bullet)
                        playerBullets.splice(idx, 1)
                        if (enemy.x - player.x < CANVAS_WIDTH / 2.5) {
                            damageEnemy(enemy,2)
                        } else {
                            damageEnemy(enemy,1)
                        }
                    }
                })
                if (!enemy.skip && (player.x > enemy.x - 30 && player.x + player.width < enemy.x + enemy.width)) {
                    if (!meleeKill && (playerState.state === 'roll' || playerState.state === 'rollEnd')) {
                        if (playerState.invincible) {
                            damageEnemy(enemy, 10)
                        } else {
                            HUDmeleeKill(enemy)
                        }
                    } else {
                        if (enemy.params.inCover) return
                        gameState.points -= 250 * gameState.multiplier
                        if (gameState.points < 0) {
                            gameState.points = 0
                        }
                        gameState.scoreStreak -= 20
                    }
                    enemy.skip = true
                }
            }
            if (enemy.x + enemy.width < zeroLeft) {
                world.removeChild(enemy)
                enemies.splice(idx, 1)
            }
        })
    }

    function createBgCar() {
        const car = new PIXI.Container()
        const carBack = new PIXI.Sprite(bgCarTexture.textures.carBack)
        const carFront = new PIXI.Sprite(bgCarTexture.textures.carFront)
        carBack.anchor.set(0.5)
        carFront.anchor.set(0.5)
        carBack.tint = randomRGB()
        if (Math.random() < 0.5) {
            car.side = 1
            car.x = zeroRight
            car.y = CANVAS_HEIGHT - 210
        } else {
            carBack.scale.set(-1, 1)
            carFront.scale.set(-1, 1)
            car.side = -1
            car.x = zeroLeft - 100
            car.y = CANVAS_HEIGHT - 210
        }
        car.speed = random(4, 10)
        car.zIndex = -1
        car.addChild(carBack)
        car.addChild(carFront)
        world.addChild(car)
        bgCar = car
    }

    function updateBgCar() {
        const b = bgCar.getBounds()
        if (bgCar.side > 0) {
            bgCar.x -= bgCar.speed
            if (b.x + b.width < 0) {
                world.removeChild(bgCar)
                bgCar = null
            }
        } else {
            bgCar.x += bgCar.speed
            if (b.x > zeroRight) {
                world.removeChild(bgCar)
                bgCar = null
            }
        }
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
        if (Math.random() > 0.75) {
            const posX = random(10, 100)
            const posY = random(94, 104)
            createGarbage(floor.x + floor.width + posX, floor.y + posY)
        }
        if (Math.random() > 0.75) {
            const posX = random(10, 100)
            const posY = random(65, 75)
            createGarbage(floor.x + floor.width + posX, floor.y + posY)
        }
        floor.body = Matter.Bodies.rectangle(floor.x, playerPos + 44, floor.width + 20, 40, {isStatic: true});
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
        const tiling = new PIXI.TilingSprite(img, gameWidth + 100, gameHeight + secondFloor)
        tiling.scale.set(0.8)
        tiling.anchor.set(0, 1)
        tiling.zIndex = -10
        tiling.y = gameHeight - 150
        tiling.tilePosition.y = gameHeight
        world.addChild(tiling)
        return tiling
    }

    function updateBg() {
        if (gameStart) {
            bgPosition -= (bgSpeed * playerSpeed) * gameSpeed
            background.x = zeroLeft
            background.tilePosition.x = bgPosition
        }
    }

    function createBochka() {
        const randomPos = Math.floor(zeroRight + Math.floor(Math.random() * (250 - 50 + 1) + 50))
        if (afterBuilding > randomPos - 100) {
            return
        }
        const bochkaContainer = new PIXI.Container()
        const bochkaTop = new PIXI.AnimatedSprite(bochka.animations.bochkaTop)
        const bochkaDown = new PIXI.AnimatedSprite(bochka.animations.bochkaDown)
        bochkaTop.scale.set(2)
        bochkaDown.scale.set(2)
        bochkaTop.loop = false
        bochkaDown.loop = false
        bochkaTop.animationSpeed = 0.2
        bochkaDown.animationSpeed = 0.2
        bochkaDown.anchor.set(0.5)
        bochkaTop.anchor.set(0.5)
        bochkaDown.parentGroup = fg
        bochkaDown.zOrder = 10
        bochkaTop.position.set(randomPos, CANVAS_HEIGHT - 210)
        bochkaDown.position.set(randomPos, CANVAS_HEIGHT - 204)
        bochkaContainer.addChild(bochkaTop)
        bochkaContainer.addChild(bochkaDown)
        world.addChild(bochkaContainer)
        traps.push(bochkaContainer)
    }

    function createExplode(target, offsetX, offsetY, isBig) {
        cameraShake(2, 500)
        soundPlayer.explosion()
        const explode = new PIXI.AnimatedSprite(isBig ? bigExplode.animations.explode : bochka.animations.smallExplode)
        explode.zIndex = target.zIndex
        explode.loop = false
        explode.anchor.set(0.5)
        explode.height = explode.height * 3
        explode.width = explode.width * 3
        explode.animationSpeed = isBig ? 0.25 : 0.4
        explode.position.set(target.x + offsetX, target.y + offsetY)
        world.addChild(explode)
        explode.play()
        explode.onComplete = () => {
            world.removeChild(explode)
        }
    }

    async function barrelDead(barrel) {
        addPoints(30)
        gameState.scoreStreak += 2
        soundPlayer.damageMetal()
        soundPlayer.beep()
        barrel.dead = true
        await sleep(100)
        const b = barrel.getBounds()
        if (currentDogEnemy) {
            const e = currentDogEnemy.getBounds()
            if (e.x + e.width > b.x - 100 && e.x < b.x + 200) {
                if (currentDogEnemy.params.dead) return
                damageEnemy(currentDogEnemy, 4)
            }
        }
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
        barrel.children[0].textures = bochka.animations.bochkaTopDead
        barrel.children[1].textures = bochka.animations.bochkaDownDead
        barrel.children[0].play()
        barrel.children[1].play()
        for (let i = 0; i < 20; i++) {
            createParticles(barrel.children[0], 'spark')
        }
        createExplode(barrel.children[0], -20, 10, false)
        createExplode(barrel.children[1], 20, 30, false)
    }

    function updateTraps() {
        traps.forEach((trap, idx) => {
            const trapB = trap.getBounds()
            if (!trap.dead) {
                const p = player.getBounds()
                if (p.x + p.width > trapB.x + 80 && p.x < trapB.x + 50) {
                    if (trap.type) {
                        if (trap.type === 'window') soundPlayer.glassBreak()
                        trap.play()
                        trap.dead = true
                        addPoints(25)
                    } else {
                        if (playerState.state === 'roll' || playerState.state === 'rollEnd') return
                        barrelDead(trap)
                    }
                }
                if (currentDogEnemy) {
                    const d = currentDogEnemy.getBounds()
                    if (d.x + d.width > trapB.x && d.x < trapB.x + trapB.width) {
                        if (trap.type) {
                            if (trap.type === 'window') soundPlayer.glassBreak()
                            if (trap.type === 'door') return;
                            trap.play()
                            gameState.scoreStreak += 5
                            trap.dead = true
                            addPoints(25)
                            damageEnemy(currentDogEnemy, 1)
                        } else {
                            barrelDead(trap)
                        }
                    }
                }
                playerBullets.forEach((bullet, bulletIdx) => {
                    const bulletBound = bullet.getBounds()
                    if (bulletBound.x + bulletBound.width > trapB.x + (trap.type ? trapB.width / 2 : trapB.width / 4) && bulletBound.x < trapB.x + trapB.width && bulletBound.y > trapB.y && bulletBound.y < trapB.y + trapB.height) {
                        world.removeChild(bullet)
                        playerBullets.splice(bulletIdx, 1)
                        if (trap.type) {
                            if (trap.type === 'window') soundPlayer.glassBreak()
                            trap.play()
                            trap.dead = true
                            addPoints(25)
                            gameState.scoreStreak += 1
                        } else {
                            barrelDead(trap)
                        }
                    }
                })
            }
            if (trapB.x + trapB.width < 0) {
                world.removeChild(trap)
                traps.splice(idx, 1)
            }
        })
    }

    function createWindow(pos) {
        const window = new PIXI.AnimatedSprite(windowTexture.animations.window)
        window.loop = false
        window.animationSpeed = 0.6
        window.anchor.set(0.5)
        window.position.set(pos, CANVAS_HEIGHT - 405)
        window.zIndex = 1
        window.type = 'window'
        world.addChild(window)
        traps.push(window)
    }

    function createDoor(pos, secondFloor) {
        const door = new PIXI.AnimatedSprite(doorTexture.animations.door)
        door.loop = false
        door.animationSpeed = 0.6
        door.anchor.set(0.5)
        door.position.set(pos, secondFloor ? CANVAS_HEIGHT - 411 : CANVAS_HEIGHT - 221)
        door.zIndex = 1
        door.type = 'door'
        world.addChild(door)
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
        const randomPos = pos || zeroRight + random(100, 250)
        if (!pos && !forBoss) {
            const rand = random(1, 10)
            if (rand > 5) {
                createEnemy(randomPos + 60, true)
            }
        }

        if (afterBuilding > randomPos - 100) {
            return
        }
        if (walls.length > 0) {
            const wallSize = walls[walls.length - 1].getLocalBounds()
            if (randomPos > wallSize.x - 100 &&
                randomPos < wallSize.x + wallSize.width + 100) {
                return
            }
        }
        const randomWall = random(1, 10)
        if (randomWall < 4) {
            wall = new PIXI.Sprite(textures.textures.coverTrash)
            wall.position.set(randomPos, CANVAS_HEIGHT - 240)
            wall.bound = 30
        } else {
            wall = new PIXI.Sprite(textures.textures.wall)
            wall.position.set(randomPos, CANVAS_HEIGHT - 232)
            wall.bound = 40
        }
        if (forBoss) {
            wall.forBoss = true
        }
        wall.anchor.set(0.5)
        world.addChild(wall)
        walls.push(wall)
        if (randomWall < 4) {
            if (Math.random() < 0.5) {
                const pos = random(20, 50)
                createGarbage(wall.x - wall.width / 2 + pos, wall.y - 3, 4)
            }
        }
    }

    function updateWall() {
        walls.forEach((wall, idx) => {
            if (wall.x + 100 < zeroLeft) {
                world.removeChild(wall)
                walls.splice(idx, 1)
            }
        })
    }

    function shot(char, offsetX, offsetY, gun, friendly) {
        const shot = new PIXI.AnimatedSprite(particles.animations.gunShot)
        shot.anchor.set(0.5)
        shot.scale.x = 1.2
        shot.scale.y = 1.2
        shot.animationSpeed = 0.2
        shot.zIndex = 11
        soundPlayer.gunShot(gun, gun === 'smg' || gun === 'rifle')
        if (friendly) {
            shot.position.set(player.x + offsetX, player.y - offsetY)
        } else {
            shot.position.set(((char.x + 4) - char.width / 2) + offsetX, (char.y - 10) + offsetY)
        }
        if (gun === 'shotgun') {
            for (let i = 0; i < 3; i++) {
                if (friendly) {
                    playerBullets.push(spawnBullet(shot.x, shot.y))
                } else {
                    enemyBullets.push(spawnBullet(shot.x, shot.y, char))
                }
            }
        } else {
            if (friendly) {
                playerBullets.push(spawnBullet(shot.x, shot.y))
            } else {
                enemyBullets.push(spawnBullet(shot.x, shot.y, char))
            }
        }
        spawnBounceParticle(shot, 'shell')
        world.addChild(shot)
        shot.play()
        sleep(150).then(() => {
            world.removeChild(shot)
        })
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
        world.addChild(bullet)
        return bullet
    }

    function updateBullets() {
        enemyBullets.forEach((b, idx) => {
            b.position.x -= (Math.cos(b.rotation) * bulletSpeed) * gameSpeed;
            b.position.y -= (Math.sin(b.rotation) * bulletSpeed) * gameSpeed;

            if (b.position.x < zeroLeft || b.position.x > zeroRight + 100) {
                gameState.scoreStreak -= 0.5
                world.removeChild(b)
                enemyBullets.splice(idx, 1)
            }
        })
        playerBullets.forEach((b, idx) => {
            b.position.x += (Math.cos(b.rotation) * bulletSpeed) * gameSpeed;
            b.position.y += (Math.sin(b.rotation) * bulletSpeed) * gameSpeed;

            if (b.position.x < zeroLeft || b.x - b.width * 2 > zeroRight) {
                world.removeChild(b)
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
                    // player.y = playerState.secondFloor ? secondFloor - 10 : playerPos - 10
                    player.anchor.y = 0.7
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
        if (gameEnd || isPause || isMenu) return
        if (playerState.inZipLine) return
        switch (true) {
            //RELOAD
            case e.code === 'KeyR':
                if ((!playerState.state || playerState.state === 'rollEnd') && gun.currentAmmo < 5) {
                    soundPlayer.pistolReload()
                    playAnim('reload')
                    playerSpeed = 0
                    spawnBounceParticle(player, 'mag')
                    sleep(1100).then(() => {
                        HUDbullets()
                        gun.currentAmmo = gun.ammo
                        if (playerState.inCover) {
                            playAnim('idle')
                            return
                        }
                        playerSpeed = playerDefaultSpeed
                        playAnim()
                    })
                }
            break
            //ROLL
            case e.code === 'Space':
                if (!playerState.state && !playerState.inBossFight) {
                    gameState.scoreStreak += 1
                    soundPlayer.slide()
                    playAnim('roll')
                    playerSpeed = playerDefaultSpeed + 1.5
                    const rollTime = 25
                    const rollEndTime = 80
                    let rollCounter = 0
                    const rollInterval = setInterval(() => {
                        if (isPause) return
                        if (!(gameSpeed < 1 && playerState.state === 'rollEnd')) {
                            rollCounter++
                        }
                        if (playerState.inZipLine || (playerState.state !== 'rollEnd' && playerState.state !== 'roll')) {
                            clearInterval(rollInterval)
                        }
                        if (rollCounter === rollTime) {
                            if (playerState.inCover) {
                                playerState.inCover = false
                                // player.y = playerState.secondFloor ? secondFloor : playerPos
                                player.anchor.y = 0.5
                            }
                            playAnim('rollEnd')
                        }
                        if (rollCounter >= rollEndTime) {
                            if (playerState.inCover === true || playerState.inZipLine) {
                                gameState.scoreStreak += 1
                                clearInterval(rollInterval)
                            } else {
                                playerSpeed = playerDefaultSpeed
                                playAnim()
                                clearInterval(rollInterval)
                            }
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
                if (!playerState.state || playerState.state === 'rollEnd') {
                    if (gun.currentAmmo <= 0) {
                        soundPlayer.pistolEmpty()
                        return;
                    }
                    if (playerState.inCover) {
                        // player.y = playerState.secondFloor ? secondFloor : playerPos
                        player.anchor.y = 0.5
                        player.tint = player.color
                    }
                    gun.currentAmmo--
                    hud.getChildByName('magazine').removeChildAt(0)
                    hud.getChildByName('magazine').x -= 16
                    playAnim('shot')
                    shot(player, 30, 12, gun.type, true)
                    playerSpeed = 0
                    sleep(150).then(() => {
                        if (playerState.inCover) {
                            playAnim('idle')
                            return
                        }
                        playerSpeed = playerDefaultSpeed
                        playAnim()
                    })
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

    function HUDbullets() {
        const oldMagazine = hud.getChildByName('magazine')
        if (oldMagazine) {
            hud.removeChild(oldMagazine)
        }
        const magazine = new PIXI.Container()
        for (let i = 0; i < gun.ammo; i++) {
            const bullet = new PIXI.Sprite(activeItems.textures.bullet)
            bullet.position.x = i * (bullet.width + 2)
            magazine.addChild(bullet)
        }
        magazine.name = 'magazine'
        magazine.position.set(20, gameHeight - 60)
        hud.addChild(magazine)
    }

    function HUDpoints() {
        const pointsStyle = new PIXI.TextStyle({
            fontFamily: 'ACastle3',
            fontSize: 56,
            fontStyle: 'italic',
            fontWeight: 'bold',
            fill: ['#ffffff', '#00ff99'], // gradient
            stroke: '#4a1850',
            strokeThickness: 5,
            dropShadow: true,
            dropShadowColor: '#000000',
            dropShadowBlur: 4,
            dropShadowAngle: Math.PI / 6,
            dropShadowDistance: 6,
            wordWrap: true,
            wordWrapWidth: 440,
            lineJoin: 'round',
        });
        const points = new PIXI.Text('0', pointsStyle);
        points.anchor.set(1, 0)
        points.x = gameWidth - 20
        points.y = 40
        points.name = 'points'

        const scaleStyle = new PIXI.TextStyle({
            fontFamily: 'ACastle3',
            fontSize: 32,
            fontStyle: 'italic',
            fontWeight: 'bold',
            fill: ['#ffffff', '#00ff99'], // gradient
            stroke: '#4a1850',
            strokeThickness: 5,
            dropShadow: true,
            dropShadowColor: '#000000',
            dropShadowBlur: 4,
            dropShadowAngle: Math.PI / 6,
            dropShadowDistance: 6,
            wordWrap: true,
            wordWrapWidth: 440,
            lineJoin: 'round',
        });
        const scale = new PIXI.Text('x0', scaleStyle);
        scale.anchor.set(1, 0)
        scale.x = gameWidth - 20
        scale.y = 90
        scale.name = 'scale'

        const scoreStyle = new PIXI.TextStyle({
            fontFamily: 'ACastle3',
            fontSize: 100,
            fontStyle: 'italic',
            fontWeight: 'bold',
            fill: ['#ffffff', '#00ff99'], // gradient
            stroke: '#4a1850',
            strokeThickness: 5,
            dropShadow: true,
            dropShadowColor: '#000000',
            dropShadowBlur: 4,
            dropShadowAngle: Math.PI / 6,
            dropShadowDistance: 6,
            wordWrap: true,
            wordWrapWidth: 440,
            lineJoin: 'round',
        });
        const score = new PIXI.Text('F', scoreStyle);
        score.anchor.set(1, 0)
        score.x = gameWidth - 20
        score.y = 140
        score.name = 'score'

        const hearts = new PIXI.Container()
        for (let i = 0; i < playerState.health; i++) {
            const heart = new PIXI.Sprite(activeItems.textures.heart)
            heart.scale.set(0.5)
            heart.position.x = (2 - i) * (heart.width / 2 + 10)
            hearts.addChild(heart)
        }
        hearts.name = 'hearts'
        hearts.position.set(20, 46)

        const stimpack = new PIXI.Sprite(activeItems.textures.stimpack)
        stimpack.scale.set(0.8)
        stimpack.position.set(20, hearts.y + 50)
        const stimpackText = new PIXI.Text('0', textStyles.default30);
        stimpackText.position.set(stimpack.x + stimpack.width, stimpack.y + stimpack.height / 2)

        const handGrenade = new PIXI.Sprite(activeItems.textures.handGrenadeIcon)
        handGrenade.scale.set(0.5)
        handGrenade.position.set(17, stimpack.y + 40)
        const handGrenadeText = new PIXI.Text('0', textStyles.default30);
        handGrenadeText.position.set(handGrenade.x + handGrenade.width, handGrenade.y + handGrenade.height / 2)

        hud.addChild(stimpackText)
        hud.addChild(stimpack)
        hud.addChild(handGrenadeText)
        hud.addChild(handGrenade)
        hud.addChild(hearts)
        hud.addChild(score)
        hud.addChild(scale);
        hud.addChild(points);
    }

    function addPoints(points) {
        gameState.pointsToAdd += points * gameState.multiplier
    }

    function scoreTimer() {
        const interval = setInterval(() => {
            if (isPause) return
            if (gameEnd || isMenu) {
                clearInterval(interval)
                return;
            }
            if (gameState.scoreStreak <= 0) return
            gameState.scoreStreak--
            playerDefaultSpeed = 2 + Number((gameState.points / 10000).toFixed(1))
        }, 500)
    }

    function HUDpause() {
        const hudPause = new PIXI.Container()
        hud.addChild(hudPause)

        const pause = new PIXI.Sprite(menuPause.textures.pause)
        pause.interactive = true
        pause.anchor.set(1)
        pause.position.set(gameWidth - 20, gameHeight - 20)
        hudPause.addChild(pause)

        const pauseMenu = new PIXI.Container()
        hudPause.addChild(pauseMenu)
        pauseMenu.visible = false

        const bg = new PIXI.Graphics();
        bg.beginFill(0x000);
        bg.alpha = 0.4
        bg.drawRect(0, 0, gameWidth, gameHeight);
        pauseMenu.addChild(bg)

        const play = new PIXI.Sprite(menuPause.textures.play)
        play.interactive = true
        play.anchor.set(1)
        play.position.set(gameWidth - 20, gameHeight - 20)
        pauseMenu.addChild(play)

        const heading = new PIXI.Text('PAUSE', textStyles.default80);
        heading.anchor.set(0.5, 1)
        heading.position.set(gameWidth / 2, gameHeight / 4)
        pauseMenu.addChild(heading)

        const distance = new PIXI.Text(`record: ${222}`, textStyles.default40);
        distance.anchor.set(0, 1)
        distance.position.set(20, gameHeight - 20)
        pauseMenu.addChild(distance)

        const leave = new PIXI.Sprite(menuUI.textures.shortexit)
        leave.interactive = true
        leave.anchor.set(0.5)
        leave.scale.set(0.5)
        leave.position.set(gameWidth / 2, gameHeight / 2)
        pauseMenu.addChild(leave)

        const leaveMenu = new PIXI.Container()
        hudPause.addChild(leaveMenu)
        leaveMenu.visible = false
        const leaveText = new PIXI.Text('leaving?', textStyles.default56);
        leaveText.anchor.set(0.5, 0)
        leaveText.position.set(gameWidth / 2, gameHeight / 2.5)
        leaveMenu.addChild(leaveText)
        const leaveDesc = new PIXI.Text('your run progress will be lost are you sure?', textStyles.default30);
        leaveDesc.anchor.set(0.5, 0)
        leaveDesc.position.set(gameWidth / 2, leaveText.y + leaveText.height + 20)
        leaveMenu.addChild(leaveDesc)

        const cancelButton = new PIXI.Sprite(menuUI.textures.exitclear)
        cancelButton.interactive = true
        cancelButton.anchor.set(1, 0)
        cancelButton.scale.set(0.5, 0.4)
        cancelButton.position.set(gameWidth / 2 - 10, leaveDesc.y + leaveDesc.height + 20)
        leaveMenu.addChild(cancelButton)
        const cancelButtonText = new PIXI.Text('leave', textStyles.default40);
        cancelButtonText.anchor.set(0.5)
        cancelButtonText.position.set(cancelButton.x - cancelButton.width / 2, cancelButton.y + cancelButton.height / 2 + 2)
        leaveMenu.addChild(cancelButtonText)

        const stayButton = new PIXI.Sprite(menuUI.textures.stayclear)
        stayButton.interactive = true
        stayButton.anchor.set(0)
        stayButton.scale.set(0.5, 0.4)
        stayButton.position.set(gameWidth / 2 + 10, leaveDesc.y + leaveDesc.height + 20)
        leaveMenu.addChild(stayButton)
        const stayButtonText = new PIXI.Text('stay', textStyles.default40);
        stayButtonText.anchor.set(0.5)
        stayButtonText.position.set(stayButton.x + stayButton.width / 2, stayButton.y + stayButton.height / 2 + 2)
        leaveMenu.addChild(stayButtonText)

        const timerMenu = new PIXI.Container()
        hudPause.addChild(timerMenu)
        timerMenu.visible = false
        const bgTimer = new PIXI.Graphics();
        bgTimer.beginFill(0x000);
        bgTimer.alpha = 0.4
        bgTimer.drawRect(0, 0, gameWidth, gameHeight);
        timerMenu.addChild(bgTimer)
        const timerText = new PIXI.Text('0', textStyles.default180);
        timerText.anchor.set(0.5)
        timerText.position.set(gameWidth / 2, gameHeight / 2)
        timerMenu.addChild(timerText)

        pause.on('pointerdown', () => {
            const allAnimated = world.children.filter(item => item.animationSpeed)
            allAnimated.forEach(item => {
                item.stop()
            })
            isPause = true
            hud.getChildByName('magazine').visible = false
            pauseMenu.visible = true
            leave.visible = true
            pause.visible = false
        })

        play.on('pointerdown', () => {
            pauseMenu.visible = false
            leaveMenu.visible = false
            timerMenu.visible = true
            let timer = 3
            timerText.text = timer
            const delay = setInterval(() => {
                timer--
                timerText.text = timer
                if (timer <= 0) {
                    clearInterval(delay)
                    hud.getChildByName('magazine').visible = true
                    timerMenu.visible = false
                    const allAnimated = world.children.filter(item => item.animationSpeed)
                    allAnimated.forEach(item => {
                        item.play()
                    })
                    isPause = false
                    pause.visible = true
                }
            }, 1000)
        })

        leave.on('pointerdown', () => {
            leaveMenu.visible = true
            leave.visible = false
        })

        cancelButton.on('pointerdown', () => {
            endGame(true)
        })

        stayButton.on('pointerdown', () => {
            leaveMenu.visible = false
            leave.visible = true
        })
    }

    function updateScore() {
        switch (true) {
            case gameState.scoreStreak < 10: {
                hud.getChildByName('score').text = 'F';
                hud.getChildByName('score').style._fill = ["#ffffff","#ff0000"];
                gameState.multiplier = 1
                break
            }
            case gameState.scoreStreak < 20: {
                hud.getChildByName('score').text = 'E';
                hud.getChildByName('score').style._fill = ["#ffffff","#ff5858"];
                gameState.multiplier = 1.1
                break
            }
            case gameState.scoreStreak < 30: {
                hud.getChildByName('score').text = 'D';
                hud.getChildByName('score').style._fill = ["#ffffff","#ffa4d5"];
                gameState.multiplier = 1.2
                break
            }
            case gameState.scoreStreak < 40: {
                hud.getChildByName('score').text = 'C';
                hud.getChildByName('score').style._fill = ["#ffffff","#83b9ff"];
                gameState.multiplier = 1.3
                break
            }
            case gameState.scoreStreak < 50: {
                hud.getChildByName('score').text = 'B';
                hud.getChildByName('score').style._fill = ["#ffffff","#b0ff89"];
                gameState.multiplier = 1.4
                break
            }
            case gameState.scoreStreak < 60: {
                hud.getChildByName('score').text = 'A';
                hud.getChildByName('score').style._fill = ["#ffffff","#9eff11"];
                gameState.multiplier = 1.5
                break
            }
            case gameState.scoreStreak < 70: {
                hud.getChildByName('score').text = 'A+';
                hud.getChildByName('score').style._fill = ["#ffffff","#ffec6e"];
                gameState.multiplier = 1.6
                break
            }
            case gameState.scoreStreak < 80: {
                hud.getChildByName('score').text = 'S';
                hud.getChildByName('score').style._fill = ["#ffffff","#ffcd00"];
                gameState.multiplier = 1.7
                break
            }
            case gameState.scoreStreak < 90: {
                hud.getChildByName('score').text = 'S+';
                hud.getChildByName('score').style._fill = ["#ffffff","#ffa33c"];
                gameState.multiplier = 1.8
                break
            }
            case gameState.scoreStreak >= 90: {
                hud.getChildByName('score').text = 'S++';
                hud.getChildByName('score').style._fill = ["#ffffff","#ff6200"];
                gameState.multiplier = 2
                break
            }
        }
    }
}


async function sleep(ms) {
    let time = 0
    return await new Promise(resolve => {
        const interval = setInterval(() => {
            if (isPause || gameEnd) return
            time++
            if (time >= ms / 10) {
                resolve();
                clearInterval(interval);
            };
        }, 10);
    });
}

function random(min, max, noFloor, noMin) {
    const res = Math.random() * (max - min + (noMin ? 0 : 1)) + min
    if (noFloor) {
        return res
    } else {
        return Math.floor(res)
    }
}

