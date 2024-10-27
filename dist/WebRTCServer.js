"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/WebRTCServer.ts
const ws_1 = require("ws");
// export class WebRTCServer {
// 	private ws: WebSocket;
// 	constructor(port: number, streamingConverter: StreamingConverter) {
// 		this.ws = new WebSocket("ws://localhost:8080");
// 	}
// 	public start() {
// 		console.log("WebRTC Server started");
// 		this.ws.on("message", (data) => {
// 			console.log(`Received data: ${data}`);
// 		});
// 	}
// }
const ws = new ws_1.WebSocket("ws://localhost:8080");
ws.on("open", () => {
    console.log("Connected to server");
});
