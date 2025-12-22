import { useState } from "react";
import { Reactor } from "./components/Utils/Reactor";
import ReactorGrid from "./parts/ReactorGrid";
import ReactorSide from "./parts/ReactorSide";
import ReactorStats from "./parts/ReactorStats";

function App() {
    const [reactor, setReactor] = useState(() => new Reactor());

    return (
        <>
            <div className="MainBody">
                <div className="ReactorTop">
                    <div className="ReactorGrid">
                        <ReactorGrid reactor={reactor} onReactorChange={setReactor} />
                    </div>
                    <div className="ReactorSide">
                        <ReactorSide />
                    </div>
                </div>
                <div className="ReactorStats">
                    <ReactorStats />
                </div>
            </div>
        </>
    );
}

export default App;
