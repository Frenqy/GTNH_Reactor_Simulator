import type { WaveConfig } from "antd/es/config-provider/context";

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

const createHolder = (node: HTMLElement) => {
    const { borderWidth } = getComputedStyle(node);
    const borderWidthNum = Number.parseInt(borderWidth, 10);

    const div = document.createElement("div");
    div.style.position = "absolute";
    div.style.inset = `-${borderWidthNum}px`;
    div.style.borderRadius = "inherit";
    div.style.background = "transparent";
    div.style.zIndex = "999";
    div.style.pointerEvents = "none";
    div.style.overflow = "hidden";
    node.appendChild(div);

    return div;
};

export const showInsetEffect: WaveConfig["showEffect"] = (node, { event, component }) => {
    if (component !== "Button") {
        return;
    }

    const holder = createHolder(node);

    const rect = holder.getBoundingClientRect();

    const left = event.clientX - rect.left;
    const top = event.clientY - rect.top;

    const dot = createDot(holder, "rgba(255, 255, 255, 0.65)", left, top);

    // Motion
    requestAnimationFrame(() => {
        dot.ontransitionend = () => {
            holder.remove();
        };

        dot.style.width = "200px";
        dot.style.height = "200px";
        dot.style.opacity = "0";
    });
};

const createDot = (holder: HTMLElement, color: string, left: number, top: number, size = 0) => {
    const dot = document.createElement("div");
    dot.style.position = "absolute";
    dot.style.left = `${left}px`;
    dot.style.top = `${top}px`;
    dot.style.width = `${size}px`;
    dot.style.height = `${size}px`;
    dot.style.borderRadius = "50%";
    dot.style.background = color;
    dot.style.transform = "translate3d(-50%, -50%, 0)";
    dot.style.transition = "all 1s ease-out";
    holder.appendChild(dot);
    return dot;
};
