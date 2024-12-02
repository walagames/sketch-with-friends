import { ModalMenu } from "./ui/modal-menu";
import { VolumeControls } from "./ui/volume-controls";

export function UIHeader() {
	return (
		<header className="flex absolute top-5 w-full px-6 justify-between items-center z-50">
			<VolumeControls />
			<ModalMenu />
		</header>
	);
}
