export const BASE_STORAGE = {
    record: 0,
    money: 0,
    gold: 0,
    lang: 'ru',
    muteSound: false,
    muteMusic: false,
    lastUpdate: 0,
    selectedSkin: 3,
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

export class StorageManager {
    constructor() {
        this.storage = { ...BASE_STORAGE }
        this.apiBaseUrl = import.meta.env.VITE_API_URL || ''
        this.userId = null
    }

    getUserId() {
        if (typeof window !== 'undefined' && window.Telegram?.WebApp?.initDataUnsafe?.user?.id) {
            return String(window.Telegram.WebApp.initDataUnsafe.user.id)
        }
        return null
    }

    async load() {
        this.userId = this.getUserId()

        if (this.userId && this.apiBaseUrl) {
            try {
                const response = await fetch(`${this.apiBaseUrl}/api/stats/${this.userId}`)
                if (response.ok) {
                    const data = await response.json()
                    this.storage = { ...BASE_STORAGE, ...data }
                    return
                }
            } catch (e) {
                console.error('Error loading from API:', e)
            }
        }

        this.loadFromLocalStorage()
    }

    loadFromLocalStorage() {
        try {
            const stored = localStorage.getItem('storage')
            if (stored) {
                this.storage = JSON.parse(stored)
            } else {
                this.storage = { ...BASE_STORAGE }
            }
        } catch (e) {
            console.error('Error loading from localStorage:', e)
            this.storage = { ...BASE_STORAGE }
        }
    }

    async save() {
        this.saveToLocalStorage()

        if (this.userId && this.apiBaseUrl) {
            try {
                await fetch(`${this.apiBaseUrl}/api/stats/${this.userId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(this.storage),
                })
            } catch (e) {
                console.error('Error saving to API:', e)
            }
        }
    }

    saveToLocalStorage() {
        try {
            localStorage.setItem('storage', JSON.stringify(this.storage))
        } catch (e) {
            console.error('Error saving to localStorage:', e)
        }
    }

    updateRecord(points) {
        if (Number(this.storage.record) < points) {
            this.storage.record = points
        }
    }

    addMoney(amount) {
        this.storage.money = Number(this.storage.money) + amount
    }

    subtractMoney(amount) {
        if (this.storage.money >= amount) {
            this.storage.money = Number(this.storage.money) - amount
            return true
        }
        return false
    }

    hasEnoughMoney(amount) {
        return Number(this.storage.money) >= amount
    }

    addGold(amount) {
        this.storage.gold = Number(this.storage.gold) + amount
    }

    selectSkin(skinId) {
        this.storage.selectedSkin = skinId
    }

    buySkin(skinId, price) {
        if (this.hasEnoughMoney(price) && !this.storage.ownedSkins.includes(skinId)) {
            this.subtractMoney(price)
            this.storage.ownedSkins.push(skinId)
            return true
        }
        return false
    }

    isSkinOwned(skinId) {
        return this.storage.ownedSkins.includes(skinId)
    }

    buyUpgrade(upgradeName, price) {
        if (this.hasEnoughMoney(price)) {
            this.subtractMoney(price)
            this.storage.upgrades[upgradeName]++
            return true
        }
        return false
    }

    getUpgradeLevel(upgradeName) {
        return this.storage.upgrades[upgradeName] || 0
    }

    buyActiveItem(itemName, price) {
        if (this.hasEnoughMoney(price)) {
            this.subtractMoney(price)
            this.storage.activeItems[itemName]++
            return true
        }
        return false
    }

    getActiveItemCount(itemName) {
        return this.storage.activeItems[itemName] || 0
    }

    useActiveItem(itemName) {
        if (this.storage.activeItems[itemName] > 0) {
            this.storage.activeItems[itemName]--
            return true
        }
        return false
    }

    getStorage() {
        return this.storage
    }
}
