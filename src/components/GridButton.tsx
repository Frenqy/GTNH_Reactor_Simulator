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
    title?: string;
};

function GridButton({ size, thisRow, thisCol, reactorItem = null, onClick, enable = true, key, title }: input) {
    return (
        <div
            key={key ? key : `row${thisRow}col${thisCol}`}
            style={{ width: size, height: size }}
            className={`GridButton ${enable ? "active" : "inactive"}`}
            onContextMenu={onClick}
            onClick={onClick}
            title={title ? title : reactorItem?.name}
        >
            {reactorItem ? <img src={reactorItem?.image} title={title ? title : reactorItem?.name}></img> : ""}
        </div>
    );
}
export default GridButton;
