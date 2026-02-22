import { Trap } from '../Trap'
import * as PIXI from 'pixi.js'
import {soundPlayer} from "../../../playSound";

export class BarrelTrap extends Trap {
    constructor(world, resources, eventBus, fg, timer) {
        super(world, resources, eventBus)
        this.fg = fg
        this.timer = timer
        this.collisionOffset = {left: 20, right: 50}
    }

    async activate(player) {
        if (!this.isAlive) return
        if (player && player.isRollState()) return

        this.isAlive = false

        soundPlayer.damageMetal()
        soundPlayer.beep()

        await this.timer.sleep(100, 'barrel:delay')

        this.sprite.children[0].textures = this.resources.bochka.animations.bochkaTopDead
        this.sprite.children[1].textures = this.resources.bochka.animations.bochkaDownDead
        this.sprite.children[0].play()
        this.sprite.children[1].play()

        for (let i = 0; i < 20; i++) {
            this.eventBus.emit('particle:default', {coords: this.sprite.children[0], type: 'spark'})
        }

        this.eventBus.emit('explode:create', {
            target: this.sprite.children[0],
            offsetX: -20,
            offsetY: 10,
            isBig: false
        })
        this.eventBus.emit('explode:create', {
            target: this.sprite.children[1],
            offsetX: 20,
            offsetY: 30,
            isBig: false,
            silence: true
        })
    }

    /**
     * Создаёт спрайт бочки и возвращает this для цепочки вызовов.
     * @param {number} x - позиция по X
     * @param {number} groundY - Y координата земли
     * @returns {BarrelTrap}
     */
    create(x, groundY) {
        this.sprite = new PIXI.Container()

        const bochkaTop = new PIXI.AnimatedSprite(this.resources.bochka.animations.bochkaTop)
        const bochkaDown = new PIXI.AnimatedSprite(this.resources.bochka.animations.bochkaDown)

        bochkaTop.scale.set(2)
        bochkaDown.scale.set(2)
        bochkaTop.loop = false
        bochkaDown.loop = false
        bochkaTop.animationSpeed = 0.2
        bochkaDown.animationSpeed = 0.2
        bochkaDown.anchor.set(0.5)
        bochkaTop.anchor.set(0.5)
        bochkaDown.parentGroup = this.fg
        bochkaDown.zOrder = 10
        bochkaTop.position.set(x, groundY + 56)
        bochkaDown.position.set(x, bochkaTop.y + 6)

        this.sprite.addChild(bochkaTop)
        this.sprite.addChild(bochkaDown)

        this.addToWorld()
        return this
    }
}
