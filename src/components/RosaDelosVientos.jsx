import React, { useContext, useEffect, useRef } from "react";
import { MapContext } from "./Map"; // Ajusta la ruta si es necesario

// Puedes cambiar esta URL por tu imagen local si la tienes en la carpeta public
const COMPASS_IMAGE_URL = "https://st2.depositphotos.com/2068621/5963/v/950/depositphotos_59637131-stock-illustration-north-direction-compass-icon-on.jpg";

const Compass = () => {
  const map = useContext(MapContext);
  const compassImgRef = useRef(null);

  useEffect(() => {
    if (!map || !compassImgRef.current) return;

    const view = map.getView();

    // Función que rota la imagen CSS según la rotación del mapa
    const rotateCompass = () => {
      const rotation = view.getRotation();
      compassImgRef.current.style.transform = `rotate(${rotation}rad)`;
    };

    // Escuchar cambios de rotación
    rotateCompass(); // Inicial
    const key = view.on("change:rotation", rotateCompass);

    return () => {
       if (view) view.un("change:rotation", key);
    };
  }, [map]);

  // --- FUNCIÓN PARA RESETEAR EL NORTE ---
  const handleResetNorth = () => {
    if (!map) return;
    
    // Usamos animate para que gire suavemente hasta 0
    map.getView().animate({
        rotation: 0,
        duration: 500, // Duración en milisegundos (0.5 segundos)
        easing: (t) => t * (2 - t) // Efecto de desaceleración suave
    });
  };

  return (
    <div 
        className="compass-container" 
        onClick={handleResetNorth} // <--- AQUÍ ESTÁ EL EVENTO CLICK
        title="Haga click para resetear el Norte"
    >
      <img 
        ref={compassImgRef}
        src={COMPASS_IMAGE_URL} 
        alt="Norte" 
        className="compass-image"
      />
    </div>
  );
};

export default Compass;