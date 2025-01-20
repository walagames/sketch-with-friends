import { generateAvatar } from "@/lib/avatar";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "@/state/store";
import { getDrawingPlayer } from "@/lib/player";
import { SkyScene } from "@/components/scenes/sky-scene";
import { BobbingDoodle } from "@/components/doodle/bobbing-doodle";
import { AnimatePresence } from "framer-motion";
import { selectWord } from "@/state/features/game";
import { RaisedButton } from "@/components/ui/raised-button";

export function PickingView() {
	const players = useSelector((state: RootState) => state.room.players);
	const playerId = useSelector((state: RootState) => state.room.playerId);
	const drawingPlayer = getDrawingPlayer(players);
	if (!drawingPlayer) return null;
	const avatarSvg = generateAvatar(drawingPlayer.avatarConfig);

	const isDrawing = playerId === drawingPlayer.id;

	return (
		<SkyScene>
			{isDrawing ? (
				<WordOptions />
			) : (
				<PlayerIsPicking
					avatarSvg={avatarSvg}
					username={drawingPlayer.username}
				/>
			)}
			<AnimatePresence>
				<BobbingDoodle
					hideOnSmallViewports
					duration={4}
					style={{ top: "20%", left: "12%" }}
					src="/doodles/rain-cloud.png"
				/>
				<BobbingDoodle
					className="lg:w-36 w-28 absolute"
					duration={5}
					style={{ top: "8%", left: "20%" }}
					src="/doodles/rain-cloud.png"
					key="rain-cloud-2"
				/>
				<BobbingDoodle
					hideOnSmallViewports
					duration={4.5}
					style={{ top: "10%", right: "10%" }}
					src="/doodles/rain-cloud.png"
				/>
			</AnimatePresence>
		</SkyScene>
	);
}

function WordOptions() {
	const dispatch = useDispatch();
	const wordOptions = useSelector((state: RootState) => state.game.wordOptions);
	return (
		<div className="flex flex-col items-center justify-center my-auto gap-12">
			<h1 className="text-3xl font-bold">Pick a word to sketch</h1>
			<div className="flex items-start justify-center lg:gap-8 gap-4 px-4 flex-wrap">
				{wordOptions.map((word) => (
					<div key={word.value} className="flex flex-col items-center gap-1.5">
						<RaisedButton
							size="wide"
							onClick={() => dispatch(selectWord(word))}
						>
							<div className="relative z-10 font-semibold flex overflow-hidden w-full max-w-full h-11 rounded-lg -translate-y-0.5">
								<span className="break-words overflow-wrap-anywhere w-full px-8 flex items-center justify-center h-full">
									{word.value}
								</span>
							</div>
						</RaisedButton>
						<p className="text-xs font-semibold text-muted-foreground flex flex-col items-center">
							<span className="capitalize text-sm !text-foreground">
								{word.difficulty}
							</span>
						</p>
					</div>
				))}
			</div>
		</div>
	);
}

function PlayerIsPicking({
	avatarSvg,
	username,
}: {
	avatarSvg: string;
	username: string;
}) {
	return (
		<>
			<img src={avatarSvg} className="w-20 h-20 rounded-lg shadow-accent" />
			<h1 className="text-2xl lg:text-3xl font-bold px-8 lg:px-0 text-center">
				{username} is picking a word to sketch
			</h1>
		</>
	);
}
