import { ReactorItem } from "../ReactorItem";
import { FuelRod } from "./FuelRod";

export class BreederCell extends ReactorItem {
    mHeatBonusStep: number;
    mHeatBonusMultiplier: number;

    constructor(
        id: number | string,
        baseName: string,
        name: string,
        image: string,
        maxDamage: number | string,
        maxHeat: number | string,
        sourceMod: string | null,
        heatBonusStep: number | string,
        heatBonusMultiplier: number | string
    ) {
        super(id, baseName, name, image, maxDamage, maxHeat, sourceMod);
        this.mHeatBonusStep = Number(heatBonusStep);
        this.mHeatBonusMultiplier = Number(heatBonusMultiplier);
    }

    getCopy(): ReactorItem {
        const copyItem = new BreederCell(
            this.id,
            this.baseName,
            this.name,
            this.image,
            this.maxDamage,
            this.maxHeat,
            this.sourceMod,
            this.mHeatBonusStep,
            this.mHeatBonusMultiplier
        );
        copyItem.setInitialHeat(this.initialHeat);
        copyItem.setAutomationThreshold(this.automationThreshold);
        copyItem.setReactorPause(this.reactorPause);
        return copyItem;
    }

    generateHeat(): number {
        const targetDamage = 1 + (this.parentReactor!.currentHeat / this.mHeatBonusStep) * this.mHeatBonusMultiplier;
        if (this.row != null && this.col != null && this.parentReactor != null) {
            for (const temp of [
                [this.row, this.col - 1],
                [this.row, this.col + 1],
                [this.row - 1, this.col],
                [this.row + 1, this.col],
            ]) {
                const [r, c] = temp;
                const component = this.parentReactor.getComponentAt(r, c);
                if (component != null && component instanceof FuelRod) {
                    this.applyDamage(targetDamage * component.getRodCount());
                }
            }
        }
        return 0;
    }
}
