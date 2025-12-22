import { BigintStorage } from "./BigintStorage";
import { Condensator } from "./ReactorItems/Condensator";

export class ReactorItem {
    static MAX_VALUE = 999999;
    id: number;
    baseName: string;
    name: string;
    image: string;
    maxDamage: number;
    maxHeat: number = 0;
    sourceMod: string;
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

    constructor(id: number, baseName: string, name: string, image: string, maxDamage: number, maxHeat: number, sourceMod: string) {
        this.id = id;
        this.baseName = baseName;
        this.name = name;
        this.image = image;
        this.maxDamage = maxDamage;
        this.maxHeat = maxHeat;
        if (maxHeat > 1) {
            this.automationThreshold = Math.round(maxHeat * 0.9);
        } else if (maxDamage > 1) {
            this.automationThreshold = Math.round(maxDamage * 1.1);
        }
        this.sourceMod = sourceMod;
    }

    getCopy() {
        return new ReactorItem(this.id, this.baseName, this.name, this.image, this.maxDamage, this.maxHeat, this.sourceMod);
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
        return this.maxHeat > 1 && !(this instanceof Condensator);
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
            let tempHeat = this.currentHeat;
            tempHeat += heat;
            if (tempHeat > this.maxHeat) {
                result = this.maxHeat - tempHeat + 1;
                tempHeat = this.maxHeat;
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
        return this.currentHeat >= this.maxHeat || this.currentDamage >= this.maxDamage;
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
}

export class Reactor {
    static DEFAULT_ON_PULSE = 5e6;
    static DEFAULT_SUSPEND_TEMP = 120e3;
    static DEFAULT_RESUME_TEMP = 120e3;
    static DEFAULT_OFF_PULSE = 0;
    static MAX_PARAM_TYPES = 3;
    static MAX_COMPONENT_HEAT = 1_080_000;
    grid: (ReactorItem | null)[][] = Array.from({ length: 6 }, () => Array<ReactorItem | null>(9));
    currentEUoutput = 0.0;
    currentHeat = 0.0;
    maxHeat = 10000.0;
    ventedHeat = 0.0;
    fluid = false;
    pulsed = false;
    automated = false;
    usingReactorCoolantInjectors = false;
    onPulse = Reactor.DEFAULT_ON_PULSE;
    offPulse = Reactor.DEFAULT_OFF_PULSE;
    suspendTemp = Reactor.DEFAULT_SUSPEND_TEMP;
    resumeTemp = Reactor.DEFAULT_RESUME_TEMP;
    maxSimulationTicks = 5e6;

    getComponentAt(row: number, column: number) {
        if (row >= 0 && row < this.grid.length && column >= 0 && column < this.grid[row].length) {
            return this.grid[row][column];
        }
        return null;
    }

    setComponentAt(row: number, column: number, component: ReactorItem | null) {
        if (row >= 0 && row < this.grid.length && column >= 0 && column < this.grid[row].length) {
            if (this.grid[row][column] != null) {
                this.grid[row][column].removeFromReactor();
            }
            this.grid[row][column] = component;
            if (component != null) {
                component.addToReactor(this, row, column);
            }
        }
    }

    clearGrid() {
        for (let row = 0; row < this.grid.length; row++) {
            for (let col = 0; col < this.grid[row].length; col++) {
                this.setComponentAt(row, col, null);
            }
        }
    }

    getCurrentEUoutput() {
        return this.currentEUoutput;
    }

    getCurrentHeat() {
        return this.currentHeat;
    }

    getMaxHeat() {
        return this.maxHeat;
    }

    adjustMaxHeat(adjustment: number) {
        this.maxHeat += adjustment;
    }

    setCurrentHeat(currentHeat: number) {
        this.currentHeat = currentHeat;
    }

    adjustCurrentHeat(adjustment: number) {
        this.currentHeat += adjustment;
        if (this.currentHeat < 0.0) {
            this.currentHeat = 0.0;
        }
    }

    addEUOutput(amount: number) {
        this.currentEUoutput += amount;
    }

    clearEUOutput() {
        this.currentEUoutput = 0.0;
    }

    // TODO
    // getMaterials() {
    //     MaterialsList result = new MaterialsList();
    //     for (int col = 0; col < grid[0].length; col++) {
    //         for (int row = 0; row < grid.length; row++) {
    //             if (getComponentAt(row, col) != null) {
    //                 result.add(MaterialsList.getMaterialsForComponent(getComponentAt(row, col)));
    //             }
    //         }
    //     }
    //     return result;
    // }
    // public MaterialsList getComponentList() {
    //     MaterialsList result = new MaterialsList();
    //     for (int col = 0; col < grid[0].length; col++) {
    //         for (int row = 0; row < grid.length; row++) {
    //             if (getComponentAt(row, col) != null) {
    //                 result.add(getComponentAt(row, col).name);
    //             }
    //         }
    //     }
    //     return result;
    // }

    getVentedHeat() {
        return this.ventedHeat;
    }

    ventHeat(amount: number) {
        this.ventedHeat += amount;
    }

    clearVentedHeat() {
        this.ventedHeat = 0;
    }

    getCode() {
        return "erp=" + this.buildCodeString();
    }

    readCodeString(code: string) {
        const storage = BigintStorage.inputBase64(code);
        // // read the code revision from the code itself instead of making it part of the prefix.
        const codeRevision = storage.extract(255);
        let maxComponentHeat;
        if (codeRevision == 4) maxComponentHeat = 1e9;
        else if (codeRevision == 3) maxComponentHeat = 1080e3;
        else maxComponentHeat = 360e3;
        // Check if the code revision is supported yet.
        if (codeRevision > 4) {
            throw new Error("Unsupported code revision in reactor code.");
        }
        // for code revision 1 or newer, read whether the reactor is pulsed and/or automated next.
        if (codeRevision >= 1) {
            this.pulsed = storage.extract(1) > 0;
            this.automated = storage.extract(1) > 0;
        }
        // read the grid next
        for (let row = 0; row < this.grid.length; row++) {
            for (let col = 0; col < this.grid[row].length; col++) {
                let componentId = 0;
                // Changes may be coming to the number of components available, so make sure to check the code revision
                // number.
                if (codeRevision <= 1) {
                    componentId = storage.extract(38);
                } else if (codeRevision == 2) {
                    componentId = storage.extract(44);
                } else if (codeRevision == 3) {
                    componentId = storage.extract(58);
                } else {
                    componentId = storage.extract(72);
                }
                if (componentId != 0) {
                    const component: ReactorItem | null = ComponentFactory.createComponent(componentId);
                    const hasSpecialAutomationConfig = storage.extract(1);
                    if (hasSpecialAutomationConfig > 0) {
                        if (component != null) {
                            component.setInitialHeat(storage.extract(maxComponentHeat));
                        }
                        if (codeRevision == 0 || (codeRevision >= 1 && this.automated)) {
                            if (component != null) {
                                component.setAutomationThreshold(storage.extract(maxComponentHeat));
                            }
                            if (component != null) {
                                component.setReactorPause(storage.extract(10e3));
                            }
                        }
                    }
                    this.setComponentAt(row, col, component);
                } else {
                    this.setComponentAt(row, col, null);
                }
            }
        }
        this.currentHeat = storage.extract(120e3);
        if (codeRevision == 0 || (codeRevision >= 1 && this.pulsed)) {
            this.onPulse = storage.extract(5e6);
            this.offPulse = storage.extract(5e6);
            this.suspendTemp = storage.extract(120e3);
            this.resumeTemp = storage.extract(120e3);
        }
        this.fluid = storage.extract(1) > 0;
        this.usingReactorCoolantInjectors = storage.extract(1) > 0;
        if (codeRevision == 0) {
            this.pulsed = storage.extract(1) > 0;
            this.automated = storage.extract(1) > 0;
        }
        this.maxSimulationTicks = storage.extract(5e6);
    }

    buildCodeString() {
        const storage: BigintStorage = new BigintStorage();
        storage.store(this.maxSimulationTicks, 5e6);
        storage.store(this.usingReactorCoolantInjectors ? 1 : 0, 1);
        storage.store(this.fluid ? 1 : 0, 1);
        if (this.pulsed) {
            storage.store(this.resumeTemp, 120e3);
            storage.store(this.suspendTemp, 120e3);
            storage.store(this.offPulse, 5e6);
            storage.store(this.onPulse, 5e6);
        }
        storage.store(this.currentHeat, 120e3);
        // grid is read (almost) first, so written (almost) last, and in reverse order
        for (let row = this.grid.length - 1; row >= 0; row--) {
            for (let col = this.grid[row].length - 1; col >= 0; col--) {
                const component: ReactorItem | null = this.grid[row][col];
                if (component != null) {
                    const id = component.id;
                    // only store automation details for a component if non-default, and add a flag bit to indicate
                    // their presence.  null components don't even need the flag bit.
                    if (
                        component.initialHeat > 0 ||
                        component.automationThreshold != ComponentFactory.getDefaultComponent(id)!.automationThreshold ||
                        component.reactorPause != ComponentFactory.getDefaultComponent(id)!.reactorPause
                    ) {
                        if (this.automated) {
                            storage.store(component.reactorPause, 10e3);
                            storage.store(component.automationThreshold, 1e9);
                        }
                        storage.store(component.initialHeat, 1e9);
                        storage.store(1, 1);
                    } else {
                        storage.store(0, 1);
                    }
                    storage.store(id, 72);
                } else {
                    storage.store(0, 72);
                }
            }
        }
        storage.store(this.automated ? 1 : 0, 1);
        storage.store(this.pulsed ? 1 : 0, 1);
        // store the code revision, allowing values up to 255 (8 bits) before adjusting how it is stored in the code.
        storage.store(4, 255);
        return storage.outputBase64();
    }

    isFluid() {
        return this.fluid;
    }

    setFluid(fluid: boolean) {
        this.fluid = fluid;
    }

    isUsingReactorCoolantInjectors() {
        return this.usingReactorCoolantInjectors;
    }

    setUsingReactorCoolantInjectors(usingReactorCoolantInjectors: boolean) {
        this.usingReactorCoolantInjectors = usingReactorCoolantInjectors;
    }

    getOnPulse() {
        return this.onPulse;
    }

    setOnPulse(onPulse: number) {
        this.onPulse = onPulse;
    }

    getOffPulse() {
        return this.offPulse;
    }

    setOffPulse(offPulse: number) {
        this.offPulse = offPulse;
    }

    getSuspendTemp() {
        return this.suspendTemp;
    }

    setSuspendTemp(suspendTemp: number) {
        this.suspendTemp = suspendTemp;
    }

    getResumeTemp() {
        return this.resumeTemp;
    }

    setResumeTemp(resumeTemp: number) {
        this.resumeTemp = resumeTemp;
    }

    isPulsed() {
        return this.pulsed;
    }

    setPulsed(pulsed: boolean) {
        this.pulsed = pulsed;
    }

    isAutomated() {
        return this.automated;
    }

    setAutomated(automated: boolean) {
        this.automated = automated;
    }

    getMaxSimulationTicks() {
        return this.maxSimulationTicks;
    }

    setMaxSimulationTicks(maxSimulationTicks: number) {
        this.maxSimulationTicks = maxSimulationTicks;
    }

    resetPulseConfig() {
        this.onPulse = Reactor.DEFAULT_ON_PULSE;
        this.offPulse = Reactor.DEFAULT_OFF_PULSE;
        this.suspendTemp = Reactor.DEFAULT_SUSPEND_TEMP;
        this.resumeTemp = Reactor.DEFAULT_RESUME_TEMP;
    }
}

export class ComponentFactory {
    static ITEMS: ReactorItem[] = [];
    static ITEM_MAP: Map<string, ReactorItem> = new Map<string, ReactorItem>();

    static getDefaultComponent(id: number): ReactorItem | null {
        if (id >= 0 && id < ComponentFactory.ITEMS.length) {
            return ComponentFactory.ITEMS[id].getCopy();
        }
        return null;
    }

    static createComponent(id?: number, name?: string): ReactorItem | null {
        if (id !== undefined && id >= 0 && id < ComponentFactory.ITEMS.length) {
            return ComponentFactory.ITEMS[id].getCopy();
        } else if (name !== undefined && name != null) {
            const temp = ComponentFactory.ITEM_MAP.get(name);
            if (temp == undefined) {
                return null;
            } else {
                return temp.getCopy();
            }
        }
        return null;
    }
}

export class MaterialsList {
    static componentMaterialsMap: Map<string, MaterialsList> = MaterialsList.initComponentMaterials();
    materials: Map<string, number> = new Map<string, number>();
    constructor(...materials: (MaterialsList | number | string)[]) {
        if (materials != undefined) {
            this.add(materials);
        }
    }

    private static initComponentMaterials() {
        // TODO
        return new Map<string, MaterialsList>();
    }

    add(materials: (MaterialsList | number | string)[]) {
        let itemCount = 1;
        for (const material of materials) {
            if (material instanceof String) {
                const materialName: string = material as string;
                if (this.materials.has(materialName)) {
                    this.materials.set(materialName, this.materials.get(materialName)! + itemCount);
                } else {
                    this.materials.set(materialName, itemCount);
                }
                itemCount = 1;
            } else if (material instanceof Number) {
                itemCount = (material as number) * 2;
            } else if (material instanceof MaterialsList) {
                for (const entrySet of material.materials.entries()) {
                    if (this.materials.has(entrySet[0])) {
                        this.materials.set(entrySet[0], this.materials.get(entrySet[0])! + itemCount * entrySet[1]);
                    } else {
                        this.materials.set(entrySet[0], itemCount * entrySet[1]);
                    }
                }
                itemCount = 1;
            }
        }
    }
}
