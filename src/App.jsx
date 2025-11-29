import React, { useState } from "react";
import MapWrapper from "./components/Map";
import LayerControl from "./components/LayerControl";
import Legend from "./components/Legend";
import Tools from "./components/Tools";
import Editor from "./components/Editor";
import "./App.css";
import Nav from "./nav";

function App() {
  
  const stopPropagation = (e) => {
    e.stopPropagation();
    // e.nativeEvent.stopImmediatePropagation(); // Usar si el anterior no basta
  };

  const [leyendaBtn,setLeyendaBtn] = useState(true)

  return (
    <MapWrapper>



    <div 
        className="nav-container-fix"
        onMouseDown={stopPropagation}
        onClick={stopPropagation}
        onDoubleClick={stopPropagation}
        onWheel={stopPropagation}

        >
        
      <Nav/>
    </div>

    <div className="leyenda-container">
      <div className="leyenda">
        <Legend/>
        <button
        className={`sidebar-toggle ${leyendaBtn ? "open" : ""}`}
            onClick={() => setLeyendaBtn(!leyendaBtn)}
            title={leyendaBtn ? "Ocultar menú" : "Mostrar menú"}
        >
                {leyendaBtn ? "X" : "+" }
        </button>
      </div>
    </div>
      

    </MapWrapper>
  );
}

export default App;
