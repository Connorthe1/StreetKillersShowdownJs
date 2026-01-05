# План рефакторинга main.js на модули

## 📋 Общая стратегия

1. **Сначала интегрируем существующие модули** (они уже готовы, нужно только подключить)
2. **Затем создаем новые модули** (по приоритету важности)
3. **После каждого шага проверяем работоспособность**
4. **Удаляем старый код** только после полной проверки

---

## 🎯 Этап 1: Интеграция существующих модулей

### Шаг 1.1: Интеграция GrenadeManager

**Цель:** Заменить все функции работы с гранатами на `GrenadeManager`

**Действия:**
1. Импортировать `GrenadeManager` в `main.js`
2. Создать переменную `let grenadeManager` в секции объявления менеджеров
3. В функции `init()` после инициализации `engine`:
   - Создать экземпляр `grenadeManager = new GrenadeManager(...)`
   - Установить все необходимые колбэки через `setCallbacks()`
4. В функции `ticker()` заменить:
   - `updateGrenade()` → `grenadeManager.updateGrenade()`
   - `updateGrenades()` → `grenadeManager.updateGrenades()`
5. В функции `events()` заменить:
   - `grenadeBounce()` → `grenadeManager.grenadeBounce()`
6. В функции `shotGrenade()` заменить на:
   - `grenadeManager.shotGrenade()`
7. В функции `activateGrenade()` заменить на:
   - `grenadeManager.activateGrenade()`
8. Обновить ссылку на `grenades` массив: `grenades = grenadeManager.getGrenades()`
9. Обновить ссылку на `activeGrenade`: `activeGrenade = grenadeManager.getActiveGrenade()`
10. **Проверить работоспособность:** запустить игру, проверить работу гранат
11. **Удалить старые функции:** `grenadeBounce()`, `grenadeExplode()`, `updateGrenade()`, `shotGrenade()`, `updateGrenades()`, `activateGrenade()`

**Файлы для изменения:**
- `src/js/main.js`

**Зависимости:**
- `engine` должен быть инициализирован
- `world` должен быть создан
- Все колбэки должны быть настроены

---

### Шаг 1.2: Интеграция TrapManager

**Цель:** Заменить все функции работы с ловушками на `TrapManager`

**Действия:**
1. Импортировать `TrapManager` в `main.js`
2. Создать переменную `let trapManager` в секции объявления менеджеров
3. В функции `init()` после инициализации `ground`:
   - Создать экземпляр `trapManager = new TrapManager(...)`
   - Установить все необходимые колбэки через `setCallbacks()`
4. В функции `ticker()` заменить:
   - `updateTraps()` → `trapManager.updateTraps()`
5. В функции `spawnEntity()` или где создаются ловушки:
   - `createBarrel()` → `trapManager.createBarrel()`
6. В `BuildingManager` или где создаются окна/двери:
   - `createWindow()` → `trapManager.createWindow()`
   - `createDoor()` → `trapManager.createDoor()`
7. В функции `barrelDead()` заменить на:
   - `trapManager.barrelDead()`
8. Обновить ссылку на `traps` массив: `traps = trapManager.getTraps()`
9. **Проверить работоспособность:** запустить игру, проверить работу ловушек
10. **Удалить старые функции:** `createBarrel()`, `updateTraps()`, `barrelDead()`, `createWindow()`, `createDoor()`

**Файлы для изменения:**
- `src/js/main.js`
- Возможно `src/js/entities/Building.js` (если там вызываются `createWindow`/`createDoor`)

**Зависимости:**
- `ground` должен быть создан
- `fg` должен быть создан
- Все колбэки должны быть настроены

---

### Шаг 1.3: Интеграция MoneyManager

**Цель:** Заменить все функции работы с деньгами на `MoneyManager`

**Действия:**
1. Импортировать `MoneyManager` в `main.js`
2. Создать переменную `let moneyManager` в секции объявления менеджеров
3. В функции `init()` после инициализации `engine`:
   - Создать экземпляр `moneyManager = new MoneyManager(...)`
   - Установить все необходимые колбэки через `setCallbacks()`
4. В функции `ticker()` заменить:
   - `updateDropMoney()` → `moneyManager.updateDropMoney()`
5. В функциях, где создаются деньги (например, при убийстве врага):
   - `spawnDropMoney()` → `moneyManager.spawnDropMoney()`
