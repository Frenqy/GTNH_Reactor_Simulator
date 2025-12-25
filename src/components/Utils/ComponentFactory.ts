import type { ReactorItem } from "./ReactorItem";

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
        console.log(ComponentFactory.ITEMS );
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
