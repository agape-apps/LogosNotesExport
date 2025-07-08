import { XMLParser } from 'fast-xml-parser';

/**
 * Configuration options for XAML to Markdown conversion
 */
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

/**
 * Default conversion options based on the documentation
 */
export const DEFAULT_OPTIONS: XamlConverterOptions = {
  headingSizes: [24, 20, 18, 16, 15, 14, 13],
  monospaceFontName: 'Courier New',
  blockQuoteLineThickness: 3,
  horizontalLineThickness: 3,
  ignoreUnknownElements: true,
};

/**
 * Interface for parsed XAML elements
 */
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
  '#text'?: string;
}

/**
 * XAML to Markdown converter
 */
export class XamlToMarkdownConverter {
  private options: XamlConverterOptions;
  private parser: XMLParser;

  constructor(options: Partial<XamlConverterOptions> = {}) {
    this.options = { ...DEFAULT_OPTIONS, ...options };
    this.parser = new XMLParser({
      ignoreAttributes: false,
      attributeNamePrefix: '@_',
      textNodeName: '#text',
      removeNSPrefix: true,
      parseAttributeValue: false,
      trimValues: true,
    });
  }

  /**
   * Convert XAML content to Markdown
   */
  public convertToMarkdown(xamlContent: string): string {
    try {
      if (!xamlContent || xamlContent.trim() === '') {
        return '';
      }

      // Parse XAML content
      const parsed = this.parser.parse(xamlContent);
      
      // Convert the parsed content to markdown
      const markdown = this.processElement(parsed);
      
      // Clean up and normalize the output
      return this.normalizeMarkdown(markdown);
    } catch (error) {
      if (process.env.DEBUG) {
        console.error('Error converting XAML to Markdown:', error);
        console.error('XAML content sample:', xamlContent.substring(0, 200));
      }
      
      if (this.options.ignoreUnknownElements) {
        // Try to extract plain text as fallback
        const fallbackText = this.extractPlainText(xamlContent);
        if (fallbackText.trim()) {
          return fallbackText;
        }
      }
      throw error;
    }
  }

  /**
   * Process a parsed XAML element and convert to markdown
   */
  private processElement(element: any): string {
    if (!element) return '';

    // Handle text content
    if (typeof element === 'string') {
      return element;
    }

    let result = '';

    // Process different XAML elements
    for (const [tagName, content] of Object.entries(element)) {
      if (tagName.startsWith('@_') || tagName === '#text') {
        continue; // Skip attributes and direct text (handled elsewhere)
      }

      switch (tagName.toLowerCase()) {
        case 'paragraph':
          result += this.processParagraph(content as any);
          break;
        case 'section':
          result += this.processSection(content as any);
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
        case 'listitem':
          result += this.processListItems(content as any, false);
          break;
        case 'table':
          result += this.processTable(content as any);
          break;
        case 'hyperlink':
          result += this.processHyperlink(content as any);
          break;
        default:
          // Handle arrays of elements
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

  /**
   * Process Paragraph elements
   */
  private processParagraph(paragraph: XamlElement | XamlElement[]): string {
    const paragraphs = Array.isArray(paragraph) ? paragraph : [paragraph];
    let result = '';

    for (const para of paragraphs) {
      if (!para) continue;

      const fontSize = para['@_FontSize'] ? parseFloat(para['@_FontSize']) : null;
      const content = this.extractElementContent(para);

      if (!content.trim()) {
        result += '\n'; // Empty paragraph creates line break
        continue;
      }

      // Check if this is a heading based on font size
      const headingLevel = this.getHeadingLevel(fontSize);
      if (headingLevel > 0) {
        result += '#'.repeat(headingLevel) + ' ' + content.trim() + '\n\n';
      } else {
        result += content.trim() + '\n\n';
      }
    }

    return result;
  }

  /**
   * Process Section elements (for quotes, code blocks, horizontal rules)
   */
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
        const quotedContent = content.split('\n')
          .map(line => line.trim() ? '> ' + line : '>')
          .join('\n');
        result += quotedContent + '\n\n';
        continue;
      }

      // Check for code block
      if (this.isCodeBlock(fontFamily)) {
        const language = sect['@_Tag'] || '';
        result += '```' + language + '\n' + content + '\n```\n\n';
        continue;
      }

      // Regular section content
      result += content + '\n\n';
    }

    return result;
  }