6. Обновить ссылку на `moneyDrop` массив: `moneyDrop = moneyManager.getMoneyDrop()`
7. **Проверить работоспособность:** запустить игру, проверить сбор денег
8. **Удалить старые функции:** `spawnDropMoney()`, `updateDropMoney()`

**Файлы для изменения:**
- `src/js/main.js`
- Возможно `src/js/entities/Enemy.js` (если там вызывается `spawnDropMoney`)

**Зависимости:**
- `engine` должен быть инициализирован
- `world` должен быть создан
- Все колбэки должны быть настроены

---

### Шаг 1.4: Интеграция PowerUpManager

**Цель:** Заменить все функции работы с пауэр-апами на `PowerUpManager`

**Действия:**
1. Импортировать `PowerUpManager` в `main.js`
2. Создать переменную `let powerUpManager` в секции объявления менеджеров
3. В функции `init()` после инициализации `fg`:
   - Создать экземпляр `powerUpManager = new PowerUpManager(...)`
   - Установить все необходимые колбэки через `setCallbacks()`
4. В функции `ticker()` заменить:
   - `updatePowerUp()` → `powerUpManager.updatePowerUp()`
5. В функции `spawnEntity()` заменить:
   - `createPowerUp()` → `powerUpManager.createPowerUp()`
6. Обновить ссылку на `activePowerUp`: `activePowerUp = powerUpManager.getActivePowerUp()`
7. **Проверить работоспособность:** запустить игру, проверить работу пауэр-апов
8. **Удалить старые функции:** `createPowerUp()`, `updatePowerUp()`

**Файлы для изменения:**
- `src/js/main.js`

**Зависимости:**
- `fg` должен быть создан
- Все колбэки должны быть настроены

---

## 🎯 Этап 2: Создание критичных модулей

### Шаг 2.1: Создание DogEnemyManager

**Цель:** Вынести логику собаки-врага в отдельный модуль

**Действия:**
1. Создать файл `src/js/entities/DogEnemy.js`
2. Изучить функции `createDogEnemy()` и `updateDogEnemy()` в `main.js`
3. Создать класс `DogEnemyManager` с методами:
   - `constructor()` - инициализация
   - `createDogEnemy()` - создание собаки
   - `updateDogEnemy()` - обновление собаки
   - `getCurrentDogEnemy()` - получить текущую собаку
   - `setCallbacks()` - установка колбэков
   - `updateState()` - обновление состояния
4. Импортировать `DogEnemyManager` в `main.js`
5. Создать переменную `let dogEnemyManager` в секции объявления менеджеров
6. В функции `init()` создать экземпляр и установить колбэки
7. В функции `ticker()` заменить:
   - `updateDogEnemy()` → `dogEnemyManager.updateDogEnemy()`
8. В функции `spawnEntity()` заменить:
   - `createDogEnemy()` → `dogEnemyManager.createDogEnemy()`
9. Обновить ссылку: `currentDogEnemy = dogEnemyManager.getCurrentDogEnemy()`
10. **Проверить работоспособность:** запустить игру, проверить работу собаки-врага
11. **Удалить старые функции:** `createDogEnemy()`, `updateDogEnemy()`

**Файлы для создания:**
- `src/js/entities/DogEnemy.js`

**Файлы для изменения:**
- `src/js/main.js`

**Зависимости:**
- `world`, `player`, `playerState`, `playerBullets`, `enemies`, `buildings`, `zeroRight`, `playerPos`, `secondFloor`

---

### Шаг 2.2: Создание InputHandler

**Цель:** Вынести обработку событий в отдельный модуль

**Действия:**
1. Создать файл `src/js/core/InputHandler.js`
2. Изучить функции `events()` и `createSwipes()` в `main.js`
3. Создать класс `InputHandler` с методами:
   - `constructor()` - инициализация
   - `handleEvent()` - обработка события клавиатуры
   - `initSwipes()` - инициализация свайпов
   - `setCallbacks()` - установка колбэков для всех действий
4. Импортировать `InputHandler` в `main.js`
5. Создать переменную `let inputHandler` в секции объявления
6. В функции `init()` или `startGame()`:
   - Создать экземпляр `inputHandler = new InputHandler(...)`
   - Установить все колбэки через `setCallbacks()`
   - Вызвать `inputHandler.initSwipes(canvas)`
