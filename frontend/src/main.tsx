import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { Provider } from "react-redux";
import { store } from "./state/store";
import { BrowserRouter, Route, Routes } from "react-router";
import { TermsOfService } from "./pages/terms-of-service";
import { PrivacyPolicy } from "./pages/privacy-policy";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<Provider store={store}>
			<BrowserRouter>
				<Routes>
					<Route path="/" element={<App />} />
					<Route path="/terms-of-service" element={<TermsOfService />} />
					<Route path="/privacy-policy" element={<PrivacyPolicy />} />
				</Routes>
			</BrowserRouter>
		</Provider>
	</StrictMode>
);
