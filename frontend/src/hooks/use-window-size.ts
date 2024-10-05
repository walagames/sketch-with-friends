import React from "react";

interface UseWindowSizeOptions {
	maxWidth?: number;
	maxHeight?: number;
}

export const useWindowSize = (
	options?: UseWindowSizeOptions,
): [number, number] => {
	const [width, setWidth] = React.useState(0);
	const [height, setHeight] = React.useState(0);

	const handleResize = React.useCallback(() => {
		const maxWidth = options?.maxWidth || window.innerWidth;
		const maxHeight = options?.maxHeight || window.innerHeight;

		setWidth(Math.min(window.innerWidth, maxWidth));
		setHeight(Math.min(window.innerHeight, maxHeight));
	}, [options]);

	React.useEffect(() => {
		// Initialize dimensions on mount
		handleResize();

		window.addEventListener("resize", handleResize);

		// Cleanup event listener on unmount
		return () => window.removeEventListener("resize", handleResize);
	}, [handleResize]);

	return [width, height];
};
