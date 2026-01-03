import type { TabsProps } from "antd";
import { Button, Col, ConfigProvider, Flex, InputNumber, Space, Tabs } from "antd";
import { cloneDeep } from "lodash";
import { useEffect, useRef, type ReactElement } from "react";
import { showInsetEffect } from "../components/Utils/Defines";
import { LanguageLoader } from "../components/Utils/LanguageLoader";
import { Reactor } from "../components/Utils/Reactor";
import "./ReactorStats.css";

type input = {
    reactor: Reactor;
    onReactorChange: React.Dispatch<React.SetStateAction<Reactor>>;
    selectedRowAndCol: { row: number; col: number };
    simulateReactor: Reactor | null;
    outputLines: string[];
};

function ReactorStats({ reactor, onReactorChange, selectedRowAndCol, simulateReactor, outputLines }: input) {
    const selectedRow = selectedRowAndCol.row;
    const selectedCol = selectedRowAndCol.col;
    const selectedGridStack = reactor.getComponentAt(selectedRow, selectedCol);
    const items: TabsProps["items"] = [];
    const tableItem: ReactElement[] = [];
    let componentArea: string;
    const outputRef = useRef<HTMLDivElement>(null);
    useEffect(() => {
        outputRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [outputLines]);

    if (simulateReactor) {
        const component = simulateReactor.getComponentAt(selectedRow, selectedCol);
        if (component) {
            componentArea = getI18N("UI.ComponentInfoLastSimRowCol", component.toString(), selectedRow, selectedCol, component.info);
        } else {
            componentArea = getI18N("UI.NoComponentLastSimRowCol", selectedRow, selectedCol);
        }
    } else {
        componentArea = getI18N("UI.NoSimulationRun");
    }

    function handleReactorUpdate(id: string, data: string | (string | number)[] | number | null) {
        onReactorChange((prev: Reactor) => {
            const newReactor = cloneDeep(prev);
            switch (id) {
                case "OnPulse": {
                    newReactor.setOnPulse(Number(data));
                    break;
                }
                case "OffPulse": {
                    newReactor.setOffPulse(Number(data));
                    break;
                }
                case "ResumeTemp": {
                    newReactor.setResumeTemp(Number(data));
                    break;
                }
                case "SuspendTemp": {
                    newReactor.setSuspendTemp(Number(data));
                    break;
                }
                case "ResetPulseConfig": {
                    newReactor.resetPulseConfig();
                    break;
                }
                case "updateComponentAutomationThreshold": {
                    newReactor.getComponentAt(selectedRow, selectedCol)?.setAutomationThreshold(Number(data));
                    break;
                }
                case "updateComponentReactorPause": {
                    newReactor.getComponentAt(selectedRow, selectedCol)?.setReactorPause(Number(data));
                    break;
                }
            }
            return newReactor;
        });
    }

    items.push({
        label: getI18N("UI.SimulationTab"),
        key: (items.length + 1).toString(),
        children: (
            <Flex className="children-full-height" style={{ overflowY: "auto" }} vertical>
                {outputLines.map((line, idx) => (
                    <div key={idx}>{line}</div>
                ))}
                <div ref={outputRef} />
            </Flex>
        ),
    });
    Array.from(reactor.getComponentList().materials.entries()).forEach((data, idx) => {
        tableItem.push(
            <tr key={`table-${idx}`}>
                <td>{data[0]}</td>
                <td>{data[1]}</td>
            </tr>
        );
    });
    items.push({
        label: getI18N("UI.ComponentListTab"),
        key: (items.length + 1).toString(),
        children: (
            <Flex className="children-full-height">
                <table border={1}>
                    <thead>
                        <tr>
                            <th>name</th>
                            <th>count</th>
                        </tr>
                    </thead>
                    <tbody>{tableItem}</tbody>
                </table>
            </Flex>
        ),
    });
    if (reactor.isPulsed()) {
        items.push({
            label: getI18N("UI.PulseConfigurationTab"),
            key: (items.length + 1).toString(),
            children: (
                <Flex className="children-full-height" vertical gap="middle" style={{ padding: "1%" }} align="center">
                    <Flex vertical>
                        <Space size="middle">
                            <Flex gap="small">
                                <div>{getI18N("Config.OnPulse")}</div>
                                <InputNumber
                                    value={reactor.getOnPulse()}
                                    min={0}
                                    max={5e6}
                                    size="small"
                                    step={1}
                                    style={{ maxWidth: "45%" }}
                                    onChange={(e) => handleReactorUpdate("OnPulse", e)}
                                />
                                <div>{getI18N("Config.Seconds")}</div>
                            </Flex>
                            <Flex gap="small">
                                <div>{getI18N("Config.OnPulse")}</div>
                                <InputNumber
                                    value={reactor.getOffPulse()}
                                    min={0}
                                    max={5e6}
                                    size="small"
                                    step={1}
                                    style={{ maxWidth: "45%" }}
                                    onChange={(e) => handleReactorUpdate("OffPulse", e)}
                                />
                                <div>{getI18N("Config.Seconds")}</div>
                            </Flex>
                        </Space>
                        <Flex>
                            <div>{getI18N("Config.PulseHelp")}</div>
                        </Flex>
                    </Flex>

                    <Flex vertical>
                        <Space size="middle">
                            <Flex gap="small">
                                <div>{getI18N("Config.SuspendTemp")}</div>
                                <InputNumber
                                    value={reactor.getSuspendTemp()}
                                    min={0}
                                    max={120e3}
                                    size="small"
                                    step={1}
                                    style={{ maxWidth: "45%" }}
                                    onChange={(e) => handleReactorUpdate("SuspendTemp", e)}
                                />
                            </Flex>
                            <Flex gap="small">
                                <div>{getI18N("Config.ResumeTemp")}</div>
                                <InputNumber
                                    value={reactor.getResumeTemp()}
                                    min={0}
                                    max={120e3}
                                    size="small"
                                    step={1}
                                    style={{ maxWidth: "45%" }}
                                    onChange={(e) => handleReactorUpdate("ResumeTemp", e)}
                                />
                            </Flex>
                        </Space>
                        <Flex>
                            <div>{getI18N("Config.SuspendTempHelp")}</div>
                        </Flex>
                    </Flex>

                    <ConfigProvider wave={{ showEffect: showInsetEffect }}>
                        <Button style={{ width: "50%" }} onClick={() => handleReactorUpdate("ResetPulseConfig", null)}>
                            {getI18N("UI.ResetPulseConfig")}
                        </Button>
                    </ConfigProvider>
                </Flex>
            ),
        });
    }

    const replacementThresholdInput = (
        <InputNumber
            value={selectedGridStack ? selectedGridStack.getAutomationThreshold() : 9000}
            onChange={(v) => handleReactorUpdate("updateComponentAutomationThreshold", v)}
            min={0}
            max={Reactor.MAX_COMPONENT_HEAT}
            size="small"
            step={1}
            style={{ maxWidth: "45%" }}
        />
    );

    const reactorPauseInput = (
        <InputNumber
            value={selectedGridStack ? selectedGridStack.getReactorPause() : 9000}
            onChange={(v) => handleReactorUpdate("updateComponentReactorPause", v)}
            min={0}
            max={10_000}
            size="small"
            step={1}
            style={{ maxWidth: "45%" }}
        />
    );

    function getI18N(key: string, ...args: (string | number)[]) {
        return LanguageLoader.getI18N(key, ...args);
    }

    return (
        <>
            <Flex align="center" justify="space-between" style={{ width: "100%", height: "100%" }}>
                <Col span={12} style={{ height: "100%" }} className="reactor-stats-tabs" id="leftStats">
                    <Flex vertical style={{ height: "100%", width: "100%" }}>
                        <Flex style={{ fontWeight: "bold" }}>{getI18N("UI.ComponentTab")}</Flex>
                        <Flex flex={1} style={{ backgroundColor: "#cdcdcd", padding: "max(1%, 10px)" }} vertical>
                            <Flex style={{ whiteSpace: "pre-line" }}>{componentArea}</Flex>
                        </Flex>
                        <Flex style={{ fontWeight: "bold" }}>{getI18N("UI.ComponentAutomationTab")}</Flex>
                        <Flex flex={2} style={{ backgroundColor: "#cdcdcd", padding: "max(1%, 10px)" }} vertical gap="small">
                            {selectedGridStack === null ? (
                                <Flex>{getI18N("UI.NoComponentRowCol", selectedRow, selectedCol)}</Flex>
                            ) : (
                                <Flex>{getI18N("UI.ChosenComponentRowCol", getI18N(selectedGridStack.name), selectedRow, selectedCol)}</Flex>
                            )}
                            <Flex gap="small">
                                {getI18N("Config.ReplacementThreshold")}
                                {replacementThresholdInput}
                            </Flex>
                            <Flex>{getI18N("Config.ReplacementThresholdHelp")}</Flex>
                            <Flex gap="small">
                                {getI18N("Config.ReactorPause")}
                                {reactorPauseInput}
                            </Flex>
                            <Flex>{getI18N("Config.ReactorPauseHelp")}</Flex>
                        </Flex>
                    </Flex>
                </Col>
                <Col span={12} style={{ height: "100%" }} className="reactor-stats-tabs" id="rightStats">
                    <Tabs
                        defaultActiveKey="0"
                        type="card"
                        items={items}
                        tabBarStyle={{ margin: "0", height: "max(5%, 20px)" }}
                        style={{ height: "100%" }}
                    />
                </Col>
            </Flex>
        </>
    );
}

export default ReactorStats;
