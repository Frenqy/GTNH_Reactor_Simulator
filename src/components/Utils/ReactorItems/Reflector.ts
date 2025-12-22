import { ReactorItem } from "../ReactorItem";

export class Reflector extends ReactorItem {
    static mcVersion: string = "1.12.2";

    constructor(id: number, baseName: string, name: string, image: string, maxDamage: number, maxHeat: number, sourceMod: string | null) {
        super(id, baseName, name, image, maxDamage, maxHeat, sourceMod);
    }

    getCopy(): Reflector {
        return new Reflector(this.id, this.baseName, this.name, this.image, this.maxDamage, this.maxHeat, this.sourceMod);
    }

    isNeutronReflector() {
        return !this.isBroken();
    }

    generateHeat() {
        if (this.row != null && this.col != null && this.parentReactor != null) {
            for (const r of [this.row - 1, this.row + 1]) {
                for (const c of [this.col - 1, this.col + 1]) {
                    const component = this.parentReactor.getComponentAt(r, c);
                    if (component != null) {
                        this.applyDamage(component.getRodCount());
                    }
                }
            }
        }
        return 0;
    }

    getMaxDamage() {
        if (this.maxDamage > 1 && "1.7.10" === Reflector.mcVersion) {
            return this.maxDamage / 3;
        }
        return this.maxDamage;
    }

    static setMcVersion(newVersion: string) {
        Reflector.mcVersion = newVersion;
    }
}
