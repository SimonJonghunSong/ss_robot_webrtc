# Installation

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

ts-node로 웹서버를 실행합니다.

```
npx ts-node src/server.ts

src/server.ts : 컨버팅용 서버
public/index.html : 스트리밍 소켓 연결을 위한 클라이언트
