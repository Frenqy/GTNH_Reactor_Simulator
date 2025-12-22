import { ReactorItem } from "../Define";

export class Exchanger extends ReactorItem {
    switchSide: number;
    switchReactor: number;

    constructor(id: number, baseName: string, name: string, image: string, maxDamage: number, maxHeat: number, sourceMod: string, switchSide: number, switchReactor: number) {
        super(id, baseName, name, image, maxDamage, maxHeat, sourceMod);
        this.switchSide = switchSide;
        this.switchReactor = switchReactor;
    }

    getCopy() {
        return new Exchanger(this.id, this.baseName, this.name, this.image, this.maxDamage, this.maxHeat, this.sourceMod, this.switchSide, this.switchReactor);
    }

    getHullCoolingCapacity() {
        return this.switchReactor;
    }

    transfer() {
        const heatableNeighbors: ReactorItem[] = [];
        if (this.row != null && this.col != null && this.parentReactor != null) {
            for (const r of [this.row - 1, this.row + 1]) {
                for (const c of [this.col - 1, this.col + 1]) {
                    const component = this.parentReactor.getComponentAt(r, c);
                    if (component != null && component.isHeatAcceptor()) {
                        heatableNeighbors.push(component);
                    }
                }
            }
        }
        // Code adapted from decompiled IC2 code, class ItemReactorHeatSwitch, with permission from Thunderdark.
        let myHeat = 0;
        if (this.switchSide > 0) {
            for (const heatableNeighbor of heatableNeighbors) {
                const mymed = (this.currentHeat * 100.0) / this.maxHeat;
                const heatablemed = (heatableNeighbor.currentHeat * 100.0) / heatableNeighbor.maxHeat;

                let add = Math.round((heatableNeighbor.maxHeat / 100.0) * (heatablemed + mymed / 2.0));
                if (add > this.switchSide) {
                    add = this.switchSide;
                }
                if (heatablemed + mymed / 2.0 < 1.0) {
                    add = this.switchSide / 2;
                }
                if (heatablemed + mymed / 2.0 < 0.75) {
                    add = this.switchSide / 4;
                }
                if (heatablemed + mymed / 2.0 < 0.5) {
                    add = this.switchSide / 8;
                }
                if (heatablemed + mymed / 2.0 < 0.25) {
                    add = 1;
                }
                if (Math.round(heatablemed * 10.0) / 10.0 > Math.round(mymed * 10.0) / 10.0) {
                    add -= 2 * add;
                } else if (Math.round(heatablemed * 10.0) / 10.0 == Math.round(mymed * 10.0) / 10.0) {
                    add = 0;
                }
                myHeat -= add;
                heatableNeighbor.adjustCurrentHeat(add);
            }
        }
        if (this.switchReactor > 0 && this.parentReactor != null) {
            const mymed = (this.currentHeat * 100.0) / this.maxHeat;
            const Reactormed = (this.parentReactor.getCurrentHeat() * 100.0) / this.parentReactor.getMaxHeat();

            let add = Math.round((this.parentReactor.getMaxHeat() / 100.0) * (Reactormed + mymed / 2.0));
            if (add > this.switchReactor) {
                add = this.switchReactor;
            }
            if (Reactormed + mymed / 2.0 < 1.0) {
                add = this.switchSide / 2;
            }
            if (Reactormed + mymed / 2.0 < 0.75) {
                add = this.switchSide / 4;
            }
            if (Reactormed + mymed / 2.0 < 0.5) {
                add = this.switchSide / 8;
            }
            if (Reactormed + mymed / 2.0 < 0.25) {
                add = 1;
            }
            if (Math.round(Reactormed * 10.0) / 10.0 > Math.round(mymed * 10.0) / 10.0) {
                add -= 2 * add;
            } else if (Math.round(Reactormed * 10.0) / 10.0 == Math.round(mymed * 10.0) / 10.0) {
                add = 0;
            }
            myHeat -= add;
            this.parentReactor.adjustCurrentHeat(add);
        }
        this.adjustCurrentHeat(myHeat);
    }
}
