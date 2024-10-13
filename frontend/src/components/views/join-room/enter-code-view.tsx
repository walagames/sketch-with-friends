import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { useDispatch } from "react-redux";
import { Hills } from "@/components/hills";
import { RaisedButton } from "@/components/raised-button";
import { enterRoomCode } from "@/state/features/client";
import { useEffect } from "react";
import { StepForwardIcon } from "lucide-react";
import { clearQueryParams } from "@/lib/params";
import {
	Form,
	FormControl,
	FormField,
	FormItem,
	FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const CodeFormSchema = z.object({
	roomCode: z
		.string()
		.length(6, {
			message: "Room code must be 6 characters long.",
		})
		.regex(/^[A-Za-z]+$/, {
			message: "Room code must contain only letters.",
		}),
});

function CodeForm() {
	const dispatch = useDispatch();
	const searchParams = new URLSearchParams(location.search);
	const roomCodeParam = searchParams.get("room");

	const form = useForm<z.infer<typeof CodeFormSchema>>({
		resolver: zodResolver(CodeFormSchema),
		defaultValues: {
			roomCode: roomCodeParam ?? "",
		},
	});

	useEffect(() => {
		form.setValue("roomCode", roomCodeParam ?? "");
	}, [roomCodeParam, form]);

	function onSubmit(data: z.infer<typeof CodeFormSchema>) {
		dispatch(enterRoomCode(data.roomCode));
	}

	return (
		<Form {...form}>
			<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
				<FormField
					control={form.control}
					name="roomCode"
					render={({ field }) => (
						<FormItem>
							<FormControl>
								<div className="relative">
									<div className="flex items-center gap-3 bg-secondary-foreground rounded-lg">
										<Input
											{...field}
											autoComplete="off"
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
											<StepForwardIcon className="w-6 h-6" />
										</RaisedButton>
									</div>
								</div>
							</FormControl>
							<FormMessage />
						</FormItem>
					)}
				/>
			</form>
		</Form>
	);
}

export function EnterCodeView() {
	const dispatch = useDispatch();

	return (
		<div className="w-full h-full flex flex-col items-center justify-center gap-8 relative">
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
						dispatch(enterRoomCode("new"));
					}}
				>
					Create room
				</RaisedButton>
				<CodeForm />
			</div>
			{/* so that hills still appear on the left when spring overshoots */}
			<Hills className="absolute bottom-0 right-full w-full" />
			<Hills />
		</div>
	);
}
