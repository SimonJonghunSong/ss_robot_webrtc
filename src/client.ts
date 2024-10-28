/**
 * 클라이언트 webRTC 연결 예시
 * webRTC 연결을 위한 클라이언트 코드입니다.
 *
 * 이 코드는 브라우저에서 실행되는 코드입니다.
 * 연결하고자 하는 카메라의 이름을 camera 변수에 입력하고 실행하면 해당 카메라와 연결을 시도합니다.
 */

const socket = io();
const camera = "camera-name"; // 연결 카메라 명

socket.emit("join", camera);

const peerConnection = new RTCPeerConnection({
	iceServers: [
		{
			urls: [
				"stun:stun.l.google.com:19302",
				"stun:stun1.l.google.com:19302",
				"stun:stun2.l.google.com:19302",
				"stun:stun3.l.google.com:19302",
				"stun:stun4.l.google.com:19302",
				"stun:stun.services.mozilla.com",
			],
		},
	],
});

peerConnection.onicecandidate = (event) => {
	if (event.candidate) {
		socket.emit("ice-candidate", event.candidate);
	}
};

peerConnection.onconnectionstatechange = () => {
	if (peerConnection.connectionState === "connected") {
		console.log("Peers connected!");
	}
};

socket.on("offer", async (offer: any) => {
	await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
	const answer = await peerConnection.createAnswer();
	await peerConnection.setLocalDescription(answer);
	socket.emit("answer", answer);
});

socket.on("stream_info", async (streamInfo: any) => {
	const ws = new WebSocket(streamInfo.wsUrl);

	ws.onmessage = (event) => {
		const video = new MediaStream([event.data]);
		videoElement.srcObject = video;
	};
});

socket.on("answer", async (answer: any) => {
	await peerConnection.setRemoteDescription(new RTCSessionDescription(answer));
});

socket.on("ice-candidate", async (candidate: any) => {
	try {
		await peerConnection.addIceCandidate(new RTCIceCandidate(candidate));
	} catch (e) {
		console.error("Error adding received ice candidate", e);
	}
});

async function createOffer() {
	const offer = await peerConnection.createOffer();
	await peerConnection.setLocalDescription(offer);
	socket.emit("offer", offer);
}

createOffer();
