import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { BrowserRouter } from "react-router-dom";
import { Toaster } from "react-hot-toast";

import { store } from "@/app/store";
import { ThemeProvider } from "@/themes/ThemeProvider";
import App from "@/App";
import "@/styles/index.css";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <Provider store={store}>
      <ThemeProvider>
        <BrowserRouter>
          <App />
          <Toaster
            position="top-right"
            toastOptions={{
              duration: 3500,
              style: {
                background: "var(--ui-secondary)",
                color: "var(--text-primary-color)",
                border: "1px solid var(--border-primary-color)",
              },
            }}
          />
        </BrowserRouter>
      </ThemeProvider>
    </Provider>
  </StrictMode>
);
