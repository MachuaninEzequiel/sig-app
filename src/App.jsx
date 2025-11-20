import React from "react";
import MapWrapper from "./components/Map";
import LayerControl from "./components/LayerControl";
import Legend from "./components/Legend";
import Tools from "./components/Tools";
import Editor from "./components/Editor";
import "./App.css";

function App() {
  return (
    <MapWrapper>
      {/* Estos componentes son hijos del mapa y flotarán sobre él */}
      <div className="sidebar">
        <h2 className="title">SIG TPI 2025</h2>
        <LayerControl />
        <Legend />
        <Tools />
        <Editor />
      </div>
    </MapWrapper>
  );
}

export default App;
