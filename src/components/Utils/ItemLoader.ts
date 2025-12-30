import type { ItemData } from "./Defines";
import { ImageLoader } from "./ImageLoader";
import { LanguageLoader } from "./LanguageLoader";
import { ReactorItem } from "./ReactorItem";
import { BreederCell } from "./ReactorItems/BreederCell";
import { Condensator } from "./ReactorItems/Condensator";
import { CoolantCell } from "./ReactorItems/CoolantCell";
import { Exchanger } from "./ReactorItems/Exchanger";
import { FuelRod } from "./ReactorItems/FuelRod";
import { GGFuelRod } from "./ReactorItems/GGFuelRod";
import { Plating } from "./ReactorItems/Plating";
import { Reflector } from "./ReactorItems/Reflector";
import { Vent } from "./ReactorItems/Vent";

// 定义构造函数类型
type ReactorItemConstructor = new (...data: string[]) => ReactorItem;

export class ItemLoader {
    private static ITEM_MAP: Map<string, ReactorItem>;

    private static CLZ_MAP: Record<string, ReactorItemConstructor> = {
        BreederCell: BreederCell,
        Condensator: Condensator,
        CoolantCell: CoolantCell,
        Exchanger: Exchanger,
        FuelRod: FuelRod,
        GGFuelRod: GGFuelRod,
        Plating: Plating,
        Reflector: Reflector,
        Vent: Vent,
    };

    static ITEM_LIST_MAP: Record<string, ReactorItem[]> = {};

    static ITEM_TYPE_NAME_LIST: string[] = [
        "FuelRod",
        "GGFuelRod",
        "BreederCell",
        "CoolantCell",
        "Condensator",
        "Exchanger",
        "Vent",
        "Plating",
        "Reflector",
    ];

