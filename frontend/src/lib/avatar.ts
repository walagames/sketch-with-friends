import { createAvatar } from "@dicebear/core";
import { notionists } from "@dicebear/collection";

export function generateAvatar(seed: string, bgcolor: string) {
	const avatar = createAvatar(notionists, {
		seed,
		backgroundColor: [bgcolor],
	});
	return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
		avatar.toString()
	)}`;
}
