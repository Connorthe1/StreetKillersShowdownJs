/**
 * HUD.js
 * 
 * Дополнительные функции HUD
 * 
 * Содержит:
 * - Вспомогательные функции для HUD
 * - Утилиты для работы с HUD элементами
 * - Дополнительные методы, не вошедшие в HUDManager
 */

import * as PIXI from 'pixi.js'

/**
 * Утилиты для HUD
 */
export class HUDUtils {
    /**
     * Обновляет FPS отображение
     * @param {PIXI.Container} hud - контейнер HUD
     * @param {PIXI.Application} app - приложение PIXI
     */
    static updateFPS(hud, app) {
        const fps = hud.getChildByName('fps')
        if (fps && app) {
            fps.text = Math.round(app.ticker.FPS)
        }
    }
    
    /**
     * Создает стиль текста для очков
     * @returns {PIXI.TextStyle} стиль текста
     */
    static createPointsStyle() {
        return new PIXI.TextStyle({
            fontFamily: 'ACastle3',
            fontSize: 56,
            fontStyle: 'italic',
            fontWeight: 'bold',
            fill: ['#ffffff', '#00ff99'],
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
        })
    }
    
    /**
     * Создает стиль текста для множителя
     * @returns {PIXI.TextStyle} стиль текста
     */
    static createScaleStyle() {
        return new PIXI.TextStyle({
            fontFamily: 'ACastle3',
            fontSize: 32,
            fontStyle: 'italic',
            fontWeight: 'bold',
            fill: ['#ffffff', '#00ff99'],
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
        })
    }
    
    /**
     * Создает стиль текста для рейтинга
     * @returns {PIXI.TextStyle} стиль текста
     */
    static createScoreStyle() {
        return new PIXI.TextStyle({
            fontFamily: 'ACastle3',
            fontSize: 100,
            fontStyle: 'italic',
            fontWeight: 'bold',
            fill: ['#ffffff', '#00ff99'],
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
        })
    }
    
    /**
     * Получает цвет рейтинга на основе значения
     * @param {string} score - рейтинг (F, D, C, B, A, S)
     * @returns {number} цвет в формате PIXI
     */
    static getScoreColor(score) {
        const colors = {
            'F': 0xffffff,
            'D': 0x888888,
            'C': 0x00ff00,
            'B': 0x0088ff,
            'A': 0xff00ff,
            'S': 0xffaa00
        }
        return colors[score] || colors['F']
    }
}
