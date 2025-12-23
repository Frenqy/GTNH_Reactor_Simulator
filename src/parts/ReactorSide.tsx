import { useEffect, useRef, useState, type MouseEvent } from "react";
import GridButton from "../components/GridButton";
import { ItemLoader } from "../components/Utils/ItemLoader";
import { LanguageLoader } from "../components/Utils/LanguageLoader";
import type { ReactorItem } from "../components/Utils/ReactorItem";
import "./ReactorSide.css";

type input = {
    setSelectedItem: React.Dispatch<React.SetStateAction<ReactorItem | null>>;
    isLoaded: boolean;
    selectedItem: ReactorItem | null;
};
function ReactorSide({ setSelectedItem, isLoaded, selectedItem }: input) {
    const selfRef = useRef<HTMLDivElement>(null);
    const [divSize, setDivSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

    useEffect(() => {
        const node = selfRef.current;
        if (!node) return;
        const updateSize = () => {
            setDivSize({
                width: node.clientWidth,
                height: node.clientHeight,
            });
        };
        updateSize();

        const resizeObserver = new ResizeObserver(updateSize);
        resizeObserver.observe(node);
        return () => {
            resizeObserver.disconnect();
        };
    }, []);

    function handleButtonClick(_event: MouseEvent<HTMLDivElement>, item: ReactorItem | null) {
        setSelectedItem(() => {
            if (item) {
                return item.getCopy();
            } else {
                return null;
            }
        });
    }

    // 动态生成按钮
    const reactorButtons = [];
    if (isLoaded && divSize.width > 0) {
        const buttonSize = Math.round(divSize.width / Math.round(divSize.width / 64));
        for (const itemType of ItemLoader.ITEM_TYPE_NAME_LIST) {
            for (const item of ItemLoader.ITEM_LIST_MAP[itemType]) {
                reactorButtons.push(
                    GridButton({
                        key: `select${item.id}`,
                        size: buttonSize,
                        reactorItem: item,
                        onClick: (event: MouseEvent<HTMLDivElement>) => handleButtonClick(event, item),
                    })
                );
            }
        }
    }

    return (
        <>
            <div ref={selfRef} className="componentSelector">
                {reactorButtons}
            </div>
            <div className="selectedItemInfo">
                <div className="infoLine">{selectedItem ? LanguageLoader.getI18N("UI.ComponentPlacingSpecific", selectedItem.name) : LanguageLoader.getI18N("UI.ComponentPlacingDefault")}</div>
                <div className="infoLine" style={{ justifyContent: "center" }}>
                    <div className="paramGroup">
                        {LanguageLoader.getI18N("Config.InitialComponentHeat")}
                        <input type="number" id="initHeat"></input>
                    </div>
                    <div className="paramGroup">
                        {LanguageLoader.getI18N("Config.PlacingReplacementThreshold")}
                        <input type="number" id="replacementThreshold"></input>
                    </div>
                    <div className="paramGroup">
                        {LanguageLoader.getI18N("Config.PlacingReactorPause")}
                        <input type="number" id="reactorPause"></input>
                    </div>
                </div>
            </div>
        </>
    );
}

export default ReactorSide;
