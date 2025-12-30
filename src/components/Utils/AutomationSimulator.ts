import { LanguageLoader } from "./LanguageLoader";
import { MaterialsList } from "./MaterialsList";
import type { Reactor } from "./Reactor";
import type { ReactorItem } from "./ReactorItem";
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
    replacedItems: MaterialsList = new MaterialsList();

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

    getI18N(key: string, ...args: (string | number)[]) {
        return LanguageLoader.getI18N(key, ...args);
    }

    async simulate() {
        const reactor = this.reactor;
        let reactorTicks = 0;
        let cooldownTicks = 0;
        let totalRodCount = 0;
        try {
            console.log(this.getI18N("Simulation.Started"));
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
                            if (
                                this.reactor.isPulsed() &&
                                (this.reactor.getCurrentHeat() >= this.suspendTemp || reactorTicks % this.clockPeriod >= this.onPulseDuration)
                            ) {
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
                            } else if (
                                reactor.isPulsed() &&
                                reactor.getCurrentHeat() <= this.resumeTemp &&
                                reactorTicks % this.clockPeriod < this.onPulseDuration
                            ) {
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
                reactorTicks < this.maxSimulationTicks
            );
            this.data.minTemp = minReactorHeat;
            this.data.maxTemp = maxReactorHeat;
            console.log(this.getI18N("Simulation.ReactorMinTemp", minReactorHeat));
            console.log(this.getI18N("Simulation.ReactorMaxTemp", maxReactorHeat));
            if (reactor.getCurrentHeat() < reactor.getMaxHeat()) {
                console.log(this.getI18N("Simulation.TimeWithoutExploding", reactorTicks));
                if (reactor.isPulsed()) {
                    let rangeString: string = "";
                    if (this.maxActiveTime > this.minActiveTime) {
                        rangeString = this.getI18N("Simulation.ActiveTimeRange", this.minActiveTime, this.maxActiveTime);
                    } else if (this.minActiveTime < this.activeTime) {
                        rangeString = this.getI18N("Simulation.ActiveTimeSingle", this.minActiveTime);
                    }
                    console.log(this.getI18N("Simulation.ActiveTime", this.activeTime, rangeString));
                    rangeString = "";
                    if (this.maxInactiveTime > this.minInactiveTime) {
                        rangeString = this.getI18N("Simulation.InactiveTimeRange", this.minInactiveTime, this.maxInactiveTime);
                    } else if (this.minInactiveTime < this.inactiveTime) {
                        rangeString = this.getI18N("Simulation.InactiveTimeSingle", this.minInactiveTime);
                    }
                    console.log(this.getI18N("Simulation.InactiveTime", this.inactiveTime, rangeString));
                }
                const replacedItemsString: string = this.replacedItems.toString();
                if (!(replacedItemsString.length == 0)) {
                    this.data.replacedItems = new MaterialsList(this.replacedItems);
                    console.log(this.getI18N("Simulation.ComponentsReplaced", replacedItemsString));
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
                                this.getI18N(
                                    "Simulation.HeatOutputs",
                                    (40 * totalHeatOutput).toFixed(2),
                                    ((2 * totalHeatOutput) / reactorTicks).toFixed(2),
                                    (2 * this.minHeatOutput).toFixed(2),
                                    (2 * this.maxHeatOutput).toFixed(2)
                                )
                            );
                            if (totalRodCount > 0) {
                                console.log(
                                    this.getI18N(
                                        "Simulation.Efficiency",
                                        totalHeatOutput / reactorTicks / 4 / totalRodCount,
                                        this.minHeatOutput / 4 / totalRodCount,
                                        this.maxHeatOutput / 4 / totalRodCount
                                    )
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
                                this.getI18N(
                                    "Simulation.EUOutputs",
                                    totalEUoutput.toFixed(2),
                                    (totalEUoutput / (reactorTicks * 20)).toFixed(2),
                                    (this.minEUoutput / 20.0).toFixed(2),
                                    (this.maxEUoutput / 20.0).toFixed(2)
                                )
                            );
                            if (totalRodCount > 0) {
                                console.log(
                                    this.getI18N(
                                        "Simulation.Efficiency",
                                        totalEUoutput / reactorTicks / 100 / totalRodCount,
                                        this.minEUoutput / 100 / totalRodCount,
                                        this.maxEUoutput / 100 / totalRodCount
                                    )
                                );
                            }
                        }
                    }
                }

                if (reactor.getCurrentHeat() > 0.0) {
                    console.log(this.getI18N("Simulation.ReactorRemainingHeat", reactor.getCurrentHeat()));
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
                                component.info += this.getI18N("ComponentInfo.RemainingHeat", component.currentHeat);
                            }
                        }
                    }
                }
                if (prevReactorHeat == 0.0 && prevTotalComponentHeat == 0.0) {
                    console.log(this.getI18N("Simulation.NoCooldown"));
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
                                        component.info += this.getI18N("ComponentInfo.CooldownTime", cooldownTicks);
                                        this.needsCooldown[row][col] = false;
                                    }
                                }
                            }
                        }
                    } while (lastHeatOutput > 0 && cooldownTicks < 50000);
                    if (reactor.getCurrentHeat() < reactor.getMaxHeat()) {
                        if (reactor.getCurrentHeat() == 0.0) {
                            console.log(this.getI18N("Simulation.ReactorCooldownTime", reactorCooldownTime));
                        } else if (reactorCooldownTime > 0) {
                            console.log(this.getI18N("Simulation.ReactorResidualHeat", reactor.getCurrentHeat(), reactorCooldownTime));
                        }
                        console.log(this.getI18N("Simulation.TotalCooldownTime", cooldownTicks));
                    }
                }
            } else {
                console.log(this.getI18N("Simulation.ReactorOverheatedTime", reactorTicks));
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
                console.log(this.getI18N("Simulation.ExplosionPower", explosionPower));
            }
            let totalCellCooling = 0.0;
            let totalCondensatorCooling = 0.0;

            for (let row = 0; row < 6; row++) {
                for (let col = 0; col < 9; col++) {
                    const component: ReactorItem | null = reactor.getComponentAt(row, col);
                    if (component != null) {
                        if (component.getVentCoolingCapacity() > 0) {
                            component.info += this.getI18N(
                                "ComponentInfo.UsedCooling",
                                component.bestVentCooling,
                                component.getVentCoolingCapacity()
                            );
                        } else if (component.bestCellCooling > 0) {
                            component.info += this.getI18N("ComponentInfo.ReceivedHeat", component.bestCellCooling);
                            totalCellCooling += component.bestCellCooling;
                        } else if (component.bestCondensatorCooling > 0) {
                            component.info += this.getI18N("ComponentInfo.ReceivedHeat", component.bestCondensatorCooling);
                            totalCondensatorCooling += component.bestCondensatorCooling;
                        } else if (component.maxHeatGenerated > 0) {
                            if (!reactor.isFluid() && component.maxEUGenerated > 0) {
                                component.info += this.getI18N("ComponentInfo.GeneratedEU", component.minEUGenerated, component.maxEUGenerated);
                            }
                            component.info += this.getI18N("ComponentInfo.GeneratedHeat", component.minHeatGenerated, component.maxHeatGenerated);
                        } else if (component instanceof BreederCell) {
                            component.info += this.getI18N(
                                "ComponentInfo.BreederProgress",
                                (component.currentDamage > component.maxDamage ? component.maxDamage : component.currentDamage).toString(),
                                component.maxDamage
                            );
                        }
                        if (component.maxReachedHeat > 0) {
                            component.info += this.getI18N("ComponentInfo.ReachedHeat", component.maxReachedHeat, component.maxHeat);
                        }
                    }
                }
            }

            // if (totalVentCoolingCapacity > 0) {
            // publish(formatI18n("Simulation.TotalVentCooling", totalEffectiveVentCooling,
            // totalVentCoolingCapacity));
            // }
            this.showHeatingCooling(reactorTicks); // Call to show this info in case it hasn't already been shown, such as for an
            // automated reactor.
            if (totalCellCooling > 0) {
                console.log(this.getI18N("Simulation.TotalCellCooling", totalCellCooling));
            }
            if (totalCondensatorCooling > 0) {
                console.log(this.getI18N("Simulation.TotalCondensatorCooling", totalCondensatorCooling));
            }
            if (maxGeneratedHeat > 0) {
                console.log(this.getI18N("Simulation.MaxHeatGenerated", maxGeneratedHeat));
            }
            if (this.redstoneUsed > 0) {
                console.log(this.getI18N("Simulation.RedstoneUsed", this.redstoneUsed));
            }
            if (this.lapisUsed > 0) {
                console.log(this.getI18N("Simulation.LapisUsed", this.lapisUsed));
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
                console.log(this.getI18N("Simulation.ErrorReactor", reactorTicks));
            } else {
                console.log(this.getI18N("Simulation.ErrorCooldown", cooldownTicks));
            }
            console.log(e);
        }
    }

    checkReactorTemperature(reactorTicks: number) {
        if (this.reactor.getCurrentHeat() < 0.5 * this.reactor.getMaxHeat() && !this.reachedBelow50 && this.reachedEvaporate) {
            console.log(this.getI18N("Simulation.TimeToBelow50"), reactorTicks);
            this.reachedBelow50 = true;
            this.data.timeToBelow50 = reactorTicks;
        }
        if (this.reactor.getCurrentHeat() >= 0.4 * this.reactor.getMaxHeat() && !this.reachedBurn) {
            console.log(this.getI18N("Simulation.TimeToBurn", reactorTicks));
            this.reachedBurn = true;
            this.data.timeToBurn = reactorTicks;
        }
        if (this.reactor.getCurrentHeat() >= 0.5 * this.reactor.getMaxHeat() && !this.reachedEvaporate) {
            console.log(this.getI18N("Simulation.TimeToEvaporate", reactorTicks));
            this.reachedEvaporate = true;
            this.data.timeToEvaporate = reactorTicks;
        }
        if (this.reactor.getCurrentHeat() >= 0.7 * this.reactor.getMaxHeat() && !this.reachedHurt) {
            console.log(this.getI18N("Simulation.TimeToHurt", reactorTicks));
            this.reachedHurt = true;
            this.data.timeToHurt = reactorTicks;
        }
        if (this.reactor.getCurrentHeat() >= 0.85 * this.reactor.getMaxHeat() && !this.reachedLava) {
            console.log(this.getI18N("Simulation.TimeToLava", reactorTicks));
            this.reachedLava = true;
            this.data.timeToLava = reactorTicks;
        }
        if (this.reactor.getCurrentHeat() >= this.reactor.getMaxHeat() && !this.reachedExplode) {
            console.log(this.getI18N("Simulation.TimeToXplode", reactorTicks));
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

    handleAutomation(reactorTicks: number) {
        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 9; col++) {
                const component: ReactorItem | null = this.reactor.getComponentAt(row, col);
                if (component != null && this.reactor.isAutomated()) {
                    if (component.maxHeat > 1) {
                        if (component.automationThreshold > component.initialHeat && component.currentHeat >= component.automationThreshold) {
                            component.clearCurrentHeat();
                            this.replacedItems.add([component.name]);
                            component.info += this.getI18N("ComponentInfo.ReplacedTime", reactorTicks);
                            if (component.reactorPause > 0) {
                                this.active = false;
                                this.pauseTimer = Math.max(this.pauseTimer, component.reactorPause);
                                this.minActiveTime = Math.min(this.currentActiveTime, this.minActiveTime);
                                this.maxActiveTime = Math.max(this.currentActiveTime, this.maxActiveTime);
                                this.currentActiveTime = 0;
                            }
                        } else if (component.automationThreshold < component.initialHeat && component.currentHeat <= component.automationThreshold) {
                            component.clearCurrentHeat();
                            this.replacedItems.add([component.name]);
                            component.info += this.getI18N("ComponentInfo.ReplacedTime", reactorTicks);
                            if (component.reactorPause > 0) {
                                this.active = false;
                                this.pauseTimer = Math.max(this.pauseTimer, component.reactorPause);
                                this.minActiveTime = Math.min(this.currentActiveTime, this.minActiveTime);
                                this.maxActiveTime = Math.max(this.currentActiveTime, this.maxActiveTime);
                                this.currentActiveTime = 0;
                            }
                        }
                    } else if (component.isBroken() || (component.maxDamage > 1 && component.currentDamage >= component.automationThreshold)) {
                        component.clearDamage();
                        this.replacedItems.add([component.name]);
                        component.info += this.getI18N("ComponentInfo.ReplacedTime", reactorTicks);
                        if (component.reactorPause > 0) {
                            this.active = false;
                            this.pauseTimer = Math.max(this.pauseTimer, component.reactorPause);
                            this.minActiveTime = Math.min(this.currentActiveTime, this.minActiveTime);
                            this.maxActiveTime = Math.max(this.currentActiveTime, this.maxActiveTime);
                            this.currentActiveTime = 0;
                        }
                    }
                }
                if (this.reactor.isUsingReactorCoolantInjectors() && component != null && component.needsCoolantInjected()) {
                    component.injectCoolant();
                    if ("rshCondensator" === component.baseName) {
                        this.redstoneUsed++;
                    } else if ("lzhCondensator" === component.baseName) {
                        this.lapisUsed++;
                    }
                }
            }
        }
    }

    handleBrokenComponents(
        reactorTicks: number,
        totalHeatOutput: number,
        totalRodCount: number,
        totalEUoutput: number,
        minReactorHeat: number,
        maxReactorHeat: number
    ) {
        for (let row = 0; row < 6; row++) {
            for (let col = 0; col < 9; col++) {
                const component: ReactorItem | null = this.reactor.getComponentAt(row, col);
                if (component != null && component.isBroken() && !this.alreadyBroken[row][col]) {
                    this.alreadyBroken[row][col] = true;
                    if (component.getRodCount() == 0) {
                        console.log(`R${row}C${col}:0xFF0000`); // NOI18N
                        component.info += this.getI18N("ComponentInfo.BrokeTime", reactorTicks);
                        if (this.componentsIntact) {
                            this.componentsIntact = false;
                            this.data.firstComponentBrokenTime = reactorTicks;
                            this.data.firstComponentBrokenRow = row;
                            this.data.firstComponentBrokenCol = col;
                            this.data.firstComponentBrokenDescription = component.toString();
                            console.log(this.getI18N("Simulation.FirstComponentBrokenDetails", component.toString(), row, col, reactorTicks));
                            if (this.reactor.isFluid()) {
                                this.data.prebreakTotalHUoutput = 40 * totalHeatOutput;
                                this.data.prebreakAvgHUoutput = (2 * totalHeatOutput) / reactorTicks;
                                this.data.prebreakMinHUoutput = 2 * this.minHeatOutput;
                                this.data.prebreakMaxHUoutput = 2 * this.maxHeatOutput;
                                console.log(
                                    this.getI18N(
                                        "Simulation.HeatOutputsBeforeBreak",
                                        (40 * totalHeatOutput).toFixed(2),
                                        ((2 * totalHeatOutput) / reactorTicks).toFixed(2),
                                        (2 * this.minHeatOutput).toFixed(2),
                                        (2 * this.maxHeatOutput).toFixed(2)
                                    )
                                );
                                if (totalRodCount > 0) {
                                    console.log(
                                        this.getI18N(
                                            "Simulation.Efficiency",
                                            totalHeatOutput / reactorTicks / 4 / totalRodCount,
                                            this.minHeatOutput / 4 / totalRodCount,
                                            this.maxHeatOutput / 4 / totalRodCount
                                        )
                                    );
                                }
                            } else {
                                this.data.prebreakTotalEUoutput = totalEUoutput;
                                this.data.prebreakAvgEUoutput = totalEUoutput / (reactorTicks * 20);
                                this.data.prebreakMinEUoutput = this.minEUoutput / 20.0;
                                this.data.prebreakMaxEUoutput = this.maxEUoutput / 20.0;
                                console.log(
                                    this.getI18N(
                                        "Simulation.EUOutputsBeforeBreak",
                                        totalEUoutput.toFixed(2),
                                        (totalEUoutput / (reactorTicks * 20)).toFixed(2),
                                        (this.minEUoutput / 20.0).toFixed(2),
                                        (this.maxEUoutput / 20.0).toFixed(2)
                                    )
                                );
                                if (totalRodCount > 0) {
                                    console.log(
                                        this.getI18N(
                                            "Simulation.Efficiency",
                                            totalEUoutput / reactorTicks / 100 / totalRodCount,
                                            this.minEUoutput / 100 / totalRodCount,
                                            this.maxEUoutput / 100 / totalRodCount
                                        )
                                    );
                                }
                            }
                        }
                    } else if (!this.anyRodsDepleted) {
                        this.anyRodsDepleted = true;
                        this.data.firstRodDepletedTime = reactorTicks;
                        this.data.firstRodDepletedRow = row;
                        this.data.firstRodDepletedCol = col;
                        this.data.firstRodDepletedDescription = component.toString();
                        console.log(this.getI18N("Simulation.FirstRodDepletedDetails", component.toString(), row, col, reactorTicks));
                        if (this.reactor.isFluid()) {
                            this.data.predepleteTotalHUoutput = 40 * totalHeatOutput;
                            this.data.predepleteAvgHUoutput = (2 * totalHeatOutput) / reactorTicks;
                            this.data.predepleteMinHUoutput = 2 * this.minHeatOutput;
                            this.data.predepleteMaxHUoutput = 2 * this.maxHeatOutput;
                            console.log(
                                this.getI18N(
                                    "Simulation.HeatOutputsBeforeDepleted",
                                    (40 * totalHeatOutput).toFixed(2),
                                    ((2 * totalHeatOutput) / reactorTicks).toFixed(2),
                                    (2 * this.minHeatOutput).toFixed(2),
                                    (2 * this.maxHeatOutput).toFixed(2)
                                )
                            );
                            if (totalRodCount > 0) {
                                console.log(
                                    this.getI18N(
                                        "Simulation.Efficiency",
                                        totalHeatOutput / reactorTicks / 4 / totalRodCount,
                                        this.minHeatOutput / 4 / totalRodCount,
                                        this.maxHeatOutput / 4 / totalRodCount
                                    )
                                );
                            }
                        } else {
                            this.data.predepleteTotalEUoutput = totalEUoutput;
                            this.data.predepleteAvgEUoutput = totalEUoutput / (reactorTicks * 20);
                            this.data.predepleteMinEUoutput = this.minEUoutput / 20.0;
                            this.data.predepleteMaxEUoutput = this.maxEUoutput / 20.0;
                            console.log(
                                this.getI18N(
                                    "Simulation.EUOutputsBeforeDepleted",
                                    totalEUoutput.toFixed(2),
                                    (totalEUoutput / (reactorTicks * 20)).toFixed(2),
                                    (this.minEUoutput / 20.0).toFixed(2),
                                    (this.maxEUoutput / 20.0).toFixed(2)
                                )
                            );
                            if (totalRodCount > 0) {
                                console.log(
                                    this.getI18N(
                                        "Simulation.Efficiency",
                                        totalEUoutput / reactorTicks / 100 / totalRodCount,
                                        this.minEUoutput / 100 / totalRodCount,
                                        this.maxEUoutput / 100 / totalRodCount
                                    )
                                );
                            }
                        }
                        this.data.predepleteMinTemp = minReactorHeat;
                        this.data.predepleteMaxTemp = maxReactorHeat;
                        console.log(this.getI18N("Simulation.ReactorMinTempBeforeDepleted", minReactorHeat));
                        console.log(this.getI18N("Simulation.ReactorMaxTempBeforeDepleted", maxReactorHeat));
                    }
                    this.showHeatingCooling(reactorTicks);
                }
            }
        }
    }

    showHeatingCooling(reactorTicks: number) {
        if (!this.showHeatingCoolingCalled) {
            this.showHeatingCoolingCalled = true;
            if (reactorTicks >= 40) {
                let totalHullCoolingCapacity = 0;
                let totalVentCoolingCapacity = 0;
                for (let row = 0; row < 6; row++) {
                    for (let col = 0; col < 9; col++) {
                        const component: ReactorItem | null = this.reactor.getComponentAt(row, col);
                        if (component != null) {
                            totalHullCoolingCapacity += component.getHullCoolingCapacity();
                            totalVentCoolingCapacity += component.getVentCoolingCapacity();
                        }
                    }
                }
                this.data.hullHeating = this.totalHullHeating / (reactorTicks - 20);
                this.data.componentHeating = this.totalComponentHeating / (reactorTicks - 20);
                this.data.hullCooling = this.totalHullCooling / (reactorTicks - 20);
                this.data.hullCoolingCapacity = totalHullCoolingCapacity;
                this.data.ventCooling = this.totalVentCooling / (reactorTicks - 20);
                this.data.ventCoolingCapacity = totalVentCoolingCapacity;
                if (this.totalHullHeating > 0) {
                    console.log(this.getI18N("Simulation.HullHeating", this.totalHullHeating / (reactorTicks - 20)));
                }
                if (this.totalComponentHeating > 0) {
                    console.log(this.getI18N("Simulation.ComponentHeating", this.totalComponentHeating / (reactorTicks - 20)));
                }
                if (totalHullCoolingCapacity > 0) {
                    console.log(this.getI18N("Simulation.HullCooling", this.totalHullCooling / (reactorTicks - 20), totalHullCoolingCapacity));
                }
                if (totalVentCoolingCapacity > 0) {
                    console.log(this.getI18N("Simulation.VentCooling", this.totalVentCooling / (reactorTicks - 20), totalVentCoolingCapacity));
                }
            }
        }
    }
}
