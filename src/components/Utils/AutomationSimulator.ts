import { ReactorItem, type Reactor } from "./Define";
import { BreederCell } from "./ReactorItems/BreederCell";
import { SimulationData } from "./SimulationData";

export class AutomationSimulator {
    reactor: Reactor;
    initialHeat: number;

    minEUoutput: number = Number.MAX_VALUE;
    maxEUoutput: number = 0.0;
    minHeatOutput: number = Number.MAX_VALUE;
    maxHeatOutput: number = 0.0;

    onPulseDuration: number;
    offPulseDuration: number;
    clockPeriod: number;
    suspendTemp: number;
    resumeTemp: number;
    maxSimulationTicks: number;

    reachedBelow50: boolean = false;
    reachedBurn: boolean = false;
    reachedEvaporate: boolean = false;
    reachedHurt: boolean = false;
    reachedLava: boolean = false;
    reachedExplode: boolean = false;

    allFuelRodsDepleted: boolean = false;
    componentsIntact: boolean = true;
    anyRodsDepleted: boolean = false;

    activeTime: number = 0;
    inactiveTime: number = 0;
    currentActiveTime: number = 0;
    minActiveTime: number = Number.MAX_SAFE_INTEGER;
    maxActiveTime: number = 0;
    currentInactiveTime: number = 0;
    minInactiveTime: number = Number.MAX_SAFE_INTEGER;
    maxInactiveTime: number = 0;

    totalHullHeating: number = 0;
    totalComponentHeating: number = 0;
    totalHullCooling: number = 0;
    totalVentCooling: number = 0;

    showHeatingCoolingCalled: boolean = false;

    active: boolean = true;

    pauseTimer: number = 0;

    redstoneUsed: number = 0;

    lapisUsed: number = 0;
    completed: boolean = false;

    data: SimulationData = new SimulationData();
    replacedItems: [] = [];

    alreadyBroken: boolean[][] = Array.from({ length: 6 }, () => Array(9).fill(false));

    needsCooldown: boolean[][] = Array.from({ length: 6 }, () => Array(9).fill(false));

    constructor(reactor: Reactor) {
        this.reactor = reactor;
        this.initialHeat = Math.round(reactor.getCurrentHeat());
        this.onPulseDuration = reactor.getOnPulse();
        this.offPulseDuration = reactor.getOffPulse();
        this.clockPeriod = this.onPulseDuration + this.offPulseDuration;
        this.suspendTemp = reactor.getSuspendTemp();
        this.resumeTemp = reactor.getResumeTemp();
        this.maxSimulationTicks = reactor.getMaxSimulationTicks();
    }

