/**
 * Player.js
 * 
 * Модуль игрока (ООП подход)
 * 
 * Содержит:
 * - Класс Player (управление игроком и всеми его данными)
 */

import * as PIXI from 'pixi.js'
import { getPercent } from './utils/GameUtils.js'

/**
 * Класс игрока
 */
export class Player {
    constructor() {
        // Спрайт игрока
        this.sprite = null;
        this.currentSkin = null;
        
        // Состояние игрока
        this.state = {
            state: '',
            health: 3,
            invincible: false,
            inCover: false,
            inZipLine: false,
            activePowerUps: [],
            rollId: null,
            secondFloor: false,
            currentSkin: null,
            stimpack: false,
            skillCD: false,
            inBossFight: false,
            leaveCover: false
        };
        
        // Скорости
        this.defaultSpeed = 1;
        this.speed = 1;
        this._initSpeed = 1;
        
        
        // Параметры оружия
        this.gun = {
            ammo: 30,
            currentAmmo: 30,
            damage: 10,
            fireRate: 100,
            type: 'pistol',
            angle: 0.4,
            offsetX: 0,
            offsetY: 0,
            shotTrigger: 0,
            reloadAnim: 0.2,
            reloadTime: 1000,
            noStop: false,
            melee: false
        };
        
        // UI ближнего боя
        this._meleeKill = null;
        
        // Задержка триггера
        this._triggerDelay = false;
    }
    
    /**
     * Создает спрайт игрока
     * @param {Object} skin - параметры скина с текстурами и анимациями
     * @param {number} x - позиция X
     * @param {number} y - позиция Y
     * @returns {PIXI.AnimatedSprite} спрайт игрока
     */
    createPlayer(skin, x = 0, y = 0) {
        if (!skin || !skin.animations) {
            console.warn('Player.createPlayer: skin or animations not provided');
            return null;
        }
        
        this.currentSkin = skin;
        this.state.currentSkin = skin;
        
        // Создание анимированного спрайта из анимации бега
        const playerSprite = new PIXI.AnimatedSprite(skin.animations.run);
        playerSprite.anchor.set(0.5, 0.7);
        playerSprite.position.set(x, y);
        playerSprite.scale.set(2);
        playerSprite.animationSpeed = 0.2;
        playerSprite.loop = true;
        playerSprite.play();
        
        // Сохранение цветов для использования в анимациях
        playerSprite.color = 0xffffff;
        playerSprite.shadow = 0x757575;
        
        // Сохранение ссылки
        this.sprite = playerSprite;
        
        return playerSprite;
    }
    
    /**
     * Обновляет игрока
     * @param {number} delta - дельта времени
     * @param {boolean} gameEnd - игра окончена
     * @param {boolean} gameStart - игра началась
     * @param {number} gameSpeed - скорость игры
     * @param {Array} enemyBullets - массив пуль врагов (обрабатывается здесь для проверки столкновений)
     * @param {PIXI.Container} world - игровой мир
     * @param {Object} soundPlayer - проигрыватель звуков
     * @param {Function} damagePlayer - функция нанесения урона игроку
     */
    updatePlayer(delta, gameEnd, gameStart, gameSpeed, enemyBullets, world, soundPlayer, damagePlayer) {
        if (!this.sprite || gameEnd) return;
        
        // Обновление позиции игрока
        if (gameStart) {
            const speed = this.speed || 1;
            this.sprite.x += (0.5 * speed) * gameSpeed;
        }
        
        // Проверка столкновения с пулями врагов
        if (enemyBullets && Array.isArray(enemyBullets)) {
            enemyBullets.forEach((bullet, idx) => {
                if (!bullet || !this.sprite) return;
                
                const bulletBounds = bullet.getBounds ? bullet.getBounds() : bullet;
                const playerBounds = this.sprite.getBounds();
                
                if (this.sprite.x + 40 > bulletBounds.x &&
                    this.sprite.x < bulletBounds.x &&
                    this.sprite.y - this.sprite.height / 2 < bulletBounds.y &&
                    this.sprite.y + this.sprite.height / 2 > bulletBounds.y) {
                    
                    // Проверка на уклонение
                    if (this.state.state === 'roll' ||
                        this.state.state === 'rollEnd' ||
                        (this.state.inCover && this.state.state !== 'shot')) {
                        if (soundPlayer && soundPlayer.bulletSkip) {
                            soundPlayer.bulletSkip();
                        }
                        return;
                    }
                    
                    // Удаление пули
                    if (world && bullet.parent) {
                        world.removeChild(bullet);
                    }
                    enemyBullets.splice(idx, 1);
                    
                    // Проверка на неуязвимость
                    if (this.state.invincible) {
                        return;
                    }
                    
                    // Нанесение урона
                    if (damagePlayer) {
                        damagePlayer();
                    }
                }
            });
        }
    }
    
