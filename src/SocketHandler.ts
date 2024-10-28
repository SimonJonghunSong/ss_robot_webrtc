import http from "http";
import { Server } from "socket.io";

class SocketHandler {
	private io: Server | null = null;

	init(httpServer: http.Server): Server {
		this.io = new Server(httpServer);

		this.io.on("connection", (socket) => {
			console.log("Client connected");

			socket.on("offer", (offer, camera) => {
				socket.to(camera).emit("offer", offer);
			});

			socket.on("join_stream", (camera) => {
				socket.join(camera);

				socket.emit("stream", {
					id: camera,
					wsUrl: `ws://localhost:3000`, // 웹 서버 상 소켓 스트리밍 주소
				});
			});

			socket.on("answer", (answer, camera) => {
				socket.to(camera).emit("answer", answer);
			});

			socket.on("ice-candidate", (candidate, camera) => {
				socket.to(camera).emit("candidate", candidate);
			});
		});

		return this.io;
	}

	getIO(): Server {
		if (!this.io) {
			throw new Error("Socket.io not initialized");
		}

		return this.io;
	}
}

export default SocketHandler;
