export interface XamlConverterOptions {
    /** Font sizes that correspond to heading levels [H1, H2, H3, H4, H5, H6] */
    headingSizes: number[];
    /** Font family name used to identify code elements */
    monospaceFontName: string;
    /** Left border thickness for block quotes */
    blockQuoteLineThickness: number;
    /** Top border thickness for horizontal rules */
    horizontalLineThickness: number;
    /** Whether to ignore unknown elements */
    ignoreUnknownElements: boolean;
}
export declare const DEFAULT_OPTIONS: XamlConverterOptions;
export declare class XamlToMarkdownConverter {
    private options;
    private parser;
    private unicodeCleaner;
    constructor(options?: Partial<XamlConverterOptions>);
    private isXamlElement;
    convertToMarkdown(xamlContent: string): string;
    private cleanXamlContent;
    private processElement;
    private processSection;
    private processParagraph;
    private processRun;
    private decodeEntities;
    private processSpan;
    private processList;
    private processListItems;
    private processTable;
    private hasMarkdownLinkSyntax;
    private hasMarkdownImageSyntax;
    private isInCodeContext;
    private processHyperlink;
    private getAttributes;
    private applyInlineFormatting;
    private extractElementContent;
    private getHeadingLevel;
    private getHeadingLevelFromParagraph;
    private extractRunsFromParagraph;
    private isHorizontalRule;
    private isBlockQuote;
    private isMonospaceFont;
    private extractListItems;
    private extractTableRows;
    private extractTableCells;
    private extractPlainText;
    private normalizeMarkdown;
    private isParagraph;
    private isCodeParagraph;
}
