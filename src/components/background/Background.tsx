"use client";

import React, { useRef, useState, useEffect } from "react";
import { Canvas, useFrame, useThree, extend , ThreeElements} from "@react-three/fiber";
import * as THREE from "three";
import { DitherMaterial } from "./ditherShader";
import { globalColors } from '../../../colors.js';

extend({ DitherMaterial });

/* eslint-disable @typescript-eslint/no-namespace */
declare global {
  namespace React.JSX {
    interface IntrinsicElements {
      ditherMaterial: ThreeElements["shaderMaterial"];
    }
  }
}
/* eslint-enable @typescript-eslint/no-namespace */

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
      ref.current.material.uniforms.time.value = clock.getElapsedTime() * 0.1;
      ref.current.material.uniforms.resolution.value.set(size.width, size.height);
      ref.current.material.uniforms.mousePosition.value.set(mousePos.x, mousePos.y);
      ref.current.material.uniforms.globalColor1.value.set(globalColors.globalColor1);
      ref.current.material.uniforms.globalColor2.value.set(globalColors.globalColor2);
      ref.current.material.uniforms.globalColor3.value.set(globalColors.globalColor3);
      ref.current.material.uniforms.globalColor4.value.set(globalColors.globalColor4);
      ref.current.material.uniforms.globalColor5.value.set(globalColors.globalColor5);
      ref.current.material.uniforms.globalColor6.value.set(globalColors.globalColor6);
    }
  });

  return (
    <mesh ref={ref} scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[2, 2]} />
      <ditherMaterial />
    </mesh>
  );
}

export default function Background(){
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
