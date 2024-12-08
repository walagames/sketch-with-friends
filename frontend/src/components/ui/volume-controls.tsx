import { Volume2Icon, VolumeXIcon } from "lucide-react";
import { RaisedButton } from "./raised-button";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Slider } from "./slider";
import { useDispatch, useSelector } from "react-redux";
import { changeVolume } from "@/state/features/preferences";
import { RootState } from "@/state/store";

export function VolumeControls() {
	const dispatch = useDispatch();
	const volume = useSelector((state: RootState) => state.preferences.volume);

	return (
		<div>
			<Popover>
				<PopoverTrigger asChild>
					<RaisedButton className="text-xl" variant="default" size="wide" shift>
						Volume
					</RaisedButton>
				</PopoverTrigger>
				<PopoverContent
					side="bottom"
					className="w-80 p-3  rounded-full bg-primary"
				>
					<div className="flex items-center gap-2">
						<VolumeXIcon
							className="size-5 cursor-pointer hover:opacity-70 text-background"
							onClick={() => dispatch(changeVolume(0))}
						/>
						<Slider
							value={[volume]}
							max={1}
							min={0}
							step={0.01}
							onValueChange={(value) => dispatch(changeVolume(value[0]))}
							className="flex-1"
						/>
						<Volume2Icon
							className="size-5 cursor-pointer hover:opacity-70 text-background"
							onClick={() => dispatch(changeVolume(1))}
						/>
					</div>
				</PopoverContent>
			</Popover>
		</div>
	);
}
