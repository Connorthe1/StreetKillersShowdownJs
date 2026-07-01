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

        eventBus.on('trap:window', pos => {
            this.createWindow(pos)
        })

        eventBus.on('trap:door', ({pos, isSecondFloor}) => {
            this.createDoor(pos, isSecondFloor)
        })
    }

    registerTrap(trap) {
        this.traps.push(trap)
    }

    createBarrel(params) {
        const {afterBuilding, pos} = params

        if (afterBuilding) console.log(afterBuilding + 250, pos)
        if (afterBuilding + 250 > pos) return

        const barrel = new BarrelTrap(this.world, this.resources, this.eventBus, this.fg, this.timer).create(pos, this.worldCoords.ground)
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

    clear() {
        this.traps.forEach(trap => trap.destroy())
        this.traps = []
    }
}
