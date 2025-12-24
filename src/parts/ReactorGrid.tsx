import { cloneDeep } from "lodash";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import GridButton from "../components/GridButton";
import type { Reactor } from "../components/Utils/Reactor";
import type { ReactorItem } from "../components/Utils/ReactorItem";
import "./ReactorGrid.css";

type input = { reactor: Reactor; onReactorChange: React.Dispatch<React.SetStateAction<Reactor>>; selectedItem: ReactorItem | null };

function ReactorGrid({ reactor, onReactorChange, selectedItem }: input) {
    const selfRef = useRef<HTMLDivElement>(null);
    const [parentSize, setParentSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

    useEffect(() => {
        const parent = selfRef.current?.parentElement;
        if (!parent) return;
        const updateSize = () => {
            setParentSize({
                width: parent.clientWidth,
                height: parent.clientHeight,
            });
        };
        updateSize();
        const resizeObserver = new ResizeObserver(updateSize);
        resizeObserver.observe(parent);
        return () => {
            resizeObserver.disconnect();
        };
    }, []);

    const reactorItemSize = Math.round(Math.min((parentSize.width - 8 * 5) / 9, (parentSize.height - 5 * 5) / 6)) - 1;
    const reactorLines = [];
    for (let row = 0; row < 6; row++) {
        const eachLine = [];
        for (let col = 0; col < 9; col++) {
            eachLine.push(
                GridButton({
                    size: reactorItemSize,
                    thisRow: row,
                    thisCol: col,
                    reactorItem: reactor.getComponentAt(row, col),
                    onClick: (event: MouseEvent<HTMLDivElement>) => handleButtonClick(event, row, col),
                })
            );
        }
        reactorLines.push(
            <div key={`row${row}`} className="GridLine">
                {eachLine}
            </div>
        );
    }

    function handleButtonClick(event: MouseEvent<HTMLDivElement>, row: number, column: number) {
        event.preventDefault();
        onReactorChange((prev: Reactor) => {
            const newReactor = cloneDeep(prev);
            if (event.button == 2 || (event.button == 0 && selectedItem == null)) {
                newReactor.setComponentAt(row, column, null);
            } else if (event.button == 0 && selectedItem != null) {
                newReactor.setComponentAt(row, column, selectedItem.getCopy());
            }
            return newReactor;
        });
    }

    return (
        <>
            <div ref={selfRef} className="GridHolder">
                {reactorLines}
            </div>
        </>
    );
}

export default ReactorGrid;
