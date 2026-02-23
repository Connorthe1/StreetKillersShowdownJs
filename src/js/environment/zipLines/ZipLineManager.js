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
import {Zipline} from "./ZipLine";

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

        eventBus.on('zipline:create', ({pos, type}) => {
            this.createZipline(pos, type)
        })
    }

    createZipline(pos, type) {
        this.zipLines.push(new Zipline(this.world, this.resources).create(pos, type))
    }
    
    /**
     * Обновляет зиплайны
     */
    update() {
        this.zipLines.forEach(zipLine => zipLine.update())

        this.zipLines = this.zipLines.filter(zipLine => zipLine.toDestroy === false)
    }
    
    /**
     * Очищает все зиплайны
     */
    clear() {
        this.zipLines.forEach(zipLine => {
            zipLine.destroy()
        })
        this.zipLines = []
    }
}
