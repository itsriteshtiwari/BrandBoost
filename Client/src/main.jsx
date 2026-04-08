import React from "react";
import ReactDOM from "react-dom/client";
import './index.css'
import App from './App.jsx'
import { BrowserRouter } from "react-router-dom";
import { GoogleOAuthProvider } from "@react-oauth/google";

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <GoogleOAuthProvider clientId="12399447113-6b9ejbmq2q42c9fn5cmkcu91hog0n5eo.apps.googleusercontent.com">
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </GoogleOAuthProvider>
  </React.StrictMode>
);
