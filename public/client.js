const video = document.getElementById("video");
const statusEl = document.getElementById("status");

if (!("MediaSource" in window)) {
	alert("MediaSource API가 지원되지 않는 브라우저입니다.");
}

const mediaSource = new MediaSource();
video.src = URL.createObjectURL(mediaSource);

mediaSource.addEventListener("sourceopen", () => {
	console.log("MediaSource 열림");
	statusEl.textContent = "연결 상태: MediaSource 열림";

	const mime = 'video/mp4; codecs="avc1.64001E"'; // H.264 High 프로필 Level 3.0
	if (MediaSource.isTypeSupported(mime)) {
		const sourceBuffer = mediaSource.addSourceBuffer(mime);
		sourceBuffer.mode = "segments"; // 'segments' 모드로 설정

		const socket = io("http://localhost:3001"); // Socket.IO 서버 주소

		// 스트리밍 시작 요청
		socket.on("connect", () => {
			console.log("Socket.IO에 연결됨");
			statusEl.textContent = "연결 상태: 연결됨";
			socket.emit("stream");
		});

		// 버퍼 큐
		const queue = [];
		let isAppending = false;

		socket.on("video-stream", (data) => {
			// Socket.IO 클라이언트는 데이터를 ArrayBuffer로 받습니다.
			if (data instanceof ArrayBuffer) {
				console.log(`수신된 데이터 크기: ${data.byteLength} 바이트`);
				const chunk = new Uint8Array(data);
				queue.push(chunk);
				appendNext();
			} else {
				console.error("받은 데이터 형식이 유효하지 않습니다.");
			}
		});

		socket.on("disconnect", () => {
			console.log("Socket.IO 연결 종료");
			statusEl.textContent = "연결 상태: 연결 종료";
			mediaSource.endOfStream();
		});

		socket.on("error", (error) => {
			console.error("Socket.IO 오류:", error);
			statusEl.textContent = "연결 상태: 오류 발생";
		});

		function appendNext() {
			if (isAppending || queue.length === 0 || sourceBuffer.updating) {
				return;
			}

			const chunk = queue.shift();
			isAppending = true;
			sourceBuffer.appendBuffer(chunk);
		}

		sourceBuffer.addEventListener("updateend", () => {
			isAppending = false;
			appendNext();
		});

		sourceBuffer.addEventListener("error", (e) => {
			console.error("SourceBuffer 오류:", e);
			statusEl.textContent = "오류: SourceBuffer 문제 발생";
		});
	} else {
		console.error(`지원되지 않는 MIME 타입: ${mime}`);
		statusEl.textContent = "오류: 지원되지 않는 MIME 타입";
	}
});

mediaSource.addEventListener("error", (e) => {
	console.error("MediaSource 오류:", e);
	statusEl.textContent = "오류: MediaSource 문제 발생";
});
