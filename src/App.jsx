import React, { useState } from "react";
import MapWrapper from "./components/Map";
import LayerControl from "./components/LayerControl";
import Legend from "./components/Legend";
import Tools from "./components/Tools";
import Editor from "./components/Editor";
import "./App.css";

function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <MapWrapper>
      {/* Botón de Toggle para el Sidebar */}
      <button
        className={`sidebar-toggle ${sidebarOpen ? "open" : ""}`}
        onClick={() => setSidebarOpen(!sidebarOpen)}
        title={sidebarOpen ? "Ocultar menú" : "Mostrar menú"}
      >
        {sidebarOpen ? "◀" : "▶"}
      </button>

      {/* Barra Lateral con clase condicional */}
      <div className={`sidebar ${sidebarOpen ? "visible" : "hidden"}`}>
        <h2 className="title">SIG TPI 2025</h2>

        {/* Contenedor con scroll para los paneles */}
        <div className="sidebar-content">
          <LayerControl />
          <Tools />
          <Legend />
          <Editor />
        </div>
      </div>
    </MapWrapper>
  );
}

export default App;
