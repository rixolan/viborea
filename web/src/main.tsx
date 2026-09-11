import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { ClerkProvider } from "@clerk/clerk-react";
import { esUY } from "@clerk/localizations";
import App from "./App";
import "./index.css";

const key = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const root = createRoot(document.getElementById("root")!);

root.render(
  <StrictMode>
    {key ? (
      <ClerkProvider
        publishableKey={key}
        localization={esUY}
        appearance={{ layout: { showOptionalFields: true } }}
      >
        <App />
      </ClerkProvider>
    ) : (
      <App />
    )}
  </StrictMode>,
);
