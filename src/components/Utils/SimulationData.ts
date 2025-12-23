import { MaterialsList } from "./MaterialsList";

export class SimulationData {
    timeToBelow50: number = Number.MAX_SAFE_INTEGER;
    timeToBurn: number = Number.MAX_SAFE_INTEGER;
    timeToEvaporate: number = Number.MAX_SAFE_INTEGER;
    timeToHurt: number = Number.MAX_SAFE_INTEGER;
    timeToLava: number = Number.MAX_SAFE_INTEGER;
    timeToXplode: number = Number.MAX_SAFE_INTEGER;

    totalRodCount: number = 0;

    firstComponentBrokenTime: number = Number.MAX_SAFE_INTEGER;
    firstComponentBrokenRow: number = -1;
    firstComponentBrokenCol: number = -1;
    firstComponentBrokenDescription: string = "";
    prebreakTotalEUoutput: number = 0;
    prebreakAvgEUoutput: number = 0;
    prebreakMinEUoutput: number = Number.MAX_VALUE;
    prebreakMaxEUoutput: number = 0;
    prebreakTotalHUoutput: number = 0;
    prebreakAvgHUoutput: number = 0;
    prebreakMinHUoutput: number = Number.MAX_VALUE;
    prebreakMaxHUoutput: number = 0;

    firstRodDepletedTime: number = Number.MAX_SAFE_INTEGER;
    firstRodDepletedRow: number = -1;
    firstRodDepletedCol: number = -1;
    firstRodDepletedDescription: string = "";
    predepleteTotalEUoutput: number = 0;
    predepleteAvgEUoutput: number = 0;
    predepleteMinEUoutput: number = Number.MAX_VALUE;
    predepleteMaxEUoutput: number = 0;
    predepleteTotalHUoutput: number = 0;
    predepleteAvgHUoutput: number = 0;
    predepleteMinHUoutput: number = Number.MAX_VALUE;
    predepleteMaxHUoutput: number = 0;
    predepleteMinTemp: number = Number.MAX_VALUE;
    predepleteMaxTemp: number = 0;

    totalReactorTicks: number = 0;
    totalEUoutput: number = 0;
    avgEUoutput: number = 0;
    minEUoutput: number = Number.MAX_VALUE;
    maxEUoutput: number = 0;
    totalHUoutput: number = 0;
    avgHUoutput: number = 0;
    minHUoutput: number = Number.MAX_VALUE;
    maxHUoutput: number = 0;
    minTemp: number = Number.MAX_VALUE;
    maxTemp: number = 0;

    hullHeating: number = 0;
    componentHeating: number = 0;
    hullCooling: number = 0;
    hullCoolingCapacity: number = 0;
    ventCooling: number = 0;
    ventCoolingCapacity: number = 0;

    replacedItems: MaterialsList = new MaterialsList();
}
