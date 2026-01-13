import { LanguageLoader } from "./LanguageLoader";
import type { Reactor } from "./Reactor";

export class ReactorItem {
    static MAX_VALUE = 999999;
    id: number;
    baseName: string;
    name: string;
    image: string;
    maxDamage: number;
    maxHeat: number = 0;
    sourceMod: string | null;
    initialHeat = 0;
    automationThreshold = 9000;
    reactorPause = 0;
    parentReactor?: Reactor | null;
    col?: number | null;
    row?: number | null;
    currentDamage: number = 0;
    currentHeat: number = 0;
    maxReachedHeat = 0;
    currentEUGenerated = 0;
    minEUGenerated = ReactorItem.MAX_VALUE;
    maxEUGenerated = 0;
    currentHeatGenerated = 0;
    minHeatGenerated = ReactorItem.MAX_VALUE;
    maxHeatGenerated = 0;
    currentHullHeating = 0;
    currentComponentHeating = 0;
    currentHullCooling = 0;
    currentVentCooling = 0;
    bestVentCooling = 0;
    currentCellCooling = 0;
    bestCellCooling = 0;
    currentCondensatorCooling = 0;
    bestCondensatorCooling = 0;
    explosionPowerMultiplier = 1;
    info: string = "";

    constructor(
        id: number | string,
        baseName: string,
        name: string,
        image: string,
        maxDamage: number | string,
        maxHeat: number | string,
        sourceMod: string | null
    ) {
        this.id = Number(id);
        this.baseName = baseName;
        this.name = name;
        this.image = image;
        this.maxDamage = Number(maxDamage);
        this.maxHeat = Number(maxHeat);
        if (this.maxHeat > 1) {
            this.automationThreshold = Math.round(this.maxHeat * 0.9);
        } else if (this.maxDamage > 1) {
            this.automationThreshold = Math.round(this.maxDamage * 1.1);
        }
        this.sourceMod = sourceMod;
    }

    getCopy() {
        const copyItem = new ReactorItem(this.id, this.baseName, this.name, this.image, this.maxDamage, this.maxHeat, this.sourceMod);
        copyItem.setInitialHeat(this.initialHeat);
        copyItem.setAutomationThreshold(this.automationThreshold);
        copyItem.setReactorPause(this.reactorPause);
        return copyItem;
    }
    getMaxDamage() {
        return this.maxDamage;
    }

    getMaxHeat() {
        return this.maxHeat;
    }

    getAutomationThreshold() {
        return this.automationThreshold;
    }

    getInitialHeat() {
        return this.initialHeat;
    }

    getCurrentHeat() {
        return this.currentHeat;
    }

    getReactorPause() {
        return this.reactorPause;
    }

    getCurrentDamage() {
        return this.currentDamage;
    }

    getMaxReachedHeat() {
        return this.maxReachedHeat;
    }

    getMinEUGenerated() {
        return this.minEUGenerated;
    }

    getMaxEUGenerated() {
        return this.maxEUGenerated;
    }

    getMinHeatGenerated() {
        return this.minHeatGenerated;
    }

    getMaxHeatGenerated() {
        return this.maxHeatGenerated;
    }

    getBestCondensatorCooling() {
        return this.bestCondensatorCooling;
    }

    getBestCellCooling() {
        return this.bestCellCooling;
    }

    getBestVentCooling() {
        return this.bestVentCooling;
    }

    getCurrentHullHeating() {
        return this.currentHullHeating;
    }

    getCurrentComponentHeating() {
        return this.currentComponentHeating;
    }

    getCurrentHullCooling() {
        return this.currentHullCooling;
    }

    getCurrentVentCooling() {
        return this.currentVentCooling;
    }

    setInitialHeat(value: number) {
        if (this.isHeatAcceptor() && value >= 0 && value < this.maxHeat) {
            this.initialHeat = value;
        }
    }

    setAutomationThreshold(value: number) {
        if (this.maxHeat > 1 || this.maxDamage > 1) {
            this.automationThreshold = value;
        }
    }

    setReactorPause(value: number) {
        if (this.maxHeat > 1 || this.maxDamage > 1) {
            this.reactorPause = value;
        }
    }