7. Заменить обработчик событий:
   - `document.addEventListener('keyup', events)` → `inputHandler.handleEvent()`
   - Или использовать через `EventManager`
8. **Проверить работоспособность:** запустить игру, проверить все действия
9. **Удалить старые функции:** `events()`, `createSwipes()`

**Файлы для создания:**
- `src/js/core/InputHandler.js`

**Файлы для изменения:**
- `src/js/main.js`

**Зависимости:**
- `player`, `playerState`, `gun`, `gameState`, `storage`, `hud`, `soundPlayer`, и все колбэки для действий

---

### Шаг 2.3: Создание ExplosionManager

**Цель:** Вынести логику взрывов в отдельный модуль

**Действия:**
1. Создать файл `src/js/entities/ExplosionManager.js`
2. Изучить функцию `createExplode()` в `main.js`
3. Создать класс `ExplosionManager` с методами:
   - `constructor()` - инициализация
   - `createExplode()` - создание взрыва
   - `setCallbacks()` - установка колбэков
4. Импортировать `ExplosionManager` в `main.js`
5. Создать переменную `let explosionManager` в секции объявления менеджеров
6. В функции `init()` создать экземпляр и установить колбэки
7. Заменить все вызовы `createExplode()` на:
   - `explosionManager.createExplode()`
8. **Проверить работоспособность:** запустить игру, проверить взрывы
9. **Удалить старую функцию:** `createExplode()`

**Файлы для создания:**
- `src/js/entities/ExplosionManager.js`

**Файлы для изменения:**
- `src/js/main.js`
- Возможно другие файлы, где вызывается `createExplode()`

**Зависимости:**
- `particleManager`, `soundPlayer`

---

## 🎯 Этап 3: Создание UI модулей

### Шаг 3.1: Создание MeleeKillManager

**Цель:** Вынести логику ближнего боя в отдельный модуль

**Действия:**
1. Создать файл `src/js/ui/MeleeKillManager.js`
2. Изучить функции `HUDmeleeKill()` и `setMeleeSelector()` в `main.js`
3. Создать класс `MeleeKillManager` с методами:
   - `constructor()` - инициализация
   - `createMeleeKillUI()` - создание UI для ближнего боя
   - `updateMeleeKill()` - обновление UI (движение селектора)
   - `handleMeleeKill()` - обработка результата ближнего боя
   - `setCallbacks()` - установка колбэков
4. Импортировать `MeleeKillManager` в `main.js`
5. Создать переменную `let meleeKillManager` в секции объявления менеджеров
6. В функции `init()` создать экземпляр и установить колбэки
7. В функции `ticker()` заменить логику ближнего боя:
   - Обновление селектора → `meleeKillManager.updateMeleeKill()`
8. В функции `events()` заменить:
   - `setMeleeSelector()` → `meleeKillManager.handleMeleeKill()`
9. В `EnemyManager` или где вызывается `HUDmeleeKill()`:
   - `HUDmeleeKill()` → `meleeKillManager.createMeleeKillUI()`
10. **Проверить работоспособность:** запустить игру, проверить ближний бой
11. **Удалить старые функции:** `HUDmeleeKill()`, `setMeleeSelector()`

**Файлы для создания:**
- `src/js/ui/MeleeKillManager.js`

**Файлы для изменения:**
- `src/js/main.js`
- Возможно `src/js/entities/Enemy.js`

**Зависимости:**
- `hud`, `gameState`, `playerState`, `gun`, `player`, `enemies`, `traps`

---

### Шаг 3.2: Создание MenuManager

**Цель:** Вынести логику меню и магазина в отдельный модуль

**Действия:**
1. Создать файл `src/js/ui/MenuManager.js`
2. Изучить функции `createMenu()` и `createStore()` в `main.js`
3. Создать класс `MenuManager` с методами:
   - `constructor()` - инициализация
   - `createMenu()` - создание главного меню
   - `createStore()` - создание магазина
   - `reloadStoreUpgrades()` - перезагрузка апгрейдов
   - `reloadSkinStore()` - перезагрузка скинов
   - `setCallbacks()` - установка колбэков
