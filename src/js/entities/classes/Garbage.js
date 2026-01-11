import * as PIXI from 'pixi.js'
import { random } from '../../utils/GameUtils.js'
import { soundPlayer } from "../../playSound";

export class Garbage {
    constructor(posX, posY, type, resources, eventBus) {
        this.resources = resources
        this.body = null
        this.alive = true
        this.eventBus = eventBus

        this.create(posX, posY, type)
    }

    create(posX, posY, type = 0) {
        const rand = type || random(1, 10)
        const garbage = new PIXI.Sprite(this.resources.garbageTexture.textures[`trash${rand}`])
        garbage.type = rand
        garbage.anchor.set(0, 1)
        garbage.position.set(posX, posY)

        this.body = garbage
    }

    breakBottle() {
        // Звук разбития стекла
        if (soundPlayer) {
            soundPlayer.glassBreak()
        }
        
        // Создание частиц
        for (let i = 0; i <= 8; i++) {
            this.eventBus.emit('particle:default', {coords: this.body, type: 'bottle'})
        }

        this.alive = false
    }
}
