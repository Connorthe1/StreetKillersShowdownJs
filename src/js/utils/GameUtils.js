/**
 * GameUtils.js
 * 
 * Утилитарные функции для игры
 * 
 * Содержит:
 * - random(min, max, noFloor, noMin) - генерация случайных чисел
 * - getPercent(value, percent) - вычисление процента от значения
 * - sleep(time, isRoll) - асинхронная задержка с поддержкой паузы
 * - Timer - класс для таймеров с возможностью паузы/возобновления
 * - randomRGB() - генерация случайного RGB цвета
 */

/**
 * Вычисляет процент от значения
 * @param {number} value - исходное значение
 * @param {number} percent - процент
 * @returns {number} результат вычисления
 */
export function getPercent(value, percent) {
    return (value / 100) * percent
}

/**
 * Генерирует случайное число в диапазоне
 * @param {number} min - минимальное значение
 * @param {number} max - максимальное значение
 * @param {boolean} noFloor - не округлять результат (вернуть float)
 * @param {boolean} noMin - не добавлять 1 к диапазону
 * @returns {number} случайное число
 */
export function random(min, max, noFloor, noMin) {
    const res = Math.random() * (max - min + (noMin ? 0 : 1)) + min
    if (noFloor) {
        return res
    } else {
        return Math.floor(res)
    }
}

/**
 * Генерирует случайный RGB цвет
 * @returns {number} цвет в формате 0xRRGGBB
 */
export function randomRGB() {
    const randomBetween = (min, max) => min + Math.floor(Math.random() * (max - min + 1));
    const r = randomBetween(0, 255);
    const g = randomBetween(0, 255);
    const b = randomBetween(0, 255);
    return (r << 16) + (g << 8) + (b);
}
