import { ReactorItem } from "../ReactorItem";

export class CoolantCell extends ReactorItem {
    constructor(
        id: number | string,
        baseName: string,
        name: string,
        image: string,
        maxDamage: number | string,
        maxHeat: number | string,
        sourceMod: string | null
    ) {
        super(id, baseName, name, image, maxDamage, maxHeat, sourceMod);
    }

    getCopy() {
        const copyItem = new CoolantCell(this.id, this.baseName, this.name, this.image, this.maxDamage, this.maxHeat, this.sourceMod);
        copyItem.setInitialHeat(this.initialHeat);
        copyItem.setAutomationThreshold(this.automationThreshold);
        copyItem.setReactorPause(this.reactorPause);
        return copyItem;
    }

    adjustCurrentHeat(heat: number) {
        this.currentCellCooling += heat;
        this.bestCellCooling = Math.max(this.currentCellCooling, this.bestCellCooling);
        return super.adjustCurrentHeat(heat);
    }
}
