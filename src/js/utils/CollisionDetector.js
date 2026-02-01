/**
 * CollisionDetector.js
 * 
 * Обнаружение коллизий между объектами
 * 
 * Содержит:
 * - Класс CollisionDetector
 * - Методы проверки коллизий между различными объектами
 * - Проверка столкновений пуль с врагами/игроком
 * - Проверка столкновений игрока с врагами/ловушками
 * - Вспомогательные методы для проверки пересечений bounds
 */

/**
 * Детектор коллизий
 */
export class CollisionDetector {
    constructor() {
        // Кэш для оптимизации (опционально)
        this.cache = new Map()
    }
    
    /**
     * Проверяет пересечение двух прямоугольников (AABB)
     * @param {Object} rect1 - первый прямоугольник {x, y, width, height}
     * @param {Object} rect2 - второй прямоугольник {x, y, width, height}
     * @returns {boolean} true если пересекаются
     */
    checkAABB(rect1, rect2) {
        return (
            rect1.x < rect2.x + rect2.width &&
            rect1.x + rect1.width > rect2.x &&
            rect1.y < rect2.y + rect2.height &&
            rect1.y + rect1.height > rect2.y
        )
    }
    
    /**
     * Проверяет коллизию пули с объектом
     * @param {PIXI.Sprite} bullet - пуля
     * @param {PIXI.Sprite|PIXI.Container} target - цель
     * @returns {boolean} true если есть коллизия
     */
    checkBulletCollision(bullet, target) {
        if (!bullet || !target) return false
        
        const bulletBounds = bullet.getBounds ? bullet.getBounds() : bullet
        const targetBounds = target.getBounds ? target.getBounds() : target
        
        return this.checkAABB(
            {
                x: bulletBounds.x,
                y: bulletBounds.y,
                width: bulletBounds.width,
                height: bulletBounds.height
            },
            {
                x: targetBounds.x,
                y: targetBounds.y,
                width: targetBounds.width,
                height: targetBounds.height
            }
        )
    }
    
    /**
     * Проверяет коллизию игрока с объектом
     * @param {PIXI.Sprite} player - игрок
     * @param {PIXI.Sprite|PIXI.Container} target - цель
     * @param {Object} playerOffset - смещение для игрока {x: 40, y: 0}
     * @param {Object} targetOffset - смещение для цели {x: 0, y: 0}
     * @returns {boolean} true если есть коллизия
     */
    checkPlayerCollision(player, target, playerOffset = { x: 40, y: 0 }, targetOffset = { x: 0, y: 0 }) {
        if (!player || !target) return false
        
        const playerBounds = player.getBounds ? player.getBounds() : player
        const targetBounds = target.getBounds ? target.getBounds() : target
        
        return (
            player.x + playerOffset.x > targetBounds.x + targetOffset.x &&
            player.x < targetBounds.x + targetBounds.width + targetOffset.x &&
            player.y - player.height / 2 < targetBounds.y + targetBounds.height &&
            player.y + player.height / 2 > targetBounds.y
        )
    }
    
    /**
     * Проверяет коллизию врага с объектом
     * @param {PIXI.Sprite} enemy - враг
     * @param {PIXI.Sprite|PIXI.Container} target - цель
     * @param {Object} enemyOffset - смещение для врага {x: -width/2, y: -height/2}
     * @returns {boolean} true если есть коллизия
     */
    checkEnemyCollision(enemy, target, enemyOffset = { x: 0, y: 0 }) {
        if (!enemy || !target) return false
        
        const enemyBounds = enemy.getBounds ? enemy.getBounds() : enemy
        const targetBounds = target.getBounds ? target.getBounds() : target
        
        return (
            enemy.x - enemy.width / 2 + enemyOffset.x < targetBounds.x + targetBounds.width &&
            enemy.x + enemy.width / 2 + enemyOffset.x > targetBounds.x &&
            enemy.y - enemy.height / 2 + enemyOffset.y < targetBounds.y + targetBounds.height &&
            enemy.y + enemy.height / 2 + enemyOffset.y > targetBounds.y
        )
    }
    
