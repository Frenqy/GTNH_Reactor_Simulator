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

    static initItems(data: ItemData[]) {
        for (const key of this.ITEM_TYPE_NAME_LIST) {
            this.ITEM_LIST_MAP[key] = new Array<ReactorItem>();
        }
        this.ITEM_MAP = new Map<string, ReactorItem>();

        data.forEach((item: ItemData) => {
            // get localized name
            item.data[1] = item.data[2].split(".")[1];
            item.data[2] = LanguageLoader.getI18N(item.data[2]);
            item.data[3] = ImageLoader.getImage(item.data[3]);
            const Clz = this.CLZ_MAP[item.type];
            if (Clz) {
                const instance = new Clz(...item.data) as ReactorItem;
                this.ITEM_MAP.set(instance.name, instance);
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
}
