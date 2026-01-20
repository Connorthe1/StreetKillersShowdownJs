import * as PIXI from 'pixi.js'
import {soundPlayer} from "../../playSound";

export class Zipline {
    constructor(world, pos, resources, type) {
        this.world = world
        this.resources = resources

        this.body = null
        this.used = false
        this.isEndBuilding = false
        this.type = type

        this.create(pos)
    }
    
    /**
     * Обновляет зиплайны
     */
    update() {
        zipLines.forEach((b, idx) => {
            if (b.position.x + b.width < worldCoords.zeroLeft) {
                world.removeChild(b)
                zipLines.splice(idx, 1)
                return;
            }
            if (playerState.inZipLine || b.used) return
            if (b.position.x + (b.end ? b.width - 20 : -10) < player.x && b.position.x + (b.end ? b.width : 0) > player.x) {
                b.used = true
                soundPlayer.zipLine()
                playerState.inZipLine = b.end ? "bot" : "top"
                setPlayerSpeed(0)
                playAnim('zipLine')
                player.rotation = skinStore[Number(storage.selectedSkin)].noRotate ? 0 : 4.8
            }
        })
    }

    create(pos) {
        let texture

        switch (this.type) {
            case 1: {
                texture = this.resources.buildZiplineTexture.textures.Zipline2FStart
                break
            }
            case 2: {
                texture = this.resources.buildZiplineTexture.textures.Zipline1FEnd
                this.isEndBuilding = true
                break
            }
            case 3: {
                texture = this.resources.buildZiplineTexture.textures.Zipline2FEnd
                this.isEndBuilding = true
                break
            }
        }

        const zipline = new PIXI.Sprite(texture)
        const offset = this.type === 1 ? zipline.width - 40 : 0
        zipline.position.set(pos.x - offset, pos.y)
        zipline.zIndex = 1
        if (this.world) {
            this.world.addChild(zipline)
        }
        this.body = zipline
        return this.body
    }
    
    /**
     * Очищает все зиплайны
     */
    clear() {
        if (this.world) {
            this.world.removeChild(this.body)
        }
    }
}