    isHeatAcceptor() {
        // maxHeat of 1 means this component never accepts heat (though it might take damage instead)
        return this.maxHeat > 1 && !this.isBroken();
    }

    isCoolable() {
        return this.maxHeat > 1;
    }

    isNeutronReflector() {
        return false;
    }

    preReactorTick() {
        this.currentHullHeating = 0.0;
        this.currentComponentHeating = 0.0;
        this.currentHullCooling = 0.0;
        this.currentVentCooling = 0.0;
        this.currentCellCooling = 0.0;
        this.currentCondensatorCooling = 0.0;
        this.currentEUGenerated = 0;
        this.currentHeatGenerated = 0;
    }

    generateHeat() {
        return 0.0;
    }

    generateEnergy() {
        return 0.0;
    }

    dissipate() {
        return 0.0;
    }

    transfer() {
        // do nothing by default.
    }

    addToReactor(parent: Reactor, row: number, col: number) {
        // call removeFromReactor first, in case it had previously been added to a different reactor (unlikely)
        this.removeFromReactor();
        this.parentReactor = parent;
        this.row = row;
        this.col = col;
    }

    removeFromReactor() {
        this.parentReactor = null;
        this.row = -10;
        this.col = -10;
    }

    clearCurrentHeat() {
        this.currentHeat = this.initialHeat;
        this.bestVentCooling = 0.0;
        this.bestCondensatorCooling = 0.0;
        this.bestCellCooling = 0.0;
        this.minEUGenerated = ReactorItem.MAX_VALUE;
        this.maxEUGenerated = 0.0;
        this.minHeatGenerated = ReactorItem.MAX_VALUE;
        this.maxHeatGenerated = 0.0;
        this.maxReachedHeat = this.initialHeat;
    }

    adjustCurrentHeat(heat: number) {
        if (this.isHeatAcceptor()) {
            let result = 0.0;
            let tempHeat = this.getCurrentHeat();
            tempHeat += heat;
            if (tempHeat > this.getMaxHeat()) {
                result = this.getMaxHeat() - tempHeat + 1;
                tempHeat = this.getMaxHeat();
            } else if (tempHeat < 0.0) {
                result = tempHeat;
                tempHeat = 0.0;
            }
            this.currentHeat = tempHeat;
            this.maxReachedHeat = Math.max(this.maxReachedHeat, this.currentHeat);
            return result;
        }
        return heat;
    }

    clearDamage() {
        this.currentDamage = 0.0;
    }

    applyDamage(damage: number) {
        // maxDamage of 1 is treated as meaning the component doesn't accept damage (though it might accept heat
        // instead)
        // if someone actually writes a mod with such a flimsy component, I might have to rethink this.
        if (this.maxDamage > 1 && damage > 0.0) {
            this.currentDamage += damage;
        }
    }

    isBroken() {
        return this.currentHeat >= this.getMaxHeat() || this.currentDamage >= this.getMaxDamage();
    }

    getRodCount() {
        return 0;
    }

    getExplosionPowerOffset() {
        if (!this.isBroken()) {
            if (this.getRodCount() == 0 && this.isNeutronReflector()) {
                return -1;
            }
            return 2 * this.getRodCount(); // all known fuel rods (including those from GT) use this formula, and non-rod
            // components return 0 for getRodCount
        }
        return 0;
    }

    getExplosionPowerMultiplier() {
        return this.explosionPowerMultiplier;
    }

    getVentCoolingCapacity() {
        return 0;
    }

    getHullCoolingCapacity() {
        return 0;
    }

    getCurrentOutput() {
        return 0;
    }

    producesOutput() {
        return this.getVentCoolingCapacity() > 0 || this.getRodCount() > 0;
    }

    needsCoolantInjected() {
        return false;
    }

    injectCoolant() {
        // do nothing by default.
    }

    toString() {
        let result = LanguageLoader.getI18N(this.name);
        if (this.initialHeat > 0) {
            result += LanguageLoader.getI18N("UI.InitialHeatDisplay", this.initialHeat);
        }
        return result;
    }
}
