/**
 * ZipLineManager.js
 * 
 * Менеджер зиплайнов
 * 
 * Содержит:
 * - Создание зиплайнов (создаются в Building.js, но управляются здесь)
 * - Обновление зиплайнов (updateZiplines)
 * - Взаимодействие с игроком (перемещение между этажами)
 * - Удаление использованных зиплайнов
 */

import * as PIXI from 'pixi.js'
import {Zipline} from "../classes/ZipLine";

/**
 * Менеджер зиплайнов
 */
export class ZipLineManager {
    constructor(world, worldCoords, resources, eventBus) {
        this.world = world
        this.worldCoords = worldCoords
        this.resources = resources
        this.eventBus = eventBus

        // Массив зиплайнов
        this.zipLines = []

        eventBus.on('zipline:create', data => {
            this.createZipline(data.pos, data.type)
        })
    }

    createZipline(pos, type) {
        this.zipLines.push(new Zipline(this.world, pos, this.resources, type))
    }
    
    /**
     * Обновляет зиплайны
     */
    updateZiplines() {
        this.zipLines.forEach((zip, idx) => {
            // Удаление за левой границей
            const zipX = zip.body.position ? zip.body.position.x : (zip.body.x || 0)
            const zipWidth = zip.body.width || 0
            
            if (zipX + zipWidth < this.worldCoords.zeroLeft) {
                zip.clear()
                this.zipLines.splice(idx, 1)
                return
            }
            
            // Пропуск, если игрок уже на зиплайне или зиплайн использован
            if (zip.used) return

            // zip.update()
            
            // Проверка коллизии с игроком
        })
    }
    
    /**
     * Очищает все зиплайны
     */
    clear() {
        this.zipLines.forEach(zipLine => {
            zipLine.clear()
        })
        this.zipLines = []
    }
}
