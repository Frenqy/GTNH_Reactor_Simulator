import { ReactorItem } from "../ReactorItem";

export class CoolantCell extends ReactorItem {
    constructor(id: number | string, baseName: string, name: string, image: string, maxDamage: number | string, maxHeat: number | string, sourceMod: string | null) {
        super(id, baseName, name, image, maxDamage, maxHeat, sourceMod);
    }

    getCopy() {
        return new CoolantCell(this.id, this.baseName, this.name, this.image, this.maxDamage, this.maxHeat, this.sourceMod);
    }

    adjustCurrentHeat(heat: number) {
        this.currentCellCooling += heat;
        this.bestCellCooling = Math.max(this.currentCellCooling, this.bestCellCooling);
        return super.adjustCurrentHeat(heat);
    }
}
