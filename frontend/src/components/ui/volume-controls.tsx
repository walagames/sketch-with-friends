import { Volume2Icon, VolumeXIcon, Volume1Icon } from "lucide-react";
import { RaisedButton } from "./raised-button";
import { Popover, PopoverContent, PopoverTrigger } from "./popover";
import { Slider } from "./slider";
import { useDispatch, useSelector } from "react-redux";
import { changeVolume } from "@/state/features/preferences";
import { RootState } from "@/state/store";

export function VolumeControls() {
	const dispatch = useDispatch();
	const volume = useSelector((state: RootState) => state.preferences.volume);

	const VolumeIcon =
		volume === null || volume === 0
			? VolumeXIcon
			: volume <= 0.5
			? Volume1Icon
			: Volume2Icon;

	return (
		<div className="absolute top-4 left-4 z-50">
			<Popover>
				<PopoverTrigger asChild>
					<RaisedButton variant="action" size="icon">
						<VolumeIcon className="size-6" />
					</RaisedButton>
				</PopoverTrigger>
				<PopoverContent side="left" className="w-80 px-3 py-3">
					<div className="flex items-center gap-2">
						<VolumeXIcon
							className="size-5 cursor-pointer hover:opacity-70"
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
							className="size-5 cursor-pointer hover:opacity-70"
							onClick={() => dispatch(changeVolume(1))}
						/>
					</div>
				</PopoverContent>
			</Popover>
		</div>
	);
}