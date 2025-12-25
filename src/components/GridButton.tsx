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
    tooltips?: string | null;
};

function GridButton({ size, thisRow, thisCol, reactorItem = null, onClick, enable = true, key, tooltips }: input) {
    tooltips = tooltips || tooltips?.length === 0 ? tooltips : reactorItem?.name;

    let maxWidth = reactorItem ? reactorItem.name.length : 0;
    tooltips?.split("\n").forEach((line) => {
        maxWidth = Math.max(maxWidth, line.length);
    });
    maxWidth *= 9;

    return (
        <Tooltip
            title={tooltips}
            styles={{
                container: {
                    whiteSpace: "pre-line",
                    width: `${Math.max(maxWidth, size)}px`,
                    fontSize: maxWidth > size ? "xx-small" : "",
                },
            }}
            key={key ? key : `row${thisRow}col${thisCol}`}
        >
            <div
                style={{ width: size, height: size }}
                className={`GridButton ${enable ? "active" : "inactive"}`}
                onContextMenu={onClick}
                onClick={onClick}
            >
                {reactorItem ? <img src={reactorItem?.image}></img> : null}
                {!enable && <div className="GridButtonMask" />}
            </div>
        </Tooltip>
    );
}
export default GridButton;
