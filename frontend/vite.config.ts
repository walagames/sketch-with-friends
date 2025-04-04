import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import * as path from "path";
// https://vitejs.dev/config/
export default defineConfig({
	plugins: [react()],
	resolve: {
		alias: [{ find: "@", replacement: path.resolve(__dirname, "src") }],
	},
	server: {
		port: 3000,
	},
	define: {
		"import.meta.env.BRANCH_SOCKET_HOST": JSON.stringify(
			`${process.env.CF_PAGES_BRANCH}-realtime.sketchwithfriends.com`
		),
	},
});
