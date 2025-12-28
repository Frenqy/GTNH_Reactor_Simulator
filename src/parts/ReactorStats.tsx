import type { TabsProps } from "antd";
import { Button, Col, ConfigProvider, Flex, InputNumber, Space, Tabs } from "antd";
import { cloneDeep } from "lodash";
import type { ReactElement } from "react";
import { showInsetEffect } from "../components/Utils/Defines";
import { LanguageLoader } from "../components/Utils/LanguageLoader";
import { Reactor } from "../components/Utils/Reactor";
import "./ReactorStats.css";

type input = { reactor: Reactor; onReactorChange: React.Dispatch<React.SetStateAction<Reactor>> };

function ReactorStats({ reactor, onReactorChange }: input) {
    function handleReactorUpdate(id: string, data: string | string[] | number | null) {
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
            }
            return newReactor;
        });
    }

    const items: TabsProps["items"] = [];
    items.push({
        label: getI18N("UI.SimulationTab"),
        key: (items.length + 1).toString(),
        children: (
            <Flex className="children-full-height">
                <div>{getI18N("UI.SimulationTab")}</div>
            </Flex>
        ),
    });
    const tableItem: ReactElement[] = [];
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

    function getI18N(key: string, ...args: string[]) {
        return LanguageLoader.getI18N(key, ...args);
    }

    return (
        <>
            <Flex align="center" justify="space-between" style={{ width: "100%", height: "100%" }}>
                <Col span={12} style={{ height: "100%" }} className="reactor-stats-tabs"></Col>
                <Col span={12} style={{ height: "100%" }} className="reactor-stats-tabs">
                    <Tabs
                        defaultActiveKey="0"
                        type="card"
                        items={items}
                        tabBarStyle={{ margin: "0", height: "max(5%, 20px)" }}
                        style={{ maxHeight: "100%" }}
                    />
                </Col>
            </Flex>
        </>
    );
}

export default ReactorStats;