4. Импортировать `MenuManager` в `main.js`
5. Создать переменную `let menuManager` в секции объявления менеджеров
6. В функции `init()` создать экземпляр и установить колбэки
7. Заменить вызовы:
   - `createMenu()` → `menuManager.createMenu()`
   - `createStore()` → `menuManager.createStore()`
8. **Проверить работоспособность:** запустить игру, проверить меню и магазин
9. **Удалить старые функции:** `createMenu()`, `createStore()`, `reloadStoreUpgrades()`, `reloadSkinStore()`

**Файлы для создания:**
- `src/js/ui/MenuManager.js`

**Файлы для изменения:**
- `src/js/main.js`

**Зависимости:**
- `app`, `gameState`, `storage`, `storageManager`, `textStyles`, все текстуры меню

---

### Шаг 3.3: Создание EndScreenManager

**Цель:** Вынести логику экрана окончания игры в отдельный модуль

**Действия:**
1. Создать файл `src/js/ui/EndScreenManager.js`
2. Изучить функцию `endGame()` в `main.js`
3. Создать класс `EndScreenManager` с методами:
   - `constructor()` - инициализация
   - `showEndScreen()` - показ экрана окончания
   - `animateScore()` - анимация подсчета очков
   - `setCallbacks()` - установка колбэков
4. Импортировать `EndScreenManager` в `main.js`
5. Создать переменную `let endScreenManager` в секции объявления менеджеров
6. В функции `init()` создать экземпляр и установить колбэки
7. Заменить вызов:
   - `endGame()` → `endScreenManager.showEndScreen()`
8. **Проверить работоспособность:** запустить игру, дойти до конца, проверить экран
9. **Удалить старую функцию:** `endGame()`

**Файлы для создания:**
- `src/js/ui/EndScreenManager.js`

**Файлы для изменения:**
- `src/js/main.js`

**Зависимости:**
- `app`, `gameState`, `storageManager`, `textStyles`, текстуры меню

---

## 🎯 Этап 4: Оптимизация и доработка

### Шаг 4.1: Добавление cameraShake в CameraManager

**Цель:** Перенести функцию тряски камеры в `CameraManager`

**Действия:**
1. Открыть `src/js/core/CameraManager.js`
2. Добавить метод `cameraShake(intensity, duration)`
3. Импортировать `sleep` если нужно
4. В `main.js` заменить:
   - `cameraShake()` → `cameraManager.cameraShake()`
5. **Проверить работоспособность:** запустить игру, проверить тряску камеры
6. **Удалить старую функцию:** `cameraShake()`

**Файлы для изменения:**
- `src/js/core/CameraManager.js`
- `src/js/main.js`

---

### Шаг 4.2: Вынос trailTimer в ParticleManager

**Цель:** Перенести таймер частиц следа в `ParticleManager`

**Действия:**
1. Открыть `src/js/entities/Particle.js`
2. Добавить метод `startTrailTimer()` для запуска таймера
3. Добавить метод `stopTrailTimer()` для остановки таймера
4. В `main.js` в функции `startGame()` заменить:
   - `trailTimer()` → `particleManager.startTrailTimer()`
5. В функции `restartGame()` или `endGame()`:
   - Остановить таймер через `particleManager.stopTrailTimer()`
6. **Проверить работоспособность:** запустить игру, проверить частицы следа
7. **Удалить старую функцию:** `trailTimer()`

**Файлы для изменения:**
- `src/js/entities/Particle.js`
- `src/js/main.js`

---

### Шаг 4.3: Создание PlayerDamageManager (опционально)

**Цель:** Вынести логику урона игроку в отдельный модуль или добавить в `Player.js`

**Действия:**
1. Решить: создать отдельный модуль или добавить в `Player.js`
2. Если отдельный модуль:
   - Создать `src/js/PlayerDamageManager.js`
   - Перенести функцию `damagePlayer()`
3. Если в `Player.js`:
   - Добавить метод `takeDamage()` в класс `Player`
4. В `main.js` заменить:
   - `damagePlayer()` → `playerInstance.takeDamage()` или `playerDamageManager.damagePlayer()`
5. **Проверить работоспособность:** запустить игру, проверить урон
6. **Удалить старую функцию:** `damagePlayer()`

**Файлы для создания/изменения:**
- `src/js/PlayerDamageManager.js` (если отдельный модуль)
- Или `src/js/Player.js` (если добавляем в Player)