  /**
   * Process Run elements (inline text with potential formatting)
   */
  private processRun(run: XamlElement | XamlElement[]): string {
    const runs = Array.isArray(run) ? run : [run];
    let result = '';

    for (const r of runs) {
      if (!r) continue;

      let text = r['@_Text'] || r['#text'] || '';
      if (!text) continue;

      // Apply formatting
      text = this.applyInlineFormatting(text, r);
      result += text;
    }

    return result;
  }

  /**
   * Process Span elements (similar to Run)
   */
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

  /**
   * Process List elements
   */
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

  /**
   * Process individual list items
   */
  private processListItems(list: XamlElement, isOrdered: boolean): string {
    let result = '';
    let counter = 1;

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

  /**
   * Process Table elements
   */
  private processTable(table: XamlElement | XamlElement[]): string {
    const tables = Array.isArray(table) ? table : [table];
    let result = '';

    for (const t of tables) {
      if (!t) continue;

      // Extract table rows
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

  /**
   * Process Hyperlink elements
   */
  private processHyperlink(hyperlink: XamlElement | XamlElement[]): string {
    const hyperlinks = Array.isArray(hyperlink) ? hyperlink : [hyperlink];
    let result = '';

    for (const link of hyperlinks) {
      if (!link) continue;

      const text = this.extractElementContent(link);
      const url = link['@_NavigateUri'] || link['@_Href'] || '';
      
      if (url) {
        result += `[${text}](${url})`;
      } else {
        result += text;
      }
    }

    return result;
  }

  /**
   * Apply inline formatting (bold, italic, code) to text
   */
  private applyInlineFormatting(text: string, element: XamlElement): string {
    if (!text) return '';

    let formatted = text;

    // Check for inline code (monospace font)
    const fontFamily = element['@_FontFamily'] || '';
    if (this.isMonospaceFont(fontFamily)) {
      formatted = '`' + formatted + '`';
    } else {
      // Check for bold
      const fontWeight = element['@_FontWeight'] || '';
      if (fontWeight.toLowerCase().includes('bold')) {
        formatted = '**' + formatted + '**';
      }

      // Check for italic
      const fontStyle = element['@_FontStyle'] || '';
      if (fontStyle.toLowerCase().includes('italic')) {
        formatted = '*' + formatted + '*';
      }
    }

    return formatted;
  }

  /**
   * Extract content from an element (text, runs, spans, etc.)
   */
  private extractElementContent(element: XamlElement): string {
    if (!element) return '';

    let content = '';

    // Direct text content
    if (element['#text']) {
      content += element['#text'];
    }

    // Text attribute
    if (element['@_Text']) {
      content += element['@_Text'];
    }

    // Process child elements
    for (const [key, value] of Object.entries(element)) {
      if (key.startsWith('@_') || key === '#text') continue;

      if (key.toLowerCase() === 'run') {
        content += this.processRun(value as any);
      } else if (key.toLowerCase() === 'span') {
        content += this.processSpan(value as any);
      } else if (key.toLowerCase() === 'hyperlink') {
        content += this.processHyperlink(value as any);
      } else if (typeof value === 'object' && value) {
        content += this.extractElementContent(value as any);
      }
    }

    return content;
  }

  /**
   * Get heading level based on font size
   */
  private getHeadingLevel(fontSize: number | null): number {
    if (fontSize === null) return 0;

    const index = this.options.headingSizes.indexOf(fontSize);
    return index >= 0 ? index + 1 : 0;
  }

  /**
   * Check if borderThickness indicates a horizontal rule
   */
  private isHorizontalRule(borderThickness: string, content: string): boolean {
    if (!borderThickness || content.trim()) return false;

    const parts = borderThickness.split(',').map(s => parseFloat(s.trim()));
    if (parts.length !== 4) return false;

    // Top border should match thickness, others should be 0
    return parts[1] === this.options.horizontalLineThickness && 
           parts[0] === 0 && parts[2] === 0 && parts[3] === 0;
  }

  /**
   * Check if borderThickness indicates a block quote
   */
  private isBlockQuote(borderThickness: string): boolean {
    if (!borderThickness) return false;

    const parts = borderThickness.split(',').map(s => parseFloat(s.trim()));
    if (parts.length !== 4) return false;

    // Left border should match thickness, others should be 0
    return parts[0] === this.options.blockQuoteLineThickness && 
           parts[1] === 0 && parts[2] === 0 && parts[3] === 0;
  }

  /**
   * Check if fontFamily indicates a code block
   */
  private isCodeBlock(fontFamily: string): boolean {
    return this.isMonospaceFont(fontFamily);
  }

  /**
   * Check if fontFamily is monospace
   */
  private isMonospaceFont(fontFamily: string): boolean {
    return fontFamily.toLowerCase().includes(this.options.monospaceFontName.toLowerCase());
  }

  /**
   * Extract list items from a list element
   */
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

  /**
   * Extract table rows from a table element
   */
  private extractTableRows(table: XamlElement): XamlElement[] {
    const rows: XamlElement[] = [];

    // Look for TableRowGroup -> TableRow pattern
    for (const [key, value] of Object.entries(table)) {
      if (key.toLowerCase() === 'tablerowgroup') {
        const rowGroups = Array.isArray(value) ? value : [value];
              for (const rowGroup of rowGroups) {
        if (rowGroup) {
          for (const [rKey, rValue] of Object.entries(rowGroup)) {
            if (rKey.toLowerCase() === 'tablerow') {
              if (Array.isArray(rValue)) {
                rows.push(...rValue);
              } else {
                rows.push(rValue);
              }
            }
          }
        }
      }
      } else if (key.toLowerCase() === 'tablerow') {
        if (Array.isArray(value)) {
          rows.push(...value);
        } else {
          rows.push(value);
        }
      }
    }

    return rows;
  }

  /**
   * Extract table cells from a table row
   */
  private extractTableCells(row: XamlElement): string[] {
    const cells: string[] = [];

    for (const [key, value] of Object.entries(row)) {
      if (key.toLowerCase() === 'tablecell') {
        const cellArray = Array.isArray(value) ? value : [value];
        for (const cell of cellArray) {
          const content = this.extractElementContent(cell as any).trim();
          cells.push(content || '');
        }
      }
    }

    return cells;
  }

  /**
   * Extract plain text as fallback
   */
  private extractPlainText(xamlContent: string): string {
    // Simple text extraction using regex as fallback
    const textMatches = xamlContent.match(/Text="([^"]*?)"/g) || [];
    const plainTexts = textMatches.map(match => 
      match.replace(/Text="([^"]*?)"/, '$1')
    );

    // Also extract content between tags
    const contentMatches = xamlContent.match(/>([^<]+)</g) || [];
    const contents = contentMatches.map(match => 
      match.replace(/^>([^<]+)<$/, '$1').trim()
    ).filter(text => text && !text.startsWith('<?') && !text.startsWith('<!--'));

    return [...plainTexts, ...contents].join(' ').trim();
  }

  /**
   * Normalize markdown output (clean up extra whitespace, etc.)
   */
  private normalizeMarkdown(markdown: string): string {
    return markdown
      .replace(/\n{3,}/g, '\n\n') // Max 2 consecutive newlines
      .replace(/^\s+|\s+$/g, '') // Trim start/end
      .replace(/\s+$/gm, ''); // Trim line endings
  }
} 