import Stream from "node-rtsp-stream-es6";

class RTSPClient {
	private client: Stream;

	constructor() {
		this.client = new Stream({
			name: "name",
			streamUrl: "url",
		});
	}
}
