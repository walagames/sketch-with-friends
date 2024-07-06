import { useEffect } from "react";

export function useResize(
	canvasRef: React.RefObject<HTMLCanvasElement>,
	containerRef: React.RefObject<HTMLDivElement>,
	draw: () => void
) {
	useEffect(() => {
		// Handler to call on window resize
		function handleResize() {
			// Set window width/height to state
			if (canvasRef.current && containerRef.current) {
				canvasRef.current.width = containerRef.current.clientWidth * 2;
				canvasRef.current.height = containerRef.current.clientHeight * 2;
				canvasRef.current.style.width = `${containerRef.current.clientWidth}px`;
				canvasRef.current.style.height = `${containerRef.current.clientHeight}px`;
				draw();
			}
		}
		// Add event listener
		window.addEventListener("resize", handleResize);
		// Call handler right away so state gets updated with initial window size
		handleResize();
		// Remove event listener on cleanup
		return () => window.removeEventListener("resize", handleResize);
	}, []);
}
