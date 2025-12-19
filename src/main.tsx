import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import ReactorGrid from "./parts/ReactorGrid";
import ReactorSide from "./parts/ReactorSide";
import ReactorStats from "./parts/ReactorStats";

createRoot(document.getElementById("root")!).render(
    <StrictMode>
        <div className="MainBody">
            <div className="ReactorTop">
                <div className="ReactorGrid">
                    <ReactorGrid />
                </div>
                <div className="ReactorSide">
                    <ReactorSide />
                </div>
            </div>
            <div className="ReactorStats">
                <ReactorStats />
            </div>
        </div>
    </StrictMode>
);
