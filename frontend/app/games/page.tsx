"use client";
import { useRoomContext } from "@/components/room/room-provider";
import Canvas from "@/components/canvas/canvas";
import { RoomForm } from "@/components/room/room-form";
import color from "tinycolor2";
import { snap } from "@popmotion/popcorn";
import {
	animate,
	motion,
	MotionValue,
	useMotionValue,
	useTransform,
	transform,
	easeInOut,
} from "framer-motion";
import * as React from "react";
import { Button } from "@/components/ui/button";

type AlignUnion = "start" | "center" | "end";

type PageViewContextProps = {
	align: AlignUnion;
	index: number;
	frameSize: number;
	trackSize: number;
	trackXOffset: MotionValue;
};

const PageContext = React.createContext<PageViewContextProps | undefined>(
	undefined
);

const usePageContext = () => {
	const contextValue = React.useContext(PageContext);
	if (!contextValue) {
		throw new Error("Missing context");
	}
	return contextValue;
};

const viewSize = 750;
const alignOptions = { start: 0, center: 0.5, end: 1 };

export function View({
	width,
	height,
	color,
}: {
	width: number;
	height: number;
	color: string;
}) {
	const { align, frameSize, index, trackSize, trackXOffset } = usePageContext();
	const initialOffset = index * viewSize;
	const alignOffset = (frameSize - viewSize) * alignOptions[align];

	const startOffset = useTransform(trackXOffset, (value) => {
		let startOffset = initialOffset + value;

		while (startOffset > trackSize - viewSize - alignOffset) {
			startOffset -= trackSize;
		}

		while (startOffset < 0 - viewSize - alignOffset) {
			startOffset += trackSize;
		}

		return startOffset + alignOffset;
	});

	// Duplicating startOffset from above for now since
	// styles don't get applied on initial render otherwise.
	// This seems due to stale values for some reason.
	const normalOffset = useTransform(trackXOffset, (value) => {
		let startOffset = initialOffset + value;

		while (startOffset > trackSize - viewSize - alignOffset) {
			startOffset -= trackSize;
		}

		while (startOffset < 0 - viewSize - alignOffset) {
			startOffset += trackSize;
		}

		startOffset += alignOffset;

		const staticOffset = startOffset - alignOffset - trackXOffset.get();
		const getNormalOffset = transform(
			[-staticOffset - viewSize, -staticOffset, -staticOffset + viewSize],
			[-1, 0, 1]
		);
		return getNormalOffset(trackXOffset.get());
	});

	const opacity = useTransform(normalOffset, [-1, 0, 1], [0.6, 1, 0.6]);
	const scale = useTransform(normalOffset, [-1, 0, 1], [0.6, 1, 0.6]);
	const rotate = useTransform(normalOffset, [-1, 0, 1], [-9, 0, 9]);

	return (
		<motion.div
			style={{
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				position: "absolute",
				backgroundColor: color,
				x: startOffset,
				y: 0,
				width: viewSize,
				height: viewSize * .7,
				borderRadius: 16,
				opacity,
				scale,
				rotate,
			}}
		/>
	);
}

type PagerViewProps = {
	align?: AlignUnion;
	children: React.ReactNode;
	items: {
		color: string;
		id: number;
	}[];
};

