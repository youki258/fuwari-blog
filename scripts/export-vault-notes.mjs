import { pathToFileURL } from "node:url";
import { importDrafts } from "./import-vault-drafts.mjs";

export * from "./import-vault-drafts.mjs";

async function main() {
	await importDrafts({ clean: process.argv.includes("--clean"), force: process.argv.includes("--force") });
}

if (import.meta.url === pathToFileURL(process.argv[1]).href) {
	main().catch((error) => {
		console.error(error.message);
		process.exitCode = 1;
	});
}
