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
        id: number | string,
        baseName: string,
        name: string,
        image: string,
        maxDamage: number | string,
        maxHeat: number | string,
        sourceMod: string | null,
        energyMult: number | string,
        heatMult: number | string,
        rodCount: number | string,
        moxStyle: boolean | string,
        heatBonus: number | string
    ) {
        super(id, baseName, name, image, maxDamage, maxHeat, sourceMod, energyMult, heatMult, rodCount, moxStyle);
        this.energyMult = Number(energyMult);
        this.rodCount = Number(rodCount);
        this.heatBonus = Number(heatBonus);
    }

    getCopy(): FuelRod {
        return new GGFuelRod(
            this.id,
            this.baseName,
            this.name,
            this.image,
            this.maxDamage,
            this.maxHeat,
            this.sourceMod,
            this.energyMult,
            this.heatMult,
            this.rodCount,
            this.moxStyle,
            this.heatBonus
        );
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
