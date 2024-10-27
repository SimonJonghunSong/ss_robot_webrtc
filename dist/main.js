"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const RTSPClient_1 = require("./RTSPClient");
const options = {
    url: "rtsp://210.99.70.120:1935/live/cctv061.stream",
    port: 9999,
};
const client = new RTSPClient_1.RTSPClient(options);
client.start();
