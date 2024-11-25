import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import { Provider } from "react-redux";
import { persistor, store } from "./state/store";
import { BrowserRouter, Route, Routes } from "react-router";
import { TermsOfService } from "./pages/terms-of-service";
import { PrivacyPolicy } from "./pages/privacy-policy";
import { HowToPlay } from "./pages/how-to-play";
import { PersistGate } from "redux-persist/integration/react";

createRoot(document.getElementById("root")!).render(
	<StrictMode>
		<Provider store={store}>
			<PersistGate loading={null} persistor={persistor}>
				<BrowserRouter>
					<Routes>
						<Route path="/" element={<App />} />
						<Route path="/terms-of-service" element={<TermsOfService />} />
						<Route path="/privacy-policy" element={<PrivacyPolicy />} />
						<Route path="/how-to-play" element={<HowToPlay />} />
					</Routes>
				</BrowserRouter>
			</PersistGate>
		</Provider>
	</StrictMode>
);
