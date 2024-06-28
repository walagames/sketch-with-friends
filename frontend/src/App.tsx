import "./App.css";
import JoinRoomCard from "@/components/join-room";
import { useRoomContext } from "@/components/room-provider";
import Canvas from "@/components/canvas";
function App() {
	const { state } = useRoomContext();
	return (
		<main className="flex flex-1 flex-col items-center">
			{state.code ? <Canvas /> : <JoinRoomCard />}
		</main>
	);
}

export default App;