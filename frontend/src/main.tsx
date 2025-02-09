import { StrictMode } from "react"
import { createRoot } from "react-dom/client"
import "./index.css"
import App from "./pages/App"
import { BrowserRouter, Route, Routes } from "react-router"
import Auth from "./pages/Auth"
import { Toaster } from "@/components/ui/toaster"

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route path="/auth" element={<Auth />} />
      </Routes>
      <Toaster />
    </BrowserRouter>
  </StrictMode>
)
