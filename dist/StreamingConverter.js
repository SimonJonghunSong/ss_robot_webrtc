"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.StreamingConverter = void 0;
// src/StreamingConverter.ts
const events_1 = require("events");
const ws_1 = __importDefault(require("ws"));
class StreamingConverter extends events_1.EventEmitter {
    constructor(wsUrl) {
        super();
        this.ws = null;
        this.wsUrl = wsUrl;
    }
    connect() {
        this.ws = new ws_1.default(this.wsUrl);
        this.ws.on("open", () => {
            console.log(`Connected to WebSocket server at ${this.wsUrl}`);
        });
        this.ws.on("message", (data) => {
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
    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }
}
exports.StreamingConverter = StreamingConverter;