    /**
     * Проверяет коллизию банки с объектом
     * @param {PIXI.Sprite} can - банка
     * @param {PIXI.Sprite|PIXI.Container} target - цель
     * @returns {boolean} true если есть коллизия
     */
    checkCanCollision(can, target) {
        if (!can || !target) return false
        
        const canBounds = can.getBounds ? can.getBounds() : can
        const targetBounds = target.getBounds ? target.getBounds() : target
        
        return (
            canBounds.x > targetBounds.x &&
            targetBounds.x + targetBounds.width > canBounds.x &&
            canBounds.y > targetBounds.y &&
            targetBounds.y + targetBounds.height > canBounds.y
        )
    }
    
    /**
     * Проверяет коллизию игрока с пулей врага
     * @param {PIXI.Sprite} player - игрок
     * @param {PIXI.Sprite} bullet - пуля
     * @returns {boolean} true если есть коллизия
     */
    checkPlayerBulletCollision(player, bullet) {
        if (!player || !bullet) return false
        
        return (
            player.x + 40 > bullet.x &&
            player.x < bullet.x &&
            player.y - player.height / 2 < bullet.y &&
            player.y + player.height / 2 > bullet.y
        )
    }
    
    /**
     * Проверяет коллизию пули игрока с врагом
     * @param {PIXI.Sprite} bullet - пуля
     * @param {PIXI.Sprite} enemy - враг
     * @returns {boolean} true если есть коллизия
     */
    checkBulletEnemyCollision(bullet, enemy) {
        if (!bullet || !enemy) return false
        
        return (
            enemy.x - enemy.width / 2 < bullet.x + bullet.width &&
            enemy.x + enemy.width / 2 > bullet.x &&
            enemy.y - enemy.height / 2 < bullet.y &&
            enemy.y + enemy.height / 2 > bullet.y
        )
    }
    
    /**
     * Проверяет коллизию пули с боссом
     * @param {PIXI.Sprite} bullet - пуля
     * @param {PIXI.Sprite} boss - босс
     * @returns {boolean} true если есть коллизия
     */
    checkBulletBossCollision(bullet, boss) {
        if (!bullet || !boss) return false
        
        const bulletBounds = bullet.getBounds ? bullet.getBounds() : bullet
        const bossBounds = boss.getBounds ? boss.getBounds() : boss
        
        return (
            bulletBounds.x + bulletBounds.width > bossBounds.x &&
            bossBounds.x + bossBounds.width > bulletBounds.x &&
            bulletBounds.y + bulletBounds.height > bossBounds.y &&
            bossBounds.y + bossBounds.height > bulletBounds.y
        )
    }
    
    /**
     * Проверяет коллизию игрока с врагом (для ближнего боя)
     * @param {PIXI.Sprite} player - игрок
     * @param {PIXI.Sprite} enemy - враг
     * @param {number} margin - отступ для проверки
     * @returns {boolean} true если есть коллизия
     */
    checkPlayerEnemyMelee(player, enemy, margin = 30) {
        if (!player || !enemy) return false
        
        return (
            player.x > enemy.x - margin &&
            player.x + 40 < enemy.x + enemy.width
        )
    }
    
    /**
     * Проверяет коллизию игрока с лужей
     * @param {PIXI.Sprite} player - игрок
     * @param {PIXI.Sprite} puddle - лужа
     * @returns {boolean} true если есть коллизия
     */
    checkPlayerPuddleCollision(player, puddle) {
        if (!player || !puddle) return false
        
        return (
            player.x + 40 > puddle.x + 20 &&
            puddle.x + puddle.width > player.x
        )
    }
    
