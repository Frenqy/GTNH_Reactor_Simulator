import { ReactorItem } from "../Define";

export class Condensator extends ReactorItem {
    constructor(id: number, baseName: string, name: string, image: string, maxDamage: number, maxHeat: number, sourceMod: string) {
        super(id, baseName, name, image, maxDamage, maxHeat, sourceMod);
    }

    getCopy(): Condensator {
        return new Condensator(this.id, this.baseName, this.name, this.image, this.maxDamage, this.maxHeat, this.sourceMod);
    }

    adjustCurrentHeat(heat: number) {
        if (heat < 0.0) {
            return heat;
        }
        this.currentCondensatorCooling += heat;
        this.bestCondensatorCooling = Math.max(this.currentCondensatorCooling, this.bestCondensatorCooling);
        const acceptedHeat = Math.min(heat, this.maxHeat - heat);
        const result = heat - acceptedHeat;
        this.currentHeat += acceptedHeat;
        this.maxReachedHeat = Math.max(this.maxReachedHeat, this.currentHeat);
        return result;
    }

    needsCoolantInjected() {
        return this.currentHeat > 0.85 * this.maxHeat;
    }

    injectCoolant() {
        this.currentHeat = 0;
    }
}
