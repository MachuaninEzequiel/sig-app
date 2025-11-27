import "./components/NavToolbar.css"
import {} from "./components/Tools"
import LayerControl from "./components/LayerControl";
import { useState } from "react";
import "./App.css"
import Tools from "./components/Tools";


function Nav() {

const [sidebarOpen, setSidebarOpen] = useState(true);

    return(
    <div className="nav-toolbar">
        <button
            className={`sidebar-toggle ${sidebarOpen ? "open" : ""}`}
            onClick={() => setSidebarOpen(!sidebarOpen)}
            title={sidebarOpen ? "Ocultar menú" : "Mostrar menú"}
        >
                {sidebarOpen ? "X" : "≡" }
        </button>
        <h2 className="nav-title">GIS TIP 2025</h2>

        <div className="tools-buttons-row">
            
            <Tools />
        </div>

        <div className={`sidebar ${sidebarOpen ? "visible" : "hidden"}`}>
        

        
            <div className="sidebar-content">
                <LayerControl />
                {/*  */}
                {/* <Legend />
                <Editor /> */}
            </div>
        </div>
    </div>
    )
}

export default Nav;