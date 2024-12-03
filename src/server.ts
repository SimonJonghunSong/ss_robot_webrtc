// simple-ws-server.ts
import { spawn } from "child_process";
import express from "express";
import { mkdirSync } from "fs";
import { createServer } from "http";
import path from "path";
import { WebSocketServer } from "ws";

const app = express();
const WS_PORT = 3001;
const RTSP_URL = "rtsp://210.99.70.120:1935/live/cctv004.stream";

const server = createServer(app);
const wss = new WebSocketServer({ server });

app.get("/", (req, res) => {
	res.sendFile(path.join(__dirname, "/public/index.html"));
});
wss.on("connection", (ws) => {
	console.log("클라이언트가 연결되었습니다.");

	ws.send(JSON.stringify({ type: "streamInitializing" }));

	let recordingProcess: any = null;
	let isRecording = false;

	ws.on("message", (message: string) => {
		const data = JSON.parse(message);
		const recordingDir = path.join(__dirname, "recordings");
		mkdirSync(recordingDir, { recursive: true });

		if (data.type === "startRecording") {
			const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
			const outputPath = path.join(recordingDir, `recording-${timestamp}.mp4`);

			isRecording = true;

			// 녹화용 FFmpeg 프로세스 시작
			recordingProcess = spawn("ffmpeg", [
				"-rtsp_transport",
				"tcp",
				"-i",
				RTSP_URL,
				"-c:v",
				"libx264",
				"-r",
				"5",
				"-vf",
				"scale=3840:2160",
				"-preset",
				"slow",
				"-an",
				"-fflags",
				"+genpts+flush_packets",
				"-avoid_negative_ts",
				"make_zero",
				"-f",
				"mp4",
				"-crf",
				"10",
				"-reconnect_at_eof",
				"1",
				"-reconnect_streamed",
				"1",
				"-reconnect_delay_max",
				"2",
				"-movflags",
				"frag_keyframe+empty_moov+default_base_moof",
				"-y",
				outputPath,
			]);

			ws.send(JSON.stringify({ type: "recordingStarted" }));
		}

		if (data.type === "stopRecording" && recordingProcess) {
			recordingProcess.kill("SIGINT");
			isRecording = false;
			recordingProcess = null;
			ws.send(JSON.stringify({ type: "recordingStopped" }));
		}
	});

	ws.on("close", () => {
		console.log("클라이언트가 연결을 끊었습니다.");
	});
});

server.listen(WS_PORT, () => {
	console.log(`서버가 시작되었습니다. 포트: ${WS_PORT}`);
});
