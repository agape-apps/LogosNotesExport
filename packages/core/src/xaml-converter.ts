import { XMLParser } from 'fast-xml-parser';
import { UnicodeCleaner } from './unicode-cleaner.js';

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

// TODO: Add support for other monospace Font Names
export const DEFAULT_OPTIONS: XamlConverterOptions = {
  headingSizes: [24, 22, 20, 18, 16, 14],
  monospaceFontName: 'Courier New',
  blockQuoteLineThickness: 3,
  horizontalLineThickness: 3,
  ignoreUnknownElements: true,
};

interface XamlElement {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
  '@_FontSize'?: string;
  '@_FontWeight'?: string;
  '@_FontStyle'?: string;
  '@_FontFamily'?: string;
  '@_BorderThickness'?: string;
  '@_BorderBrush'?: string;
  '@_Text'?: string;
  '@_Tag'?: string;
  '@_NavigateUri'?: string;
  '@_MarkerStyle'?: string;
  '@_Kind'?: string; // Added for list Kind
  '#text'?: string;
}

export class XamlToMarkdownConverter {
  private options: XamlConverterOptions;
  private parser: XMLParser;
  private unicodeCleaner: UnicodeCleaner;

  constructor(options: Partial<XamlConverterOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      removeNSPrefix: true,
      parseAttributeValue: false,
      trimValues: false,
      processEntities: true,
      preserveOrder: true,
      allowBooleanAttributes: true,
    });
    this.unicodeCleaner = new UnicodeCleaner();
  }

  private isXamlElement(value: unknown): value is XamlElement {
    return value !== null && typeof value === 'object';
  }

  public convertToMarkdown(xamlContent: string): string {
    try {
      if (!xamlContent || xamlContent.trim() === '') {
        return '';
      }

      // Clean and prepare Rich Text (XAML) content
      const cleanedXaml = this.cleanXamlContent(xamlContent);
      if (!cleanedXaml.trim()) {
        return '';
      }

      // Wrap in Root to handle multiple roots
      const wrappedXaml = `<Root>${cleanedXaml}</Root>`;

      // Parse Rich Text (XAML) content
      const parsed = this.parser.parse(wrappedXaml);
      
      // Convert to markdown
      const markdown = this.processElement(parsed);
      
      // Clean up and normalize
      return this.normalizeMarkdown(markdown);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.warn(`XAML parsing failed: ${errorMessage}`);
      if (this.options.ignoreUnknownElements) {
        const fallbackResult = this.extractPlainText(xamlContent);
        console.warn(`Falling back to plain text extraction. Result length: ${fallbackResult.length} chars`);
        return '*[Warning: Some formatting lost due to complex content]*\n\n' + fallbackResult;
      }
      throw new Error(`Rich Text (XAML) conversion failed: ${error}`);
    }
  }

  private cleanXamlContent(xaml: string): string {
    // Remove XML declarations and namespaces
    let cleaned = xaml.replace(/<\?xml[^>]*\?>/gi, '');
    cleaned = cleaned.replace(/xmlns[^=]*="[^"]*"/gi, '');
   
    return cleaned.trim();
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private processElement(element: any): string {
    if (!element) return '';

    if (typeof element === 'string') {
      return element;
    }

    if (Array.isArray(element)) {
      let result = '';
      let i = 0;
      while (i < element.length) {
        let current = element[i];
        let codeLines: string[] = [];
        while (i < element.length && this.isParagraph(current) && this.isCodeParagraph(current)) {
          const content = this.processParagraph(current, true);
          if (content.trim()) {
            codeLines.push(content.trim());
          }
          i++;
          if (i < element.length) {
            current = element[i];
          }
        }
        if (codeLines.length > 0) {
          if (codeLines.length === 1) {
            result += '`' + codeLines[0] + '`  \n';
          } else {
            result += '```\n' + codeLines.join('\n') + '\n```\n\n';
          }
        } else {
          result += this.processElement(current);
          i++;
        }
      }
      return result;
    }

    // Handle preserveOrder format - element is an array of objects
    let result = '';

    for (const [tagName, content] of Object.entries(element)) {
      if (tagName === ':@') {
        // Skip attributes - they're handled by individual processors
        continue;
      }

      switch (tagName.toLowerCase()) {
        case 'root':
          // Handle the Root wrapper - process its content array
          if (Array.isArray(content)) {
            for (const childElement of content) {
              result += this.processElement(childElement);
            }
          } else {
            result += this.processElement(content);
          }
          break;
        case 'section':
          result += this.processSection(element);
          break;
        case 'paragraph':
          result += this.processParagraph(element);
          break;
        case 'run':
          result += this.processRun(element);
          break;
        case 'span':
          result += this.processSpan(element);
          break;
        case 'list':
          result += this.processList(element);
          break;
        case 'table':
          result += this.processTable(element);
          break;
        case 'hyperlink':
          result += this.processHyperlink(element);
          break;
        case 'urilink':
          result += this.processHyperlink(element);
          break;
        default:
          if (Array.isArray(content)) {
            // Process array of child elements
            result += this.processElement(content);
          } else {
            result += this.processElement(content);
          }
          break;
      }
    }

    return result;
  }

  private processSection(section: XamlElement | XamlElement[]): string {
    const sections = Array.isArray(section) ? section : [section];
    let result = '';

    for (const sect of sections) {
      if (!sect) continue;

      const borderThickness = sect['@_BorderThickness'] || '';
      const fontFamily = sect['@_FontFamily'] || '';
      const content = this.extractElementContent(sect);

      // Check for horizontal rule
      if (this.isHorizontalRule(borderThickness, content)) {
        result += '---\n\n';
        continue;
      }

      // Check for block quote
      if (this.isBlockQuote(borderThickness)) {
        const quotedLines = content.split('\n')
          .map(line => line.trim() ? '> ' + line : '>')
          .join('\n');
        result += quotedLines + '\n\n';
        continue;
      }

      // Check for code block
      if (this.isMonospaceFont(fontFamily)) {
        const language = sect['@_Tag'] || '';
        result += '```' + language + '\n' + content + '\n```\n\n';
        continue;
      }

      // Regular section content
      result += content + '\n\n';
    }

    return result;
  }

  private processParagraph(paragraph: XamlElement | XamlElement[], skipNewline = false): string {
    const paragraphs = Array.isArray(paragraph) ? paragraph : [paragraph];
    let result = '';

    for (const para of paragraphs) {
      if (!para) continue;

      // Handle preserveOrder structure - get Paragraph content array
      const paragraphContent = para.Paragraph || para.paragraph || [];
      
      // Process paragraph content (array of child elements)
      let content = '';
      if (Array.isArray(paragraphContent)) {
        content = this.processElement(paragraphContent);
      } else {
        content = this.extractElementContent(para);
      }

      if (skipNewline) {
        result += content;
      } else {
        if (!content.trim()) {
          result += '\n\n';
          continue;
        }

        const headingLevel = this.getHeadingLevelFromParagraph(para);
        if (headingLevel > 0) {
          result += '#'.repeat(headingLevel) + ' ' + content.trim() + '\n';
        } else {
          result += content.trimEnd() + '  \n';
        }
      }
    }

    return result;
  }

  private processRun(run: XamlElement | XamlElement[]): string {
    const runs = Array.isArray(run) ? run : [run];
    let result = '';

    for (const r of runs) {
      if (!r) continue;

      // Get attributes from the Run element
      const attrs = this.getAttributes(r);
      
      // Get text from attributes
      let text = attrs['@_Text'] || '';
      
      // Fallback to direct text content
      if (!text) {
        text = r['#text'] || '';
      }
      
      if (!text) continue;

      // Decode entities after parsing
      text = this.decodeEntities(text);

      // Check if this is monospace font (code) - preserve as-is without link conversion
      const fontFamily = attrs['@_FontFamily'] || '';
      if (this.isMonospaceFont(fontFamily)) {
        // For code context, preserve existing markdown syntax
        result += '`' + text + '`';
        continue;
      }

      // Check if text already contains markdown syntax - preserve it
      if (this.hasMarkdownLinkSyntax(text)) {
        result += text;
        continue;
      }

      // Apply inline formatting for non-code, non-markdown content
      text = this.applyInlineFormatting(text, r);
      result += text;
    }

    return result;
  }

  // New helper method to decode entities
  private decodeEntities(text: string): string {
    return text
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)));
  }

  private processSpan(span: XamlElement | XamlElement[]): string {
    const spans = Array.isArray(span) ? span : [span];
    let result = '';

    for (const s of spans) {
      if (!s) continue;

      let content = this.extractElementContent(s);
      // Decode entities after parsing
      content = this.decodeEntities(content);
      const formatted = this.applyInlineFormatting(content, s);
      result += formatted;
    }

    return result;
  }

  private processList(list: XamlElement | XamlElement[]): string {
    const lists = Array.isArray(list) ? list : [list];
    let result = '';

    for (const l of lists) {
      if (!l) continue;

      // Handle preserveOrder attribute structure
      const attrs = l[':@'] || l;
      const markerStyle = attrs['@_Kind'] || attrs['@_MarkerStyle'] || 'Disc';
      const isOrdered = markerStyle.toLowerCase() === 'decimal';
      
      result += this.processListItems(l, isOrdered) + '\n';
    }

    return result;
  }

  private processListItems(list: XamlElement, isOrdered: boolean): string {
    let result = '';
    let counter = 1;

    // Extract list items
    const listItems = this.extractListItems(list);
    
    for (const item of listItems) {
      const content = this.extractElementContent(item).trim();
      if (content) {
        const marker = isOrdered ? `${counter}. ` : '- ';
        result += marker + content + '\n';
        counter++;
      }
    }

    return result;
  }

  private processTable(table: XamlElement | XamlElement[]): string {
    const tables = Array.isArray(table) ? table : [table];
    let result = '';

    for (const t of tables) {
      if (!t) continue;

      const rows = this.extractTableRows(t);
      if (rows.length === 0) continue;

      // Process header row
      if (rows.length > 0) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const headerCells = this.extractTableCells(rows[0] as any);
        const headerRow = '| ' + headerCells.join(' | ') + ' |';
        const separatorRow = '| ' + headerCells.map(() => '---').join(' | ') + ' |';
        
        result += headerRow + '\n' + separatorRow + '\n';

        // Process data rows
        for (let i = 1; i < rows.length; i++) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const cells = this.extractTableCells(rows[i] as any);
          const dataRow = '| ' + cells.join(' | ') + ' |';
          result += dataRow + '\n';
        }
      }

      result += '\n';
    }

    return result;
  }

  // New helper methods to detect existing markdown syntax
  private hasMarkdownLinkSyntax(text: string): boolean {
    // Check for markdown link patterns: [text](url) or [text][ref] or ![alt](url)
    const linkPatterns = [
      /\[([^\]]*)\]\(([^)]+)\)/,  // [text](url)
      /\[([^\]]*)\]\[([^\]]*)\]/,  // [text][ref]
      /!\[([^\]]*)\]\(([^)]+)\)/,  // ![alt](url)
      /!\[([^\]]*)\]\[([^\]]*)\]/   // ![alt][ref]
    ];
    
    return linkPatterns.some(pattern => pattern.test(text));
  }

  private hasMarkdownImageSyntax(text: string): boolean {
    // Check for markdown image patterns: ![alt](url) or ![alt][ref]
    const imagePatterns = [
      /!\[([^\]]*)\]\(([^)]+)\)/,  // ![alt](url)
      /!\[([^\]]*)\]\[([^\]]*)\]/   // ![alt][ref]
    ];
    
    return imagePatterns.some(pattern => pattern.test(text));
  }

  private isInCodeContext(element: XamlElement): boolean {
    const attrs = this.getAttributes(element);
    const fontFamily = attrs['@_FontFamily'] || '';
    return this.isMonospaceFont(fontFamily);
  }

  private processHyperlink(hyperlink: XamlElement | XamlElement[]): string {
    const hyperlinks = Array.isArray(hyperlink) ? hyperlink : [hyperlink];
    let result = '';

    for (const link of hyperlinks) {
      if (!link) continue;

      // Get attributes - handle preserveOrder structure
      const attrs = link[':@'] || link;
      const url = attrs['@_Uri'] || attrs['@_NavigateUri'] || '';

      // Extract content - process children
      let text = '';
      if (Array.isArray(link)) {
        text = this.processElement(link);
      } else {
        // For object structure, process non-attribute keys
        for (const [childKey, childValue] of Object.entries(link)) {
          if (childKey !== ':@') {
            text += this.processElement(childValue);
          }
        }
      }

      text = text.trim();
      if (!text) continue;

      // Check if this is in code context
      if (this.isInCodeContext(link)) {
        // Preserve code context
        result += text;
      } else if (url) {
        if (this.hasMarkdownLinkSyntax(text)) {
          result += text;
        } else {
          result += `[${text}](${url})`;
        }
      } else {
        result += text;
      }
    }

    return result;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private getAttributes(element: XamlElement): any {
    // Handle preserveOrder attribute structure
    if (element[':@']) {
      return element[':@'];
    }
    
    // Fallback to old structure for backward compatibility
    return element;
  }

  private applyInlineFormatting(text: string, element: XamlElement): string {
    if (!text) return '';

    // Clean Unicode issues first
    const cleanedText = this.unicodeCleaner.cleanXamlText(text);

    // Handle whitespace around formatting
    const leadingSpace = cleanedText.match(/^\s*/)?.[0] || '';
    const trailingSpace = cleanedText.match(/\s*$/)?.[0] || '';
    let formatted = cleanedText.trim();

    // If the text is only whitespace, return it as is.
    if (formatted === '') {
      return cleanedText;
    }

    // Get attributes using helper method
    const attrs = this.getAttributes(element);

    // Check for inline code (monospace font)
    const fontFamily = attrs['@_FontFamily'] || '';
    if (this.isMonospaceFont(fontFamily)) {
      formatted = '`' + formatted + '`';
      return leadingSpace + formatted + trailingSpace; // Code formatting takes precedence
    }

    // Apply text formatting in order: bold, italic, underline, strikethrough, small caps, sub/superscript, highlight
    let needsBold = false;
    let needsItalic = false;
    let needsUnderline = false;
    let needsStrikethrough = false;
    let needsSmallCaps = false;
    let needsSubscript = false;
    let needsSuperscript = false;
    let needsHighlight = false;

    // Check for bold
    const fontBold = attrs['@_FontBold'] || '';
    if (fontBold.toLowerCase() === 'true') {
      needsBold = true;
    }

    // Check for italic
    const fontItalic = attrs['@_FontItalic'] || '';
    if (fontItalic.toLowerCase() === 'true') {
      needsItalic = true;
    }

    // Check for underline
    const hasUnderline = attrs['@_HasUnderline'] || '';
    if (hasUnderline.toLowerCase() === 'true') {
      needsUnderline = true;
    }

    // Check for strikethrough
    const hasStrikethrough = attrs['@_HasStrikethrough'] || '';
    if (hasStrikethrough.toLowerCase() === 'true') {
      needsStrikethrough = true;
    }

    // Check for small caps
    const fontCapitals = attrs['@_FontCapitals'] || '';
    if (fontCapitals.toLowerCase() === 'smallcaps') {
      needsSmallCaps = true;
    }

    // Check for subscript/superscript
    const fontVariant = attrs['@_FontVariant'] || '';
    if (fontVariant.toLowerCase() === 'subscript') {
      needsSubscript = true;
    } else if (fontVariant.toLowerCase() === 'superscript') {
      needsSuperscript = true;
    }

    // Check for background color highlight
    const backgroundColor = attrs['@_BackgroundColor'] || '';
    if (backgroundColor.trim() !== '') {
      needsHighlight = true;
    }

    // Apply formatting in the correct order (innermost to outermost)
    if (needsSubscript) {
      formatted = '<sub>' + formatted + '</sub>';
    } else if (needsSuperscript) {
      formatted = '<sup>' + formatted + '</sup>';
    }

    if (needsSmallCaps) {
      formatted = '<small>' + formatted.toUpperCase() + '</small>';
    }

    if (needsStrikethrough) {
      formatted = '~~' + formatted + '~~';
    }

    if (needsUnderline) {
      formatted = '<u>' + formatted + '</u>';
    }

    if (needsItalic) {
      formatted = '*' + formatted + '*';
    }

    if (needsBold) {
      formatted = '**' + formatted + '**';
    }

    if (needsHighlight) {
      formatted = '==' + formatted + '==';
    }

    return leadingSpace + formatted + trailingSpace;
  }

  private extractElementContent(element: XamlElement): string {
    if (!element) return '';

    if (Array.isArray(element)) {  // Added explicit array handling
      let content = '';
      for (const item of element) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        content += this.extractElementContent(item as any);
      }
      return content;
    }

    let content = '';

    // Direct text - clean Unicode issues
    if (element['#text']) {
      content += this.unicodeCleaner.cleanXamlText(element['#text']);
    }

    // Text attribute - clean Unicode issues
    if (element['@_Text']) {
      content += this.unicodeCleaner.cleanXamlText(element['@_Text']);
    }

    // Process child elements
    for (const [key, value] of Object.entries(element)) {
      if (key.startsWith('@_') || key === '#text') continue;

      switch (key.toLowerCase()) {
        case 'run':
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          content += this.processRun(value as any);
          break;
        case 'span':
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          content += this.processSpan(value as any);
          break;
        case 'hyperlink':
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          content += this.processHyperlink(value as any);
          break;
        case 'urilink':  // Add this case
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          content += this.processHyperlink(value as any);
          break;
        case 'list':
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          content += this.processList(value as any);
          break;
        case 'table':
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          content += this.processTable(value as any);
          break;
        default:
          if (typeof value === 'object' && value) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            content += this.extractElementContent(value as any);
          }
          break;
      }
    }

    return content;
  }

  private getHeadingLevel(fontSize: number | null): number {
    if (fontSize === null) return 0;
    const index = this.options.headingSizes.indexOf(fontSize);
    return index >= 0 ? index + 1 : 0;
  }

  private getHeadingLevelFromParagraph(paragraph: XamlElement): number {
    // Check if this paragraph contains only Run elements with heading-level font sizes
    const runs = this.extractRunsFromParagraph(paragraph);
    if (runs.length === 0) return 0;

    // Get all font sizes from runs
    const fontSizes = runs.map(run => {
      const attrs = this.getAttributes(run);
      const fontSize = attrs['@_FontSize'] ? parseFloat(attrs['@_FontSize']) : null;
      return fontSize;
    }).filter(size => size !== null);

    // If no font sizes found, not a heading
    if (fontSizes.length === 0) return 0;

    // Check if all font sizes are the same and correspond to a heading level
    const firstFontSize = fontSizes[0];
    const allSameSize = fontSizes.every(size => size === firstFontSize);
    
    if (allSameSize && firstFontSize !== undefined) {
      return this.getHeadingLevel(firstFontSize);
    }

    return 0;
  }

  private extractRunsFromParagraph(paragraph: XamlElement): XamlElement[] {
    const runs: XamlElement[] = [];

    // Handle preserveOrder structure - paragraph content is an array
    const paragraphContent = paragraph.Paragraph || paragraph.paragraph || [];
    
    if (Array.isArray(paragraphContent)) {
      for (const item of paragraphContent) {
        if (item && typeof item === 'object') {
          // Check if this item is a Run element
          if (item.Run || item.run) {
            runs.push(item);
          }
        }
      }
    }

    // Fallback to old structure
    for (const [key, value] of Object.entries(paragraph)) {
      if (key.toLowerCase() === 'run') {
        if (Array.isArray(value)) {
          runs.push(...value.filter(v => v && typeof v === 'object'));
        } else if (value && typeof value === 'object') {
          runs.push(value as XamlElement);
        }
      }
    }

    return runs;
  }

  private isHorizontalRule(borderThickness: string, content: string): boolean {
    if (!borderThickness || content.trim()) return false;

    const parts = borderThickness.split(',').map(s => parseFloat(s.trim()));
    if (parts.length !== 4) return false;

    // Top border should match thickness, others should be 0
    return parts[1] === this.options.horizontalLineThickness && 
           parts[0] === 0 && parts[2] === 0 && parts[3] === 0;
  }

  private isBlockQuote(borderThickness: string): boolean {
    if (!borderThickness) return false;

    const parts = borderThickness.split(',').map(s => parseFloat(s.trim()));
    if (parts.length !== 4) return false;

    // Left border should match thickness, others should be 0
    return parts[0] === this.options.blockQuoteLineThickness && 
           parts[1] === 0 && parts[2] === 0 && parts[3] === 0;
  }

  private isMonospaceFont(fontFamily: string): boolean {
    if (!fontFamily) return false;
    return fontFamily.toLowerCase().includes(this.options.monospaceFontName.toLowerCase());
  }

  private extractListItems(list: XamlElement): XamlElement[] {
    const items: XamlElement[] = [];

    // Handle reconstructed structure from preserveOrder
    if (list.List && Array.isArray(list.List)) {
      for (const item of list.List) {
        if (item.ListItem) {
          if (Array.isArray(item.ListItem)) {
            items.push(...item.ListItem);
          } else {
            items.push(item.ListItem);
          }
        }
      }
    }
    // Handle preserveOrder structure - list content is an array
    else if (Array.isArray(list)) {
      for (const item of list) {
        if (item.ListItem) {
          if (Array.isArray(item.ListItem)) {
            items.push(...item.ListItem);
          } else {
            items.push(item.ListItem);
          }
        }
      }
    } else {
      // Handle old structure
      for (const [key, value] of Object.entries(list)) {
        if (key.toLowerCase() === 'listitem') {
          if (Array.isArray(value)) {
            items.push(...value);
          } else {
            items.push(value);
          }
        }
      }
    }

    return items;
  }

  private extractTableRows(table: XamlElement): XamlElement[] {
    const rows: XamlElement[] = [];

    for (const [key, value] of Object.entries(table)) {
      if (key.toLowerCase() === 'tablerowgroup') {
        const rowGroups = Array.isArray(value) ? value : [value];
        for (const rowGroup of rowGroups) {
          if (rowGroup) {
            for (const [rKey, rValue] of Object.entries(rowGroup)) {
              if (rKey.toLowerCase() === 'tablerow') {
                if (Array.isArray(rValue)) {
                  rows.push(...rValue as XamlElement[]);
                } else {
                  rows.push(rValue as XamlElement);
                }
              }
            }
          }
        }
      } else if (key.toLowerCase() === 'tablerow') {
        if (Array.isArray(value)) {
          rows.push(...value as XamlElement[]);
        } else {
          rows.push(value as XamlElement);
        }
      }
    }

    return rows;
  }

  private extractTableCells(row: XamlElement): string[] {
    const cells: string[] = [];

    for (const [key, value] of Object.entries(row)) {
      if (key.toLowerCase() === 'tablecell') {
        const cellArray = Array.isArray(value) ? value : [value];
        for (const cell of cellArray) {
          if (cell && typeof cell === 'object') {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const content = this.extractElementContent(cell as any).trim();
            cells.push(content || '');
          }
        }
      }
    }

    return cells;
  }

  private extractPlainText(xamlContent: string): string {
    const textMatches = xamlContent.match(/Text="([^"]*?)"/g) || [];
    const plainTexts = textMatches.map(match => {
      let text = match.replace(/Text="([^"]*?)"/, '$1');
      text = this.decodeEntities(text);
      return this.unicodeCleaner.cleanXamlText(text);
    });

    let result = plainTexts.join('\n').trim();

    // Detect and format simple structures
    result = result.replace(/### (.+)/g, '\n\n### $1\n\n');
    result = result.replace(/\b[0-9]+\. /g, '\n$0');
    result = result.replace(/\b\* /g, '\n$0');
    result = result.replace(/\b- /g, '\n$0');

    return result;
  }

  private normalizeMarkdown(markdown: string): string {
    return markdown
      .replace(/\n{3,}/g, '\n\n')
      .replace(/^\s+|\s+$/g, '')
      .replace(/[ \t]{3,}$/gm, '  ')
      .replace(/[ \t]+$/gm, (match) => match === '  ' ? '  ' : '');
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private isParagraph(item: any): boolean {
    return !!item && !!item.Paragraph;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private isCodeParagraph(paragraph: any): boolean {
    const runs = this.extractRunsFromParagraph(paragraph);
    if (runs.length === 0) return false;

    return runs.every(run => {
      const attrs = this.getAttributes(run);
      const font = attrs['@_FontFamily'] || '';
      return this.isMonospaceFont(font);
    });
  }
} 