import { Button, Col, ConfigProvider, Input, Row } from "antd";
import { showInsetEffect } from "../components/Utils/Defines";
import { LanguageLoader } from "../components/Utils/LanguageLoader";
import { Reactor } from "../components/Utils/Reactor";

type input = { reactor: Reactor; onReactorChange: React.Dispatch<React.SetStateAction<Reactor>> };
function ReactorCode({ reactor, onReactorChange }: input) {
    function getI18N(key: string, ...args: string[]) {
        return LanguageLoader.getI18N(key, ...args);
    }

    function handleCopyCode() {
        navigator.clipboard.writeText(reactor.getCode());
    }

    function handlePasteCode() {
        navigator.clipboard.readText().then((text) => {
            onReactorChange(() => {
                const newReactor = new Reactor();
                newReactor.readCodeString(text);
                console.log(newReactor);

                return newReactor;
            });
        });
    }

    return (
        <>
            <Row wrap={false} style={{ width: "100%" }} align="middle" gutter={1}>
                <Col flex="5%">{getI18N("UI.CodeLabel")}</Col>
                <Col flex="auto">
                    <Input disabled value={reactor.getCode()} />
                </Col>
                <ConfigProvider wave={{ showEffect: showInsetEffect }}>
                    <Col flex="10%">
                        <Button style={{ width: "100%" }} onClick={handleCopyCode}>
                            {getI18N("UI.CopyCodeButton")}
                        </Button>
                    </Col>
                    <Col flex="10%">
                        <Button style={{ width: "100%" }} onClick={handlePasteCode}>
                            {getI18N("UI.PasteCodeButton")}
                        </Button>
                    </Col>
                </ConfigProvider>
            </Row>
        </>
    );
}

export default ReactorCode;
