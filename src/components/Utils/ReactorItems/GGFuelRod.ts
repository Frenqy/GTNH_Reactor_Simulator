import { FuelRod } from "./FuelRod";

export class GGFuelRod extends FuelRod {
    rodCount: number;
    energyMult: number;
    heatBonus: number;
    static GTNHbehavior: boolean = false;

    static setGTNHBehavior(value: boolean) {
        GGFuelRod.GTNHbehavior = value;
    }

    constructor(
        id: number,
        baseName: string,
        name: string,
        image: string,
        maxDamage: number,
        maxHeat: number,
        sourceMod: string | null,
        energyMult: number,
        heatMult: number,
        rodCount: number,
        moxStyle: boolean,
        heatBonus: number
    ) {
        super(id, baseName, name, image, maxDamage, maxHeat, sourceMod, energyMult, heatMult, rodCount, moxStyle);
        this.energyMult = energyMult;
        this.rodCount = rodCount;
        this.heatBonus = heatBonus;
    }

    getCopy(): FuelRod {
        return new GGFuelRod(this.id, this.baseName, this.name, this.image, this.maxDamage, this.maxHeat, this.sourceMod, this.energyMult, this.heatMult, this.rodCount, this.moxStyle, this.heatBonus);
    }

    countNeutronNeighbors = super.countNeutronNeighbors;

    generateEnergy() {
        const pulses = this.countNeutronNeighbors() + 1 + this.rodCount / 2;
        let energy = this.energyMult * pulses * (1 + this.heatBonus * (this.parentReactor!.getCurrentHeat() / this.parentReactor!.getMaxHeat()));
        if (GGFuelRod.GTNHbehavior || "GTNH" === this.sourceMod) {
            energy *= 5; // EUx5 if from GTNH or in GTNH mode, no gt bonus
        }
        this.minEUGenerated = Math.min(this.minEUGenerated, energy);
        this.maxEUGenerated = Math.max(this.maxEUGenerated, energy);
        this.currentEUGenerated = energy;
        this.parentReactor!.addEUOutput(energy);
        this.applyDamage(1.0);
        return energy;
    }
}
