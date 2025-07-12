import { XMLParser } from 'fast-xml-parser';
import { cleanXamlText, UnicodeCleaner } from './unicode-cleaner.js';

export interface XamlConverterOptions {
  /** Font sizes that correspond to heading levels [H1, H2, H3, H4, H5, H6, H7] */
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

export const DEFAULT_OPTIONS: XamlConverterOptions = {
  headingSizes: [22, 20, 18, 16, 14, 13],
  monospaceFontName: 'Courier New',
  blockQuoteLineThickness: 3,
  horizontalLineThickness: 3,
  ignoreUnknownElements: true,
};

interface XamlElement {
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
      trimValues: false,  // Changed to false to preserve spaces in Run Text
      processEntities: true,
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

      // Parse Rich Text (XAML) content
      const parsed = this.parser.parse(cleanedXaml);
      
      // Convert to markdown
      const markdown = this.processElement(parsed);
      
      // Clean up and normalize
      return this.normalizeMarkdown(markdown);
    } catch (error) {
      if (this.options.ignoreUnknownElements) {
        // Fallback to text extraction
        return this.extractPlainText(xamlContent);
      }
      throw new Error(`Rich Text (XAML) conversion failed: ${error}`);
    }
  }

  private cleanXamlContent(xaml: string): string {
    // Remove XML declarations and namespaces
    let cleaned = xaml.replace(/<\?xml[^>]*\?>/gi, '');
    cleaned = cleaned.replace(/xmlns[^=]*="[^"]*"/gi, '');
    
    // Decode HTML entities
    cleaned = cleaned
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&amp;/g, '&')
      .replace(/&quot;/g, '"')
      .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code)));

    return cleaned.trim();
  }

  private processElement(element: any): string {
    if (!element) return '';

    if (typeof element === 'string') {
      return element;
    }

    let result = '';

    for (const [tagName, content] of Object.entries(element)) {
      if (tagName.startsWith('@_') || tagName === '#text') {
        continue;
      }

      switch (tagName.toLowerCase()) {
        case 'section':
          result += this.processSection(content as any);
          break;
        case 'paragraph':
          result += this.processParagraph(content as any);
          break;
        case 'run':
          result += this.processRun(content as any);
          break;
        case 'span':
          result += this.processSpan(content as any);
          break;
        case 'list':
          result += this.processList(content as any);
          break;
        case 'table':
          result += this.processTable(content as any);
          break;
        case 'hyperlink':
          result += this.processHyperlink(content as any);
          break;
        default:
          if (Array.isArray(content)) {
            for (const item of content) {
              result += this.processElement({ [tagName]: item });
            }
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

  private processParagraph(paragraph: XamlElement | XamlElement[]): string {
    const paragraphs = Array.isArray(paragraph) ? paragraph : [paragraph];
    let result = '';

    for (const para of paragraphs) {
      if (!para) continue;

      const content = this.extractElementContent(para);

      if (!content.trim()) {
        result += '\n';
        continue;
      }

      // Check if this paragraph should be a heading based on its Run elements
      const headingLevel = this.getHeadingLevelFromParagraph(para);
      if (headingLevel > 0) {
        result += '#'.repeat(headingLevel) + ' ' + content.trim() + '\n\n';
      } else {
        result += content.trim() + '\n\n';
      }
    }

    return result;
  }

  private processRun(run: XamlElement | XamlElement[]): string {
    const runs = Array.isArray(run) ? run : [run];
    let result = '';

    for (const r of runs) {
      if (!r) continue;

      let text = r['@_Text'] || r['#text'] || '';
      if (!text) continue;

      // Apply inline formatting
      text = this.applyInlineFormatting(text, r);
      result += text;
    }

    return result;
  }

  private processSpan(span: XamlElement | XamlElement[]): string {
    const spans = Array.isArray(span) ? span : [span];
    let result = '';

    for (const s of spans) {
      if (!s) continue;

      const content = this.extractElementContent(s);
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

      const markerStyle = l['@_MarkerStyle'] || 'Disc';
      const isOrdered = markerStyle.toLowerCase().includes('decimal');
      
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
        const headerCells = this.extractTableCells(rows[0] as any);
        const headerRow = '| ' + headerCells.join(' | ') + ' |';
        const separatorRow = '| ' + headerCells.map(() => '---').join(' | ') + ' |';
        
        result += headerRow + '\n' + separatorRow + '\n';

        // Process data rows
        for (let i = 1; i < rows.length; i++) {
          const cells = this.extractTableCells(rows[i] as any);
          const dataRow = '| ' + cells.join(' | ') + ' |';
          result += dataRow + '\n';
        }
      }

      result += '\n';
    }

    return result;
  }

  private processHyperlink(hyperlink: XamlElement | XamlElement[]): string {
    const hyperlinks = Array.isArray(hyperlink) ? hyperlink : [hyperlink];
    let result = '';

    for (const link of hyperlinks) {
      if (!link) continue;

      const text = this.extractElementContent(link);
      const url = link['@_NavigateUri'] || '';
      
      if (url) {
        result += `[${text}](${url})`;
      } else {
        result += text;
      }
    }

    return result;
  }

  private applyInlineFormatting(text: string, element: XamlElement): string {
    if (!text) return '';

    // Clean Unicode issues first
    let formatted = this.unicodeCleaner.cleanXamlText(text);

    // Check for inline code (monospace font)
    const fontFamily = element['@_FontFamily'] || '';
    if (this.isMonospaceFont(fontFamily)) {
      formatted = '`' + formatted + '`';
      return formatted; // Code formatting takes precedence
    }

    // Apply text formatting in order: bold, italic, underline, strikethrough, small caps, sub/superscript
    let needsBold = false;
    let needsItalic = false;
    let needsUnderline = false;
    let needsStrikethrough = false;
    let needsSmallCaps = false;
    let needsSubscript = false;
    let needsSuperscript = false;

    // Check for bold
    const fontBold = element['@_FontBold'] || '';
    if (fontBold.toLowerCase() === 'true') {
      needsBold = true;
    }

    // Check for italic
    const fontItalic = element['@_FontItalic'] || '';
    if (fontItalic.toLowerCase() === 'true') {
      needsItalic = true;
    }

    // Check for underline
    const hasUnderline = element['@_HasUnderline'] || '';
    if (hasUnderline.toLowerCase() === 'true') {
      needsUnderline = true;
    }

    // Check for strikethrough
    const hasStrikethrough = element['@_HasStrikethrough'] || '';
    if (hasStrikethrough.toLowerCase() === 'true') {
      needsStrikethrough = true;
    }

    // Check for small caps
    const fontCapitals = element['@_FontCapitals'] || '';
    if (fontCapitals.toLowerCase() === 'smallcaps') {
      needsSmallCaps = true;
    }

    // Check for subscript/superscript
    const fontVariant = element['@_FontVariant'] || '';
    if (fontVariant.toLowerCase() === 'subscript') {
      needsSubscript = true;
    } else if (fontVariant.toLowerCase() === 'superscript') {
      needsSuperscript = true;
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

    return formatted;
  }

  private extractElementContent(element: XamlElement): string {
    if (!element) return '';

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
          content += this.processRun(value as any);
          break;
        case 'span':
          content += this.processSpan(value as any);
          break;
        case 'hyperlink':
          content += this.processHyperlink(value as any);
          break;
        default:
          if (typeof value === 'object' && value) {
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
      const fontSize = run['@_FontSize'] ? parseFloat(run['@_FontSize']) : null;
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

    for (const [key, value] of Object.entries(list)) {
      if (key.toLowerCase() === 'listitem') {
        if (Array.isArray(value)) {
          items.push(...value);
        } else {
          items.push(value);
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
            const content = this.extractElementContent(cell as any).trim();
            cells.push(content || '');
          }
        }
      }
    }

    return cells;
  }

  private extractPlainText(xamlContent: string): string {
    // Fallback text extraction using regex
    const textMatches = xamlContent.match(/Text="([^"]*?)"/g) || [];
    const plainTexts = textMatches.map(match => 
      this.unicodeCleaner.cleanXamlText(match.replace(/Text="([^"]*?)"/, '$1'))
    );

    // Extract content between tags
    const contentMatches = xamlContent.match(/>([^<]+)</g) || [];
    const contents = contentMatches.map(match => 
      this.unicodeCleaner.cleanXamlText(match.replace(/^>([^<]+)<$/, '$1').trim())
    ).filter(text => text && !text.startsWith('<?') && !text.startsWith('<!--'));

    return [...plainTexts, ...contents].join(' ').trim();
  }

  private normalizeMarkdown(markdown: string): string {
    return markdown
      .replace(/\n{3,}/g, '\n\n') // Max 2 consecutive newlines
      .replace(/^\s+|\s+$/g, '') // Trim start/end
      .replace(/\s+$/gm, ''); // Trim line endings
  }
} 