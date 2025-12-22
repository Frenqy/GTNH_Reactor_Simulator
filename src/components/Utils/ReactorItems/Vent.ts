import { ReactorItem } from "../Define";

export class Vent extends ReactorItem {
    selfVent: number;
    hullDraw: number;
    sideVent: number;

    constructor(id: number, baseName: string, name: string, image: string, maxDamage: number, maxHeat: number, sourceMod: string, selfVent: number, hullDraw: number, sideVent: number) {
        super(id, baseName, name, image, maxDamage, maxHeat, sourceMod);
        this.selfVent = selfVent;
        this.hullDraw = hullDraw;
        this.sideVent = sideVent;
    }

    getCopy(): Vent {
        return new Vent(this.id, this.baseName, this.name, this.image, this.maxDamage, this.maxHeat, this.sourceMod, this.selfVent, this.hullDraw, this.sideVent);
    }

    dissipate() {
        const deltaHeat = Math.min(this.hullDraw, this.parentReactor!.getCurrentHeat());
        this.currentHullCooling = deltaHeat;
        this.parentReactor!.adjustCurrentHeat(-deltaHeat);
        this.adjustCurrentHeat(deltaHeat);
        const currentDissipation = Math.min(this.selfVent, this.currentHeat);
        this.currentVentCooling = currentDissipation;
        this.parentReactor!.ventHeat(currentDissipation);
        this.adjustCurrentHeat(-currentDissipation);
        if (this.sideVent > 0 && this.parentReactor != null) {
            const coolableNeighbors: ReactorItem[] = [];
            if (this.row != null && this.col != null) {
                for (const r of [this.row - 1, this.row + 1]) {
                    for (const c of [this.col - 1, this.col + 1]) {
                        const component = this.parentReactor.getComponentAt(r, c);
                        if (component != null) {
                            coolableNeighbors.push(component);
                        }
                    }
                }
            }
            for (const coolableNeighbor of coolableNeighbors) {
                const rejectedCooling = coolableNeighbor.adjustCurrentHeat(-this.sideVent);
                const tempDissipatedHeat = this.sideVent + rejectedCooling;
                this.parentReactor.ventHeat(tempDissipatedHeat);
                this.currentVentCooling += tempDissipatedHeat;
            }
        }
        this.bestVentCooling = Math.max(this.bestVentCooling, this.currentVentCooling);
        return currentDissipation;
    }

    getVentCoolingCapacity() {
        let result = this.selfVent;
        if (this.selfVent > 0 && this.parentReactor != null && this.row != null && this.col != null) {
            for (const r of [this.row - 1, this.row + 1]) {
                for (const c of [this.col - 1, this.col + 1]) {
                    const component = this.parentReactor.getComponentAt(r, c);
                    if (component != null && component.isCoolable()) {
                        result += this.sideVent;
                    }
                }
            }
        }
        return result;
    }

    getHullCoolingCapacity() {
        return this.hullDraw;
    }

    getCurrentOutput() {
        return this.currentVentCooling;
    }
}
