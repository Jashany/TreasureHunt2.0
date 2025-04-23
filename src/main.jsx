import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Provider } from "react-redux"; // Import Provider
import { store } from "./app/store"; // Import store
import "./index.css";
import App from "./App.jsx";
import { BrowserRouter } from "react-router-dom";

createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      {/* Wrap the App with BrowserRouter */}
    <Provider store={store}>
      <App />
    </Provider>
    </BrowserRouter>
  </StrictMode>
);