    /**
     * Проигрывает анимацию
     * @param {string} anim - название анимации (idle, run, shot, reload, roll, rollEnd, zipLine, melee)
     */
    playAnim(anim) {
        if (!this.sprite || !this.currentSkin || !this.currentSkin.animations) {
            return;
        }
        
        // Настройка цикла анимации
        this.sprite.loop = !anim || anim === 'idle';
        
        // Скорость анимации
        this.sprite.animationSpeed = (anim === 'reload' && this.gun.reloadAnim) ? this.gun.reloadAnim : 0.2;
        
        // Специальная обработка для оружия без остановки
        if (this.gun.noStop && anim === 'shot' && !this.state.inCover) {
            if (this.state.state) {
                this.updatePlayerState(anim, this.currentSkin.animations.run, this.sprite.color);
            } else {
                this.state.state = anim;
            }
            return;
        }
        
        // Сброс состояния
        if (!anim || (anim === 'shotEnd' && this.gun.noStop)) {
            this.resetPlayerState();
        } else {
            // Установка цвета в зависимости от состояния
            const tint = (anim === 'roll' || anim === 'rollEnd' || (this.state.inCover && anim !== 'shot')) ?
                this.sprite.shadow : this.sprite.color;
            this.sprite.tint = tint;
            
            // Обработка специальных анимаций
            if (anim === 'idle' || anim === 'zipLine') {
                if (anim === 'idle') {
                    this.sprite.anchor.y = 0.7;
                }
                this.updatePlayerState('', this.currentSkin.animations[anim], tint);
            } else {
                // Проверка наличия анимации
                if (this.currentSkin.animations[anim]) {
                    this.updatePlayerState(anim, this.currentSkin.animations[anim], tint);
                } else {
                    console.warn(`Animation "${anim}" not found in skin animations`);
                }
            }
        }
    }
    
    /**
     * Обновляет состояние игрока
     * @param {string} state - состояние
     * @param {Array} textures - текстуры анимации
     * @param {number} tint - цвет
     */
    updatePlayerState(state, textures, tint) {
        if (!this.sprite || !textures) return;
        
        this.state.state = state;
        this.sprite.textures = textures;
        this.sprite.tint = tint;
        this.sprite.play();
    }
    
    /**
     * Сбрасывает состояние игрока
     */
    resetPlayerState() {
        if (!this.sprite || !this.currentSkin) return;
        
        this.state.state = '';
        if (this.currentSkin.animations.run) {
            this.sprite.textures = this.currentSkin.animations.run;
        }
        this.sprite.tint = this.sprite.color;
        this.sprite.play();
    }
    
    /**
     * Получает спрайт игрока
     */
    getSprite() {
        return this.sprite;
    }
    
    /**
     * Устанавливает скин
     */
    setSkin(skin) {
        this.currentSkin = skin;
        this.state.currentSkin = skin;
    }
    
