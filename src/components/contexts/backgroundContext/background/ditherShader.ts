import { shaderMaterial } from "@react-three/drei";
import * as THREE from "three";

const DitherMaterial = shaderMaterial(
  {
    globalColor1: new THREE.Color("#ffffff"),
    globalColor2: new THREE.Color("#cccccc"),
    globalColor3: new THREE.Color("#999999"),
    globalColor4: new THREE.Color("#666666"),
    globalColor5: new THREE.Color("#333333"),
    globalColor6: new THREE.Color("#000000"),
    time: 0.0,
    mousePosition: new THREE.Vector2(0.5, 0.5),
    mouseIntensity: 0.1,
    colorIntensity: 1.0,
    ditherSize: 512.0,
    hazeAmount: 1.5,
    resolution: new THREE.Vector2(1.0, 1.0),
  },
  `
    varying vec2 vScreenUv;
    uniform vec2 resolution;
    uniform vec2 mousePosition;
    uniform float mouseIntensity;
    uniform float colorIntensity;
    uniform float ditherSize;
    uniform float hazeAmount;

    void main() {
      vec4 clipSpace = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      vScreenUv = clipSpace.xy / clipSpace.w * 0.5 + 0.5;
      gl_Position = clipSpace;
    }
  `,
  `
    precision highp float;

    varying vec2 vScreenUv;
    uniform vec3 globalColor1;
    uniform vec3 globalColor2;
    uniform vec3 globalColor3;
    uniform vec3 globalColor4;
    uniform vec3 globalColor5;
    uniform vec3 globalColor6;
    uniform float time;
    uniform float mouseIntensity;
    uniform float colorIntensity;
    uniform float ditherSize;
    uniform float hazeAmount;
    uniform vec2 mousePosition;
    uniform vec2 resolution;

    vec2 fixAspectRatio(vec2 uv) {
        float aspectRatio = resolution.x / resolution.y;
        return vec2(uv.x * aspectRatio, uv.y);
    }

    float fluidMotion(vec2 uv, float speed, float scale, float strength) {
        return sin(uv.y * scale + time * speed + sin(uv.x * scale * 0.8 + time * speed * 0.5)) * strength;
    }

    vec2 swirlingFlow(vec2 uv, float speed, float scale, float strength) {
        float angle = sin(uv.x * scale + time * speed) * strength;
        return vec2(cos(angle), sin(angle)) * 0.1;
    }

    float mouseWarp(vec2 uv, vec2 mouse, float intensity) {
        float dist = distance(uv, mouse);
        return exp(-dist * 8.0) * intensity;
    }

    float bayerDither(vec2 uv) {
        int x = int(mod(uv.x, 4.0));
        int y = int(mod(uv.y, 4.0));
        int index = y * 4 + x;
        float bayerMatrix[16] = float[16](
            0.0, 0.5, 0.125, 0.625,
            0.75, 0.25, 0.875, 0.375,
            0.1875, 0.6875, 0.0625, 0.5625,
            0.9375, 0.4375, 0.8125, 0.3125
        );
        return bayerMatrix[index];
    }

    void main() {
        vec2 aspectCorrectedUv = fixAspectRatio(vScreenUv);
        vec3 baseColor = globalColor6;
        float flow1 = fluidMotion(aspectCorrectedUv, 0.6, 6.0, 0.3);
        float flow2 = fluidMotion(aspectCorrectedUv * 1.3, -0.8, 9.0, 0.25);
        float flow3 = fluidMotion(aspectCorrectedUv * 0.9, 0.5, 12.0, 0.2);
        vec2 swirl1 = swirlingFlow(aspectCorrectedUv, 0.5, 4.0, 1.2);
        vec2 swirl2 = swirlingFlow(aspectCorrectedUv * 1.1, -0.4, 6.0, 0.8);
        float mouseEffect = mouseWarp(aspectCorrectedUv, mousePosition, mouseIntensity);
        float hazePattern = flow1 * 0.4 + flow2 * 0.3 + flow3 * 0.3 + dot(swirl1 + swirl2, vec2(0.5, 0.5)) + mouseEffect;
        hazePattern = clamp(hazePattern * hazeAmount, 0.0, 1.0);
        hazePattern = pow(hazePattern, 1.1);
        hazePattern *= colorIntensity;
        float stepSize = 1.0 / 5.0;
        vec3 hazeColor;
        if (hazePattern < stepSize) {
            hazeColor = mix(globalColor1, globalColor2, hazePattern / stepSize);
        } else if (hazePattern < stepSize * 2.0) {
            hazeColor = mix(globalColor2, globalColor3, (hazePattern - stepSize) / stepSize);
        } else if (hazePattern < stepSize * 3.0) {
            hazeColor = mix(globalColor3, globalColor4, (hazePattern - stepSize * 2.0) / stepSize);
        } else if (hazePattern < stepSize * 4.0) {
            hazeColor = mix(globalColor4, globalColor5, (hazePattern - stepSize * 3.0) / stepSize);
        } else {
            hazeColor = globalColor5;
        }
        float ditherThreshold = bayerDither(aspectCorrectedUv * ditherSize);
        float ditherMask = step(ditherThreshold, hazePattern);
        float applyDither = smoothstep(0.1, 0.8, hazePattern);
        vec3 finalColor = mix(baseColor, hazeColor, applyDither * ditherMask);
        gl_FragColor = vec4(finalColor, 1.0);
    }
  `,
);

export { DitherMaterial };