    simulate() {
        const reactor = this.reactor;
        let reactorTicks = 0;
        let cooldownTicks = 0;
        let totalRodCount = 0;
        try {
            console.log("Simulation.Started");
            this.reactor.setCurrentHeat(this.initialHeat);
            this.reactor.clearVentedHeat();
            let minReactorHeat = this.initialHeat;
            let maxReactorHeat = this.initialHeat;
            this.reachedBelow50 = false;
            this.reachedBurn = this.initialHeat >= 0.4 * this.reactor.getMaxHeat();
            this.reachedEvaporate = this.initialHeat >= 0.5 * this.reactor.getMaxHeat();
            this.reachedHurt = this.initialHeat >= 0.7 * this.reactor.getMaxHeat();
            this.reachedLava = this.initialHeat >= 0.85 * this.reactor.getMaxHeat();
            this.reachedExplode = false;
            for (let row = 0; row < 6; row++) {
                for (let col = 0; col < 9; col++) {
                    const component: ReactorItem | null = this.reactor.getComponentAt(row, col);
                    if (component != null) {
                        component.clearCurrentHeat();
                        component.clearDamage();
                        totalRodCount += component.getRodCount();
                    }
                    console.log(`R${row}C${col}:0xC0C0C0`);
                }
            }
            this.data.totalRodCount = totalRodCount;
            let lastEUoutput = 0.0;
            let totalEUoutput = 0.0;
            let lastHeatOutput = 0.0;
            let totalHeatOutput = 0.0;
            let maxGeneratedHeat = 0.0;
            this.allFuelRodsDepleted = false;
            this.componentsIntact = true;
            this.anyRodsDepleted = false;
            do {
                reactorTicks++;
                this.reactor.clearEUOutput();
                this.reactor.clearVentedHeat();
                for (let row = 0; row < 6; row++) {
                    for (let col = 0; col < 9; col++) {
                        const component: ReactorItem | null = this.reactor.getComponentAt(row, col);
                        if (component != null) {
                            component.preReactorTick();
                        }
                    }
                }
                if (this.active) {
                    this.allFuelRodsDepleted = true; // assume rods depleted until one is found that isn't.
                }
                let generatedHeat = 0.0;
                for (let row = 0; row < 6; row++) {
                    for (let col = 0; col < 9; col++) {
                        const component: ReactorItem | null = this.reactor.getComponentAt(row, col);
                        if (component != null && !component.isBroken()) {
                            if (this.allFuelRodsDepleted && component.getRodCount() > 0) {
                                this.allFuelRodsDepleted = false;
                            }
                            if (this.active) {
                                generatedHeat += component.generateHeat();
                            }
                            component.dissipate();
                            component.transfer();
                        }
                    }
                }
                maxReactorHeat = Math.max(this.reactor.getCurrentHeat(), maxReactorHeat);
                minReactorHeat = Math.min(this.reactor.getCurrentHeat(), minReactorHeat);
                this.checkReactorTemperature(reactorTicks);
                maxGeneratedHeat = Math.max(generatedHeat, maxGeneratedHeat);
                if (this.active) {
                    for (let row = 0; row < 6; row++) {
                        for (let col = 0; col < 9; col++) {
                            const component: ReactorItem | null = this.reactor.getComponentAt(row, col);
                            if (component != null && !component.isBroken()) {
                                component.generateEnergy();
                            }
                        }
                    }
                }
                lastEUoutput = this.reactor.getCurrentEUoutput();
                totalEUoutput += lastEUoutput;
                lastHeatOutput = this.reactor.getVentedHeat();
                totalHeatOutput += lastHeatOutput;
                if (this.reactor.getCurrentHeat() <= this.reactor.getMaxHeat()) {
                    if (this.reactor.isPulsed() || this.reactor.isAutomated()) {
                        if (this.active) {
                            this.activeTime++;
                            this.currentActiveTime++;
                            if (this.reactor.isPulsed() && (this.reactor.getCurrentHeat() >= this.suspendTemp || reactorTicks % this.clockPeriod >= this.onPulseDuration)) {
                                this.active = false;
                                this.minActiveTime = Math.min(this.currentActiveTime, this.minActiveTime);
                                this.maxActiveTime = Math.max(this.currentActiveTime, this.maxActiveTime);
                                this.currentActiveTime = 0;
                            }
                        } else {
                            this.inactiveTime++;
                            this.currentInactiveTime++;
                            if (reactor.isAutomated() && this.pauseTimer > 0) {
                                this.pauseTimer--;
                            } else if (reactor.isPulsed() && reactor.getCurrentHeat() <= this.resumeTemp && reactorTicks % this.clockPeriod < this.onPulseDuration) {
                                this.active = true;
                                this.minInactiveTime = Math.min(this.currentInactiveTime, this.minInactiveTime);
                                this.maxInactiveTime = Math.max(this.currentInactiveTime, this.maxInactiveTime);
                                this.currentInactiveTime = 0;
                            }
                        }
                    }
                    this.minEUoutput = Math.min(lastEUoutput, this.minEUoutput);
                    this.maxEUoutput = Math.max(lastEUoutput, this.maxEUoutput);
                    this.minHeatOutput = Math.min(lastHeatOutput, this.minHeatOutput);
                    this.maxHeatOutput = Math.max(lastHeatOutput, this.maxHeatOutput);
                }
                this.calculateHeatingCooling(reactorTicks);
                this.handleAutomation(reactorTicks);
                this.handleBrokenComponents(reactorTicks, totalHeatOutput, totalRodCount, totalEUoutput, minReactorHeat, maxReactorHeat);
            } while (
                reactor.getCurrentHeat() < reactor.getMaxHeat() &&
                (!this.allFuelRodsDepleted || lastEUoutput > 0 || lastHeatOutput > 0) &&
                reactorTicks < this.maxSimulationTicks &&
                !this.isCancelled()
            );
            if (this.isCancelled()) {
                console.log("Simulation.CancelledAtTick", reactorTicks);
                return null;
            }
            this.data.minTemp = minReactorHeat;
            this.data.maxTemp = maxReactorHeat;
            console.log("Simulation.ReactorMinTemp", minReactorHeat);
            console.log("Simulation.ReactorMaxTemp", maxReactorHeat);
            if (reactor.getCurrentHeat() < reactor.getMaxHeat()) {
                console.log("Simulation.TimeWithoutExploding", reactorTicks);
                if (reactor.isPulsed()) {
                    let rangeString: string = "";
                    if (this.maxActiveTime > this.minActiveTime) {
                        rangeString = "Simulation.ActiveTimeRange" + this.minActiveTime + ", " + this.maxActiveTime;
                    } else if (this.minActiveTime < this.activeTime) {
                        rangeString = "Simulation.ActiveTimeSingle" + this.minActiveTime;
                    }
                    console.log("Simulation.ActiveTime", this.activeTime, rangeString);
                    rangeString = "";
                    if (this.maxInactiveTime > this.minInactiveTime) {
                        rangeString = "Simulation.InactiveTimeRange" + this.minInactiveTime + ", " + this.maxInactiveTime;
                    } else if (this.minInactiveTime < this.inactiveTime) {
                        rangeString = "Simulation.InactiveTimeSingle" + this.minInactiveTime;
                    }
                    console.log("Simulation.InactiveTime", this.inactiveTime, rangeString);
                }
                const replacedItemsString: string = this.replacedItems.toString();
                if (!(replacedItemsString.length == 0)) {
                    this.data.replacedItems = new MaterialsList(this.replacedItems);
                    console.log("Simulation.ComponentsReplaced", replacedItemsString);
                }

                if (reactorTicks > 0) {
                    this.data.totalReactorTicks = reactorTicks;
                    if (reactor.isFluid()) {
                        this.data.totalHUoutput = 40 * totalHeatOutput;
                        this.data.avgHUoutput = (2 * totalHeatOutput) / reactorTicks;
                        this.data.minHUoutput = 2 * this.minHeatOutput;
                        this.data.maxHUoutput = 2 * this.maxHeatOutput;
                        if (totalHeatOutput > 0) {
                            console.log(
                                "Simulation.HeatOutputs",
                                (40 * totalHeatOutput).toFixed(2),
                                ((2 * totalHeatOutput) / reactorTicks).toFixed(2),
                                (2 * this.minHeatOutput).toFixed(2),
                                (2 * this.maxHeatOutput).toFixed(2)
                            );
                            if (totalRodCount > 0) {
                                console.log(
                                    "Simulation.Efficiency",
                                    totalHeatOutput / reactorTicks / 4 / totalRodCount,
                                    this.minHeatOutput / 4 / totalRodCount,
                                    this.maxHeatOutput / 4 / totalRodCount
                                );
                            }
                        }
                    } else {
                        this.data.totalEUoutput = totalEUoutput;
                        this.data.avgEUoutput = totalEUoutput / (reactorTicks * 20);
                        this.data.minEUoutput = this.minEUoutput / 20.0;
                        this.data.maxEUoutput = this.maxEUoutput / 20.0;
                        if (totalEUoutput > 0) {
                            console.log(
                                "Simulation.EUOutputs",
                                totalEUoutput.toFixed(2),
                                (totalEUoutput / (reactorTicks * 20)).toFixed(2),
                                (this.minEUoutput / 20.0).toFixed(2),
                                (this.maxEUoutput / 20.0).toFixed(2)
                            );
                            if (totalRodCount > 0) {
                                console.log(
                                    "Simulation.Efficiency",
                                    totalEUoutput / reactorTicks / 100 / totalRodCount,
                                    this.minEUoutput / 100 / totalRodCount,
                                    this.maxEUoutput / 100 / totalRodCount
                                );
                            }
                        }
                    }
                }

                if (reactor.getCurrentHeat() > 0.0) {
                    console.log("Simulation.ReactorRemainingHeat", reactor.getCurrentHeat());
                }
                let prevReactorHeat: number = reactor.getCurrentHeat();
                let prevTotalComponentHeat: number = 0.0;
                for (let row = 0; row < 6; row++) {
                    for (let col = 0; col < 9; col++) {
                        const component: ReactorItem | null = reactor.getComponentAt(row, col);
                        if (component != null && !component.isBroken()) {
                            if (component.currentHeat > 0.0) {
                                prevTotalComponentHeat += component.currentHeat;
                                console.log(`R${row}C${col}:0xFFA500`); // NOI18N
                                component.info += "ComponentInfo.RemainingHeat" + component.currentHeat;
                            }
                        }
                    }
                }
                if (prevReactorHeat == 0.0 && prevTotalComponentHeat == 0.0) {
                    console.log("Simulation.NoCooldown");
                } else if (reactor.getCurrentHeat() < reactor.getMaxHeat()) {
                    let currentTotalComponentHeat: number = prevTotalComponentHeat;
                    let reactorCooldownTime: number = 0;
                    do {
                        reactor.clearVentedHeat();
                        prevReactorHeat = reactor.getCurrentHeat();
                        if (prevReactorHeat == 0.0) {
                            reactorCooldownTime = cooldownTicks;
                        }
                        prevTotalComponentHeat = currentTotalComponentHeat;
                        for (let row = 0; row < 6; row++) {
                            for (let col = 0; col < 9; col++) {
                                const component: ReactorItem | null = reactor.getComponentAt(row, col);
                                if (component != null && !component.isBroken()) {
                                    component.dissipate();
                                    component.transfer();
                                }
                            }
                        }
                        lastHeatOutput = reactor.getVentedHeat();
                        totalHeatOutput += lastHeatOutput;
                        this.minEUoutput = Math.min(lastEUoutput, this.minEUoutput);
                        this.maxEUoutput = Math.max(lastEUoutput, this.maxEUoutput);
                        this.minHeatOutput = Math.min(lastHeatOutput, this.minHeatOutput);
                        this.maxHeatOutput = Math.max(lastHeatOutput, this.maxHeatOutput);
                        cooldownTicks++;
                        currentTotalComponentHeat = 0.0;
                        for (let row = 0; row < 6; row++) {
                            for (let col = 0; col < 9; col++) {
                                const component: ReactorItem | null = reactor.getComponentAt(row, col);
                                if (component != null && !component.isBroken()) {
                                    currentTotalComponentHeat += component.currentHeat;
                                    if (component.currentHeat == 0.0 && this.needsCooldown[row][col]) {
                                        component.info += "ComponentInfo.CooldownTime" + cooldownTicks;
                                        this.needsCooldown[row][col] = false;
                                    }
                                }
                            }
                        }
                    } while (lastHeatOutput > 0 && cooldownTicks < 50000);
                    if (reactor.getCurrentHeat() < reactor.getMaxHeat()) {
                        if (reactor.getCurrentHeat() == 0.0) {
                            console.log("Simulation.ReactorCooldownTime", reactorCooldownTime);
                        } else if (reactorCooldownTime > 0) {
                            console.log("Simulation.ReactorResidualHeat", reactor.getCurrentHeat(), reactorCooldownTime);
                        }
                        console.log("Simulation.TotalCooldownTime", cooldownTicks);
                    }
                }
            } else {
                console.log("Simulation.ReactorOverheatedTime", reactorTicks);
                let explosionPower = 10.0;
                let explosionPowerMult = 1.0;
                for (let row = 0; row < 6; row++) {
                    for (let col = 0; col < 9; col++) {
                        const component: ReactorItem | null = reactor.getComponentAt(row, col);
                        if (component != null) {
                            explosionPower += component.getExplosionPowerOffset();
                            explosionPowerMult *= component.getExplosionPowerMultiplier();
                        }
                    }
                }
                explosionPower *= explosionPowerMult;
                console.log("Simulation.ExplosionPower", explosionPower);
            }
            let totalCellCooling = 0.0;
            let totalCondensatorCooling = 0.0;

            for (let row = 0; row < 6; row++) {
                for (let col = 0; col < 9; col++) {
                    const component: ReactorItem | null = reactor.getComponentAt(row, col);
                    if (component != null) {
                        if (component.getVentCoolingCapacity() > 0) {
                            component.info += "ComponentInfo.UsedCooling" + component.bestVentCooling + component.getVentCoolingCapacity();
                            totalEffectiveVentCooling += component.bestVentCooling;
                            totalVentCoolingCapacity += component.getVentCoolingCapacity();
                        } else if (component.bestCellCooling > 0) {
                            component.info += "ComponentInfo.ReceivedHeat" + component.bestCellCooling;
                            totalCellCooling += component.bestCellCooling;
                        } else if (component.bestCondensatorCooling > 0) {
                            (component.info += "ComponentInfo.ReceivedHeat"), component.bestCondensatorCooling;
                            totalCondensatorCooling += component.bestCondensatorCooling;
                        } else if (component.maxHeatGenerated > 0) {
                            if (!reactor.isFluid() && component.maxEUGenerated > 0) {
                                component.info += "ComponentInfo.GeneratedEU" + component.minEUGenerated + component.maxEUGenerated;
                            }
                            component.info += "ComponentInfo.GeneratedHeat" + component.minHeatGenerated + component.maxHeatGenerated;
                        } else if (component instanceof BreederCell) {
                            component.info +=
                                "ComponentInfo.BreederProgress" + (component.currentDamage > component.maxDamage ? component.maxDamage : component.currentDamage).toString() + component.maxDamage;
                        }
                        if (component.maxReachedHeat > 0) {
                            component.info += "ComponentInfo.ReachedHeat" + component.maxReachedHeat + component.maxHeat;
                        }
                    }
                }
            }

            // if (totalVentCoolingCapacity > 0) {
            // publish(formatI18n("Simulation.TotalVentCooling", totalEffectiveVentCooling,
            // totalVentCoolingCapacity));
            // }
            showHeatingCooling(reactorTicks); // Call to show this info in case it hasn't already been shown, such as for an
            // automated reactor.
            if (totalCellCooling > 0) {
                console.log("Simulation.TotalCellCooling", totalCellCooling);
            }
            if (totalCondensatorCooling > 0) {
                console.log("Simulation.TotalCondensatorCooling", totalCondensatorCooling);
            }
            if (maxGeneratedHeat > 0) {
                console.log("Simulation.MaxHeatGenerated", maxGeneratedHeat);
            }
            if (this.redstoneUsed > 0) {
                console.log("Simulation.RedstoneUsed", this.redstoneUsed);
            }
            if (this.lapisUsed > 0) {
                console.log("Simulation.LapisUsed", this.lapisUsed);
            }
            // double totalCooling = totalEffectiveVentCooling + totalCellCooling +
            // totalCondensatorCooling;
            // if (totalCooling >= maxGeneratedHeat) {
            // publish(formatI18n("Simulation.ExcessCooling", totalCooling -
            // maxGeneratedHeat));
            // } else {
            // publish(formatI18n("Simulation.ExcessHeating", maxGeneratedHeat -
            // totalCooling));
            // }
            // return null;
        } catch (e) {
            if (cooldownTicks == 0) {
                console.log("Simulation.ErrorReactor", reactorTicks);
            } else {
                console.log("Simulation.ErrorCooldown", cooldownTicks);
            }
            console.log(e);
        }
    }

