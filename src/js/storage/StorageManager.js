/**
 * StorageManager.js
 * 
 * Управление хранилищем данных
 * 
 * Содержит:
 * - baseStorage - базовое состояние хранилища
 * - Метод getData() - загрузка данных из localStorage/VK
 * - Метод saveData() - сохранение данных
 * - Методы для работы с деньгами, золотом, скинами, апгрейдами
 * - Синхронизация с VK Bridge (если используется)
 */

import bridge from '@vkontakte/vk-bridge'

/**
 * Базовое состояние хранилища
 */
export const BASE_STORAGE = {
    record: 0,
    money: 0,
    gold: 0,
    lang: 'ru',
    muteSound: false,
    muteMusic: false,
    lastUpdate: 0,
    selectedSkin: 2,
    ownedSkins: [0],
    activeItems: {
        stimpack: 0,
        grenades: 0
    },
    upgrades: {
        boostAmmo: 0,
        boostGun: 0,
        boostShield: 0,
        can: 0,
        gunTrigger: 0,
        accuracy: 0,
    }
}

/**
 * Класс для управления хранилищем данных
 */
export class StorageManager {
    constructor() {
        this.storage = { ...BASE_STORAGE }
        this.useVKBridge = false // Флаг для использования VK Bridge
    }
    
    /**
     * Загружает данные из хранилища
     * @param {boolean} useVK - использовать ли VK Bridge
     * @returns {Promise<void>}
     */
    async load(useVK = false) {
        this.useVKBridge = useVK
        
        if (useVK) {
            // Загрузка из VK (закомментировано в оригинале)
            // try {
            //     await bridge.send('VKWebAppInit')
            //     const checkAcc = await bridge.send('VKWebAppStorageGetKeys', {count: 1})
            //     if (checkAcc.keys.length === 0) {
            //         await bridge.send("VKWebAppStorageSet", {key: 'storage', value: JSON.stringify(BASE_STORAGE)})
            //     }
            //     const getStorageFromVk = await bridge.send("VKWebAppStorageGet",{keys: ['storage']})
            //     const parse = JSON.parse(getStorageFromVk.keys[0].value)
            //     this.storage = parse
            // } catch (e) {
            //     console.log(e)
            //     // Fallback to localStorage
            //     this.loadFromLocalStorage()
            // }
            this.loadFromLocalStorage()
        } else {
            this.loadFromLocalStorage()
        }
    }
    
    /**
     * Загружает данные из localStorage
     */
    loadFromLocalStorage() {
        try {
            const stored = localStorage.getItem('storage')
            if (stored) {
                const parse = JSON.parse(stored)
                this.storage = parse
            } else {
                this.storage = { ...BASE_STORAGE }
            }
        } catch (e) {
            console.error('Error loading from localStorage:', e)
            this.storage = { ...BASE_STORAGE }
        }
    }
    
    /**
     * Сохраняет данные в хранилище
     * @returns {Promise<void>}
     */
    async save() {
        if (this.useVKBridge) {
            // Сохранение в VK (закомментировано в оригинале)
            // try {
            //     await bridge.send("VKWebAppStorageSet", {key: 'storage', value: JSON.stringify(this.storage)})
            // } catch (e) {
            //     console.error('Error saving to VK:', e)
            //     // Fallback to localStorage
            //     this.saveToLocalStorage()
            // }
            this.saveToLocalStorage()
        } else {
            this.saveToLocalStorage()
        }
    }
    
    /**
     * Сохраняет данные в localStorage
     */
    saveToLocalStorage() {
        try {
            localStorage.setItem('storage', JSON.stringify(this.storage))
        } catch (e) {
            console.error('Error saving to localStorage:', e)
        }
    }
    
    /**
     * Обновляет рекорд, если текущие очки больше
     * @param {number} points - текущие очки
     */
    updateRecord(points) {
        if (Number(this.storage.record) < points) {
            this.storage.record = points
        }
    }
    
    /**
     * Добавляет деньги
     * @param {number} amount - количество денег
     */
    addMoney(amount) {
        this.storage.money = Number(this.storage.money) + amount
    }
    
    /**
     * Вычитает деньги
     * @param {number} amount - количество денег
     * @returns {boolean} true если успешно, false если недостаточно денег
     */
    subtractMoney(amount) {
        if (this.storage.money >= amount) {
            this.storage.money = Number(this.storage.money) - amount
            return true
        }
        return false
    }
    
    /**
     * Проверяет, достаточно ли денег
     * @param {number} amount - количество денег
     * @returns {boolean}
     */
    hasEnoughMoney(amount) {
        return Number(this.storage.money) >= amount
    }
    
    /**
     * Добавляет золото
     * @param {number} amount - количество золота
     */
    addGold(amount) {
        this.storage.gold = Number(this.storage.gold) + amount
    }
    
    /**
     * Выбирает скин
     * @param {number} skinId - ID скина
     */
    selectSkin(skinId) {
        this.storage.selectedSkin = skinId
    }
    
    /**
     * Покупает скин
     * @param {number} skinId - ID скина
     * @param {number} price - цена скина
     * @returns {boolean} true если успешно
     */
    buySkin(skinId, price) {
        if (this.hasEnoughMoney(price) && !this.storage.ownedSkins.includes(skinId)) {
            this.subtractMoney(price)
            this.storage.ownedSkins.push(skinId)
            return true
        }
        return false
    }
    
    /**
     * Проверяет, куплен ли скин
     * @param {number} skinId - ID скина
     * @returns {boolean}
     */
    isSkinOwned(skinId) {
        return this.storage.ownedSkins.includes(skinId)
    }
    
    /**
     * Покупает апгрейд
     * @param {string} upgradeName - название апгрейда
     * @param {number} price - цена апгрейда
     * @returns {boolean} true если успешно
     */
    buyUpgrade(upgradeName, price) {
        if (this.hasEnoughMoney(price)) {
            this.subtractMoney(price)
            this.storage.upgrades[upgradeName]++
            return true
        }
        return false
    }
    
    /**
     * Получает уровень апгрейда
     * @param {string} upgradeName - название апгрейда
     * @returns {number}
     */
    getUpgradeLevel(upgradeName) {
        return this.storage.upgrades[upgradeName] || 0
    }
    
    /**
     * Покупает активный предмет
     * @param {string} itemName - название предмета
     * @param {number} price - цена предмета
     * @returns {boolean} true если успешно
     */
    buyActiveItem(itemName, price) {
        if (this.hasEnoughMoney(price)) {
            this.subtractMoney(price)
            this.storage.activeItems[itemName]++
            return true
        }
        return false
    }
    
    /**
     * Получает количество активного предмета
     * @param {string} itemName - название предмета
     * @returns {number}
     */
    getActiveItemCount(itemName) {
        return this.storage.activeItems[itemName] || 0
    }
    
    /**
     * Использует активный предмет
     * @param {string} itemName - название предмета
     * @returns {boolean} true если успешно
     */
    useActiveItem(itemName) {
        if (this.storage.activeItems[itemName] > 0) {
            this.storage.activeItems[itemName]--
            return true
        }
        return false
    }
    
    /**
     * Получает текущее хранилище (для обратной совместимости)
     * @returns {Object}
     */
    getStorage() {
        return this.storage
    }
}
