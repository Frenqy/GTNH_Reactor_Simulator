import { ReactorItem } from "../ReactorItem";

export class FuelRod extends ReactorItem {
    energyMult: number;
    heatMult: number;
    rodCount: number;
    moxStyle: boolean;

    static GT509behavior: boolean = false;
    static GTNHbehavior: boolean = false;

    static setGT509Behavior(value: boolean) {
        FuelRod.GT509behavior = value;
    }

    static setGTNHBehavior(value: boolean) {
        FuelRod.GTNHbehavior = value;
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
        moxStyle: boolean | string
    ) {
        super(id, baseName, name, image, maxDamage, maxHeat, sourceMod);
        this.energyMult = Number(energyMult);
        this.heatMult = Number(heatMult);
        this.rodCount = Number(rodCount);
        this.moxStyle = moxStyle === true || moxStyle === "true";
    }

    getCopy(): FuelRod {
        const copyItem = new FuelRod(
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
            this.moxStyle
        );
        copyItem.setInitialHeat(this.initialHeat);
        copyItem.setAutomationThreshold(this.automationThreshold);
        copyItem.setReactorPause(this.reactorPause);
        return copyItem;
    }

    isNeutronReflector() {
        return !this.isBroken();
    }

    countNeutronNeighbors() {
        let neutronNeighbors = 0;
        if (this.row != null && this.col != null && this.parentReactor != null) {
            for (const temp of [
                [this.row + 1, this.col],
                [this.row - 1, this.col],
                [this.row, this.col - 1],
                [this.row, this.col + 1],
            ]) {
                const [r, c] = temp;
                const component = this.parentReactor!.getComponentAt(r, c);
                if (component != null && component.isNeutronReflector()) {
                    neutronNeighbors++;
                }
            }
        }
        return neutronNeighbors;
    }

    getHeatableNeighbors() {
        const heatableNeighbors: ReactorItem[] = [] as ReactorItem[];
        if (this.row != null && this.col != null && this.parentReactor != null) {
            for (const temp of [
                [this.row + 1, this.col],
                [this.row - 1, this.col],
                [this.row, this.col - 1],
                [this.row, this.col + 1],
            ]) {
                const [r, c] = temp;
                const component = this.parentReactor.getComponentAt(r, c);
                if (component != null && component.isHeatAcceptor()) {
                    heatableNeighbors.push(component);
                }
            }
        }
        return heatableNeighbors;
    }

    getGTHeatableNeighbors() {
        const heatableNeighbors: ReactorItem[] = [] as ReactorItem[];
        if (this.row != null && this.col != null && this.parentReactor != null) {
            for (const temp of [
                [this.row, this.col - 1],
                [this.row, this.col + 1],
                [this.row + 1, this.col],
                [this.row - 1, this.col],
            ]) {
                const [r, c] = temp;
                const component = this.parentReactor.getComponentAt(r, c);
                if (component != null && component.isHeatAcceptor()) {
                    heatableNeighbors.push(component);
                }
            }
        }
        return heatableNeighbors;
    }

    handleHeat(heat: number) {
        const heatableNeighbors = this.getHeatableNeighbors();
        if (heatableNeighbors.length === 0 && this.parentReactor != null) {
            this.parentReactor.adjustCurrentHeat(heat);
            this.currentHullHeating = heat;
        } else {
            this.currentComponentHeating = heat;
            for (const heatableNeighbor of heatableNeighbors) {
                heatableNeighbor.adjustCurrentHeat(heat / heatableNeighbors.length);
            }
            const remainderHeat = heat % heatableNeighbors.length;
            heatableNeighbors[0].adjustCurrentHeat(remainderHeat);
        }
    }

    handleGTHeat(heat: number) {
        const heatableNeighbors = this.getGTHeatableNeighbors();
        if (heatableNeighbors.length === 0 && this.parentReactor != null) {
            this.parentReactor.adjustCurrentHeat(heat);
            this.currentHullHeating = heat;
        } else {
            this.currentComponentHeating = heat;
            let everCycleHeat = heat / this.rodCount;
            for (let i = 0; i < heatableNeighbors.length; i++) {
                const toNeighborHeat = everCycleHeat / (heatableNeighbors.length - i);
                everCycleHeat -= toNeighborHeat;
                heatableNeighbors[i].adjustCurrentHeat(this.rodCount * toNeighborHeat);
            }
        }
    }

    generateHeat() {
        const pulses = this.countNeutronNeighbors() + 1 + this.rodCount / 2;
        let heat = Math.trunc(this.heatMult * pulses * (pulses + 1));
        if (
            this.parentReactor != null &&
            this.moxStyle &&
            this.parentReactor.isFluid() &&
            this.parentReactor.getCurrentHeat() / this.parentReactor.getMaxHeat() > 0.5
        ) {
            heat *= 2;
        }
        this.currentHeatGenerated = heat;
        this.minHeatGenerated = Math.min(this.minHeatGenerated, heat);
        this.maxHeatGenerated = Math.max(this.maxHeatGenerated, heat);
        if (FuelRod.GT509behavior || FuelRod.GTNHbehavior) {
            this.handleGTHeat(heat);
        } else {
            this.handleHeat(heat);
        }
        return this.currentHeatGenerated;
    }

    generateEnergy() {
        const pulses = this.countNeutronNeighbors() + 1 + this.rodCount / 2;
        let energy = this.energyMult * pulses;
        if ((FuelRod.GT509behavior || "GT5.09" === this.sourceMod) && this.parentReactor != null) {
            energy *= 2; // EUx2 if from GT5.09 or in GT5.09 mode
            if (this.moxStyle) {
                energy *= 1 + (1.5 * this.parentReactor.getCurrentHeat()) / this.parentReactor.getMaxHeat();
            }
        } else if ((FuelRod.GTNHbehavior || "GTNH" === this.sourceMod) && this.parentReactor != null) {
            energy *= 10; // EUx10 if from GTNH or in GTNH mode
            if (this.moxStyle) {
                energy *= 1 + (1.5 * this.parentReactor.getCurrentHeat()) / this.parentReactor.getMaxHeat();
            }
        } else if (this.moxStyle && this.parentReactor != null) {
            energy *= 1 + (4.0 * this.parentReactor.getCurrentHeat()) / this.parentReactor.getMaxHeat();
        }
        this.minEUGenerated = Math.min(this.minEUGenerated, energy);
        this.maxEUGenerated = Math.max(this.maxEUGenerated, energy);
        this.currentEUGenerated = energy;
        this.parentReactor!.addEUOutput(energy);
        this.applyDamage(1.0);
        return energy;
    }

    getRodCount() {
        return this.rodCount;
    }

    getCurrentOutput() {
        if (this.parentReactor != null) {
            if (this.parentReactor.isFluid()) {
                return this.currentHeatGenerated;
            } else {
                return this.currentEUGenerated;
            }
        }
        return 0;
    }
}
