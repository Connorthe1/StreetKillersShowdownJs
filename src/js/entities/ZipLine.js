/**
 * ZipLine.js
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

/**
 * Менеджер зиплайнов
 */
export class ZipLineManager {
    constructor(world, player, playerState, zeroLeft, soundPlayer, storage, skinStore) {
        this.world = world
        this.player = player
        this.playerState = playerState
        this.zeroLeft = zeroLeft
        this.soundPlayer = soundPlayer
        this.storage = storage
        this.skinStore = skinStore
        
        // Массив зиплайнов
        this.zipLines = []
        
        // Callbacks
        this.playAnimCallback = null
        this.playerSpeed = null
    }
    
    /**
     * Устанавливает колбэки
     */
    setCallbacks(callbacks) {
        if (callbacks.playAnim) this.playAnimCallback = callbacks.playAnim
        if (callbacks.playerSpeed) this.playerSpeed = callbacks.playerSpeed
    }
    
    /**
     * Обновляет состояние
     */
    updateState(state) {
        if (state.player !== undefined) this.player = state.player
        if (state.playerState !== undefined) this.playerState = state.playerState
        if (state.zeroLeft !== undefined) this.zeroLeft = state.zeroLeft
    }
    
    /**
     * Добавляет зиплайн в массив
     * @param {PIXI.Sprite} zipLine - зиплайн
     */
    addZipLine(zipLine) {
        if (!zipLine.used) {
            zipLine.used = false
        }
        this.zipLines.push(zipLine)
    }
    
    /**
     * Обновляет зиплайны
     */
    updateZiplines() {
        if (!this.player || !this.playerState) return
        
        this.zipLines.forEach((b, idx) => {
            // Удаление за левой границей
            const zipX = b.position ? b.position.x : (b.x || 0)
            const zipWidth = b.width || 0
            
            if (zipX + zipWidth < this.zeroLeft) {
                if (this.world) {
                    this.world.removeChild(b)
                }
                this.zipLines.splice(idx, 1)
                return
            }
            
            // Пропуск, если игрок уже на зиплайне или зиплайн использован
            if (this.playerState.inZipLine || b.used) return
            
            // Проверка коллизии с игроком
            const playerX = this.player.x || 0
            const zipStart = b.end ? zipX + zipWidth - 20 : zipX - 10
            const zipEnd = b.end ? zipX + zipWidth : zipX
            
            if (zipStart < playerX && zipEnd > playerX) {
                b.used = true
                
                // Звук зиплайна
                if (this.soundPlayer) {
                    this.soundPlayer.zipLine()
                }
                
                // Установка состояния игрока
                this.playerState.inZipLine = b.end ? "bot" : "top"
                
                // Остановка игрока
                if (this.playerSpeed !== null && this.playerSpeed !== undefined) {
                    this.playerSpeed.value = 0
                }
                
                // Анимация зиплайна
                if (this.playAnimCallback) {
                    this.playAnimCallback('zipLine')
                }
                
                // Поворот игрока (если скин не запрещает поворот)
                if (this.player && this.storage && this.skinStore) {
                    const skinData = this.skinStore[Number(this.storage.selectedSkin)]
                    this.player.rotation = skinData && skinData.noRotate ? 0 : 4.8
                }
            }
        })
    }
    
    /**
     * Получает массив зиплайнов
     */
    getZipLines() {
        return this.zipLines
    }
    
    /**
     * Очищает все зиплайны
     */
    clear() {
        this.zipLines.forEach(zipLine => {
            if (this.world) {
                this.world.removeChild(zipLine)
            }
        })
        this.zipLines = []
    }
}
