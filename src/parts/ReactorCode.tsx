import { Button, Col, ConfigProvider, Flex, Input, message } from "antd";
import { useEffect } from "react";
import { showInsetEffect } from "../components/Utils/Defines";
import { LanguageLoader } from "../components/Utils/LanguageLoader";
import { Reactor } from "../components/Utils/Reactor";

type input = { reactor: Reactor; onReactorChange: React.Dispatch<React.SetStateAction<Reactor>> };
function ReactorCode({ reactor, onReactorChange }: input) {
    function getI18N(key: string, ...args: string[]) {
        return LanguageLoader.getI18N(key, ...args);
    }

    const handleCopyCode = async () => {
        const text = reactor.getCode();

        const fallbackCopy = (t: string) => {
            const ta = document.createElement("textarea");
            ta.value = t;
            ta.style.position = "fixed";
            ta.style.left = "-9999px";
            document.body.appendChild(ta);
            ta.select();
            try {
                const ok = document.execCommand("copy");
                if (ok) message.success("反应堆代码已复制到剪贴板");
                else message.error("复制失败，请手动复制");
            } catch (error) {
                message.error(`复制失败，请手动复制 ${(error as Error).message}`);
            }
            document.body.removeChild(ta);
        };

        if (navigator.clipboard && typeof navigator.clipboard.writeText === "function") {
            try {
                await navigator.clipboard.writeText(text);
                message.success("反应堆代码已复制到剪贴板");
            } catch (error) {
                message.error(`${(error as Error).message}`);
                fallbackCopy(text);
            }
        } else {
            fallbackCopy(text);
        }
    };

    const handlePasteCode = async () => {
        if (navigator.clipboard && typeof navigator.clipboard.readText === "function") {
            try {
                const text = await navigator.clipboard.readText();
                message.success("反应堆代码已粘贴");
                onReactorChange(() => {
                    const newReactor = new Reactor();
                    newReactor.readCodeString(text);
                    return newReactor;
                });
            } catch (error) {
                message.error(`粘贴失败${(error as Error).message}`);
            }
        } else {
            message.error("当前环境不支持从剪贴板读取，请手动粘贴（Ctrl+V）");
        }
    };

    useEffect(() => {
        const onPaste = (e: ClipboardEvent) => {
            e.preventDefault();
            const pastedText = e.clipboardData?.getData("Text");
            if (pastedText) {
                message.success("反应堆代码已粘贴");
                onReactorChange(() => {
                    const newReactor = new Reactor();
                    newReactor.readCodeString(pastedText);
                    return newReactor;
                });
            }
        };
        window.addEventListener("paste", onPaste, true);
        return () => {
            window.removeEventListener("paste", onPaste, true);
        };
    }, [onReactorChange]);

    return (
        <>
            <Flex align="center" justify="center" style={{ width: "100%", height: "100%" }}>
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
            </Flex>
        </>
    );
}

export default ReactorCode;
