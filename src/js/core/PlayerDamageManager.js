/**
 * PlayerDamageManager.js
 * 
 * Менеджер урона игроку
 * 
 * Содержит:
 * - Логику нанесения урона игроку
 * - Обработку щитов и пауэр-апов
 * - Обработку смерти игрока
 */

/**
 * Менеджер урона игроку
 */
export class PlayerDamageManager {
    constructor(playerState, gameState) {
        this.playerState = playerState
        this.gameState = gameState
        
        // Колбэки
        this.cameraShake = null
        this.soundPlayer = null
        this.player = null
        this.hud = null
        this.world = null
        this.createParticles = null
        this.sleep = null
        this.endGame = null
        this.HUDupdatePowerUp = null
        this.HUDremoveShield = null
        this.getSecondFloor = null
        this.setPlayerSpeed = null
    }
    
    /**
     * Устанавливает колбэки
     * @param {Object} callbacks - объект с колбэками
     */
    setCallbacks(callbacks) {
        if (callbacks.cameraShake !== undefined) this.cameraShake = callbacks.cameraShake
        if (callbacks.soundPlayer !== undefined) this.soundPlayer = callbacks.soundPlayer
        if (callbacks.player !== undefined) this.player = callbacks.player
        if (callbacks.hud !== undefined) this.hud = callbacks.hud
        if (callbacks.world !== undefined) this.world = callbacks.world
        if (callbacks.createParticles !== undefined) this.createParticles = callbacks.createParticles
        if (callbacks.sleep !== undefined) this.sleep = callbacks.sleep
        if (callbacks.endGame !== undefined) this.endGame = callbacks.endGame
        if (callbacks.HUDupdatePowerUp !== undefined) this.HUDupdatePowerUp = callbacks.HUDupdatePowerUp
        if (callbacks.HUDremoveShield !== undefined) this.HUDremoveShield = callbacks.HUDremoveShield
        if (callbacks.getSecondFloor !== undefined) this.getSecondFloor = callbacks.getSecondFloor
        if (callbacks.setPlayerSpeed !== undefined) this.setPlayerSpeed = callbacks.setPlayerSpeed
    }
    
    /**
     * Наносит урон игроку
     */
    damagePlayer() {
        if (!this.player || !this.playerState) return
        
        // Тряска камеры
        if (this.cameraShake) {
            this.cameraShake(4, 600)
        }
        
        // Установка неуязвимости
        this.playerState.invincible = true
        
        // Проверка наличия щита (boostShield)
        if (this.playerState.activePowerUps.some(item => item.type === 'boostShield')) {
            if (this.soundPlayer) {
                this.soundPlayer.damageMetal()
            }
            this.player.tint = 16777021
            const shieldIndex = this.playerState.activePowerUps.findIndex(item => item.type === 'boostShield')
            if (shieldIndex !== -1) {
                this.playerState.activePowerUps.splice(shieldIndex, 1)
            }
            if (this.HUDupdatePowerUp) {
                this.HUDupdatePowerUp()
            }
        } else {
            // Проверка наличия стимпака
            if (this.playerState.stimpack) {
                if (this.soundPlayer) {
                    this.soundPlayer.damageMetal()
                }
                this.player.tint = 16777021
                this.playerState.stimpack = false
                if (this.HUDremoveShield) {
                    this.HUDremoveShield()
                }
            } else {
                // Нанесение реального урона
                this.gameState.scoreStreak -= 30
                this.player.tint = 16737894
                this.playerState.health--
                
                // Удаление сердца из HUD
                if (this.hud) {
                    const hearts = this.hud.getChildByName('hearts')
                    if (hearts && hearts.children.length > 0) {
                        hearts.removeChildAt(0)
                    }
                }
            }
        }
        
        // Проверка смерти игрока
        if (this.playerState.health <= 0) {
            // Создание частиц крови
            if (this.createParticles) {
                const secondFloor = this.getSecondFloor ? this.getSecondFloor() : false
                const isOnSecondFloor = secondFloor === this.player.y
                for (let i = 0; i <= 20; i++) {
                    this.createParticles(this.player, 'blood', isOnSecondFloor)
                }
            }
            
            // Удаление игрока из мира
            if (this.world && this.player) {
                this.world.removeChild(this.player)
            }
            
            // Остановка движения игрока
            if (this.setPlayerSpeed) {
                this.setPlayerSpeed(false)
            }
            
            // Задержка перед окончанием игры
            if (this.sleep && this.endGame) {
                this.sleep(1000).then(() => {
                    this.endGame()
                })
            }
        } else {
            // Восстановление после урона
            if (this.sleep) {
                this.sleep(200).then(() => {
                    this.playerState.invincible = false
                    if (this.player) {
                        if (this.playerState.inCover) {
                            this.player.tint = this.player.shadow
                        } else {
                            this.player.tint = this.player.color
                        }
                    }
                })
            }
        }
    }
}

