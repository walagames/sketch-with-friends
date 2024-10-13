import { useDispatch } from "react-redux";

export function PostGameHostView() {
	const dispatch = useDispatch();

	return (
		<div className="flex h-full flex-col items-center justify-center w-full">
			PostGameHostView{" "}
			<button onClick={() => dispatch({ type: "game/startGame" })}>
				start game
			</button>
		</div>
	);
}