    static DISABLE_MAP: { [key: string]: string[] } = {
        "5.08": [
            "coolantCellNeutronium1G",
            "fuelRodNaquadah",
            "dualFuelRodNaquadah",
            "quadFuelRodNaquadah",
            "fuelRodCesium",
            "dualFuelRodCesium",
            "quadFuelRodCesium",
            "fuelRodCoaxium",
            "dualFuelRodCoaxium",
            "quadFuelRodCoaxium",
            "fuelRodNaquadahGTNH",
            "dualFuelRodNaquadahGTNH",
            "quadFuelRodNaquadahGTNH",
            "coolantCellSpace180k",
            "coolantCellSpace360k",
            "coolantCellSpace540k",
            "coolantCellSpace1080k",
            "fuelRodNaquadria",
            "dualFuelRodNaquadria",
            "quadFuelRodNaquadria",
            "fuelRodTiberium",
            "dualFuelRodTiberium",
            "quadFuelRodTiberium",
            "fuelRodTheCore",
            "fuelRodCompressedUranium",
            "dualFuelRodCompressedUranium",
            "quadFuelRodCompressedUranium",
            "fuelRodCompressedPlutonium",
            "dualFuelRodCompressedPlutonium",
            "quadFuelRodCompressedPlutonium",
            "fuelRodLiquidUranium",
            "dualFuelRodLiquidUranium",
            "quadFuelRodLiquidUranium",
            "fuelRodLiquidPlutonium",
            "dualFuelRodLiquidPlutonium",
            "quadFuelRodLiquidPlutonium",
            "fuelRodGlowstone",
            "coolantCellNeutronium1G",
        ],
        "5.09": [
            "fuelRodCesium",
            "dualFuelRodCesium",
            "quadFuelRodCesium",
            "fuelRodCoaxium",
            "dualFuelRodCoaxium",
            "quadFuelRodCoaxium",
            "fuelRodNaquadahGTNH",
            "dualFuelRodNaquadahGTNH",
            "quadFuelRodNaquadahGTNH",
            "coolantCellSpace180k",
            "coolantCellSpace360k",
            "coolantCellSpace540k",
            "coolantCellSpace1080k",
            "fuelRodNaquadria",
            "dualFuelRodNaquadria",
            "quadFuelRodNaquadria",
            "fuelRodTiberium",
            "dualFuelRodTiberium",
            "quadFuelRodTiberium",
            "fuelRodTheCore",
            "fuelRodCompressedUranium",
            "dualFuelRodCompressedUranium",
            "quadFuelRodCompressedUranium",
            "fuelRodCompressedPlutonium",
            "dualFuelRodCompressedPlutonium",
            "quadFuelRodCompressedPlutonium",
            "fuelRodLiquidUranium",
            "dualFuelRodLiquidUranium",
            "quadFuelRodLiquidUranium",
            "fuelRodLiquidPlutonium",
            "dualFuelRodLiquidPlutonium",
            "quadFuelRodLiquidPlutonium",
            "fuelRodGlowstone",
        ],
        GTNH: [
            "fuelRodCesium",
            "dualFuelRodCesium",
            "quadFuelRodCesium",
            "fuelRodCoaxium",
            "dualFuelRodCoaxium",
            "quadFuelRodCoaxium",
            "fuelRodNaquadah",
            "dualFuelRodNaquadah",
            "quadFuelRodNaquadah",
        ],
        "-": [
            "fuelRodThorium",
            "dualFuelRodThorium",
            "quadFuelRodThorium",
            "coolantCellHelium60k",
            "coolantCellHelium180k",
            "coolantCellHelium360k",
            "coolantCellNak60k",
            "coolantCellNak180k",
            "coolantCellNak360k",
            "coolantCellNeutronium1G",
            "fuelRodNaquadah",
            "dualFuelRodNaquadah",
            "quadFuelRodNaquadah",
            "fuelRodNaquadahGTNH",
            "dualFuelRodNaquadahGTNH",
            "quadFuelRodNaquadahGTNH",
            "coolantCellSpace180k",
            "coolantCellSpace360k",
            "coolantCellSpace540k",
            "coolantCellSpace1080k",
            "fuelRodNaquadria",
            "dualFuelRodNaquadria",
            "quadFuelRodNaquadria",
            "fuelRodTiberium",
            "dualFuelRodTiberium",
            "quadFuelRodTiberium",
            "fuelRodTheCore",
            "fuelRodCompressedUranium",
            "dualFuelRodCompressedUranium",
            "quadFuelRodCompressedUranium",
            "fuelRodCompressedPlutonium",
            "dualFuelRodCompressedPlutonium",
            "quadFuelRodCompressedPlutonium",
            "fuelRodLiquidUranium",
            "dualFuelRodLiquidUranium",
            "quadFuelRodLiquidUranium",
            "fuelRodLiquidPlutonium",
            "dualFuelRodLiquidPlutonium",
            "quadFuelRodLiquidPlutonium",
            "fuelRodGlowstone",
        ],
        "1.7.10": ["iridiumNeutronReflector"],
    };

    static initItems(data: ItemData[]) {
        for (const key of this.ITEM_TYPE_NAME_LIST) {
            this.ITEM_LIST_MAP[key] = new Array<ReactorItem>();
        }
        this.ITEM_MAP = new Map<string, ReactorItem>();

        console.log(data);

        data.forEach((item: ItemData) => {
            const name = LanguageLoader.getI18N(item.data[2]);
            item.data[3] = ImageLoader.getImage(item.data[3]);
            const Clz = this.CLZ_MAP[item.type];

            if (Clz) {
                const instance = new Clz(...item.data) as ReactorItem;
                this.ITEM_MAP.set(name, instance);
                this.ITEM_MAP.set(instance.id.toString(), instance);
                this.ITEM_LIST_MAP[item.type].push(instance);
            } else {
                console.warn(`未知的item类型: ${item.type}, ${item.data}`);
            }
        });
    }

    static getItemByNameOrId(nameOrId: string): ReactorItem | null {
        const item = this.ITEM_MAP.get(nameOrId);
        return item ? item.getCopy() : null;
    }

    static isItemDisable(mcVersion: string, gtVersion: string, name: string) {
        if (gtVersion === "-") {
            return !this.DISABLE_MAP[mcVersion]?.includes(name) && !this.DISABLE_MAP[gtVersion]?.includes(name);
        } else {
            return !this.DISABLE_MAP[gtVersion]?.includes(name);
        }
    }
}
