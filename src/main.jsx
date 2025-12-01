import CardPrinterPage from "./routes/CardPrinterPage";
import LinkMaker from "./routes/MultiPlayerFormatLinkMaker";
import HomePage from "./routes/HomePage";
import { createRoot } from "react-dom/client";
import { StrictMode } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";

const rootElement = document.getElementById("root");
if (rootElement) {
    const root = createRoot(rootElement);
    root.render(
        <StrictMode>
            <BrowserRouter basename="/yugioh-tools">
                <Routes>
                    <Route path="/*" element={<HomePage />} />
                    <Route path="card-printer" element={<CardPrinterPage />} />
                    <Route path="link-maker" element={<LinkMaker />} />
                </Routes>
            </BrowserRouter>
        </StrictMode>
    );
}
