import type { Reactor } from "../Reactor";
import { ReactorItem } from "../ReactorItem";

export class Plating extends ReactorItem {
    heatAdjustment: number;

    constructor(id: number, baseName: string, name: string, image: string, maxDamage: number, maxHeat: number, sourceMod: string | null, heatAdjustment: number, explosionPowerMultiplier: number) {
        super(id, baseName, name, image, maxDamage, maxHeat, sourceMod);
        this.heatAdjustment = heatAdjustment;
        this.explosionPowerMultiplier = explosionPowerMultiplier;
    }

    getCopy(): Plating {
        return new Plating(this.id, this.baseName, this.name, this.image, this.maxDamage, this.maxHeat, this.sourceMod, this.heatAdjustment, this.explosionPowerMultiplier);
    }

    addToReactor(parent: Reactor, row: number, col: number) {
        super.addToReactor(parent, row, col);
        if (parent != null) {
            parent.adjustMaxHeat(this.heatAdjustment);
        }
    }

    removeFromReactor() {
        if (this.parentReactor != null) {
            this.parentReactor.adjustMaxHeat(-this.heatAdjustment);
        }
        super.removeFromReactor();
    }
}
