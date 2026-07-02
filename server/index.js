const fs = require('fs')
const path = require('path')
const express = require('express')
const cors = require('cors')
const Database = require('better-sqlite3')

const PORT = process.env.PORT || 3001
const DB_PATH = process.env.DB_PATH || path.join(__dirname, 'data', 'stats.db')

fs.mkdirSync(path.dirname(DB_PATH), { recursive: true })

const db = new Database(DB_PATH)
db.pragma('journal_mode = WAL')
db.exec(`
    CREATE TABLE IF NOT EXISTS player_stats (
        user_id TEXT PRIMARY KEY,
        data TEXT NOT NULL,
        updated_at INTEGER NOT NULL
    )
`)

const app = express()
app.use(cors())
app.use(express.json())

app.get('/api/stats/:userId', (req, res) => {
    const row = db.prepare('SELECT data FROM player_stats WHERE user_id = ?').get(req.params.userId)
    if (!row) {
        return res.status(404).json({ error: 'not found' })
    }
    res.json(JSON.parse(row.data))
})

app.get('/api/admin/stats', (req, res) => {
    const rows = db.prepare('SELECT user_id, data, updated_at FROM player_stats ORDER BY updated_at DESC').all()
    res.json(rows.map(row => ({
        userId: row.user_id,
        updatedAt: new Date(row.updated_at).toISOString(),
        ...JSON.parse(row.data),
    })))
})

app.post('/api/stats/:userId', (req, res) => {
    const data = JSON.stringify(req.body)
    db.prepare(`
        INSERT INTO player_stats (user_id, data, updated_at)
        VALUES (?, ?, ?)
        ON CONFLICT(user_id) DO UPDATE SET data = excluded.data, updated_at = excluded.updated_at
    `).run(req.params.userId, data, Date.now())
    res.json({ ok: true })
})

app.listen(PORT, () => {
    console.log(`Stats API listening on port ${PORT}`)
})
