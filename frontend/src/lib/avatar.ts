import { createAvatar } from "@dicebear/core";
import { dylan } from "@dicebear/collection";

export function generateAvatar(seed: string) {
	const avatar = createAvatar(dylan, {
		seed,
		// backgroundColor: [bgcolor],
	});
	return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
		avatar.toString()
	)}`;
}
