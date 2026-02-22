import * as PIXI from 'pixi.js'
import {soundPlayer} from "../../playSound";

export class Zipline {
    constructor(world, resources) {
        this.world = world
        this.resources = resources

        this.sprite = null
        this.skip = false
        this.toDestroy = false
        this.isEnd = false

        this.bound = 0
    }

    create(pos, type) {
        let texture

        switch (type) {
            //START
            case 1: {
                texture = this.resources.buildZiplineTexture.textures.Zipline2FStart
                this.bound = -16
                break
            }
            //ROOF
            case 2: {
                texture = this.resources.buildZiplineTexture.textures.Zipline1FEnd
                this.bound = 144
                this.isEnd = true
                break
            }
            //END
            case 3: {
                texture = this.resources.buildZiplineTexture.textures.Zipline2FEnd
                this.bound = -6
                this.isEnd = true
                break
            }
        }

        const zipline = new PIXI.Sprite(texture)
        const offset = type === 1 ? zipline.width - 40 : 0
        zipline.position.set(pos.x - offset, pos.y)
        zipline.zIndex = 1

        this.sprite = zipline
        this.addToWorld()

        return this
    }

    activate() {
        if (this.skip) return

        this.skip = true
        soundPlayer.zipLine()
    }

    update() {
        if (this.isOutOfBounds()) {
            this.destroy()
        }
    }

    isOutOfBounds() {
        const zipLine = this.sprite.getBounds()

        return zipLine.x + zipLine.width < 0
    }

    addToWorld() {
        this.world.addChild(this.sprite)
    }

    destroy() {
        this.world.removeChild(this.sprite)
        this.toDestroy = true
    }
}
