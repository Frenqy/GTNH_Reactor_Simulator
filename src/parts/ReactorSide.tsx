import { type MouseEvent } from "react";
import GridButton from "../components/GridButton";
import { ItemLoader } from "../components/Utils/ItemLoader";
import type { ReactorItem } from "../components/Utils/ReactorItem";
import "./ReactorSide.css";

type input = {
    setSelectedItem: React.Dispatch<React.SetStateAction<ReactorItem | null>>;
};
function ReactorSide({ setSelectedItem }: input) {
    // divSize.width, divSize.height;
    // const buttonSize = Math.round(Math.min((nodeSize.height * 0.2) / 10, nodeSize.width / 10));
    // console.log(buttonSize);
    const reactorButtons = [];
    for (const itemType of ItemLoader.ITEM_TYPE_NAME_LIST) {
        for (const item of ItemLoader.ITEM_LIST_MAP[itemType]) {
            reactorButtons.push(
                GridButton({
                    key: item.id,
                    size: 20,
                    reactorItem: item,
                    onClick: (event: MouseEvent<HTMLDivElement>) => handleButtonClick(event, item),
                })
            );
        }
    }

    function handleButtonClick(event: MouseEvent<HTMLDivElement>, item: ReactorItem | null) {
        // event.preventDefault();
        // left click => 1; right click => 2
        setSelectedItem(() => {
            if (item) {
                return item.getCopy();
            } else {
                return null;
            }
        });
    }

    return (
        <div className="ReactorSideInside">
            <div className="componentSelector">{reactorButtons}</div>
            <div className="temp"></div>
        </div>
    );
}

export default ReactorSide;
