import * as PIXI from 'pixi.js'
import { random } from '../../utils/GameUtils.js'
import { soundPlayer } from "../../playSound";

export class Garbage {
    constructor(posX, posY, type, resources) {
        this.resources = resources
        this.body = null
        this.alive = true

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

    breakBottle(garbage) {
        // Звук разбития стекла
        if (soundPlayer) {
            soundPlayer.glassBreak()
        }
        
        // Создание частиц
        for (let i = 0; i <= 8; i++) {
            this.particleManager(garbage, 'bottle')
        }

        this.alive = false
    }
}