    /**
     * Проверяет коллизию игрока с банкой
     * @param {PIXI.Sprite} player - игрок
     * @param {PIXI.Sprite} can - банка
     * @returns {boolean} true если есть коллизия
     */
    checkPlayerCanCollision(player, can) {
        if (!player || !can) return false
        
        return (
            player.x + 40 > can.x + 40 &&
            player.x < can.x + 20 &&
            can.y > player.y &&
            player.y + player.height > can.y
        )
    }
    
    /**
     * Проверяет коллизию игрока с ловушкой
     * @param {PIXI.Sprite} player - игрок
     * @param {PIXI.Container} trap - ловушка
     * @returns {boolean} true если есть коллизия
     */
    checkPlayerTrapCollision(player, trap) {
        if (!player || !trap) return false
        
        const trapBounds = trap.getBounds ? trap.getBounds() : trap
        const playerBounds = player.getBounds ? player.getBounds() : player
        
        return (
            playerBounds.x > trapBounds.x + 20 &&
            playerBounds.x < trapBounds.x + 50
        )
    }
    
    /**
     * Проверяет коллизию гранаты с объектами в радиусе
     * @param {PIXI.Sprite} grenade - граната
     * @param {PIXI.Sprite|PIXI.Container} target - цель
     * @param {number} radius - радиус взрыва
     * @returns {boolean} true если цель в радиусе
     */
    checkGrenadeRadius(grenade, target, radius = 200) {
        if (!grenade || !target) return false
        
        const grenadeBounds = grenade.getBounds ? grenade.getBounds() : grenade
        const targetBounds = target.getBounds ? target.getBounds() : target
        
        const grenadeX = grenadeBounds.x + grenadeBounds.width / 2
        const grenadeY = grenadeBounds.y + grenadeBounds.height / 2
        const targetX = targetBounds.x + targetBounds.width / 2
        const targetY = targetBounds.y + targetBounds.height / 2
        
        const distance = Math.sqrt(
            Math.pow(targetX - grenadeX, 2) + Math.pow(targetY - grenadeY, 2)
        )
        
        return distance <= radius
    }
    
    /**
     * Проверяет коллизию взрыва бочки с объектами
     * @param {PIXI.Container} barrel - бочка
     * @param {PIXI.Sprite|PIXI.Container} target - цель
     * @param {number} radius - радиус взрыва
     * @returns {boolean} true если цель в радиусе
     */
    checkBarrelExplosion(barrel, target, radius = 100) {
        if (!barrel || !target) return false
        
        const barrelBounds = barrel.getBounds ? barrel.getBounds() : barrel
        const targetBounds = target.getBounds ? target.getBounds() : target
        
        return (
            targetBounds.x + targetBounds.width > barrelBounds.x - radius &&
            targetBounds.x < barrelBounds.x + barrelBounds.width + radius
        )
    }
    
    /**
     * Проверяет, находится ли объект в видимой области
     * @param {PIXI.Sprite|PIXI.Container} obj - объект
     * @param {number} zeroLeft - левая граница видимой области
     * @param {number} zeroRight - правая граница видимой области
     * @returns {boolean} true если объект видим
     */
    isInVisibleArea(obj, zeroLeft, zeroRight) {
        if (!obj) return false
        
        const bounds = obj.getBounds ? obj.getBounds() : obj
        
        return bounds.x + bounds.width >= zeroLeft && bounds.x <= zeroRight
    }
    
    /**
     * Проверяет, нужно ли удалить объект (он вышел за левую границу)
     * @param {PIXI.Sprite|PIXI.Container} obj - объект
     * @param {number} zeroLeft - левая граница видимой области
     * @param {number} margin - отступ для удаления
     * @returns {boolean} true если нужно удалить
     */
    shouldRemove(obj, zeroLeft, margin = 0) {
        if (!obj) return false
        
        const bounds = obj.getBounds ? obj.getBounds() : obj
        
        return bounds.x + bounds.width < zeroLeft - margin
    }
    
    /**
     * Очистка кэша
     */
    clearCache() {
        this.cache.clear()
    }
}
