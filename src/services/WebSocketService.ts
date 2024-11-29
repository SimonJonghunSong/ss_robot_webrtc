import { RTCIceCandidate, RTCSessionDescription } from "@roamhq/wrtc";
import WebSocket from "ws";
import { RTCClient, WebSocketMessage } from "../interfaces";
import { RecordingService } from "./RecordingService";

export class WebSocketService {
	constructor(private recordingService: RecordingService) {}

	async handleMessage(
		ws: WebSocket,
		message: string,
		client: RTCClient,
	): Promise<void> {
		try {
			const data: WebSocketMessage = JSON.parse(message);

			switch (data.type) {
				case "offer":
					await this.handleOffer(ws, data, client);
					break;

				case "candidate":
					await this.handleCandidate(data, client);
					break;

				case "startRecording":
					await this.handleStartRecording(ws, client);
					break;

				case "stopRecording":
					await this.handleStopRecording(ws, client);
					break;
			}
		} catch (error) {
			console.error("WebSocket message handling error:", error);
			ws.send(
				JSON.stringify({
					type: "error",
					message: "Failed to process request",
				}),
			);
		}
	}

	private async handleOffer(
		ws: WebSocket,
		data: WebSocketMessage,
		client: RTCClient,
	): Promise<void> {
		await client.peerConnection.setRemoteDescription(
			new RTCSessionDescription(data as RTCSessionDescriptionInit),
		);
		const answer = await client.peerConnection.createAnswer();
		await client.peerConnection.setLocalDescription(answer);
		ws.send(JSON.stringify(answer));
	}

	private async handleCandidate(
		data: WebSocketMessage,
		client: RTCClient,
	): Promise<void> {
		if (data.candidate) {
			await client.peerConnection.addIceCandidate(
				new RTCIceCandidate(data.candidate),
			);
		}
	}

	private async handleStartRecording(
		ws: WebSocket,
		client: RTCClient,
	): Promise<void> {
		await this.recordingService.startRecording(client);
		ws.send(JSON.stringify({ type: "recordingStarted" }));
	}

	private async handleStopRecording(
		ws: WebSocket,
		client: RTCClient,
	): Promise<void> {
		await this.recordingService.stopRecording(client);
		ws.send(JSON.stringify({ type: "recordingStopped" }));
	}
}
