import { lang, type LangsJson } from "./Defines";
import { GlobalData } from "./GlobalData";

export class LanguageLoader {
    static LangsData: LangsJson;

    static initLanguageLoader(d: LangsJson) {
        this.LangsData = d;
    }

    static getI18N(key: string): string {
        let temp: unknown = this.LangsData[GlobalData.language == lang.zh ? lang.zh : lang.en];
        for (const k of key.split(".")) {
            if (typeof temp === "object" && temp !== null) {
                temp = (temp as Record<string, unknown>)[k];
            } else {
                return "";
            }
        }
        return typeof temp === "string" ? temp : "";
    }
}
