export interface ImgData {
    [key: string]: string; // 键为图片名，值为 base64 字符串
}

export interface ItemData {
    type: string;
    data: string[];
}

export interface AllData {
    image: ImgData[]; // 键为图片名，值为 base64 字符串
    items: ItemData[];
}

export interface LangsJson {
    [lang: string]: {
        Comparison: Record<string, Record<string, string> | string>;
        ComponentData: Record<string, string>;
        ComponentInfo: Record<string, string>;
        ComponentName: Record<string, string>;
        ComponentTooltip: Record<string, string>;
        Config: Record<string, string>;
        CSVData: Record<string, string>;
        MaterialName: Record<string, string>;
        Simulation: Record<string, string>;
        UI: Record<string, string>;
        Warning: Record<string, string>;
    };
}

export class lang {
    static zh = "zh_cn";
    static en = "en_us";
}
