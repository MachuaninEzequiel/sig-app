import "./components/Nav.css"
import {} from "./components/Tools"
import LayerControl from "./components/LayerControl";
import { useState } from "react";
import "./App.css"
import Tools from "./components/Tools";
import Legend from "./components/Legend";
import Editor from "./components/Editor"
import AnalysisPanel from "./components/AnalysisPanel";



function Nav() {

const [sidebarOpen, setSidebarOpen] = useState(true);
const [analysisPanelOpen, setAnalysisPanelOpen] = useState(false);

    return(
    <div className="nav-toolbar">
        <button
            className={`sidebar-toggle ${sidebarOpen ? "open" : ""}`}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title={sidebarOpen ? "Ocultar menú" : "Mostrar menú"}
        >
                {sidebarOpen ? "X" : "≡" }
        </button>
        <h2 className="nav-title">GIS TPI 2025</h2>

        <div className="tools-buttons-row">
            
            <Tools onToggleAnalysis={() => setAnalysisPanelOpen(!analysisPanelOpen)} />
        </div>
        <div className="leyersidebar">
            <div className={`sidebar ${sidebarOpen ? "visible" : "hidden"}`}>
                    <LayerControl />
                    {/* <Legend/>
                    <Editor /> */}
        
            </div>
        </div>

        {analysisPanelOpen && (
            <AnalysisPanel 
                isOpen={analysisPanelOpen} 
                onClose={() => setAnalysisPanelOpen(false)} 
            />
        )}
        
    </div>
    )
}

export default Nav;