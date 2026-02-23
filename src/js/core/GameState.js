export class GameState {
    constructor(eventBus) {
        // Игровые очки и статистика
        this.points = 0
        this.pointsToAdd = 0
        this.kills = 0
        this.score = 'F'
        this.multiplier = 1
        this.scoreStreak = 0
        this.collectedMoney = 0
        
        // Флаги состояния игры
        this.isPause = false
        this.isMenu = true
        this.gameStart = false
        this.gameEnd = false

        this.eventBus = eventBus
        this.scoreTimer = 0

        eventBus.on('game:addPoints', (data) => {
            this.addPoints(data)
        })

        eventBus.on('game:addScore', (data) => {
            this.increaseStreak(data)
        })

        eventBus.on('game:addMoney', data => {
            this.collectedMoney += data
        })

        eventBus.on('game:addKills', data => {
            this.kills += data
        })
    }

    reset() {
        this.points = 0
        this.pointsToAdd = 0
        this.kills = 0
        this.score = 'F'
        this.multiplier = 1
        this.scoreStreak = 0
        this.collectedMoney = 0
        this.isPause = false
        this.gameStart = false
        this.gameEnd = false
        this.scoreTimer = 0
    }

    updatePoints() {
        if (this.pointsToAdd > 0) {
            if (this.pointsToAdd < 0) {
                this.pointsToAdd = 0
            }
            const pointsToAdd = Math.max(1, Math.floor(this.pointsToAdd / 50))
            this.pointsToAdd -= pointsToAdd
            this.points += pointsToAdd
        }
        return this.points
    }

    updateScore(stimpackActive = false) {
        let multiplier

        if (this.scoreStreak < 10) {
            this.score = 'F'
            multiplier = 1
        } else if (this.scoreStreak < 20) {
            this.score = 'E'
            multiplier = 1.1
        } else if (this.scoreStreak < 30) {
            this.score = 'D'
            multiplier = 1.2
        } else if (this.scoreStreak < 40) {
            this.score = 'C'
            multiplier = 1.3
        } else if (this.scoreStreak < 50) {
            this.score = 'B'
            multiplier = 1.4
        } else if (this.scoreStreak < 60) {
            this.score = 'A'
            multiplier = 1.5
        } else if (this.scoreStreak < 70) {
            this.score = 'A+'
            multiplier = 1.6
        } else if (this.scoreStreak < 80) {
            this.score = 'S'
            multiplier = 1.7
        } else if (this.scoreStreak < 90) {
            this.score = 'S+'
            multiplier = 1.8
        } else {
            this.score = 'S++'
            multiplier = 2
        }

        // Удваиваем множитель если активен стимулятор
        if (stimpackActive) {
            multiplier = multiplier * 2
        }

        this.multiplier = multiplier;
    }

    updateScoreTimer(dt) {
        if (this.isPause || this.isMenu) return;
        this.scoreTimer += dt

        if (this.scoreTimer >= 500) {
            this.scoreTimer = 0

            if (this.scoreStreak <= 0) return;

            this.decreaseStreak(1);

            // Обновление скорости игрока на основе очков
            this.eventBus.emit('player:speed', this.points / 10000)
        }
    }

    update(dt, stimpackActive = false) {
        this.updateScore(stimpackActive)
        this.updateScoreTimer(dt)
    }

    addPoints(points) {
        this.pointsToAdd += points * this.multiplier;
    }

    increaseStreak(amount) {
        this.scoreStreak += amount;
    }

    decreaseStreak(amount) {
        this.scoreStreak -= amount;
        if (this.scoreStreak < 0) {
            this.scoreStreak = 0;
        }
    }
}
