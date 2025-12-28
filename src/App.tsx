import { useEffect, useState } from "react";
import { lang, type AllData, type LangsJson } from "./components/Utils/Defines";
import { GlobalData } from "./components/Utils/GlobalData";
import { ImageLoader } from "./components/Utils/ImageLoader";
import { ItemLoader } from "./components/Utils/ItemLoader";
import { LanguageLoader } from "./components/Utils/LanguageLoader";
import { Reactor } from "./components/Utils/Reactor";
import type { ReactorItem } from "./components/Utils/ReactorItem";
import ReactorCode from "./parts/ReactorCode";
import ReactorGrid from "./parts/ReactorGrid";
import ReactorSide from "./parts/ReactorSide";
import ReactorStats from "./parts/ReactorStats";

function initLang() {
    GlobalData.language = navigator.language.includes("zh") ? lang.zh : lang.en;
}

function App() {
    const [reactor, setReactor] = useState(() => new Reactor());
    const [selectedItem, setSelectedItem] = useState<ReactorItem | null>(null);
    const [isLoaded, setIsLoaded] = useState(false);
    const [version, setVersion] = useState<{ mcVersion: string; gtVersion: string }>({ mcVersion: "1.7.10", gtVersion: "-" });

    useEffect(() => {
        const loadData = async () => {
            const langsRes = await fetch("/data/langs.json");
            const langsData: LangsJson = await langsRes.json();
            LanguageLoader.initLanguageLoader(langsData);

            const allRes = await fetch("/data/all_data.json");
            const allData: AllData = await allRes.json();
            ImageLoader.initImages(allData.image);
            ItemLoader.initItems(allData.items);
            setIsLoaded(true);
        };
        loadData();

        initLang();
    }, [version]);

    if (!isLoaded) {
        // 数据没加载完时只显示 loading
        return <div>加载中...</div>;
    } else {
        return (
            <>
                <div className="MainBody">
                    <div className="ReactorGridCodeStats">
                        <div className="ReactorGrid">
                            <ReactorGrid reactor={reactor} onReactorChange={setReactor} selectedItem={selectedItem} />
                        </div>
                        <div className="ReactorCode">
                            <ReactorCode reactor={reactor} onReactorChange={setReactor} />
                        </div>
                        <div className="ReactorStats">
                            <ReactorStats reactor={reactor} onReactorChange={setReactor} />
                        </div>
                    </div>
                    <div className="ReactorSide">
                        <ReactorSide
                            setSelectedItem={setSelectedItem}
                            selectedItem={selectedItem}
                            reactor={reactor}
                            setReactor={setReactor}
                            version={version}
                            setVersion={setVersion}
                        />
                    </div>
                </div>
            </>
        );
    }
}

export default App;
