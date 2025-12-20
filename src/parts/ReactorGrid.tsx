import { useEffect, useRef, useState } from "react";
import GridButton from "../components/GridButton";
import "./ReactorGrid.css";

function ReactorGrid() {
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

    const blockSize = Math.round(Math.min((parentSize.width - 8 * 5) / 9, (parentSize.height - 5 * 5) / 6)) - 1;
    const blockElements = [];
    for (let i = 0; i < 6; i++) {
        const lineElements = [];
        for (let q = 0; q < 9; q++) {
            lineElements.push(GridButton({ size: blockSize, row: i, col: q }));
        }
        blockElements.push(
            <div key={i} className="GridLine">
                {lineElements}
            </div>
        );
    }

    return (
        <>
            <div ref={selfRef} className="GridHolder">
                {blockElements}
            </div>
        </>
    );
}

export default ReactorGrid;
