const ws = new WebSocket(`ws://${window.location.host}/ws`);
const pc = new RTCPeerConnection({
	iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
});
const video = document.getElementById("video");
const startRecordBtn = document.getElementById("startRecord");
const stopRecordBtn = document.getElementById("stopRecord");

// WebRTC 설정
pc.ontrack = (event) => {
	video.srcObject = event.streams[0];
};

pc.onicecandidate = (event) => {
	if (event.candidate) {
		ws.send(
			JSON.stringify({
				type: "candidate",
				candidate: event.candidate,
			}),
		);
	}
};

// 녹화 제어
startRecordBtn.onclick = () => {
	ws.send(JSON.stringify({ type: "startRecording" }));
	startRecordBtn.disabled = true;
	stopRecordBtn.disabled = false;
};

stopRecordBtn.onclick = () => {
	ws.send(JSON.stringify({ type: "stopRecording" }));
	startRecordBtn.disabled = false;
	stopRecordBtn.disabled = true;
};

// WebSocket 메시지 처리
ws.onmessage = async (e) => {
	const data = JSON.parse(e.data);
	switch (data.type) {
		case "answer":
			await pc.setRemoteDescription(data);
			break;
		case "candidate":
			if (data.candidate) {
				await pc.addIceCandidate(data.candidate);
			}
			break;
		case "error":
			console.error("Server error:", data.message);
			break;
	}
};

// 초기 연결 설정
ws.onopen = async () => {
	try {
		const stream = await navigator.mediaDevices.getUserMedia({ video: true });
		stream.getTracks().forEach((track) => pc.addTrack(track, stream));

		const offer = await pc.createOffer();
		await pc.setLocalDescription(offer);
		ws.send(JSON.stringify(offer));
	} catch (error) {
		console.error("Failed to setup connection:", error);
	}
};
