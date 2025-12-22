import { ReactorItem } from "../Define";
import { FuelRod } from "./FuelRod";

export class BreederCell extends ReactorItem {
    mHeatBonusStep: number;
    mHeatBonusMultiplier: number;

    constructor(id: number, baseName: string, name: string, image: string, maxDamage: number, maxHeat: number, sourceMod: string, heatBonusStep: number, heatBonusMultiplier: number) {
        super(id, baseName, name, image, maxDamage, maxHeat, sourceMod);
        this.mHeatBonusStep = heatBonusStep;
        this.mHeatBonusMultiplier = heatBonusMultiplier;
    }

    getCopy(): ReactorItem {
        return new BreederCell(this.id, this.baseName, this.name, this.image, this.maxDamage, this.maxHeat, this.sourceMod, this.mHeatBonusStep, this.mHeatBonusMultiplier);
    }

    generateHeat(): number {
        const targetDamage = 1 + (this.parentReactor!.currentHeat / this.mHeatBonusStep) * this.mHeatBonusMultiplier;
        if (this.row != null && this.col != null && this.parentReactor != null) {
            for (const r of [this.row - 1, this.row + 1]) {
                for (const c of [this.col - 1, this.col + 1]) {
                    const component = this.parentReactor.getComponentAt(r, c);
                    if (component != null && component instanceof FuelRod) {
                        for (let i = 0; i < (component as FuelRod).getRodCount(); i++) {
                            this.applyDamage(targetDamage);
                        }
                    }
                }
            }
        }
        return 0;
    }
}
