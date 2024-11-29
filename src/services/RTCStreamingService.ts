import { MediaStream, RTCPeerConnection } from "@roamhq/wrtc";
import { spawn } from "child_process";
import path from "path";
import WebSocket from "ws";
import { RTCClient, StreamingServiceConfig } from "../interfaces";
import { RecordingService } from "./RecordingService";
import { WebSocketService } from "./WebSocketService";

export class RTCStreamingService {
	private rtspProcess: any;
	private clients: Map<string, RTCClient>;
	private recordingService: RecordingService;
	private webSocketService: WebSocketService;

	constructor(config: StreamingServiceConfig) {
		this.clients = new Map();

		const recordingsPath =
			config.recordingsPath || path.join(process.cwd(), "recordings");

		this.recordingService = new RecordingService(recordingsPath);
		this.webSocketService = new WebSocketService(this.recordingService);
		this.startRTSPStream(config.rtspUrl);
	}

	private startRTSPStream(rtspUrl: string): void {
		// FFmpeg 명령어로 RTSP 스트림을 H.264로 변환
		this.rtspProcess = spawn("ffmpeg", [
			"-i",
			rtspUrl,
			"-c:v",
			"libx264",
			"-preset",
			"ultrafast",
			"-tune",
			"zerolatency",
			"-f",
			"h264",
			"-",
		]);

		this.rtspProcess.stderr.on("data", (data: Buffer) => {
			console.log("FFmpeg:", data.toString());
		});

		this.rtspProcess.on("error", (err: Error) => {
			console.error("FFmpeg error:", err);
		});
	}

	handleWebSocketConnection(ws: WebSocket): void {
		const clientId = this.generateClientId();
		const peerConnection = this.createPeerConnection();

		const client: RTCClient = {
			peerConnection,
			type: "browser",
			videoTrack: null,
		};

		this.clients.set(clientId, client);

		// WebSocket 메시지 핸들러
		ws.on("message", async (message: string) => {
			await this.webSocketService.handleMessage(ws, message, client);
		});

		// 연결 종료 처리
		ws.on("close", () => {
			if (client.recording) {
				this.recordingService.stopRecording(client);
			}
			this.cleanupClient(clientId);
		});

		// 에러 처리
		ws.on("error", (error) => {
			console.error("WebSocket error:", error);
			this.cleanupClient(clientId);
		});
	}

	private createPeerConnection(): RTCPeerConnection {
		const pc = new RTCPeerConnection({
			iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
		});

		// 비디오 스트림 설정
		const videoTrack = new MediaStream();
		pc.addTrack(videoTrack);

		// ICE 후보 이벤트 핸들러
		pc.onicecandidate = (event: any) => {
			if (event.candidate) {
				// ICE 후보를 클라이언트에게 전송
				this.clients.forEach((client) => {
					if (client.peerConnection === pc) {
						client.peerConnection.addIceCandidate(event.candidate);
					}
				});
			}
		};

		// 연결 상태 변경 핸들러
		pc.onconnectionstatechange = () => {
			console.log("Connection state:", pc.connectionState);
			if (pc.connectionState === "failed") {
				pc.restartIce();
			}
		};

		// ICE 연결 상태 변경 핸들러
		pc.oniceconnectionstatechange = () => {
			console.log("ICE connection state:", pc.iceConnectionState);
		};

		return pc;
	}

	private createVideoTrack(): MediaStreamTrack {
		// H.264 비디오 스트림을 MediaStreamTrack으로 변환
		const videoStream = new MediaStream();

		if (this.rtspProcess && this.rtspProcess.stdout) {
			this.rtspProcess.stdout.on("data", (data: Buffer) => {
				// H.264 데이터를 WebRTC로 전송
				this.clients.forEach((client) => {
					if (client.peerConnection.connectionState === "connected") {
						const senders = client.peerConnection.getSenders();
						const videoSender = senders.find(
							(sender) => sender.track?.kind === "video",
						);
						if (videoSender) {
							// 비디오 데이터 전송
							videoSender.replaceTrack(new MediaStreamTrack());
						}
					}
				});
			});
		}

		return videoStream.getTracks()[0];
	}

	private cleanupClient(clientId: string): void {
		const client = this.clients.get(clientId);
		if (client) {
			// PeerConnection 정리
			if (client.peerConnection) {
				client.peerConnection.close();
			}

			// 녹화 중지
			if (client.recording) {
				this.recordingService.stopRecording(client);
			}

			// 클라이언트 제거
			this.clients.delete(clientId);
		}
	}

	private generateClientId(): string {
		return Math.random().toString(36).substring(7);
	}

	// 서비스 종료 시 정리
	public cleanup(): void {
		// RTSP 프로세스 종료
		if (this.rtspProcess) {
			this.rtspProcess.kill();
		}

		// 모든 클라이언트 연결 종료
		this.clients.forEach((client, clientId) => {
			this.cleanupClient(clientId);
		});
	}
}
