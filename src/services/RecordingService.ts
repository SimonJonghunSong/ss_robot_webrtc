import ffmpeg from "fluent-ffmpeg";
import * as fs from "fs";
import * as path from "path";
import { RTCClient } from "../interfaces";

export class RecordingService {
	private readonly recordingsPath: string;

	constructor(recordingsPath: string) {
		this.recordingsPath = recordingsPath;
		this.ensureRecordingDirectory();
	}

	private ensureRecordingDirectory(): void {
		if (!fs.existsSync(this.recordingsPath)) {
			fs.mkdirSync(this.recordingsPath, { recursive: true });
		}
	}

	async startRecording(client: RTCClient): Promise<void> {
		if (client.recording) return;

		const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
		const filename = `recording_${timestamp}.mp4`;
		const outputPath = path.join(this.recordingsPath, filename);

		try {
			const ffmpegCommand = ffmpeg()
				.input("pipe:0")
				.inputFormat("h264")
				.outputFormat("mp4")
				.output(outputPath)
				.on("end", () => {
					console.log(`Recording saved: ${outputPath}`);
				})
				.on("error", (err) => {
					console.error("FFmpeg error:", err);
				});

			const stream = fs.createWriteStream(outputPath);

			client.recording = {
				filename,
				stream,
				ffmpegCommand,
			};

			ffmpegCommand.run();
			console.log(`Started recording: ${filename}`);
		} catch (error) {
			console.error("Failed to start recording:", error);
			throw error;
		}
	}

	async stopRecording(client: RTCClient): Promise<void> {
		if (!client.recording) return;

		try {
			const { stream, ffmpegCommand } = client.recording;
			stream.end();
			ffmpegCommand.kill("SIGKILL");
			delete client.recording;
			console.log("Recording stopped");
		} catch (error) {
			console.error("Failed to stop recording:", error);
			throw error;
		}
	}
}
