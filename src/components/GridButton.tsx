import cloneDeep from "lodash/cloneDeep";
import im from "../assets/ic2/textures/items/reactorHeatSwitchDiamond.png";
import "./GridButton.css";
import { Reactor } from "./Utils/Reactor";
import { Reflector } from "./Utils/ReactorItems/Reflector";

type input = {
    size: number;
    col: number;
    row: number;
    onReactorChange: React.Dispatch<React.SetStateAction<Reactor>>;
    hasReactorItem: boolean;
};

function GridButton(input: input) {
    const thisRow = input.row;
    const thisCol = input.col;

    function whenClick() {
        input.onReactorChange((prev: Reactor) => {
            const newReactor = cloneDeep(prev);
            if (newReactor.getComponentAt(thisRow, thisCol) == null) {
                newReactor.setComponentAt(thisRow, thisCol, new Reflector(7, "neutronReflector", "ComponentName.NeutronReflector", "reactorReflector.png", 30e3, 1, null));
            } else {
                newReactor.setComponentAt(thisRow, thisCol, null);
            }
            return newReactor;
        });
    }

    return (
        <div key={`row${thisRow}col${thisCol}`} onClick={whenClick} style={{ width: input.size, height: input.size }} className="GridButton">
            {thisRow},{thisCol},{input.hasReactorItem ? "True" : "False"}
            {input.hasReactorItem ? <img src={im}></img> : null}
        </div>
    );
}
export default GridButton;
