import { useEffect, useRef, useState } from "react";
import GridButton from "../components/GridButton";
import type { Reactor } from "../components/Utils/Reactor";
import "./ReactorGrid.css";

function ReactorGrid({ reactor, onReactorChange }: { reactor: Reactor; onReactorChange: React.Dispatch<React.SetStateAction<Reactor>> }) {
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
    for (let i = 0; i < 6; i++) {
        const eachLine = [];
        for (let q = 0; q < 9; q++) {
            eachLine.push(GridButton({ size: reactorItemSize, row: i, col: q, onReactorChange: onReactorChange, hasReactorItem: reactor.grid[i][q] != null }));
        }
        reactorLines.push(
            <div key={`row${i}`} className="GridLine">
                {eachLine}
            </div>
        );
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
