import "./GridButton.css";

type input = {
    size: number;
    col: number;
    row: number;
};

function GridButton(input: input) {
    const thisRow = input.row;
    const thisCol = input.col;

    function whenClick() {
        console.log(thisRow, thisCol);
    }

    return (
        <div key={thisRow + thisCol} onClick={whenClick} style={{ width: input.size, height: input.size }} className="GridButton">
            {thisRow},{thisCol}
        </div>
    );
}
export default GridButton;
