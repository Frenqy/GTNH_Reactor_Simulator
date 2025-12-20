import type { TabsProps } from "antd";
import { Tabs } from "antd";
import "./ReactorStats.css";

const items: TabsProps["items"] = [];

const tabsName: string[] = ["模拟", "元件", "元件自动化", "元件清单", "材料", "csv", "高级", "比较方式"];
tabsName.forEach((name, idx) => {
    items.push({
        label: name,
        key: idx.toString(),
        children: (
            <div className="children-full-height">
                <div>{name}</div>
            </div>
        ),
    });
});

function ReactorStats() {
    return (
        <div className="reactor-stats-tabs" style={{ height: "100%" }}>
            <Tabs defaultActiveKey="0" type="card" items={items} tabBarStyle={{ margin: "0", height: "max(5%, 20px)" }} />
        </div>
    );
}

export default ReactorStats;
