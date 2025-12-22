import { ReactorItem } from "../Define";

export class CoolantCell extends ReactorItem {
    constructor(id: number, baseName: string, name: string, image: string, maxDamage: number, maxHeat: number, sourceMod: string) {
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
