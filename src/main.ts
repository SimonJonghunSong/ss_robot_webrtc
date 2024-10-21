import { RTSPClient } from "./RTSPClient";
async function main() {
	const client = new RTSPClient({
		url: "rstp",
		wsPort: 9999,
	});

	client.start();
}

main();
