declare module 'bun:sqlite' {
  export class Database {
    constructor(path: string, options?: any);
    query(sql: string): any;
    prepare(sql: string): any;
    run(sql: string, ...params: any[]): any;
    close(): void;
  }
} 