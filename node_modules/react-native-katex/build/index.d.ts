import React from 'react';
import { WebViewSharedProps } from 'react-native-webview/lib/WebViewTypes';
export interface KatexOptions {
    displayMode?: boolean;
    output?: 'html' | 'mathml' | 'htmlAndMathml';
    leqno?: boolean;
    fleqn?: boolean;
    throwOnError?: boolean;
    errorColor?: string;
    macros?: any;
    minRuleThickness?: number;
    colorIsTextColor?: boolean;
    maxSize?: number;
    maxExpand?: number;
    strict?: boolean | string;
    trust?: boolean;
    globalGroup?: boolean;
}
export interface ContentOptions extends KatexOptions {
    inlineStyle?: string;
    expression?: string;
}
export interface KatexProps extends ContentOptions, Omit<WebViewSharedProps, 'source'> {
}
export default function Katex({ expression, displayMode, output, leqno, fleqn, throwOnError, errorColor, macros, minRuleThickness, colorIsTextColor, maxSize, maxExpand, strict, trust, globalGroup, inlineStyle, ...webViewProps }: KatexProps): React.JSX.Element;
