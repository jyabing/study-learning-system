import { BrowserRouter, Routes, Route } from "react-router-dom";
import Home from "./pages/Home";
import Train from "./pages/Train";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/train" element={<Train />} />
      </Routes>
    </BrowserRouter>
  );
}
