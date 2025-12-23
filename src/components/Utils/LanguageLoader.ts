import { lang, type LangsJson } from "./Defines";
import { GlobalData } from "./GlobalData";

export class LanguageLoader {
    static LangsData: LangsJson;

    static initLanguageLoader(d: LangsJson) {
        this.LangsData = d;
    }

    static format(str: string, ...args: string[]) {
        let i = 0;
        return str.replace(/%s/g, () => args[i++]);
    }

    static getI18N(key: string, ...args: string[]): string {
        let temp: unknown = this.LangsData[GlobalData.language == lang.zh ? lang.zh : lang.en];
        for (const k of key.split(".")) {
            if (typeof temp === "object" && temp !== null) {
                temp = (temp as Record<string, unknown>)[k];
            } else {
                return "";
            }
        }
        if (args.length > 0) {
            return this.format(typeof temp === "string" ? temp : "", ...args);
        } else {
            return typeof temp === "string" ? temp : "";
        }
    }
}
