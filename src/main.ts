/**
 * 아래 코드는 서버2에서 실행되는 예제 코드입니다.
 * 카메라 영상 주소를 전달받아 아래 코드를 실행하면 RTSP 서버가 실행됩니다.
 */
import { RTSPClient, RTSPClientOptions } from "./RTSPClient";

const options: RTSPClientOptions = {
	url: "rtsp://210.99.70.120:1935/live/cctv061.stream", // 카메라 영상 주소
	port: 9999,
};

const client = new RTSPClient(options);

// Start the RTSP server
client.start();
