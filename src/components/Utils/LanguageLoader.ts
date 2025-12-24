import { lang, type LangsJson } from "./Defines";
import { GlobalData } from "./GlobalData";

export class LanguageLoader {
    static LangsData: LangsJson;
    private static regex = /%((\.(?<num>\d)*|,*)+f|(\.(?<num>\d)*|,*)d|s)/g;

    static initLanguageLoader(d: LangsJson) {
        this.LangsData = d;
    }

    static format(baseString: string, ...args: string[]) {
        let m;
        let counter = 0;
        while ((m = this.regex.exec(baseString)) !== null) {
            if (m[0].includes(".") && m.groups) {
                args[counter] = Number(args[counter]).toFixed(Number(m.groups["num"]));
            }
            if (m[0].includes(",")) {
                args[counter] = Number(args[counter]).toLocaleString();
            }
            counter += 1;
        }
        counter = 0;
        return baseString.replace(this.regex, () => args[counter++]).replaceAll("%%", "");
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
            return typeof temp === "string" ? this.format(temp, ...args) : "";
        } else {
            return typeof temp === "string" ? temp.replaceAll("%%", "") : "";
        }
    }
}
