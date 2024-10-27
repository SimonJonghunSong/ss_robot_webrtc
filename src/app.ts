// app.ts

/**
 * 사용 예시
 * express 서버를 사용하는 경우 아래와 같이 webRTC Scoket을 생성하고 연결을 진행합니다.
 */
import express from "express";
import { createServer } from "http";
import SocketHandler from "./SocketHandler";

const app = express();
const httpServer = createServer(app);

const socketHandler = new SocketHandler();
socketHandler.init(httpServer);

httpServer.listen(3000, () => {
	console.log("Server running on port 3000");
});