    /**
     * Обновляет параметры оружия из скина и апгрейдов
     * @param {number} skinIndex - индекс скина
     * @param {Object} storage - хранилище с апгрейдами
     * @param {Function} getPercent - функция получения процента
     * @param {Array} skinStore - массив скинов
     */
    updateGunFromSkin(skinIndex, storage, getPercent, skinStore = null) {
        if (!storage || !getPercent) {
            console.warn('updateGunFromSkin: storage or getPercent not provided');
            return;
        }
        
        // Базовые параметры оружия
        this.gun.currentAmmo = 5;
        this.gun.ammo = 5;
        this.gun.angle = 0.4;
        this.gun.type = 'pistol';
        this.gun.offsetX = 0;
        this.gun.offsetY = 0;
        this.gun.shotTrigger = 0;
        this.gun.reloadAnim = 0.2;
        this.gun.reloadTime = 1000;
        this.gun.noStop = false;
        this.gun.melee = false;
        this.gun.damage = 10;
        this.gun.fireRate = 100;
        
        // Применение параметров скина
        if (skinStore && skinStore[skinIndex]) {
            const skin = skinStore[skinIndex];
            
            // Тип оружия
            if (skin.gun) {
                this.gun.type = skin.gun;
            }
            
            // Количество патронов
            if (skin.gunAmmo !== undefined) {
                this.gun.ammo = skin.gunAmmo;
                this.gun.currentAmmo = skin.gunAmmo;
            }
            
            // Угол разброса
            if (skin.gunAngle !== undefined) {
                this.gun.angle = skin.gunAngle;
            }
            
            // Урон
            if (skin.gunDamage !== undefined) {
                this.gun.damage = 10 * skin.gunDamage;
            }
            
            // Задержка выстрела
            if (skin.gunShotDelay !== undefined) {
                this.gun.shotTrigger = skin.gunShotDelay;
            }
            
            // Смещение для выстрела
            if (skin.offsetX !== undefined) {
                this.gun.offsetX = skin.offsetX;
            }
            if (skin.offsetY !== undefined) {
                this.gun.offsetY = skin.offsetY;
            }
            
            // Время перезарядки
            if (skin.reloadTime !== undefined) {
                this.gun.reloadTime = skin.reloadTime;
            }
            
            // Скорость анимации перезарядки
            if (skin.reloadAnim !== undefined) {
                this.gun.reloadAnim = skin.reloadAnim;
            }
            
            // Не останавливаться при стрельбе
            if (skin.noStop !== undefined) {
                this.gun.noStop = skin.noStop;
            }
            
            // Ближний бой
            if (skin.melee !== undefined) {
                this.gun.melee = skin.melee;
            }
            
            // Множитель скорости
            if (skin.speedAmp !== undefined) {
                this.defaultSpeed = this._initSpeed * skin.speedAmp;
                this.speed = this.defaultSpeed;
            }
        }
        
        // Применение апгрейдов
        if (storage.upgrades) {
            // Апгрейд триггера
            if (storage.upgrades.gunTrigger) {
                this.gun.shotTrigger = (this.gun.shotTrigger || 0) + (storage.upgrades.gunTrigger * 50);
            }
            
            // Апгрейд точности
            if (storage.upgrades.accuracy) {
                this.gun.angle = Math.max(0.1, this.gun.angle - (storage.upgrades.accuracy * 0.05));
            }
            
            // Апгрейд урона
            if (storage.upgrades.boostGun) {
                this.gun.damage = this.gun.damage + (storage.upgrades.boostGun * 2);
            }
            
            // Апгрейд патронов
            if (storage.upgrades.boostAmmo) {
                this.gun.ammo = this.gun.ammo + (storage.upgrades.boostAmmo * 5);
                this.gun.currentAmmo = this.gun.ammo;
            }
        }
    }
    /**
     * Геттеры и сеттеры для обратной совместимости
     */
    get playerState() {
        return this.state;
    }
    
    get playerDefaultSpeed() {
        return this.defaultSpeed;
    }
    
    get playerSpeed() {
        return this.speed;
    }
    
    get initSpeed() {
        return this._initSpeed;
    }

    set initSpeed(value) {
        this._initSpeed = value;
    }
    
    
    get meleeKill() {
        return this._meleeKill;
    }
    
    get triggerDelay() {
        return this._triggerDelay;
    }
    
    set triggerDelay(value) {
        this._triggerDelay = value;
    }


    /**
     * Метод для стрельбы
     * @param {PIXI.Container} world - игровой мир
     * @param {Object} soundPlayer - проигрыватель звуков
     * @param {Function} createBullet - функция создания пули
     */
    shoot(world, soundPlayer, createBullet) {
        if (!this.state || !this.gun) return;
        
        // Проверка наличия боеприпасов
        if (this.gun.currentAmmo <= 0) {
            this.playAnim('reload');
            return;
        }
        
        // Уменьшение количества патронов
        this.gun.currentAmmo--;
        
        // Воспроизведение звука выстрела
        if (soundPlayer && typeof soundPlayer.playShootSound === 'function') {
            soundPlayer.playShootSound(this.gun.type);
        }
        
        // Создание пули
        if (createBullet && typeof createBullet === 'function') {
            const bullet = createBullet(
                this.sprite.x + this.gun.offsetX,
                this.sprite.y + this.gun.offsetY,
                this.gun.type,
                this.gun.damage
            );
            
            if (bullet && world) {
                world.addChild(bullet);
            }
        }
        
        // Воспроизведение анимации выстрела
        this.playAnim('shot');
    }

    /**
     * Метод для проверки столкновений
     * @param {Object} target - объект, с которым проверяется столкновение
     * @returns {boolean} результат проверки столкновения
     */
    checkCollision(target) {
        if (!this.sprite || !target) return false;
        
        const bounds1 = this.sprite.getBounds();
        const bounds2 = target.getBounds ? target.getBounds() : target;
        
        return (
            bounds1.x < bounds2.x + bounds2.width &&
            bounds1.x + bounds1.width > bounds2.x &&
            bounds1.y < bounds2.y + bounds2.height &&
            bounds1.y + bounds1.height > bounds2.y
        );
    }

    /**
     * Метод для получения урона
     * @param {number} damage - количество урона
     * @param {Function} updateHealth - функция обновления здоровья
     */
    takeDamage(damage, updateHealth) {
        if (this.state.invincible) return;
        
        this.state.health -= damage;
        
        if (updateHealth && typeof updateHealth === 'function') {
            updateHealth(this.state.health);
        }
        
        // Включение режима неуязвимости на короткое время
        this.state.invincible = true;
        setTimeout(() => {
            this.state.invincible = false;
        }, 1000);
    }

