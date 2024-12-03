# README

## Requirements

- OS: Linux
- Architecture: x64
- Node.js 22.x
- npm 10.x

## Installation

### 1

```bash
git clone /path/to/module
```

### 2

패키지를 설치합니다.

```bash
npm install
```

### 3

서버를 실행합니다.

#### 3-1

먼저 미디어 서버를 실행합니다.

```bash
./mediamtx
```

#### 3-2

웹서버/웹소켓 서버를 실행합니다.
서버는 RTSP 스트리밍을 컨버팅하고 웹소켓 서버를 실행합니다.

해당 서버는 Node.js Websocket 모듈을 사용하고 있습니다.

카메라 주소는mediamtx.yml 파일에서 설정할 수 있습니다.

```yaml
# mediamtx.yml 701 line
source: rtsp://127.0.0.1:8554/test
```

```bash
npx ts-node src/server.ts
```

### 4

클라이언트를 실행합니다.

```bash
http://localhost:3001
```

리액트를 사용하는 경우 public/index.html 파일을 리액트 소스 코드 내 public/index.html 파일로 복사해주세요.
이후 리액트 서버를 실행하여 <http://서버주소/index.html> 페이지를 열어주세요.

```javascript
ws = new WebSocket("ws://localhost:3001");
```

### 5

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
