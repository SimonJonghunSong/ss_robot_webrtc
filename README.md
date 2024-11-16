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

```javascript
ws = new WebSocket("ws://localhost:3001");
```
