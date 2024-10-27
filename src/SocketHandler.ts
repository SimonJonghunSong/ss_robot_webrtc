import http from "http";
import { Server } from "socket.io";

class SocketHandler {
	private io: Server | null = null;

	init(httpServer: http.Server): Server {
		this.io = new Server(httpServer);

		this.io.on("connection", (socket) => {
			console.log("Client connected");
			socket.on("disconnect", () => {
				console.log("Client disconnected");
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
