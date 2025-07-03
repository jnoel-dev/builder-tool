"use client";

import React, { useRef, useState, useEffect } from "react";
import { Canvas, useFrame, useThree, extend, ThreeElements } from "@react-three/fiber";
import * as THREE from "three";
import { DitherMaterial } from "./ditherShader";
import { useThemeColors } from "../themeManager/ThemeManager";

extend({ DitherMaterial });

declare global {
  namespace React.JSX {
    interface IntrinsicElements {
      ditherMaterial: ThreeElements["shaderMaterial"];
    }
  }
}

interface DitherMaterialUniforms extends Record<string, THREE.IUniform<unknown>> {
  time: { value: number };
  resolution: { value: THREE.Vector2 };
  mousePosition: { value: THREE.Vector2 };
  globalColor1: { value: THREE.Color };
  globalColor2: { value: THREE.Color };
  globalColor3: { value: THREE.Color };
  globalColor4: { value: THREE.Color };
  globalColor5: { value: THREE.Color };
  globalColor6: { value: THREE.Color };
}

interface DitherMaterialType extends THREE.ShaderMaterial {
  uniforms: DitherMaterialUniforms;
}

function FullscreenPlane(): React.JSX.Element {
  const ref = useRef<THREE.Mesh<THREE.PlaneGeometry, DitherMaterialType> | null>(null);
  const { viewport, size } = useThree();
  const [mousePos, setMousePos] = useState<{ x: number; y: number }>({ x: 0.5, y: 0.5 });

  const { colors } = useThemeColors(); 

  useEffect(() => {
    const updateMousePosition = (event: MouseEvent): void => {
      const aspectRatio = size.width / size.height;
      const x = event.clientX / size.width;
      const y = 1.0 - event.clientY / size.height;
      const correctedX = x * aspectRatio;
      setMousePos({ x: correctedX, y });
    };

    window.addEventListener("mousemove", updateMousePosition);
    return () => window.removeEventListener("mousemove", updateMousePosition);
  }, [size]);




  useFrame(({ clock }) => {
  
    if (ref.current) {
      const material = ref.current.material;
      material.uniforms.time.value = clock.getElapsedTime() * 0.1;
      material.uniforms.resolution.value.set(size.width, size.height);
      material.uniforms.mousePosition.value.set(mousePos.x, mousePos.y);

      const baseColor = new THREE.Color(colors[2]).multiplyScalar(6.0);
      material.uniforms.globalColor1.value.copy(baseColor);

      for (let i = 1; i <= 5; i++) {
        const brighterColor = baseColor.clone();
        brighterColor.multiplyScalar(1 + (5 - i) * 0.5);
        (material.uniforms[`globalColor${i + 1}`].value as THREE.Color).copy(brighterColor);
      }
    }
  });



  return (
    <mesh ref={ref} scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[2, 2]} />
      <ditherMaterial />
    </mesh>
  );
}

export default function Background() {
  return (
    <Canvas
      orthographic
      camera={{ zoom: 100, position: [0, 0, 1] }}
      style={{ position: "absolute", width: "100vw", height: "100vh" }}
    >
      <FullscreenPlane />
    </Canvas>
  );
}
