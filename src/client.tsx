import { useEffect, useRef, useState } from "react";
import "./VideoPlayer.css";

const VideoPlayer = () => {
	const videoRef = useRef(null);
	const [status, setStatus] = useState("연결 상태: 연결 중...");
	const [isRecording, setIsRecording] = useState(false);
	const wsRef = useRef(null);
	const mediaSourceRef = useRef(null);
	const sourceBufferRef = useRef(null);
	const queueRef = useRef([]);
	const isAppendingRef = useRef(false);

	useEffect(() => {
		if (!("MediaSource" in window)) {
			alert("MediaSource API가 지원되지 않는 브라우저입니다.");
			return;
		}

		mediaSourceRef.current = new MediaSource();
		videoRef.current.src = URL.createObjectURL(mediaSourceRef.current);

		mediaSourceRef.current.addEventListener("sourceopen", handleSourceOpen);
		mediaSourceRef.current.addEventListener("error", handleMediaSourceError);

		return () => {
			if (wsRef.current) {
				wsRef.current.close();
			}
			mediaSourceRef.current.removeEventListener(
				"sourceopen",
				handleSourceOpen,
			);
			mediaSourceRef.current.removeEventListener(
				"error",
				handleMediaSourceError,
			);
		};
	}, []);

	const handleSourceOpen = () => {
		console.log("MediaSource 열림");
		setStatus("연결 상태: MediaSource 열림");

		const mime = 'video/mp4; codecs="avc1.64001E"';
		if (MediaSource.isTypeSupported(mime)) {
			sourceBufferRef.current = mediaSourceRef.current.addSourceBuffer(mime);
			sourceBufferRef.current.mode = "segments";
			sourceBufferRef.current.addEventListener("updateend", appendNext);

			connectWebSocket();
		} else {
			console.error("지원되지 않는 MIME 타입:", mime);
			setStatus("오류: 지원되지 않는 비디오 포맷");
		}
	};

	const handleMediaSourceError = (e) => {
		console.error("MediaSource 오류:", e);
		setStatus("오류: MediaSource 문제 발생");
	};

	const connectWebSocket = () => {
		wsRef.current = new WebSocket("ws://localhost:3001");
		wsRef.current.binaryType = "arraybuffer";

		wsRef.current.onopen = () => {
			console.log("WebSocket에 연결됨");
			setStatus("연결 상태: 연결됨");
		};

		wsRef.current.onmessage = (event) => {
			if (typeof event.data === "string") {
				try {
					const response = JSON.parse(event.data);
					if (response.type === "recordingStarted") {
						console.log("녹화가 시작되었습니다.");
					} else if (response.type === "recordingStopped") {
						console.log("녹화가 종료되었습니다.");
					}
				} catch (e) {
					console.error("JSON 파싱 에러:", e);
				}
			} else if (event.data instanceof ArrayBuffer) {
				const chunk = new Uint8Array(event.data);
				queueRef.current.push(chunk);
				appendNext();
			}
		};

		wsRef.current.onclose = () => {
			console.log("WebSocket 연결 종료");
			setStatus("연결 상태: 연결 종료");
			mediaSourceRef.current.endOfStream();
		};

		wsRef.current.onerror = (error) => {
			console.error("WebSocket 오류:", error);
			setStatus("연결 상태: 오류 발생");
		};
	};

	const appendNext = () => {
		if (
			isAppendingRef.current ||
			queueRef.current.length === 0 ||
			sourceBufferRef.current.updating
		) {
			return;
		}

		const chunk = queueRef.current.shift();
		isAppendingRef.current = true;
		try {
			sourceBufferRef.current.appendBuffer(chunk);
		} catch (e) {
			console.error("appendBuffer 오류:", e);
		}
	};

	const handleUpdateEnd = () => {
		isAppendingRef.current = false;
		appendNext();
	};

	const startRecording = () => {
		if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
			wsRef.current.send(JSON.stringify({ type: "startRecording" }));
			setIsRecording(true);
			setStatus("연결 상태: 녹화 중...");
		}
	};

	const stopRecording = () => {
		if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
			wsRef.current.send(JSON.stringify({ type: "stopRecording" }));
			setIsRecording(false);
			setStatus("연결 상태: 연결됨");
		}
	};

	return (
		<div>
			<h1>RTSP 스트림 뷰어 with WebSocket and MSE</h1>
			<div id="video-container">
				<video ref={videoRef} controls autoPlay></video>
				<button onClick={startRecording} disabled={isRecording}>
					녹화 시작
				</button>
				<button onClick={stopRecording} disabled={!isRecording}>
					녹화 종료
				</button>
			</div>
			<div id="status">{status}</div>
		</div>
	);
};

export default VideoPlayer;
