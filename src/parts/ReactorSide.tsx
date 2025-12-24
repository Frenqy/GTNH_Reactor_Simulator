import { useEffect, useRef, useState, type ChangeEvent, type MouseEvent, type ReactElement } from "react";
import GridButton from "../components/GridButton";
import { ItemLoader } from "../components/Utils/ItemLoader";
import { LanguageLoader } from "../components/Utils/LanguageLoader";
import { Reactor } from "../components/Utils/Reactor";
import type { ReactorItem } from "../components/Utils/ReactorItem";
import "./ReactorSide.css";

type input = {
    setSelectedItem: React.Dispatch<React.SetStateAction<ReactorItem | null>>;
    isLoaded: boolean;
    selectedItem: ReactorItem | null;
};
function ReactorSide({ setSelectedItem, isLoaded, selectedItem }: input) {
    const selfRef = useRef<HTMLDivElement>(null);
    const [initHeatValue, setInitHeatValue] = useState(0);
    const [replacementThresholdValue, setReplacementThresholdValue] = useState(9000);
    const [reactorPauseValue, setReactorPauseValue] = useState(0);
    const [divSize, setDivSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

    function handleButtonClick(_event: MouseEvent<HTMLDivElement>, item: ReactorItem | null) {
        setSelectedItem(() => {
            if (item) {
                const tempItem = item.getCopy();
                setInitHeatValue(tempItem.initialHeat);
                setReplacementThresholdValue(tempItem.automationThreshold);
                setReactorPauseValue(tempItem.reactorPause);
                return tempItem;
            } else {
                return null;
            }
        });
    }

    function checkInputValid(e: ChangeEvent<HTMLInputElement>) {
        let inputNum = Math.round(Number(e.target.value));
        switch (e.target.id) {
            case "initHeat": {
                inputNum = Math.max(0, Math.min(Reactor.MAX_COMPONENT_HEAT, inputNum));
                setInitHeatValue(inputNum);
                break;
            }
            case "replacementThreshold": {
                inputNum = Math.max(0, Math.min(Reactor.MAX_COMPONENT_HEAT, inputNum));
                setReplacementThresholdValue(inputNum);
                break;
            }
            case "reactorPause": {
                inputNum = Math.max(0, Math.min(10_000, inputNum));
                setReactorPauseValue(inputNum);
                break;
            }
        }
    }

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

    const reactorButtons: ReactElement[] = [];
    if (isLoaded && divSize.width > 0) {
        const buttonSize = Math.round(divSize.width / Math.round(divSize.width / 64));
        reactorButtons.push(
            GridButton({
                key: `null`,
                size: buttonSize,
                onClick: (event: MouseEvent<HTMLDivElement>) => handleButtonClick(event, null),
                title: "null",
            })
        );
        ItemLoader.ITEM_TYPE_NAME_LIST.forEach((itemType) => {
            ItemLoader.ITEM_LIST_MAP[itemType].forEach((item) => {
                reactorButtons.push(
                    GridButton({
                        key: `select${item.id}`,
                        size: buttonSize,
                        reactorItem: item,
                        onClick: (event: MouseEvent<HTMLDivElement>) => handleButtonClick(event, item),
                        title: `${LanguageLoader.getI18N("ComponentName." + item.baseName)}</br>${LanguageLoader.getI18N(
                            "ComponentData." + item.baseName
                        )}`,
                    })
                );
            });
        });
    }

    return (
        <>
            <div ref={selfRef} className="componentSelector">
                {reactorButtons}
            </div>
            <div className="selectedItemInfo">
                <div className="infoLine">
                    {selectedItem
                        ? LanguageLoader.getI18N("UI.ComponentPlacingSpecific", selectedItem.name)
                        : LanguageLoader.getI18N("UI.ComponentPlacingDefault")}
                </div>
                <div className="infoLine center">
                    <div className="paramGroup">
                        {LanguageLoader.getI18N("Config.InitialComponentHeat")}
                        <input type="number" id="initHeat" value={initHeatValue} onChange={checkInputValid}></input>
                    </div>
                    <div className="paramGroup">
                        {LanguageLoader.getI18N("Config.PlacingReplacementThreshold")}
                        <input type="number" id="replacementThreshold" value={replacementThresholdValue} onChange={checkInputValid}></input>
                    </div>
                    <div className="paramGroup">
                        {LanguageLoader.getI18N("Config.PlacingReactorPause")}
                        <input type="number" id="reactorPause" value={reactorPauseValue} onChange={checkInputValid}></input>
                    </div>
                </div>
            </div>
        </>
    );
}

export default ReactorSide;
