import { useDispatch } from "react-redux";

export function PostGameHostView() {
	const dispatch = useDispatch();
	return (
		<div>
			PostGameHostView{" "}
			<button onClick={() => dispatch({ type: "game/startGame" })}>
				start game
			</button>
		</div>
	);
}
