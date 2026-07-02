# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Communication

Always communicate with the user in Russian (Общайся с пользователем на русском языке), regardless of the language used in code, comments, or file contents.

## Project overview

"Street Killers Showdown" (`sks`) — a 2D side-scrolling shooter built on **PixiJS 7** (rendering) + **Matter.js** (physics), packaged for web/Telegram WebApp/VK and mobile via **Capacitor** (Android/iOS). No framework, no bundler-managed component tree — a hand-rolled manager/entity architecture updated from a single game loop.

## Commands

```
npm start      # vite dev server on port 8000
npm run build  # vite build -> dist/
npm run preview
```

There is no lint script and no real test suite (`npm test` is a placeholder that exits 1). There is no CI config in this repo.

Dev server note: `vite.config.js` serves `src/assets` at `/assets` in dev via a custom middleware (`serveAssetsPlugin`) and copies it into `dist/assets` on build (`copyAssetsPlugin`) — `publicDir` is disabled, so assets only work through this plugin pair, not Vite's default static dir.

## Architecture

### Boot sequence
`src/js/main.js` creates the PixiJS `Application`, wires `@pixi/layers` (`Stage`), loads all assets via `ResourceLoader`, loads persisted state via `StorageManager`, then constructs a single `Game` instance (`src/js/Game.js`) and calls `game.init()`. Everything else hangs off that one `Game` object.

### The manager pattern (read this before touching any feature)
There is no ECS and no scene graph framework. Instead:

- `Game.createManagers()` instantiates ~15 `*Manager` objects into `this.managers` (`m.ground`, `m.bullet`, `m.spawn`, `m.hud`, `m.camera`, `m.money`, `m.grenade`, `m.explosion`, `m.meleeKill`, `m.menu`, `m.endScreen`, `m.zipLine`, `m.timer`, `m.gameState`, `m.interaction`...).
- Every manager constructor takes the same kind of shared context by explicit positional args — typically some subset of `(world, gameState/physics, worldCoords, resources, timer, eventBus, storage)`. When adding a manager, follow the existing argument order used by sibling managers in the same directory rather than inventing a new convention.
- `Game.tick(delta)` is the single game loop (driven by `app.ticker`), and it explicitly calls `.update(...)` on each manager in a fixed order. If you add a manager that needs per-frame work, you must wire it into `tick()` (and into `restart()`'s clear list, and `createManagers()`) yourself — nothing is auto-registered.
- `Game.restart()` tears down and rebuilds the whole world: it calls `.clear()` on every manager, calls `eventBus.removeAll()`, then re-runs `registerEvents()` and `init()`. Any manager holding PIXI/Matter resources must implement `clear()` to release them, or restart will leak.

### Entity + Manager split
Game objects mostly come in pairs: an per-instance entity class (`Enemy`, `Bullet`, `Trap`, `Wall`, `Puddle`, `Money`, `Garbage`, `ZipLine`) plus a `*Manager` that owns an array/pool of them, handles spawning, batch `.update()`/`.clear()`, and is what the rest of the game talks to. Some pairs live in separate files (`entities/enemies/Enemy.js` + `EnemyManager.js`), others are bundled in one file (`entities/enemies/Boss.js`, `entities/enemies/DogEnemy.js`, `entities/PowerUp.js`, `environment/Can.js` all export both the entity class and its manager). Check the neighboring file/export before assuming a split.

`SpawnManager` (`src/js/core/SpawnManager.js`) is the orchestrator for world content: it owns one instance of every environment/entity manager (buildings, puddles, walls, traps, cans, cars, wood decor, garbage, power-ups, enemies, dog enemy, boss) and decides *what* spawns next via weighted random selection (`getSpawnWeights`/`pickEntityType`), advancing a horizontal cursor (`nextSpawnX`) ahead of the camera.

### Collision handling
There is no physics-engine collision callback wiring for gameplay — `Matter.js` is used for body/force simulation only. Actual gameplay collisions are polled every frame in `src/js/physics/InteractionSystem.js`: `update()` runs a fixed list of `this.check(a, b, 'eventName')` calls covering every relevant pair (player/wall, bullet/enemy, explosion/boss, etc). `check()` picks a bounds-overlap test via `getCollideType(event)` and, on overlap, calls `handle(event, a, b, result)`, which is a big switch statement containing the actual gameplay effect (`a.destroy()`, `b.damage()`, `b.activate()`, ...). To add a new collidable pair: add an entry to `InteractionSystem.update()`, a case in `getCollideType`, and a case in `handle`.

### Cross-manager communication
`src/js/utils/EventBus.js` is a minimal pub/sub (`on`/`off`/`emit`/`removeAll`) instantiated once in `main.js` and threaded through every manager's constructor. It's the *only* sanctioned way for decoupled systems to talk (e.g. `game:addPoints`, `game:addScore`, `player:speed`, `endScreen:restart`, `menu:startGame`, `gameSpeed:default`/`gameSpeed:slow`). Prefer emitting/listening on the bus over adding new direct manager-to-manager references, consistent with existing code (`Game.registerEvents()`, `GameState`'s constructor listeners).

### World/coordinate model
`worldCoords` (built in `Game` from `gameConfig`) is a shared plain object — not a class — holding `zeroLeft`/`zeroRight` (scrolling world bounds), `worldWidth`/`worldHeight`, and `firstFloor`/`secondFloor`/`ground` (vertical lanes derived from the ground container's bounds after `GroundManager` builds it). Nearly every manager takes `worldCoords` by reference and mutates or reads from it directly — it's intentionally a shared mutable struct, not passed by value.

`GAME_SCALE`, `DEFAULT_GAME_SPEED`/`SLOW_GAME_SPEED`, and world dimensions live in `src/js/core/GameConfig.js`; `initGameConfig(gameWidth, gameHeight)` derives `WORLD_WIDTH`/`WORLD_HEIGHT` and builds the shared `PIXI.TextStyle` objects (`textStyles.default80`, etc.) used by all UI screens.

### Resources
`src/js/resources/ResourceLoader.js` eagerly loads every texture atlas, spritesheet, the custom font, and the sound bundle (`src/js/sounds.js`) up front before the game starts, into one flat `resources` object that's passed by reference into every manager that needs textures. There is no lazy/streamed loading — if you add an asset, register it here and thread it through the same `resources` object.

Persisted player state (money, gold, owned skins, upgrades, active items) lives in `src/js/storage/StorageManager.js`, backed by `localStorage` under the key `'storage'`, with `BASE_STORAGE` as the schema/defaults. `storageManager.getStorage()` returns the live mutable object that's passed around as `storage`/`this.storage` — mutate it in place and call `.save()` to persist, rather than replacing the reference.

### Platform integration
The game runs inside a Telegram WebApp (`telegram-web-app.js` script tag in `index.html`), targets VK via `@vkontakte/vk-bridge`, and wraps into native Android/iOS via Capacitor (`capacitor.config.json` — note it currently points `server.url` at a LAN dev address for device testing against the Vite dev server rather than loading the bundled `dist/webDir` build).

## Conventions worth knowing

- Most comments and doc-blocks in this codebase are written in Russian; match the existing style if editing nearby code rather than switching to English mid-file.
- No TypeScript, no JSX — plain ES modules throughout, imported by relative path with `.js` extensions inconsistently present/omitted (both styles appear; match the importing file's existing style).
- `dist/` is gitignored build output — regenerate via `npm run build`, don't hand-edit.