    /**
     * Метод для восстановления здоровья
     * @param {number} amount - количество здоровья для восстановления
     * @param {Function} updateHealth - функция обновления здоровья
     */
    heal(amount, updateHealth) {
        this.state.health = Math.min(this.state.health + amount, 3); // Максимальное здоровье 3
        
        if (updateHealth && typeof updateHealth === 'function') {
            updateHealth(this.state.health);
        }
    }

    /**
     * Метод для перезарядки
     * @param {Object} soundPlayer - проигрыватель звуков
     */
    reload(soundPlayer) {
        if (!this.gun || this.gun.currentAmmo === this.gun.ammo) return;
        
        const neededAmmo = this.gun.ammo - this.gun.currentAmmo;
        this.gun.currentAmmo = this.gun.ammo;
        
        // Воспроизведение звука перезарядки
        if (soundPlayer && typeof soundPlayer.playReloadSound === 'function') {
            soundPlayer.playReloadSound();
        }
        
        // Воспроизведение анимации перезарядки
        this.playAnim('reload');
    }

    /**
     * Метод для выполнения ролла (переката)
     * @param {number} direction - направление ролла (-1 или 1)
     */
    roll(direction) {
        if (this.state.state === 'roll' || this.state.state === 'rollEnd') return;
        
        this.state.state = 'roll';
        this.speed = this.defaultSpeed * 2; // Увеличение скорости во время ролла
        
        // Воспроизведение анимации ролла
        this.playAnim('roll');
        
        // Завершение ролла через определенное время
        setTimeout(() => {
            this.state.state = 'rollEnd';
            this.speed = this.defaultSpeed;
            
            // Воспроизведение завершающей анимации ролла
            this.playAnim('rollEnd');
            
            // Сброс состояния через некоторое время
            setTimeout(() => {
                if (this.state.state === 'rollEnd') {
                    this.resetPlayerState();
                }
            }, 200);
        }, 300);
    }

    /**
     * Метод для обновления состояния здоровья
     * @returns {number} текущее здоровье
     */
    getHealth() {
        return this.state.health;
    }

    /**
     * Метод для установки здоровья
     * @param {number} health - новое значение здоровья
     */
    setHealth(health) {
        this.state.health = Math.max(0, Math.min(health, 3)); // Ограничение от 0 до 3
    }

    /**
     * Метод для проверки жив ли игрок
     * @returns {boolean} статус жизни игрока
     */
    isAlive() {
        return this.state.health > 0;
    }

    /**
     * Метод для добавления усилителя
     * @param {string} powerUpType - тип усилителя
     * @param {number} duration - продолжительность действия
     */
    addPowerUp(powerUpType, duration) {
        // Проверка, есть ли уже такой усилитель
        const existingPowerUp = this.state.activePowerUps.find(p => p.type === powerUpType);
        if (existingPowerUp) {
            clearTimeout(existingPowerUp.timeoutId);
        } else {
            this.state.activePowerUps.push({ type: powerUpType, duration });
        }

        // В зависимости от типа усилителя применяем эффект
        switch (powerUpType) {
            case 'health':
                this.heal(1, () => {});
                break;
            case 'speed':
                this.speed = this.defaultSpeed * 1.5;
                break;
            case 'ammo':
                if (this.gun) {
                    this.gun.currentAmmo = this.gun.ammo;
                }
                break;
            case 'invincibility':
                this.state.invincible = true;
                break;
        }

        // Установка таймера для окончания действия усилителя
        const timeoutId = setTimeout(() => {
            this.removePowerUp(powerUpType);
        }, duration);

        // Обновляем ID таймера для этого усилителя
        const powerUpIndex = this.state.activePowerUps.findIndex(p => p.type === powerUpType);
        if (powerUpIndex !== -1) {
            this.state.activePowerUps[powerUpIndex].timeoutId = timeoutId;
        }
    }

    /**
     * Метод для удаления усилителя
     * @param {string} powerUpType - тип усилителя
     */
    removePowerUp(powerUpType) {
        const powerUpIndex = this.state.activePowerUps.findIndex(p => p.type === powerUpType);
        if (powerUpIndex !== -1) {
            const removedPowerUp = this.state.activePowerUps.splice(powerUpIndex, 1)[0];

            // В зависимости от типа усилителя убираем эффект
            switch (powerUpType) {
                case 'speed':
                    this.speed = this.defaultSpeed;
                    break;
                case 'invincibility':
                    this.state.invincible = false;
                    break;
            }

            // Удаляем таймер
            if (removedPowerUp.timeoutId) {
                clearTimeout(removedPowerUp.timeoutId);
            }
        }
    }
}
