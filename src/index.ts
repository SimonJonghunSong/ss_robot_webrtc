import { MediaStreamTrack, RTCPeerConnection } from "@roamhq/wrtc";
import express from "express";
import ffmpeg from "fluent-ffmpeg";
import * as fs from "fs";
import { createServer } from "http";
import RTSPClient from "node-rtsp-stream";
import * as path from "path";
import WebSocket from "ws";
interface RTCClient {
	peerConnection: RTCPeerConnection;
	type: "browser" | "server";
	videoTrack: MediaStreamTrack | null;
	recording?: {
		filename: string;
		stream: fs.WriteStream;
		ffmpegCommand: ffmpeg.FfmpegCommand;
	};
}

interface WebSocketMessage {
	type: "offer" | "answer" | "candidate" | "startRecording" | "stopRecording";
	candidate?: RTCIceCandidate;
	sdp?: string;
}

class RTCStreamingService {
	private rtspClient: RTSPClient;
	private clients: Map<string, RTCClient>;
	private readonly recordingsPath: string;

	constructor(rtspUrl: string) {
		this.rtspClient = new RTSPClient({
			url: rtspUrl,
			wsPort: 8080,
		});
		this.clients = new Map();
		this.recordingsPath = path.join(__dirname, "../recordings");

		if (!fs.existsSync(this.recordingsPath)) {
			fs.mkdirSync(this.recordingsPath, { recursive: true });
		}
	}

	async startRTSPStream(): Promise<void> {
		try {
			this.rtspClient.on("data", (frame: Buffer) => {
				this.clients.forEach(({ peerConnection, videoTrack }) => {
					if (videoTrack) {
						(videoTrack as any).replaceFrame(frame);
					}
				});
			});
			await this.rtspClient.start();
		} catch (error) {
			console.error("RTSP stream error:", error);
			throw error;
		}
	}

	async handleClient(
		ws: WebSocket,
		clientType: "browser" | "server",
	): Promise<string> {
		const clientId = Date.now().toString();

		const peerConnection = new RTCPeerConnection({
			iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
		});

		const client: RTCClient = {
			peerConnection,
			type: clientType,
			videoTrack: null,
		};

		this.clients.set(clientId, client);

		this.setupPeerConnection(peerConnection, ws);
		this.setupWebSocket(ws, clientId, peerConnection);

		return clientId;
	}

	private setupPeerConnection(
		peerConnection: RTCPeerConnection,
		ws: WebSocket,
	): void {
		peerConnection.onicecandidate = (event: RTCPeerConnectionIceEvent) => {
			if (event.candidate) {
				ws.send(
					JSON.stringify({
						type: "candidate",
						candidate: event.candidate,
					}),
				);
			}
		};

		peerConnection.onconnectionstatechange = () => {
			console.log("Connection state:", peerConnection.connectionState);
		};
	}

	private async startRecording(clientId: string): Promise<void> {
		const client = this.clients.get(clientId);
		if (!client || client.recording) return;

		const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
		const filename = `recording_${timestamp}.mp4`;
		const outputPath = path.join(this.recordingsPath, filename);

		try {
			const ffmpegCommand = ffmpeg()
				.input("pipe:0")
				.inputFormat("h264")
				.outputFormat("mp4")
				.output(outputPath)
				.on("end", () => {
					console.log(`Recording saved: ${outputPath}`);
				})
				.on("error", (err) => {
					console.error("FFmpeg error:", err);
				});

			const stream = fs.createWriteStream(outputPath);

			client.recording = {
				filename,
				stream,
				ffmpegCommand,
			};

			ffmpegCommand.run();
			console.log(`Started recording: ${filename}`);
		} catch (error) {
			console.error("Failed to start recording:", error);
			throw error;
		}
	}

	private async stopRecording(clientId: string): Promise<void> {
		const client = this.clients.get(clientId);
		if (!client || !client.recording) return;

		try {
			const { stream, ffmpegCommand } = client.recording;
			stream.end();
			ffmpegCommand.kill("SIGKILL");
			delete client.recording;
			console.log("Recording stopped");
		} catch (error) {
			console.error("Failed to stop recording:", error);
			throw error;
		}
	}

	private setupWebSocket(
		ws: WebSocket,
		clientId: string,
		peerConnection: RTCPeerConnection,
	): void {
		ws.on("message", async (message: string) => {
			try {
				const data: WebSocketMessage = JSON.parse(message);

				switch (data.type) {
					case "offer":
						await peerConnection.setRemoteDescription(
							new RTCSessionDescription(data as RTCSessionDescriptionInit),
						);
						const answer = await peerConnection.createAnswer();
						await peerConnection.setLocalDescription(answer);
						ws.send(JSON.stringify(answer));
						break;

					case "candidate":
						if (data.candidate) {
							await peerConnection.addIceCandidate(
								new RTCIceCandidate(data.candidate),
							);
						}
						break;
				}
			} catch (error) {
				console.error("WebSocket message handling error:", error);
			}
		});

		ws.on("close", () => {
			this.clients.delete(clientId);
			peerConnection.close();
		});

		ws.on("error", (error: Error) => {
			console.error("WebSocket error:", error);
			this.clients.delete(clientId);
			peerConnection.close();
		});
	}

	stop(): void {
		this.rtspClient.close();
		this.clients.forEach((client) => {
			client.peerConnection.close();
		});
		this.clients.clear();
	}
}

// 서버 설정
const app = express();
const server = createServer(app);
const wss = new WebSocket.Server({ server });

// 환경 변수에서 설정 읽기
const RTSP_URL =
	process.env.RTSP_URL || "rtsp://210.99.70.120:1935/live/cctv004.stream";
const PORT = parseInt(process.env.PORT || "3000", 10);

// 스트리밍 서비스 인스턴스 생성
const streamingService = new RTCStreamingService(RTSP_URL);

// 정적 파일 제공
app.get("/", (req, res) => {
	res.sendFile(__dirname + "/public/index.html");
});

// WebSocket 연결 처리
wss.on("connection", async (ws: WebSocket, req: any) => {
	try {
		const clientType = req.url === "/server" ? "server" : "browser";
		await streamingService.handleClient(ws, clientType);
	} catch (error) {
		console.error("WebSocket connection error:", error);
		ws.close();
	}
});

// 서버 시작
async function startServer(): Promise<void> {
	try {
		await streamingService.startRTSPStream();
		server.listen(PORT, () => {
			console.log(`Server running on port ${PORT}`);
		});
	} catch (error) {
		console.error("Server startup error:", error);
		process.exit(1);
	}
}

// 에러 처리
process.on("uncaughtException", (error: Error) => {
	console.error("Uncaught Exception:", error);
});

process.on("unhandledRejection", (reason: any) => {
	console.error("Unhandled Rejection:", reason);
});

// 종료 처리
process.on("SIGTERM", () => {
	streamingService.stop();
	server.close(() => {
		process.exit(0);
	});
});

startServer();
