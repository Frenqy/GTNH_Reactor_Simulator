import type { MouseEvent } from "react";
import "./GridButton.css";
import type { ReactorItem } from "./Utils/ReactorItem";

type input = {
    size: number;
    thisRow?: number;
    thisCol?: number;
    reactorItem: ReactorItem | null;
    onClick?: (event: MouseEvent<HTMLDivElement>) => void;
    enable?: boolean;
    key?: string | number;
};

function GridButton({ size, thisRow, thisCol, reactorItem, onClick, enable = true, key }: input) {
    return (
        <div key={key ? key : `row${thisRow}col${thisCol}`} style={{ width: size, height: size }} className={`GridButton ${enable ? "active" : "inactive"}`} onContextMenu={onClick} onClick={onClick}>
            {reactorItem ? <img src={reactorItem?.image} title={reactorItem?.name}></img> : ""}
        </div>
    );
}
export default GridButton;
