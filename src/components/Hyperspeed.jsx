import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { BloomEffect, EffectComposer, EffectPass, RenderPass, SMAAEffect, SMAAPreset } from 'postprocessing';
import './Hyperspeed.css';

const DEFAULT_EFFECT_OPTIONS = {
    distortion: 'turbulentDistortion',
    length: 400,
    roadWidth: 10,
    islandWidth: 2,
    lanesPerRoad: 4,
    fov: 90,
    fovSpeedUp: 150,
    speedUp: 2,
    carLightsFade: 0.4,
    totalSideLightSticks: 20,
    lightPairsPerRoadWay: 40,
    shoulderLinesWidthPercentage: 0.05,
    brokenLinesWidthPercentage: 0.1,
    brokenLinesLengthPercentage: 0.5,
    lightStickWidth: [0.12, 0.5],
    lightStickHeight: [1.3, 1.7],
    movingAwaySpeed: [60, 80],
    movingCloserSpeed: [-120, -160],
    carLightsLength: [12, 80],
    carLightsRadius: [0.05, 0.14],
    carWidthPercentage: [0.3, 0.5],
    carShiftX: [-0.8, 0.8],
    carFloorSeparation: [0, 5],
    colors: {
        roadColor: 0x080808,
        islandColor: 0x0a0a0a,
        background: 0x000000,
        shoulderLines: 0xffffff,
        brokenLines: 0xffffff,
        leftCars: [0xd856bf, 0x6750a2, 0xc247ac],
        rightCars: [0x03b3c3, 0x0e5ea5, 0x324555],
        sticks: 0x03b3c3
    }
};

