// src/RTSPClient.ts
import Stream from "node-rtsp-stream-es6";

export interface RTSPClientOptions {
	url: string;
	ffmpegOptions?: any;
	port: number;
}

export class RTSPClient {
	private stream: Stream;
	private options: RTSPClientOptions;

	constructor(options: RTSPClientOptions) {
		this.options = options;
		this.stream = new Stream({
			name: "camera-stream",
			streamUrl: this.options.url,
			port: this.options.port,
			ffmpegOptions: this.options.ffmpegOptions || {
				"-stats": "",
				"-r": 30,
				"-s": "640x480",
			},
		});
	}

	public start() {
		console.log(`RTSP Client started for URL: ${this.options.url}`);
		this.stream.start();
	}

	public stop() {
		console.log(`RTSP Client stopped for URL: ${this.options.url}`);
		this.stream.stop();
	}
}
