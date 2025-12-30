import { cloneDeep } from "lodash";
import { useEffect, useRef, useState, type MouseEvent } from "react";
import GridButton from "../components/GridButton";
import { LanguageLoader } from "../components/Utils/LanguageLoader";
import type { Reactor } from "../components/Utils/Reactor";
import type { ReactorItem } from "../components/Utils/ReactorItem";
import "./ReactorGrid.css";

type input = {
    reactor: Reactor;
    onReactorChange: React.Dispatch<React.SetStateAction<Reactor>>;
    selectedItem: ReactorItem | null;
    setSelectedRowAndCol: React.Dispatch<React.SetStateAction<{ row: number; col: number }>>;
};

function ReactorGrid({ reactor, onReactorChange, selectedItem, setSelectedRowAndCol }: input) {
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
            const item = reactor.getComponentAt(row, col);
            eachLine.push(
                GridButton({
                    size: reactorItemSize,
                    thisRow: row,
                    thisCol: col,
                    reactorItem: item,
                    onClick: (event: MouseEvent<HTMLDivElement>) => handleButtonClick(event, row, col),
                    tooltips: item ? LanguageLoader.getI18N(item.name) : "",
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
            if (event.button == 2) {
                newReactor.setComponentAt(row, column, null);
            } else if (event.button == 0 && selectedItem != null) {
                newReactor.setComponentAt(row, column, selectedItem.getCopy());
            }
            return newReactor;
        });
        if (event.button === 0) {
            setSelectedRowAndCol({ row: row, col: column });
        }
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
