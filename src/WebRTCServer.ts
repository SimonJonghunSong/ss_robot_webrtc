// src/WebRTCServer.ts
import express from "express";
import http from "http";
import WebSocket, { Server as WebSocketServer } from "ws";
import { StreamingConverter } from "./StreamingConverter";

export class WebRTCServer {
	private app: express.Application;
	private server: http.Server;
	private wss: WebSocketServer;
	private streamingConverter: StreamingConverter;

	constructor(port: number, streamingConverter: StreamingConverter) {
		this.app = express();
		this.server = http.createServer(this.app);
		this.wss = new WebSocketServer({ server: this.server });
		this.streamingConverter = streamingConverter;

		this.setupRoutes();
		this.setupWebSocket();
		this.streamingConverter.on("stream-data", (data) =>
			this.broadcastData(data),
		);
	}

	private setupRoutes() {
		// 정적 파일 제공 (예: 클라이언트 HTML)
		this.app.use(express.static("public"));

		this.app.get("/", (req, res) => {
			res.sendFile("index.html", { root: "public" });
		});
	}

	private setupWebSocket() {
		this.wss.on("connection", (ws: WebSocket) => {
			console.log("Client connected to WebRTCServer via WebSocket");

			ws.on("message", (message: string) => {
				// WebRTC 신호 처리 (예: offer, answer, candidate)
				// 여기서는 간단하게 브로드캐스트
				this.wss.clients.forEach((client) => {
					if (client !== ws && client.readyState === WebSocket.OPEN) {
						client.send(message);
					}
				});
			});

			ws.on("close", () => {
				console.log("Client disconnected from WebRTCServer");
			});
		});
	}

	private broadcastData(data: WebSocket.Data) {
		// 스트림 데이터를 모든 클라이언트에 전송
		this.wss.clients.forEach((client) => {
			if (client.readyState === WebSocket.OPEN) {
				client.send(data);
			}
		});
	}

	public start(port: number) {
		this.server.listen(port, () => {
			console.log(`WebRTCServer is listening on port ${port}`);
		});
	}

	public stop() {
		this.server.close();
	}
}
