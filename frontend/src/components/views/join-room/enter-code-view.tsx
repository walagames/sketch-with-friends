import { Input } from "@/components/ui/input";
import { motion } from "framer-motion";
import { useDispatch } from "react-redux";
import { Hills } from "@/components/hills";
import { useDirectionAnimation } from "@/App";
import { RaisedButton } from "@/components/raised-button";
import { enterRoomCode } from "@/state/features/client";
import { useState } from "react";
import { ArrowRightIcon } from "lucide-react";
import { clearQueryParams } from "@/lib/params";
export function EnterCodeView() {
	const animationProps = useDirectionAnimation();
	const dispatch = useDispatch();

	const searchParams = new URLSearchParams(location.search);
	const roomCodeParam = searchParams.get("room");

	const [roomCode, setRoomCode] = useState(roomCodeParam ?? "");

	function onSubmit(code: string) {
		dispatch(enterRoomCode(code));
	}

	return (
		<motion.div
			{...animationProps}
			className="w-full h-full absolute inset-0 flex flex-col items-center justify-center gap-8"
		>
			<div className="flex items-center gap-3">
				<img
					className=""
					src="/logo-full.png"
					alt="logo"
					width={230}
					height={102}
				/>
			</div>
			<div className="flex flex-col items-center gap-4">
				<RaisedButton
					size="xl"
					variant="action"
					className="w-full"
					onClick={() => {
						clearQueryParams();
						onSubmit("new");
					}}
				>
					Create room
				</RaisedButton>
				<form
					onSubmit={(e) => {
						e.preventDefault();
						onSubmit(e.currentTarget.roomCode.value);
					}}
					className="flex items-center gap-3 relative"
				>
					<div className="relative ">
						<div className="flex items-center gap-3 bg-secondary-foreground rounded-lg">
							<Input
								name="roomCode"
								autoComplete="off"
								value={roomCode}
								onChange={(e) => setRoomCode(e.target.value)}
								placeholder="Room code"
								className="font-bold text-xl text-zinc-400 placeholder:text-zinc-400 bg-background rounded-lg h-14 px-4 py-3.5 w-64 -translate-y-1.5 translate-x-1.5"
							/>
						</div>
						<div className="absolute -right-14 top-2">
							<RaisedButton
								type="submit"
								shift={false}
								variant="action"
								size="icon"
							>
								<ArrowRightIcon className="w-6 h-6" />
							</RaisedButton>
						</div>
					</div>
				</form>
			</div>
			<Hills />
		</motion.div>
	);
}
