// src/StreamingConverter.ts
import { EventEmitter } from "events";
import WebSocket from "ws";

export class StreamingConverter extends EventEmitter {
	private wsUrl: string;
	private ws: WebSocket | null = null;

	constructor(wsUrl: string) {
		super();
		this.wsUrl = wsUrl;
	}

	public connect() {
		this.ws = new WebSocket(this.wsUrl);

		this.ws.on("open", () => {
			console.log(`Connected to WebSocket server at ${this.wsUrl}`);
		});

		this.ws.on("message", (data: WebSocket.Data) => {
			this.emit("stream-data", data);
		});

		this.ws.on("close", () => {
			console.log(`WebSocket connection to ${this.wsUrl} closed`);
			// 재접속 로직을 추가할 수 있습니다.
		});

		this.ws.on("error", (error) => {
			console.error(`WebSocket error: ${error}`);
		});
	}

	public disconnect() {
		if (this.ws) {
			this.ws.close();
			this.ws = null;
		}
	}
}
