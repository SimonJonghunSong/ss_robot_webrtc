// simple-ws-server.ts

import { spawn } from "child_process";
import path from "path";
import { WebSocketServer } from "ws";

const WS_PORT = 3001;
const RTSP_URL = "rtsp://210.99.70.120:1935/live/cctv005.stream";
// "rtsp://root:stsunlab2024%24@122.203.5.76/axis-media/media.amp?streamprofile=4";

const wss = new WebSocketServer({ port: WS_PORT });

wss.on("connection", (ws) => {
	console.log("클라이언트가 연결되었습니다.");

	let recordingProcess: any = null;
	let isRecording = false;

	const ffmpeg = spawn("ffmpeg", [
		"-rtsp_transport",
		"tcp",
		"-nostdin",
		"-fflags",
		"+genpts+flush_packets", // PTS 생성 및 패킷 플러시
		"-avoid_negative_ts",
		"make_zero", // Negative timestamps 설정
		"-start_at_zero", // 스트림을 0에서 시작
		"-probesize",
		"32", // 프로브 크기 설정
		"-analyzeduration",
		"0", // 분석 기간 설정
		"-i",
		RTSP_URL,
		"-fps_mode",
		"passthrough", // 비디오 동기화 비활성화
		"-c:v",
		"libx264", // 비디오를 H.264로 인코딩
		"-g",
		"15", // 프레임 간격 설정
		"-r",
		"30", // 프레임 속도 설정
		"-vf",
		"scale=854:480", // 480p 해상도
		"-b:v",
		"1000k", // 비트레이트 1Mbps로 감소
		"-maxrate",
		"1500k", // 최대 비트레이트 1.5Mbps
		"-bufsize",
		"1500k", // 버퍼 크기 2Mbps
		"-pix_fmt",
		"yuv420p", // 픽셀 포맷 설정
		"-color_range",
		"2", // 색상 범위 설정 (1: limited, 2: full)
		"-preset",
		"ultrafast", // 인코딩 속도 최적화
		"-tune",
		"zerolatency", // 지연 시간 최소화
		"-an", // 오디오 비활성화
		"-f",
		"mp4", // 출력 포맷 설정
		"-movflags",
		"frag_keyframe+empty_moov+default_base_moof", // Fragmented MP4 설정
		"-fflags",
		"nobuffer", // 버퍼링 최소화
		"-flags",
		"low_delay", // 지연 시간 최소화
		"-strict",
		"experimental", // 실험적 기능 사용 (필요 시)
		"-muxdelay",
		"0", // 멀티플렉싱 지연 시간 설정
		"-muxpreload",
		"0", // 멀티플렉싱 사전 로딩 시간 설정
		"-max_interleave_delta",
		"0", // 최대 인터리빙 델타 설정
		"-bsf:v",
		"h264_mp4toannexb", // H.264 스트림 필터 추가
		"-max_muxing_queue_size",
		"1024", // 멀티플렉싱 큐 크기 증가
		"pipe:1",
	]);

	ffmpeg.stdout.on("data", (chunk: Buffer) => {
		if (ws.readyState === ws.OPEN && !isRecording) {
			ws.send(chunk);
		}
	});

	ffmpeg.stderr.on("data", (data: Buffer) => {
		console.error(`FFmpeg stderr: ${data}`);
	});

	ffmpeg.on("close", (code: number) => {
		console.log(`FFmpeg exited with code ${code}`);
		ws.close();
	});

	ws.on("message", (message: string) => {
		const data = JSON.parse(message);

		if (data.type === "startRecording") {
			const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
			const outputPath = path.join(
				__dirname,
				"recordings",
				`recording-${timestamp}.mp4`,
			);

			isRecording = true;

			// 녹화용 FFmpeg 프로세스 시작
			recordingProcess = spawn("ffmpeg", [
				"-rtsp_transport",
				"tcp",
				"-i",
				RTSP_URL,
				"-c:v",
				"copy",
				"-an",
				outputPath,
			]);

			recordingProcess.stderr.on("data", (data: Buffer) => {
				console.log(`Recording FFmpeg: ${data}`);
			});

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
