import { Button, Checkbox, ConfigProvider, Flex, InputNumber, Radio } from "antd";
import { cloneDeep } from "lodash";
import { useEffect, useRef, useState, type MouseEvent, type ReactElement } from "react";
import GridButton from "../components/GridButton";
import { showInsetEffect } from "../components/Utils/Defines";
import { ItemLoader } from "../components/Utils/ItemLoader";
import { LanguageLoader } from "../components/Utils/LanguageLoader";
import { Reactor } from "../components/Utils/Reactor";
import type { ReactorItem } from "../components/Utils/ReactorItem";
import "./ReactorSide.css";

type input = {
    setSelectedItem: React.Dispatch<React.SetStateAction<ReactorItem | null>>;
    selectedItem: ReactorItem | null;
    reactor: Reactor;
    setReactor: React.Dispatch<React.SetStateAction<Reactor>>;
};
function ReactorSide({ setSelectedItem, selectedItem, reactor, setReactor }: input) {
    const selfRef = useRef<HTMLDivElement>(null);
    const [initHeatValue, setInitHeatValue] = useState(0);
    const [replacementThresholdValue, setReplacementThresholdValue] = useState(9000);
    const [reactorPauseValue, setReactorPauseValue] = useState(0);
    const [divSize, setDivSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

    const isPulsedOrAutomaOptions = [
        { label: LanguageLoader.getI18N("UI.PulsedReactor"), value: "PulsedReactor" },
        { label: LanguageLoader.getI18N("UI.AutomatedReactor"), value: "AutomatedReactor" },
    ];

    const isFluidOptions = [
        { value: 1, label: `${LanguageLoader.getI18N("Config.EUReactor")}` },
        { value: 2, label: `${LanguageLoader.getI18N("Config.FluidReactor")}` },
    ];

    function getI18N(key: string, ...args: string[]) {
        return LanguageLoader.getI18N(key, ...args);
    }

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

    function handleReactorUpdate(id: string, data: string | string[] | number | null) {
        setReactor((prev: Reactor) => {
            const newReactor = cloneDeep(prev);
            switch (id) {
                case "isFluid": {
                    newReactor.setFluid(Number(data) === 2);
                    break;
                }
                case "reactorInitHeat": {
                    newReactor.setCurrentHeat(data ? Number(data) : 0);
                    break;
                }
                case "modifyReactor": {
                    newReactor.setPulsed((data as string[]).includes("PulsedReactor"));
                    newReactor.setAutomated((data as string[]).includes("AutomatedReactor"));
                    break;
                }
                case "maxSimulationTicks": {
                    newReactor.setMaxSimulationTicks(Number(data));
                    break;
                }
                case "coolantInjectors": {
                    newReactor.setUsingReactorCoolantInjectors((data as string[]).includes("Injector"));
                    break;
                }
            }
            return newReactor;
        });
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
    if (divSize.width > 0) {
        const buttonSize = Math.round(divSize.width / Math.round(divSize.width / 64));
        reactorButtons.push(
            GridButton({
                key: `null`,
                size: buttonSize,
                onClick: (event: MouseEvent<HTMLDivElement>) => handleButtonClick(event, null),
                tooltips: null,
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
                        tooltips: `${getI18N("ComponentName." + item.baseName)}\n${getI18N("ComponentData." + item.baseName)}`,
                    })
                );
            });
        });
    }

    return (
        <>
            <div ref={selfRef} className="componentSelector">
                <Flex wrap gap="small">
                    {reactorButtons}
                </Flex>
            </div>
            <div className="selectedItemInfo">
                <div className="infoLine">
                    {selectedItem ? getI18N("UI.ComponentPlacingSpecific", selectedItem.name) : getI18N("UI.ComponentPlacingDefault")}
                </div>
                <div className="infoLine center">
                    <div className="paramGroup">
                        {getI18N("Config.InitialComponentHeat")}
                        <InputNumber
                            value={initHeatValue}
                            onChange={(v) => setInitHeatValue(Number(v))}
                            min={0}
                            max={Reactor.MAX_COMPONENT_HEAT}
                            size={"small"}
                            step={1}
                            style={{ maxWidth: "45%" }}
                        />
                    </div>
                    <div className="paramGroup">
                        {getI18N("Config.PlacingReplacementThreshold")}
                        <InputNumber
                            value={replacementThresholdValue}
                            onChange={(v) => setReplacementThresholdValue(Number(v))}
                            min={0}
                            max={Reactor.MAX_COMPONENT_HEAT}
                            size={"small"}
                            step={1}
                            style={{ maxWidth: "45%" }}
                        />
                    </div>
                    <div className="paramGroup">
                        {getI18N("Config.PlacingReactorPause")}
                        <InputNumber
                            value={reactorPauseValue}
                            onChange={(v) => setReactorPauseValue(Number(v))}
                            min={0}
                            max={10_000}
                            size={"small"}
                            step={1}
                            style={{ maxWidth: "45%" }}
                        />
                    </div>
                </div>
            </div>
            <div className="controlPanel center">
                <div className="controlLine center">
                    <Radio.Group
                        value={reactor.isFluid() ? 2 : 1}
                        options={isFluidOptions}
                        onChange={(e) => handleReactorUpdate("isFluid", e.target.value)}
                    />
                </div>
                <div className="controlLine center">
                    <Flex gap={"small"}>
                        <ConfigProvider wave={{ showEffect: showInsetEffect }}>
                            <Button variant="solid" color="primary">
                                {getI18N("UI.ClearGridButton")}
                            </Button>
                            <Button variant="solid" color="danger">
                                {getI18N("UI.SimulateButton")}
                            </Button>
                            <Button variant="solid" color="default">
                                {getI18N("UI.CancelButton")}
                            </Button>
                        </ConfigProvider>
                    </Flex>
                </div>
                <div className="controlLine center">
                    <Flex gap={"small"}>
                        {getI18N("UI.InitialReactorHeat")}
                        <InputNumber
                            value={reactor.getCurrentHeat()}
                            onChange={(e) => handleReactorUpdate("reactorInitHeat", e)}
                            min={0}
                            max={10_000}
                            size={"small"}
                            step={1}
                            style={{ maxWidth: "45%" }}
                        />
                        {getI18N("UI.MaxHeatDefault")}
                    </Flex>
                </div>
                <div className="controlLine center">
                    <Flex gap={"small"}>
                        <Checkbox.Group
                            options={isPulsedOrAutomaOptions}
                            defaultValue={[reactor.isPulsed() ? "PulsedReactor" : "", reactor.isAutomated() ? "AutomatedReactor" : ""]}
                            onChange={(e) => {
                                handleReactorUpdate("modifyReactor", e);
                            }}
                        />
                    </Flex>
                </div>
                <div className="controlLine center">
                    <Flex gap={"small"}>
                        {getI18N("UI.MaxSimulationTicks")}
                        <InputNumber
                            value={reactor.getMaxSimulationTicks()}
                            onChange={(e) => handleReactorUpdate("maxSimulationTicks", e)}
                            min={0}
                            max={5e6}
                            size={"small"}
                            step={1}
                            style={{ maxWidth: "45%" }}
                        />
                        {getI18N("Config.Seconds")}
                    </Flex>
                </div>
                <div className="controlLine center">
                    <Checkbox.Group
                        options={[{ label: getI18N("Config.ReactorCoolantInjectors"), value: "Injector" }]}
                        defaultValue={[reactor.isUsingReactorCoolantInjectors() ? "Injector" : ""]}
                        onChange={(e) => {
                            handleReactorUpdate("coolantInjectors", e);
                        }}
                    />
                </div>
            </div>
        </>
    );
}

export default ReactorSide;
