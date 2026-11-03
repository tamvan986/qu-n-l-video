declare module 'mammoth' {
  export interface RawTextResult {
    value: string;
    messages: any[];
  }
  export interface HtmlResult {
    value: string;
    messages: any[];
  }
  export function extractRawText(options: { arrayBuffer: ArrayBuffer }): Promise<RawTextResult>;
  export function convertToHtml(options: { arrayBuffer: ArrayBuffer }): Promise<HtmlResult>;
}
