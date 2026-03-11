declare module 'socket.io' {
  export type Socket = any;

  export class Server {
    constructor(...args: any[]);
    on(...args: any[]): any;
    to(...args: any[]): any;
    emit(...args: any[]): any;
  }
}
