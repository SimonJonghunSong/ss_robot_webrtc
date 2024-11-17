# README

## Requirements

- Node.js 22.x
- npm 10.x

## Installation

1

```bash
git clone /path/to/module
```

2

패키지를 설치합니다.

```javascript
npm install
```

3
서버를 실행합니다.
서버는 RTSP 스트리밍을 컨버팅하고 웹소켓 서버를 실행합니다.

해당 서버는 Node.js Websocket 모듈을 사용하고 있습니다.

```javascript
npx ts-node src/server.ts
```

4

클라이언트를 실행합니다.

public/index.html 파일을 브라우저에서 열어주세요.
67 line 부분에서 웹소켓 서버의 주소를 변경해주세요(샘플코드 - 3001번 포트 사용).

리액트를 사용하는 경우 public/index.html 파일을 리액트 소스 코드 내 public/index.html 파일로 복사해주세요.
복사한 다음 리액트 서버를 실행하여 <http://서버주소/index.html> 페이지를 열어주세요.

```javascript
ws = new WebSocket("ws://localhost:3001");
```

5

서버 연동 가이드

## WebSocket 이벤트 핸들링

- WebSocket 객체는 onopen, onmessage, onclose, onerror 이벤트를 지원합니다.

### 녹화 시작 요청

```javascript
ws.send(
	JSON.stringify({
		type: "startRecording",
	}),
);
```

### 녹화 종료 요청

```javascript
ws.send(
	JSON.stringify({
		type: "stopRecording",
	}),
);
```

### 스트리밍 처리

```javascript
ws.binaryType = "arraybuffer"; // ArrayBuffer 설정

ws.onmessage = (event) => {
	if (event.data instanceof ArrayBuffer) {
		const chunk = new Uint8Array(event.data);
		// MediaSource에 비디오 데이터 추가
		sourceBuffer.appendBuffer(chunk);
	}
};
```
