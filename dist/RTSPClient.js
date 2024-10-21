"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RTSPClient = void 0;
// src/RTSPClient.ts
const node_rtsp_stream_es6_1 = __importDefault(require("node-rtsp-stream-es6"));
class RTSPClient {
    constructor(options) {
        this.options = options;
        this.stream = new node_rtsp_stream_es6_1.default({
            name: "camera-stream",
            streamUrl: this.options.url,
            wsPort: this.options.wsPort,
            ffmpegOptions: this.options.ffmpegOptions || {
                "-stats": "",
                "-r": 30,
                "-s": "640x480",
            },
        });
    }
    start() {
        console.log(`RTSP Client started for URL: ${this.options.url}`);
        this.stream.start();
    }
    stop() {
        console.log(`RTSP Client stopped for URL: ${this.options.url}`);
        this.stream.stop();
    }
}
exports.RTSPClient = RTSPClient;
