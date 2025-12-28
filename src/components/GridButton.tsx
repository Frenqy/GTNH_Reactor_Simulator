import { Tooltip } from "antd";
import type { MouseEvent } from "react";
import "./GridButton.css";
import type { ReactorItem } from "./Utils/ReactorItem";

type input = {
    size: number;
    thisRow?: number;
    thisCol?: number;
    reactorItem?: ReactorItem | null;
    onClick?: (event: MouseEvent<HTMLDivElement>) => void;
    enable?: boolean;
    key?: string | number;
    tooltips: string | null;
};

function GridButton({ size, thisRow, thisCol, reactorItem = null, onClick, enable = true, key, tooltips }: input) {
    let maxWidth = 0;
    tooltips?.split("\n").forEach((line) => {
        maxWidth = Math.max(maxWidth, line.length);
    });
    maxWidth *= 9;

    const borderWidth = size / 18;
    const borderHoverWidth = (size * 1.5) / 18;

    return (
        <Tooltip
            title={enable ? tooltips : undefined}
            styles={{
                container: {
                    whiteSpace: "pre-line",
                    width: `${Math.max(maxWidth, size * 1.1)}px`,
                    fontSize: "xx-small",
                },
            }}
            key={key ? key : `row${thisRow}col${thisCol}`}
        >
            <div
                style={{ width: size, height: size, borderWidth: `${borderWidth}px` }}
                className={`GridButton`}
                onContextMenu={enable ? onClick : undefined}
                onClick={enable ? onClick : undefined}
                onMouseEnter={(e) => {
                    if (enable) e.currentTarget.style.setProperty("border-width", `${borderHoverWidth}px`);
                }}
                onMouseLeave={(e) => {
                    if (enable) e.currentTarget.style.setProperty("border-width", `${borderWidth}px`);
                }}
            >
                {reactorItem ? <img src={reactorItem?.image}></img> : null}
                {!enable && <div className="GridButtonMask" style={{ width: size, height: size, top: -borderWidth, left: -borderWidth }} />}
            </div>
        </Tooltip>
    );
}
export default GridButton;
