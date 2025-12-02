import React, { useState } from "react";
import MapWrapper from "./components/Map";
import LayerControl from "./components/LayerControl";
import Legend from "./components/Legend";
import Tools from "./components/Tools";
import Editor from "./components/Editor";
import "./App.css";
import Nav from "./nav";
import  Compass from "./components/RosaDelosVientos"

function App() {

  const stopPropagation = (e) => {
    e.stopPropagation();
    // e.nativeEvent.stopImmediatePropagation(); // Usar si el anterior no basta
  };

  const [leyendaBtn, setLeyendaBtn] = useState(true);
  const [editorVisible, setEditorVisible] = useState(false);

  return (
    <MapWrapper>



    <div
        className="nav-container-fix"
        onMouseDown={stopPropagation}
        onClick={stopPropagation}
        onDoubleClick={stopPropagation}
        onWheel={stopPropagation}
        >
      <Nav editorVisible={editorVisible} setEditorVisible={setEditorVisible} />
    </div>

    <div className="leyenda">
        <Legend leyendaBtn={leyendaBtn} setLeyendaBtn={setLeyendaBtn}/>
    </div>

    {/* Panel de edición */}
    {editorVisible && (
      <div
        className="editor-container"
        onMouseDown={stopPropagation}
        onClick={stopPropagation}
        onDoubleClick={stopPropagation}
        onWheel={stopPropagation}
      >
        <Editor onClose={() => setEditorVisible(false)} />
      </div>
    )}

    <Compass/>
    </MapWrapper>
  );
}

export default App;
