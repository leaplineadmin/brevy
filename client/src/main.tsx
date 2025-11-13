import { createRoot } from "react-dom/client";
import App from "./App";
import "./index.css";
import "./styles/globals.css";
import "./lib/cv-templates/styles/template-classic.css";
import "./lib/cv-templates/styles/template-boxes.css";
import "./lib/cv-templates/styles/template-technical.css";
import "./lib/cv-templates/styles/template-bento.css";
import "./lib/cv-templates/styles/template-datalover.css";
//import "./lib/cv-templates/styles/mobile-preview-overrides.css";

createRoot(document.getElementById("root")!).render(<App />);
