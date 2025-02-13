export function hslToHex(h: number, l: number): string {
	const s = 100; // Saturation is always 100%

	const c = ((1 - Math.abs((2 * l) / 100 - 1)) * s) / 100;
	const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
	const m = l / 100 - c / 2;

	let r, g, b;
	if (h >= 0 && h < 60) {
		[r, g, b] = [c, x, 0];
	} else if (h >= 60 && h < 120) {
		[r, g, b] = [x, c, 0];
	} else if (h >= 120 && h < 180) {
		[r, g, b] = [0, c, x];
	} else if (h >= 180 && h < 240) {
		[r, g, b] = [0, x, c];
	} else if (h >= 240 && h < 300) {
		[r, g, b] = [x, 0, c];
	} else {
		[r, g, b] = [c, 0, x];
	}

	const rgb = [r, g, b].map((v) => Math.round((v + m) * 255));
	return `#${rgb.map((v) => v.toString(16).padStart(2, "0")).join("")}`;
}