    checkReactorTemperature(reactorTicks: number) {
        if (this.reactor.getCurrentHeat() < 0.5 * this.reactor.getMaxHeat() && !this.reachedBelow50 && this.reachedEvaporate) {
            console.log("Simulation.TimeToBelow50", reactorTicks);
            this.reachedBelow50 = true;
            this.data.timeToBelow50 = reactorTicks;
        }
        if (this.reactor.getCurrentHeat() >= 0.4 * this.reactor.getMaxHeat() && !this.reachedBurn) {
            console.log("Simulation.TimeToBurn", reactorTicks);
            this.reachedBurn = true;
            this.data.timeToBurn = reactorTicks;
        }
        if (this.reactor.getCurrentHeat() >= 0.5 * this.reactor.getMaxHeat() && !this.reachedEvaporate) {
            console.log("Simulation.TimeToEvaporate", reactorTicks);
            this.reachedEvaporate = true;
            this.data.timeToEvaporate = reactorTicks;
        }
        if (this.reactor.getCurrentHeat() >= 0.7 * this.reactor.getMaxHeat() && !this.reachedHurt) {
            console.log("Simulation.TimeToHurt", reactorTicks);
            this.reachedHurt = true;
            this.data.timeToHurt = reactorTicks;
        }
        if (this.reactor.getCurrentHeat() >= 0.85 * this.reactor.getMaxHeat() && !this.reachedLava) {
            console.log("Simulation.TimeToLava", reactorTicks);
            this.reachedLava = true;
            this.data.timeToLava = reactorTicks;
        }
        if (this.reactor.getCurrentHeat() >= this.reactor.getMaxHeat() && !this.reachedExplode) {
            console.log("Simulation.TimeToXplode", reactorTicks);
            this.reachedExplode = true;
            this.data.timeToXplode = reactorTicks;
        }
    }

    calculateHeatingCooling(reactorTicks: number) {
        if (reactorTicks > 20) {
            for (let row = 0; row < 6; row++) {
                for (let col = 0; col < 9; col++) {
                    const component: ReactorItem | null = this.reactor.getComponentAt(row, col);
                    if (component != null) {
                        this.totalHullHeating += component.currentHullHeating;
                        this.totalComponentHeating += component.currentComponentHeating;
                        this.totalHullCooling += component.currentHullCooling;
                        this.totalVentCooling += component.currentVentCooling;
                    }
                }
            }
        }
    }
}
