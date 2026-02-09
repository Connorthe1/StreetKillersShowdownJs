import { BarrelTrap } from "./types/BarrelTrap";
import { DoorTrap } from "./types/DoorTrap";
import { WindowTrap } from "./types/WindowTrap";

/**
 * Менеджер ловушек
 */
export class TrapManager {
    constructor(world, worldCoords, ground, fg, resources, timer, eventBus) {
        this.world = world
        this.ground = ground
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
    }
    
    getGroundY() {
        return this.ground?.getLocalBounds ? this.ground.getLocalBounds().y : 0
    }

    registerTrap(displayObject) {
        this.traps.push(displayObject)
    }

    createBarrel(afterBuilding) {
        const randomPos = Math.floor(this.worldCoords.zeroRight + Math.floor(Math.random() * (250 - 50 + 1) + 50))

        if (afterBuilding > randomPos - 100) return

        const hasOverlap = this.traps.some(trap => {
            const t = trap.getLocalBounds ? trap.getLocalBounds() : trap
            return randomPos > t.x - 100 && randomPos < t.x + t.width + 100
        })
        if (hasOverlap) return

        const groundY = this.getGroundY()
        const barrel = new BarrelTrap(this.world, this.resources, this.eventBus, this.fg, this.timer).create(randomPos, groundY)
        this.registerTrap(barrel)
    }

    createWindow(pos) {
        const groundY = this.getGroundY()
        const window = new WindowTrap(this.world, this.resources).create(pos, groundY)
        this.registerTrap(window)
    }

    createDoor(pos, secondFloor) {
        const groundY = this.getGroundY()
        const door = new DoorTrap(this.world, this.resources).create(pos, groundY, secondFloor)
        this.registerTrap(door)
    }

    update() {
        this.traps.forEach(trap => trap.update())

        this.traps = this.traps.filter(trap => trap.toDestroy === false)
    }
    
    bossClear(pos) {
        this.traps.forEach((trap, idx) => {
            if (!trap.type) {
                const t = trap.getLocalBounds ? trap.getLocalBounds() : trap
                if (t.x > pos - 400 && t.x < pos + 200) {
                    if (this.world) {
                        this.world.removeChild(trap)
                    }
                    this.traps.splice(idx, 1)
                }
            }
        })
    }

    clear() {
        this.traps.forEach(trap => {
            trap.destroy()
        })
    }
}
