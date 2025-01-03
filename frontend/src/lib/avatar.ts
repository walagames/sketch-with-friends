import { createAvatar } from "@dicebear/core";
import { dylan } from "@dicebear/collection";
import { AvatarConfig } from "@/state/features/preferences";

export function generateAvatar(config: AvatarConfig) {
	const avatar = createAvatar(dylan, {
		hair: [config.hairStyle],
		hairColor: [config.hairColor],
		mood: [config.mood],
		skinColor: [config.skinColor],
		backgroundColor: [config.backgroundColor],
	});
	return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(
		avatar.toString()
	)}`;
}
