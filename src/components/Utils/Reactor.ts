import { message } from "antd";
import { BigintStorage } from "./BigintStorage";
import { ComponentFactory } from "./ComponentFactory";
import { ItemLoader } from "./ItemLoader";
import { LanguageLoader } from "./LanguageLoader";
import { MaterialsList } from "./MaterialsList";
import type { ReactorItem } from "./ReactorItem";

export class Reactor {
    static DEFAULT_ON_PULSE = 5e6;
    static DEFAULT_SUSPEND_TEMP = 120e3;
    static DEFAULT_RESUME_TEMP = 120e3;
    static DEFAULT_OFF_PULSE = 0;
    static MAX_PARAM_TYPES = 3;
    static MAX_COMPONENT_HEAT = 1_080_000;
    grid: (ReactorItem | null)[][] = Array.from({ length: 6 }, () => Array<ReactorItem | null>(9).fill(null));
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
    getComponentList(): MaterialsList {
        const result: MaterialsList = new MaterialsList();
        let item: ReactorItem | null;
        for (let col = 0; col < this.grid[0].length; col++) {
            for (let row = 0; row < this.grid.length; row++) {
                if ((item = this.getComponentAt(row, col)) !== null) {
                    result.add([LanguageLoader.getI18N("ComponentName." + item.name.split(".")[1])]);
                }
            }
        }
        return result;
    }

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
        code = code.replace("erp=", "");
        try {
            const storage = BigintStorage.inputBase64(code);

            const codeRevision = storage.extract(255);
            let maxComponentHeat;
            if (codeRevision == 4) maxComponentHeat = 1e9;
            else if (codeRevision == 3) maxComponentHeat = 1080e3;
            else maxComponentHeat = 360e3;
            if (codeRevision > 4) {
                throw new Error("Unsupported code revision in reactor code.");
            }
            if (codeRevision >= 1) {
                this.pulsed = storage.extract(1) > 0;
                this.automated = storage.extract(1) > 0;
            }
            for (let row = 0; row < this.grid.length; row++) {
                for (let col = 0; col < this.grid[row].length; col++) {
                    let componentId = 0;
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
                        const component: ReactorItem | null = ItemLoader.getItemByNameOrId(componentId.toString());
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
        } catch (error) {
            message.error("读取反应堆代码时出错: " + (error as Error).message);
        }
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
        for (let row = this.grid.length - 1; row >= 0; row--) {
            for (let col = this.grid[row].length - 1; col >= 0; col--) {
                const component: ReactorItem | null = this.grid[row][col];
                if (component != null) {
                    const id = component.id;
                    if (
                        component.initialHeat > 0 ||
                        component.automationThreshold != ComponentFactory.getDefaultComponent(id)?.automationThreshold ||
                        component.reactorPause != ComponentFactory.getDefaultComponent(id)?.reactorPause
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
