import ffmpeg from "fluent-ffmpeg";
import fs from "fs";
export interface RTCClient {
	peerConnection: RTCPeerConnection;
	type: "browser" | "server";
	videoTrack: MediaStreamTrack | null;
	recording?: {
		filename: string;
		stream: fs.WriteStream;
		ffmpegCommand: ffmpeg.FfmpegCommand;
	};
}

export interface WebSocketMessage {
	type: "offer" | "answer" | "candidate" | "startRecording" | "stopRecording";
	candidate?: RTCIceCandidate;
	sdp?: string;
}

export interface StreamingServiceConfig {
	rtspUrl: string;
	recordingsPath?: string;
}
