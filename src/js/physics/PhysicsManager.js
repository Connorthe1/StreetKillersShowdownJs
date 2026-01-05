/**
 * PhysicsManager.js
 * 
 * Управление физическим движком Matter.js
 * 
 * Содержит:
 * - Класс PhysicsManager
 * - Инициализация Matter.Engine
 * - Создание физических тел
 * - Управление физическим миром
 * - Обновление физики в игровом цикле
 * - Методы для создания статических и динамических тел
 */

import * as Matter from 'matter-js'

/**
 * Класс для управления физическим движком
 */
export class PhysicsManager {
    constructor() {
        this.engine = null
    }
    
    /**
     * Инициализирует физический движок
     * @param {number} timeScale - масштаб времени (по умолчанию 1)
     */
    init(timeScale = 1) {
        this.engine = Matter.Engine.create()
        this.engine.timing.timeScale = timeScale
        return this.engine
    }
    
    /**
     * Обновляет физический движок (вызывается в игровом цикле)
     */
    update() {
        if (this.engine) {
            Matter.Engine.update(this.engine)
        }
    }
    
    /**
     * Создает прямоугольное физическое тело
     * @param {number} x - позиция X
     * @param {number} y - позиция Y
     * @param {number} width - ширина
     * @param {number} height - высота
     * @param {Object} options - опции тела (isStatic, restitution, frictionAir, chamfer и т.д.)
     * @returns {Matter.Body} созданное тело
     */
    createRectangleBody(x, y, width, height, options = {}) {
        return Matter.Bodies.rectangle(x, y, width, height, options)
    }
    
    /**
     * Создает статическое прямоугольное тело
     * @param {number} x - позиция X
     * @param {number} y - позиция Y
     * @param {number} width - ширина
     * @param {number} height - высота
     * @returns {Matter.Body} созданное тело
     */
    createStaticBody(x, y, width, height) {
        return this.createRectangleBody(x, y, width, height, { isStatic: true })
    }
    
    /**
     * Создает динамическое прямоугольное тело
     * @param {number} x - позиция X
     * @param {number} y - позиция Y
     * @param {number} width - ширина
     * @param {number} height - высота
     * @param {Object} options - дополнительные опции
     * @returns {Matter.Body} созданное тело
     */
    createDynamicBody(x, y, width, height, options = {}) {
        return this.createRectangleBody(x, y, width, height, {
            isStatic: false,
            ...options
        })
    }
    
    /**
     * Добавляет тело в физический мир
     * @param {Matter.Body} body - тело для добавления
     */
    addBody(body) {
        if (this.engine && body) {
            Matter.World.add(this.engine.world, body)
        }
    }
    
    /**
     * Удаляет тело из физического мира
     * @param {Matter.Body} body - тело для удаления
     */
    removeBody(body) {
        if (this.engine && body) {
            Matter.World.remove(this.engine.world, body)
        }
    }
    
    /**
     * Применяет силу к телу
     * @param {Matter.Body} body - тело
     * @param {Object} position - позиция приложения силы {x, y}
     * @param {Object} force - вектор силы {x, y}
     */
    applyForce(body, position, force) {
        if (body) {
            Matter.Body.applyForce(body, position, force)
        }
    }
    
    /**
     * Получает экземпляр движка
     * @returns {Matter.Engine} экземпляр движка
     */
    getEngine() {
        return this.engine
    }
    
    /**
     * Получает физический мир
     * @returns {Matter.World} физический мир
     */
    getWorld() {
        return this.engine ? this.engine.world : null
    }
    
    /**
     * Устанавливает масштаб времени
     * @param {number} timeScale - масштаб времени
     */
    setTimeScale(timeScale) {
        if (this.engine) {
            this.engine.timing.timeScale = timeScale
        }
    }
    
    /**
     * Уничтожает физический движок
     */
    destroy() {
        if (this.engine) {
            Matter.Engine.clear(this.engine)
            this.engine = null
        }
    }
}
