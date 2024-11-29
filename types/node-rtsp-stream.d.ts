declare module "node-rtsp-stream" {
	class RTSPClient {
		constructor(any);
		start(): void;
		stop(): void;
		close(): void;
		on(any, any): void;
		connect(): void;
	}
	export = RTSPClient;
}
