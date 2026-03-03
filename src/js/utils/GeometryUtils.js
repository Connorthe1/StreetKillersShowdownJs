/**
 * GeometryUtils.js
 *
 * Утилиты для геометрических проверок
 *
 * Содержит:
 * - isPositionInsideBuildings(buildings, x) - проверка попадания позиции внутрь массива зданий
 */

/**
 * Проверяет, попадает ли координата X внутрь здания (массива секций).
 * Массив buildings — это одно здание с секциями: первый элемент — левая граница, последний — правая.
 *
 * @param {Array} buildings - Массив секций здания (PIXI.Container с getBounds/getLocalBounds)
 * @param {number} x - Координата X для проверки (в мировых координатах)
 * @returns {boolean} true, если позиция попадает внутрь здания
 */
export function isPositionInsideBuildings(buildings, x) {
    if (!buildings || buildings.length === 0) return false

    const firstSection = buildings[0]
    const lastSection = buildings[buildings.length - 1]

    const getBounds = (section) => {
        return section.getLocalBounds()
    }

    const firstBounds = getBounds(firstSection)
    const lastBounds = getBounds(lastSection)

    if (!firstBounds || !lastBounds) return false

    const leftEdge = firstBounds.x
    const rightEdge = lastBounds.x + lastBounds.width

    return x >= leftEdge && x <= rightEdge
}
