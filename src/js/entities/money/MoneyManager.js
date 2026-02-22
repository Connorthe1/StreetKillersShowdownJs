/**
 * MoneyManager.js
 *
 * Менеджер денег
 *
 * Содержит:
 * - Создание денег (create)
 * - Обновление денег (updateDropMoney)
 * - Физика денег (Matter.js)
 * - Сбор денег игроком
 * - Удаление за границами экрана
 */

import { Money } from './Money.js'

/**
 * Менеджер денег
 */
export class MoneyManager {
    constructor(world, physicsManager, worldCoords, resources, eventBus) {
        this.world = world
        this.physicsManager = physicsManager
        this.worldCoords = worldCoords
        this.resources = resources
        this.eventBus = eventBus

        this.moneyDrop = []

        eventBus.on('money:drop', pos => {
            this.create(pos)
        })
    }

    /**
     * Создает деньги на позиции
     * @param {Object|PIXI.Sprite} pos - позиция {x, y} или спрайт с позицией
     */
    create(pos) {
        this.moneyDrop.push(
            new Money(this.world, this.physicsManager, this.resources, this.eventBus).create(pos)
        )
    }

    /**
     * Обновляет все деньги
     */
    update() {
        this.moneyDrop.forEach(m => m.update())
        this.moneyDrop = this.moneyDrop.filter(m => !m.toDestroy)
    }

    /**
     * Очищает все деньги
     */
    clear() {
        this.moneyDrop.forEach(money => {
            this.physicsManager.removeBody(money.body)
            this.world.removeChild(money.sprite)
        })
        this.moneyDrop = []
    }
}
