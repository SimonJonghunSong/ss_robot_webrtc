// simple-ws-server.ts
import { spawn } from "child_process";
import { mkdirSync } from "fs";
import path from "path";
import { WebSocketServer } from "ws";

const WS_PORT = 3001;
const RTSP_URL = "rtsp://210.99.70.120:1935/live/cctv004.stream";
// "rtsp://root:stsunlab2024%24@122.203.5.76/axis-media/media.amp?streamprofile=4";

const wss = new WebSocketServer({ port: WS_PORT });

wss.on("connection", (ws) => {
	console.log("클라이언트가 연결되었습니다.");

	ws.send(JSON.stringify({ type: "streamInitializing" }));

	let recordingProcess: any = null;
	let isRecording = false;

	const ffmpeg = spawn("ffmpeg", [
		"-fflags",
		"+genpts+nobuffer",
		"-rtsp_transport",
		"tcp",
		"-i",
		RTSP_URL,
		"-copyts",
		"-c:v",
		"copy",
		"-an",
		"-f",
		"mp4",
		"-movflags",
		"empty_moov+default_base_moof+frag_keyframe+faststart",
		"-tune",
		"zerolatency",
		"-preset",
		"ultrafast",
		"-probesize",
		"32",
		"-analyzeduration",
		"0",
		"-reconnect_at_eof",
		"1",
		"-reconnect_streamed",
		"1",
		"-reconnect_delay_max",
		"2",
		"pipe:1",
	]);

	ffmpeg.stdout.on("data", (chunk: Buffer) => {
		if (ws.readyState === ws.OPEN) {
			ws.send(chunk);
		}
	});

	ffmpeg.stderr.on("data", (chunk: Buffer) => {
		console.error(`FFmpeg stderr: ${chunk}`);
	});

	ffmpeg.on("close", (code: number) => {
		console.log(`FFmpeg exited with code ${code}`);
		ws.close();
	});

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
		ffmpeg.kill("SIGINT");
	});
});

console.log(`WebSocket 서버가 ws://localhost:${WS_PORT} 에서 실행 중입니다.`);