const Hyperspeed = ({ effectOptions = DEFAULT_EFFECT_OPTIONS }) => {
    const containerRef = useRef(null);
    const appRef = useRef(null);

    useEffect(() => {
        const container = containerRef.current;
        if (!container) return undefined;

        const options = {
            ...DEFAULT_EFFECT_OPTIONS,
            ...effectOptions,
            colors: {
                ...DEFAULT_EFFECT_OPTIONS.colors,
                ...(effectOptions.colors || {})
            }
        };

        const width = Math.max(1, container.clientWidth || container.offsetWidth || 1);
        const height = Math.max(1, container.clientHeight || container.offsetHeight || 1);

        const scene = new THREE.Scene();
        scene.background = new THREE.Color(options.colors.background);

        const camera = new THREE.PerspectiveCamera(options.fov, width / height, 0.1, 2000);
        camera.position.z = 2;

        const renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
        renderer.setPixelRatio(window.devicePixelRatio || 1);
        renderer.setSize(width, height, false);
        renderer.setClearColor(0x000000, 0);
        container.appendChild(renderer.domElement);

        const composer = new EffectComposer(renderer);
        composer.addPass(new RenderPass(scene, camera));
        composer.addPass(
            new EffectPass(
                camera,
                new BloomEffect({
                    luminanceThreshold: 0.18,
                    luminanceSmoothing: 0.4,
                    intensity: 1.3,
                    resolutionScale: 1
                }),
                new SMAAEffect({
                    preset: SMAAPreset.MEDIUM,
                    searchImage: SMAAEffect.searchImageDataURL,
                    areaImage: SMAAEffect.areaImageDataURL
                })
            )
        );

        const geometry = new THREE.PlaneGeometry(2, 2, 1, 1);
        const material = new THREE.ShaderMaterial({
            transparent: true,
            depthWrite: false,
            uniforms: {
                uTime: { value: 0 },
                uResolution: { value: new THREE.Vector2(width, height) },
                uPrimary: { value: new THREE.Color(0x5227ff) },
                uSecondary: { value: new THREE.Color(0x03b3c3) },
                uBackground: { value: new THREE.Color(options.colors.background) }
            },
            vertexShader: `
        varying vec2 vUv;
        void main() {
          vUv = uv;
          gl_Position = vec4(position, 1.0);
        }
      `,
            fragmentShader: `
        precision highp float;

        varying vec2 vUv;
        uniform float uTime;
        uniform vec2 uResolution;
        uniform vec3 uPrimary;
        uniform vec3 uSecondary;
        uniform vec3 uBackground;

        float hash(vec2 p) {
          return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453123);
        }

        float noise(vec2 p) {
          vec2 i = floor(p);
          vec2 f = fract(p);
          float a = hash(i);
          float b = hash(i + vec2(1.0, 0.0));
          float c = hash(i + vec2(0.0, 1.0));
          float d = hash(i + vec2(1.0, 1.0));
          vec2 u = f * f * (3.0 - 2.0 * f);
          return mix(a, b, u.x) + (c - a) * u.y * (1.0 - u.x) + (d - b) * u.x * u.y;
        }

        float line(float x, float width) {
          return smoothstep(width, 0.0, abs(x));
        }

        void main() {
          vec2 uv = vUv;
          vec2 p = uv * 2.0 - 1.0;
          p.x *= uResolution.x / uResolution.y;

          float depth = 1.0 - uv.y;
          float perspective = 1.0 / max(0.25, depth);
          float travel = uTime * 0.8;

          vec3 color = uBackground;

          float tunnel = smoothstep(1.3, 0.1, length(p * vec2(1.0, 0.9)));
          color += tunnel * mix(uPrimary, uSecondary, noise(p * 3.0 + uTime * 0.08)) * 0.08;

          float roadMask = smoothstep(0.9, 0.15, abs(p.x));
          float lanes = 0.0;
          float laneCount = 4.0;
          for (float i = -2.0; i <= 2.0; i += 1.0) {
            float laneX = i / laneCount;
            float animated = fract((uv.y * perspective * 2.5) - travel * 0.25);
            float dash = line(fract(animated * 8.0) - 0.5, 0.035);
            lanes += dash * smoothstep(0.12, 0.0, abs(p.x - laneX));
          }

          float speedLines = 0.0;
          for (float i = 0.0; i < 14.0; i += 1.0) {
            float seed = i / 14.0;
            float x = fract(seed * 13.37 + uTime * 0.06) * 2.0 - 1.0;
            float width = mix(0.006, 0.035, seed);
            speedLines += smoothstep(width, 0.0, abs(p.x - x)) * smoothstep(1.1, 0.0, depth);
          }

          float glow = speedLines * 0.28 + lanes * 0.65;
          color += uPrimary * glow;
          color += uSecondary * speedLines * 0.12;
          color += roadMask * vec3(0.03, 0.03, 0.04);

          float vignette = smoothstep(1.5, 0.2, length(p));
          color *= vignette;

          gl_FragColor = vec4(color, 1.0);
        }
      `
        });

        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);

        const clock = new THREE.Clock();
        let frameId = 0;

        const resize = () => {
            const nextWidth = Math.max(1, container.clientWidth || container.offsetWidth || 1);
            const nextHeight = Math.max(1, container.clientHeight || container.offsetHeight || 1);
            camera.aspect = nextWidth / nextHeight;
            camera.updateProjectionMatrix();
            renderer.setSize(nextWidth, nextHeight, false);
            composer.setSize(nextWidth, nextHeight);
            material.uniforms.uResolution.value.set(nextWidth, nextHeight);
        };

        const resizeObserver = new ResizeObserver(resize);
        resizeObserver.observe(container);
        window.addEventListener('resize', resize);
        resize();

        const animate = () => {
            frameId = requestAnimationFrame(animate);
            material.uniforms.uTime.value = clock.getElapsedTime();
            composer.render();
        };

        animate();

        appRef.current = {
            dispose: () => {
                cancelAnimationFrame(frameId);
                resizeObserver.disconnect();
                window.removeEventListener('resize', resize);
                geometry.dispose();
                material.dispose();
                composer.dispose();
                renderer.dispose();
                if (renderer.domElement.parentNode) {
                    renderer.domElement.parentNode.removeChild(renderer.domElement);
                }
            }
        };

        return () => {
            appRef.current?.dispose();
            appRef.current = null;
        };
    }, [effectOptions]);

    return <div ref={containerRef} className="hyperspeed-container" aria-hidden="true" />;
};

export default Hyperspeed;