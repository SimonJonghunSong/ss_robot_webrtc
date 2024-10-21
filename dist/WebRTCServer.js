"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.WebRTCServer = void 0;
// src/WebRTCServer.ts
const express_1 = __importDefault(require("express"));
const http_1 = __importDefault(require("http"));
const ws_1 = __importStar(require("ws"));
class WebRTCServer {
    constructor(port, streamingConverter) {
        this.app = (0, express_1.default)();
        this.server = http_1.default.createServer(this.app);
        this.wss = new ws_1.Server({ server: this.server });
        this.streamingConverter = streamingConverter;
        this.setupRoutes();
        this.setupWebSocket();
        this.streamingConverter.on("stream-data", (data) => this.broadcastData(data));
    }
    setupRoutes() {
        // 정적 파일 제공 (예: 클라이언트 HTML)
        this.app.use(express_1.default.static("public"));
        this.app.get("/", (req, res) => {
            res.sendFile("index.html", { root: "public" });
        });
    }
    setupWebSocket() {
        this.wss.on("connection", (ws) => {
            console.log("Client connected to WebRTCServer via WebSocket");
            ws.on("message", (message) => {
                // WebRTC 신호 처리 (예: offer, answer, candidate)
                // 여기서는 간단하게 브로드캐스트
                this.wss.clients.forEach((client) => {
                    if (client !== ws && client.readyState === ws_1.default.OPEN) {
                        client.send(message);
                    }
                });
            });
            ws.on("close", () => {
                console.log("Client disconnected from WebRTCServer");
            });
        });
    }
    broadcastData(data) {
        // 스트림 데이터를 모든 클라이언트에 전송
        this.wss.clients.forEach((client) => {
            if (client.readyState === ws_1.default.OPEN) {
                client.send(data);
            }
        });
    }
    start(port) {
        this.server.listen(port, () => {
            console.log(`WebRTCServer is listening on port ${port}`);
        });
    }
    stop() {
        this.server.close();
    }
}
exports.WebRTCServer = WebRTCServer;