**Файлы для изменения:**
- `src/js/main.js`

---

## 🎯 Этап 5: Финальная очистка

### Шаг 5.1: Удаление неиспользуемых функций

**Цель:** Удалить все старые функции, которые были заменены модулями

**Действия:**
1. Пройтись по всем шагам выше и убедиться, что все функции удалены
2. Проверить, нет ли ссылок на удаленные функции
3. Удалить неиспользуемые импорты
4. Удалить неиспользуемые переменные
5. **Проверить работоспособность:** запустить игру, проверить все функции

---

### Шаг 5.2: Обновление GameManager

**Цель:** Добавить все новые менеджеры в `GameManager`

**Действия:**
1. Открыть `src/js/core/GameManager.js`
2. Добавить ссылки на все новые менеджеры:
   - `grenadeManager`
   - `trapManager`
   - `moneyManager`
   - `powerUpManager`
   - `dogEnemyManager`
   - `inputHandler`
   - `explosionManager`
   - `meleeKillManager`
   - `menuManager`
   - `endScreenManager`
3. Обновить метод `setManagers()` для принятия новых менеджеров
4. В `main.js` обновить вызов `gameManager.setManagers()`
5. **Проверить работоспособность:** запустить игру

**Файлы для изменения:**
- `src/js/core/GameManager.js`
- `src/js/main.js`

---

### Шаг 5.3: Финальная проверка и документация

**Цель:** Убедиться, что все работает и обновить документацию

**Действия:**
1. Запустить игру и проверить все функции:
   - ✅ Меню и магазин
   - ✅ Игровой процесс
   - ✅ Враги и боссы
   - ✅ Гранаты и взрывы
   - ✅ Ловушки
   - ✅ Деньги и пауэр-апы
   - ✅ Ближний бой
   - ✅ Экран окончания
   - ✅ Все действия игрока
2. Проверить производительность
3. Обновить `REFACTORING_COMPLETED.md` с информацией о новых модулях
4. Удалить `MODULES_ANALYSIS.md` (или переместить в архив)
5. Создать финальный отчет о рефакторинге

---

## 📝 Чеклист выполнения

### Этап 1: Интеграция существующих модулей
- [ ] Шаг 1.1: Интеграция GrenadeManager
- [ ] Шаг 1.2: Интеграция TrapManager
- [ ] Шаг 1.3: Интеграция MoneyManager
- [ ] Шаг 1.4: Интеграция PowerUpManager

### Этап 2: Создание критичных модулей
- [ ] Шаг 2.1: Создание DogEnemyManager
- [ ] Шаг 2.2: Создание InputHandler
- [ ] Шаг 2.3: Создание ExplosionManager

### Этап 3: Создание UI модулей
- [ ] Шаг 3.1: Создание MeleeKillManager
- [ ] Шаг 3.2: Создание MenuManager
- [ ] Шаг 3.3: Создание EndScreenManager

### Этап 4: Оптимизация и доработка
- [ ] Шаг 4.1: Добавление cameraShake в CameraManager
- [ ] Шаг 4.2: Вынос trailTimer в ParticleManager
- [ ] Шаг 4.3: Создание PlayerDamageManager (опционально)

### Этап 5: Финальная очистка
- [ ] Шаг 5.1: Удаление неиспользуемых функций
- [ ] Шаг 5.2: Обновление GameManager
- [ ] Шаг 5.3: Финальная проверка и документация

---

## ⚠️ Важные замечания

1. **После каждого шага:** Обязательно проверять работоспособность игры
2. **Колбэки:** Все колбэки должны быть правильно настроены перед использованием модуля
3. **Обратная совместимость:** Старые функции можно удалять только после полной проверки
4. **Тестирование:** Тестировать не только основную функциональность, но и граничные случаи
5. **Коммиты:** Делать коммиты после каждого успешного шага для возможности отката

---

## 🎯 Ожидаемый результат

После выполнения всех шагов:
- `main.js` будет содержать только функции координации (~200-300 строк вместо 4392)
- Все функциональные модули будут вынесены в отдельные файлы
- Код будет легче поддерживать и расширять
- Каждый модуль будет отвечать за свою область ответственности
- Система колбэков обеспечит слабую связанность между модулями

