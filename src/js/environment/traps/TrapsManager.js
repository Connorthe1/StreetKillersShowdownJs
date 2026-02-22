import { BarrelTrap } from "./types/BarrelTrap";
import { DoorTrap } from "./types/DoorTrap";
import { WindowTrap } from "./types/WindowTrap";

/**
 * Менеджер ловушек
 */
export class TrapManager {
    constructor(world, worldCoords, fg, resources, timer, eventBus) {
        this.world = world
        this.fg = fg
        this.worldCoords = worldCoords
        this.resources = resources
        this.timer = timer
        this.eventBus = eventBus

        // Массив ловушек
        this.traps = []

        eventBus.on('trap:bossClear', pos => {
            this.bossClear(pos)
        })

        eventBus.on('trap:window', pos => {
            this.createWindow(pos)
        })

        eventBus.on('trap:door', ({pos, isSecondFloor}) => {
            this.createDoor(pos, isSecondFloor)
        })
    }

    registerTrap(displayObject) {
        this.traps.push(displayObject)
    }

    createBarrel(afterBuilding) {
        const randomPos = Math.floor(this.worldCoords.zeroRight + Math.floor(Math.random() * (250 - 50 + 1) + 50))

        if (afterBuilding > randomPos - 100) return

        const hasOverlap = this.traps.some(trap => {
            const trapB = trap.sprite.getLocalBounds()
            return randomPos > trapB.x - 100 && randomPos < trapB.x + trapB.width + 100
        })
        if (hasOverlap) return

        const barrel = new BarrelTrap(this.world, this.resources, this.eventBus, this.fg, this.timer).create(randomPos, this.worldCoords.ground)
        this.registerTrap(barrel)
    }

    createWindow(pos) {
        const window = new WindowTrap(this.world, this.resources, this.eventBus).create(pos, this.worldCoords.ground)
        this.registerTrap(window)
    }

    createDoor(pos, secondFloor) {
        const door = new DoorTrap(this.world, this.resources, this.eventBus).create(pos, this.worldCoords.ground, secondFloor)
        this.registerTrap(door)
    }

    update() {
        this.traps.forEach(trap => trap.update())

        this.traps = this.traps.filter(trap => trap.toDestroy === false)
    }
    
    bossClear(pos) {
        this.traps.forEach((trap) => {
            const t = trap.sprite.getLocalBounds ? trap.sprite.getLocalBounds() : trap
            if (t.x > pos - 400 && t.x < pos + 200) {
                trap.destroy()
            }
        })
    }

    getTraps() {
        return this.traps
    }

    destroy() {
        this.traps.forEach(trap => {
            trap.destroy()
        })
        this.traps = []
    }
}
