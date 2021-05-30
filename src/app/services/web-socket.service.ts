import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  // WEBSOCKET_URL: string = 'wss://echo.websocket.org';
  WEBSOCKET_URL: string = 'ws://localhost:8000/inference';
  // WEBSOCKET_URL: string = 'ws://13.235.27.172:8000/inference';

  webSocket: WebSocket;
  webSocketConnected: boolean = false;
  webSocketResponse: any;

  constructor() { }

  openWebsocket() {
    this.webSocket = new WebSocket(this.WEBSOCKET_URL);

    this.webSocket.onopen = event => {
      console.log(`Connection opened`);
      this.webSocketConnected = true;
    };

    // this.webSocket.onmessage = event => {
    //   const message = event.data;
    //   this.webSocketResponse = message;
    // };

    this.webSocket.onclose = event => {
      console.log(`Connection closed`);
    };
  }

  sendData(data: any) {
    this.webSocket.send(data);
  }

  closeWebSocket() {
    this.webSocket.close();
  }

}
