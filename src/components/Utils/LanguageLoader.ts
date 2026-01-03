import { lang, type LangsJson } from "./Defines";

export class LanguageLoader {
    static LangsData: LangsJson;
    static language: lang;
    private static regex = /%((\.(?<num>\d)*|,*)+f|(\.(?<num>\d)*|,*)d|s)/g;

    private static replacePairs = [
        ["%%", ""],
        ["&lt;", "<"],
        ["&gt;", ">"],
        ["&amp;", "&"],
    ];

    static initLanguageLoader(d: LangsJson, l: lang) {
        this.LangsData = d;
        this.language = l;
    }

    static format(baseString: string, ...args: (string | number)[]) {
        let temp;
        let counter = 0;
        while ((temp = this.regex.exec(baseString)) !== null) {
            if (temp[0].includes(".") && temp.groups) {
                args[counter] = Number(args[counter]).toFixed(Number(temp.groups["num"]));
            }
            if (temp[0].includes(",")) {
                args[counter] = Number(args[counter]).toLocaleString();
            }
            counter += 1;
        }
        counter = 0;
        return baseString.replace(this.regex, () => args[counter++].toString());
    }

    static capitalizeWithReplace(str: string) {
        return str.replace(/^\w/, (c) => c.toUpperCase());
    }

    static beforeReturn(str: string) {
        this.replacePairs.forEach((pairs) => {
            str = str.replace(pairs[0], pairs[1]);
        });
        return str;
    }

    static getI18N(key: string, ...args: (string | number)[]): string {
        let temp: unknown = this.LangsData[this.language === lang.zh ? lang.zh : lang.en];

        for (const k of key.split(".")) {
            if (typeof temp === "object" && temp !== null) {
                temp = (temp as Record<string, unknown>)[this.capitalizeWithReplace(k)];
            } else {
                return "";
            }
        }
        if (args.length > 0) {
            return typeof temp === "string" ? this.beforeReturn(this.format(temp, ...args)) : "";
        } else {
            return typeof temp === "string" ? this.beforeReturn(temp) : "";
        }
    }
}