export function Page({ align, items, children }: PagerViewProps) {
	const frameRef = React.useRef();
	const resizeObserverRef = React.useRef();
	const [frameSize, setFrameSize] = React.useState(-1);
	const trackSize = React.Children.count(children) * viewSize;
	const trackXOffset = useMotionValue(0);
	// const colors = React.useMemo(() => items.map((item) => item.color), [items]);
	// // Get a fractional index based on trackXOffset
	// const fractionalIndex = useTransform(trackXOffset, (value) =>
	// 	Math.abs((value / viewSize) % 5)
	// );

	// // Use fractional index to interpolate between colors
	// const backgroundColor = useTransform(fractionalIndex, (index) => {
	// 	const i = Math.floor(index);
	// 	const t = index - i;
	// 	const color1 = colors[i];
	// 	const color2 = colors[(i + 1) % colors.length];
	// 	console.log(color1, color2);
	// 	return interpolateColors(color1, color2, t);
	// });

	// // Helper function to interpolate between two hex colors
	// function interpolateColors(color1, color2, t) {
	// 	const c1 = hexToRgb(color1);
	// 	const c2 = hexToRgb(color2);
	// 	const r = Math.round(c1.r + (c2.r - c1.r) * t);
	// 	const g = Math.round(c1.g + (c2.g - c1.g) * t);
	// 	const b = Math.round(c1.b + (c2.b - c1.b) * t);
	// 	return `rgba(${r}, ${g}, ${b}, .5)`;
	// }

	// // Helper function to convert hex color to rgb
	// function hexToRgb(hex) {
	// 	let shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
	// 	hex = hex.replace(shorthandRegex, function (m, r, g, b) {
	// 		return r + r + g + g + b + b;
	// 	});

	// 	let result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
	// 	return result
	// 		? {
	// 				r: parseInt(result[1], 16),
	// 				g: parseInt(result[2], 16),
	// 				b: parseInt(result[3], 16),
	// 		  }
	// 		: null;
	// }

	const snapTo = snap(viewSize);
	const moveTrackPosition = (amount: number) => {
		const nextXOffset = trackXOffset.get() + amount;
		animate(trackXOffset, snapTo(nextXOffset), {
			type: "spring",
			damping: 50,
			stiffness: 500,
		});
	};

	React.useLayoutEffect(() => {
		setFrameSize(frameRef.current.offsetWidth);
	}, []);

	React.useLayoutEffect(() => {
		resizeObserverRef.current = new ResizeObserver(() => {
			setFrameSize(frameRef.current.offsetWidth);
		});
		resizeObserverRef.current.observe(frameRef.current);
		return () => {
			resizeObserverRef.current.disconnect();
		};
	}, []);

	return (
		<motion.div
			className="flex flex-col items-center justify-center overflow-hidden"
			style={{
				width: "100%",
				height: "100vh",

				// backgroundColor,
			}}
		>
			<motion.div ref={frameRef} style={{ overflow: "hidden" }} className="">
				<motion.div
					className="flex items-center"
					drag="x"
					_dragX={trackXOffset}
					dragTransition={{
						power: .2,
						timeConstant: 100,
						bounceStiffness: 100,
						modifyTarget: (value) => snapTo(value),
					}}
					style={{
						position: "relative",
						height: viewSize,
						width: trackSize,
					}}
				>
					{React.Children.map(children, (child, index) => (
						<PageContext.Provider
							value={{
								index,
								align,
								frameSize,
								trackSize,
								trackXOffset,
							}}
						>
							{child}
						</PageContext.Provider>
					))}
				</motion.div>
			</motion.div>
			<div
				className="flex absolute top-0 left-0 "
			>
				<Button onClick={() => moveTrackPosition(viewSize)}>Prev</Button>
				<Button onClick={() => moveTrackPosition(-viewSize)}>Next</Button>
			</div>
		</motion.div>
	);
}

export default function Home() {
	const { room } = useRoomContext();

	// TODO: useMemo on room.status to render form or room view
	// TODO: use roomRole to render player or host view
	// TODO: use gameRole to render drawing or guessing view
	const items = [
		{ id: 1, color: generateGradient(1 * 200) },
		{ id: 2, color: generateGradient(2 * 200) },
		{ id: 3, color: generateGradient(3 * 200) },
		{ id: 4, color: generateGradient(4 * 200) },
		{ id: 5, color: generateGradient(5 * 200) },
	];

	return (
		<main
			style={{ background: "linear-gradient(#0e101c, #1c164c)" }}
			className="flex min-h-screen flex-col items-center justify-center"
		>
			<Page items={items} align="center">
				{items.map((item, index) => (
					<View key={item.id} width={500} height={500} color={item.color} />
				))}
			</Page>
		</main>
	);
}

const gradients = new Map();

export function generateGradient(hue: number) {
	if (gradients.has(hue)) {
		return gradients.get(hue);
	} else {
		const gradient = color({ h: hue % 360, s: 0.9, l: 0.6 })
			.analogous()
			.slice(0, 2)
			.map((color) => color.toHexString())[0];

		console.log(gradient);
		gradients.set(hue, gradient);
		return gradient;
	}
}
