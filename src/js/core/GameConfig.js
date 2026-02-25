/**
 * GameConfig.js
 * 
 * Конфигурация игры и константы
 * 
 * Содержит:
 * - Размеры экрана (gameWidth, gameHeight)
 * - Размеры игрового мира (WORLD_WIDTH, WORLD_HEIGHT)
 * - Масштаб игры (gameScale)
 * - Скорости игры (defaultGameSpeed, slowGameSpeed)
 * - Цвета земли (groundColor)
 * - Стили текста (textStyles)
 * - Вероятности спавна (fenceChance, buildingChance)
 * - Экспорт конфигурации для использования в других модулях
 */

import * as PIXI from 'pixi.js'

/**
 * Константы игры
 */
export const GAME_SCALE = 1
export const DEFAULT_GAME_SPEED = 1
export const SLOW_GAME_SPEED = 0.1
export const BULLET_SPEED = 30
export const FENCE_CHANCE = 4
export const BUILDING_CHANCE = 10
export const GROUND_COLORS = ['#eaaaaa','#7f8bff','#a2e0ae']
export const BG_SPEED = 0.2

/**
 * Инициализирует конфигурацию игры на основе размеров экрана
 * @param {number} gameWidth - ширина экрана
 * @param {number} gameHeight - высота экрана
 * @returns {Object} объект конфигурации
 */
export function initGameConfig(gameWidth, gameHeight) {
    const WORLD_WIDTH = Math.floor(gameWidth / GAME_SCALE)
    const WORLD_HEIGHT = Math.floor(gameHeight / GAME_SCALE)
    
    const textStyles = {
        default180: new PIXI.TextStyle({
            fontFamily: 'ACastle3',
            fontSize: 180,
            fill: '#ffffff',
            wordWrap: true,
            wordWrapWidth: gameWidth - 100,
            align: 'center',
        }),
        default60: new PIXI.TextStyle({
            fontFamily: 'ACastle3',
            fontSize: 60,
            fill: '#ffffff',
            wordWrap: true,
            wordWrapWidth: gameWidth - 100,
            align: 'center',
        }),
        default80: new PIXI.TextStyle({
            fontFamily: 'ACastle3',
            fontSize: 80,
            fill: '#ffffff',
            wordWrap: true,
            wordWrapWidth: gameWidth - 100,
            align: 'center',
        }),
        default100: new PIXI.TextStyle({
            fontFamily: 'ACastle3',
            fontSize: 100,
            fill: '#ffffff',
            wordWrap: true,
            wordWrapWidth: gameWidth - 100,
            align: 'center',
        }),
        default40: new PIXI.TextStyle({
            fontFamily: 'ACastle3',
            fontSize: 40,
            fill: '#ffffff',
            wordWrap: true,
            wordWrapWidth: gameWidth - 100,
            align: 'center',
        }),
        default30: new PIXI.TextStyle({
            fontFamily: 'ACastle3',
            fontSize: 30,
            fill: '#ffffff',
            wordWrap: true,
            wordWrapWidth: gameWidth - 100,
            align: 'left',
            lineHeight: 20
        }),
        default56: new PIXI.TextStyle({
            fontFamily: 'ACastle3',
            fontSize: 56,
            lineHeight: 40,
            fill: '#ffffff',
            wordWrap: true,
            wordWrapWidth: gameWidth - 100,
            align: 'center',
        }),
        green60: new PIXI.TextStyle({
            fontFamily: 'ACastle3',
            fontSize: 60,
            fill: '#81ff6e',
            wordWrap: true,
            wordWrapWidth: gameWidth - 100,
            align: 'center',
        }),
    }
    
    return {
        gameWidth,
        gameHeight,
        WORLD_WIDTH,
        WORLD_HEIGHT,
        textStyles
    }
}
