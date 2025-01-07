import { createAvatar } from "@dicebear/core";
import { dylan } from "@dicebear/collection";
import { AvatarConfig } from "@/state/features/preferences";

export class Avatar {
	static readonly backgroundColors = [
		"e02929", // RED
		"e08529", // ORANGE
		"e0da29", // YELLOW
		"5de029", // GREEN
		"29e0d4", // CYAN
		"9129e0", // PURPLE
		"e029ce", // PINK
	] as const;

	static readonly hairStyles = [
		"plain",
		"wavy",
		"shortCurls",
		"parting",
		"spiky",
		"roundBob",
		"longCurls",
		"buns",
		"bangs",
		"fluffy",
		"flatTop",
		"shaggy",
	] as const;

	static readonly hairColors = [
		"000000", // BLACK
		"1d5dff", // BLUE
		"ff543d", // ORANGE
		"fff500", // YELLOW
		"ffffff", // WHITE
	] as const;

	static readonly moods = [
		"angry",
		"confused",
		"happy",
		"hopeful",
		"neutral",
		"sad",
		"superHappy",
	] as const;

	static readonly skinColors = [
		"8d5524", // DARK_BROWN
		"c26450", // BROWN
		"e6b087", // MEDIUM
		"ffd6c0", // LIGHT
		"ffe4d3", // PALE
	] as const;

	static cycleProperty<T>(current: T, options: readonly T[]): T {
		const index = options.indexOf(current);
		const nextIndex = (index + 1) % options.length;
		return options[nextIndex];
	}

	static random() {
		return {
			hairStyle:
				this.hairStyles[Math.floor(Math.random() * this.hairStyles.length)],
			hairColor:
				this.hairColors[Math.floor(Math.random() * this.hairColors.length)],
			mood: this.moods[Math.floor(Math.random() * this.moods.length)],
			skinColor:
				this.skinColors[Math.floor(Math.random() * this.skinColors.length)],
			backgroundColor:
				this.backgroundColors[
					Math.floor(Math.random() * this.backgroundColors.length)
				],
		};
	}
}

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
