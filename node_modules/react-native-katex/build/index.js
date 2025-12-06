"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = Katex;
const react_1 = __importDefault(require("react"));
const react_native_webview_1 = require("react-native-webview");
const katex_style_1 = __importDefault(require("./katex-style"));
const katex_script_1 = __importDefault(require("./katex-script"));
function getContent({ inlineStyle, expression, ...options }) {
    return `<!DOCTYPE html>
<html>
<head>
<style>
${katex_style_1.default}
${inlineStyle}
</style>
<script>
window.onerror = e => document.write(e);
window.onload = () => katex.render(${JSON.stringify(expression)}, document.body, ${JSON.stringify(options)});
${katex_script_1.default}
</script>
</head>
<body>
</body>
</html>
`;
}
const defaultStyle = {
    root: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
};
const defaultInlineStyle = `
html, body {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100%;
  margin: 0;
  padding: 0;
}
.katex {
  margin: 0;
  display: flex;
}
`;
function Katex({ expression = '', displayMode = false, output, leqno, fleqn, throwOnError = false, errorColor = '#f00', macros = {}, minRuleThickness, colorIsTextColor = false, maxSize, maxExpand, strict, trust, globalGroup, inlineStyle = defaultInlineStyle, ...webViewProps }) {
    return (react_1.default.createElement(react_native_webview_1.WebView, { style: defaultStyle, ...webViewProps, source: {
            html: getContent({
                expression,
                inlineStyle,
                displayMode,
                output,
                leqno,
                fleqn,
                throwOnError,
                errorColor,
                macros,
                minRuleThickness,
                colorIsTextColor,
                maxSize,
                maxExpand,
                strict,
                trust,
                globalGroup,
            }),
        } }));
}
//# sourceMappingURL=index.js.map