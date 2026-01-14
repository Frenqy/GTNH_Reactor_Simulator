import { Button, Checkbox, ConfigProvider, Flex, InputNumber, Radio, Select } from "antd";
import { cloneDeep } from "lodash";
import { useEffect, useRef, useState, type MouseEvent, type ReactElement } from "react";
import GridButton from "../components/GridButton";
import { AutomationSimulator } from "../components/Utils/AutomationSimulator";
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
    version: { mcVersion: string; gtVersion: string };
    setVersion: React.Dispatch<React.SetStateAction<{ mcVersion: string; gtVersion: string }>>;
    setSimulateReactor: React.Dispatch<React.SetStateAction<Reactor | null>>;
    setOutputLines: React.Dispatch<React.SetStateAction<string[]>>;
};
function ReactorSide({ setSelectedItem, selectedItem, reactor, setReactor, version, setVersion, setSimulateReactor, setOutputLines }: input) {
    const selfRef = useRef<HTMLDivElement>(null);
    const [divSize, setDivSize] = useState<{ width: number; height: number }>({ width: 0, height: 0 });

    const styleForEachLine: React.CSSProperties = { width: "90%", height: "100%" };
    const mcVersion: string[] = ["1.7.10", "1.8.9", "1.9.4", "1.10.2", "1.11.2", "1.12.2"];
    const gtVersion: string[] = ["-", "5.08", "5.09", "GTNH"];

    const isPulsedOrAutomaOptions = [
        { label: LanguageLoader.getI18N("UI.PulsedReactor"), value: "PulsedReactor" },
        { label: LanguageLoader.getI18N("UI.AutomatedReactor"), value: "AutomatedReactor" },
    ];

    const isFluidOptions = [
        { value: 1, label: `${LanguageLoader.getI18N("Config.EUReactor")}` },
        { value: 2, label: `${LanguageLoader.getI18N("Config.FluidReactor")}` },
    ];

    function getI18N(key: string, ...args: (string | number)[]) {
        return LanguageLoader.getI18N(key, ...args);
    }

    function handleButtonClick(_event: MouseEvent<HTMLDivElement>, item: ReactorItem | null) {
        setSelectedItem(() => {
            if (item) {
                const tempItem = item.getCopy();
                return tempItem;
            } else {
                return null;
            }
        });
    }

    function updateSelectedItemSetting(which: string, value: number) {
        setSelectedItem((prev) => {
            if (prev == null) return null;
            const newItem = prev.getCopy();
            switch (which) {
                case "initialHeat":
                    newItem.setInitialHeat(value);
                    break;
                case "automationThreshold":
                    newItem.setAutomationThreshold(value);
                    break;
                case "reactorPause":
                    newItem.setReactorPause(value);
                    break;
            }
            return newItem;
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
                case "clearReactor": {
                    newReactor.clearGrid();
                    break;
                }
            }
            return newReactor;
        });
    }

    function handleVersionChange(which: string, e: string) {
        setVersion((prev) => {
            const newVersion = cloneDeep(prev);
            if (which === "mcVersion") {
                localStorage.setItem("mcVersion", e);
                newVersion.mcVersion = e;
                if (e !== "1.7.10") {
                    newVersion.gtVersion = "-";
                }
            } else if (which === "gtVersion") {
                localStorage.setItem("gtVersion", e);
                newVersion.gtVersion = e;
            }
            return newVersion;
        });
    }

    async function startSimulate() {
        const simReactor = cloneDeep(reactor);
        setSimulateReactor(() => {
            return simReactor;
        });
        new AutomationSimulator(simReactor, setOutputLines).simulate();
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
            ItemLoader.ITEM_LIST_MAP[itemType]?.forEach((item) => {
                const isEnable = ItemLoader.isItemDisable(version.mcVersion, version.gtVersion, item.baseName.toString());
                reactorButtons.push(
                    GridButton({
                        key: `select${item.id}`,
                        size: buttonSize,
                        reactorItem: item,
                        onClick: (event: MouseEvent<HTMLDivElement>) => handleButtonClick(event, item),
                        tooltips: `${getI18N(item.name)}\n${getI18N("ComponentData." + item.name.split(".")[1])}`,
                        enable: isEnable,
                    })
                );
            });
        });
    }

    return (
        <>
            <div ref={selfRef} className="componentSelector">
                <Flex wrap gap="small" justify="center">
                    {reactorButtons}
                </Flex>
            </div>
            <Flex className="selectedItemInfo" vertical>
                <Flex style={{ marginLeft: "1%" }}>
                    {getI18N(
                        "UI.TemperatureEffectsSpecific",
                        Math.round(reactor.getMaxHeat() * 0.4).toString(),
                        Math.round(reactor.getMaxHeat() * 0.5).toString(),
                        Math.round(reactor.getMaxHeat() * 0.7).toString(),
                        Math.round(reactor.getMaxHeat() * 0.85).toString(),
                        Math.round(reactor.getMaxHeat() * 1.0).toString()
                    )}
                </Flex>
                <Flex style={{ height: "50%", marginLeft: "1%" }} align="center">
                    {selectedItem ? getI18N("UI.ComponentPlacingSpecific", getI18N(selectedItem.name)) : getI18N("UI.ComponentPlacingDefault")}
                </Flex>
                <Flex style={{ height: "50%" }} align="center" justify="center">
                    <Flex className="paramGroup">
                        {getI18N("Config.InitialComponentHeat")}
                        <InputNumber
                            value={selectedItem ? selectedItem.getInitialHeat() : 0}
                            onChange={(v) => updateSelectedItemSetting("initialHeat", Number(v))}
                            min={0}
                            max={Reactor.MAX_COMPONENT_HEAT}
                            size="small"
                            step={1}
                            style={{ maxWidth: "45%" }}
                        />
                    </Flex>
                    <Flex className="paramGroup">
                        {getI18N("Config.PlacingReplacementThreshold")}
                        <InputNumber
                            value={selectedItem ? selectedItem.getAutomationThreshold() : 9000}
                            onChange={(v) => updateSelectedItemSetting("automationThreshold", Number(v))}
                            min={0}
                            max={Reactor.MAX_COMPONENT_HEAT}
                            size="small"
                            step={1}
                            style={{ maxWidth: "45%" }}
                        />
                    </Flex>
                    <Flex className="paramGroup">
                        {getI18N("Config.PlacingReactorPause")}
                        <InputNumber
                            value={selectedItem ? selectedItem.getReactorPause() : 0}
                            onChange={(v) => updateSelectedItemSetting("reactorPause", Number(v))}
                            min={0}
                            max={10_000}
                            size="small"
                            step={1}
                            style={{ maxWidth: "45%" }}
                        />
                    </Flex>
                </Flex>
            </Flex>
            <Flex vertical style={{ height: "40%" }} align="center" justify="center">
                <Flex style={styleForEachLine} align="center" justify="center">
                    <Radio.Group
                        value={reactor.isFluid() ? 2 : 1}
                        options={isFluidOptions}
                        onChange={(e) => handleReactorUpdate("isFluid", e.target.value)}
                    />
                </Flex>
                <Flex style={styleForEachLine} align="center" justify="center" gap={"small"}>
                    <ConfigProvider wave={{ showEffect: showInsetEffect }}>
                        <Button variant="solid" color="primary" onClick={() => handleReactorUpdate("clearReactor", null)}>
                            {getI18N("UI.ClearGridButton")}
                        </Button>
                        <Button variant="solid" color="danger" onClick={async () => await startSimulate()}>
                            {getI18N("UI.SimulateButton")}
                        </Button>
                        <Button variant="solid" color="default">
                            {getI18N("UI.CancelButton")}
                        </Button>
                    </ConfigProvider>
                </Flex>
                <Flex style={styleForEachLine} align="center" justify="center" gap={"small"}>
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
                <Flex style={styleForEachLine} align="center" justify="center" gap={"small"}>
                    <Checkbox.Group
                        options={isPulsedOrAutomaOptions}
                        value={[reactor.isPulsed() ? "PulsedReactor" : "", reactor.isAutomated() ? "AutomatedReactor" : ""]}
                        onChange={(e) => {
                            handleReactorUpdate("modifyReactor", e);
                        }}
                    />
                </Flex>
                <Flex style={styleForEachLine} align="center" justify="center" gap={"small"}>
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
                <Flex style={styleForEachLine} align="center" justify="center">
                    <Checkbox.Group
                        options={[{ label: getI18N("Config.ReactorCoolantInjectors"), value: "Injector" }]}
                        value={[reactor.isUsingReactorCoolantInjectors() ? "Injector" : ""]}
                        onChange={(e) => {
                            handleReactorUpdate("coolantInjectors", e);
                        }}
                        disabled={version.mcVersion === "1.7.10"}
                    />
                </Flex>
                <Flex style={styleForEachLine} align="center" justify="center" gap={"small"}>
                    {getI18N("UI.MinecraftVersion")}
                    <Select
                        options={mcVersion.map((version) => ({ label: version, value: version }))}
                        value={version.mcVersion}
                        onChange={(e) => handleVersionChange("mcVersion", e)}
                        style={{ minWidth: "15%" }}
                    />
                    {getI18N("UI.GregTechVersion")}
                    <Select
                        options={gtVersion.map((version) => ({ label: version, value: version }))}
                        value={version.gtVersion}
                        onChange={(e) => handleVersionChange("gtVersion", e)}
                        style={{ minWidth: "15%" }}
                        disabled={version.mcVersion !== "1.7.10"}
                    />
                </Flex>
            </Flex>
        </>
    );
}

export default ReactorSide;
