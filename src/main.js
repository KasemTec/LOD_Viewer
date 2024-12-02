import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { DRACOLoader } from "three/examples/jsm/loaders/DRACOLoader"; // Import the correct DRACOLoader
import { LOD } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GUI } from "dat.gui";
import TWEEN from "@tweenjs/tween.js";
// Import Modules
import { setupShadow } from "./ShadowConfig";
import { createBasicGui, addCameraControls } from "./GuiControl";

// Scene setup
const scene = new THREE.Scene();
THREE.ColorManagement.enabled = true;
scene.background = new THREE.Color(0x404040);

// Lighting
const ambientLight = new THREE.AmbientLight(0x404040, 3);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 10);
directionalLight.position.set(30, 10, 10);
scene.add(directionalLight);

// Apply shadow configuration
const shadowHelper = setupShadow(directionalLight);
scene.add(shadowHelper); // Optionally add the helper to the scene for debugging

// Renderer setup
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Camera setup
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  250
);
camera.position.set(0, 0, 15);

// OrbitControls setup
const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;
orbitControls.minDistance = 10;
orbitControls.maxDistance = 500;

// Initial values for the GUI
const guiParams = {
  shadows: false,
  fov: 75,
  z: 15,
  far: 1000,
  lightParams: {
    visible: directionalLight.visible,
    color: directionalLight.color.getHex(),
    light: directionalLight,
    intensity: directionalLight.intensity,
  },
  enableFog: false,
  fogParams: {
    fogColor: 0xaaaaaa,
    fogDensity: 0.01,
  },
  enableTransform: false,
  transformationMode: "translate", // Default mode
};

const guiCallbacks = {
  toggleShadows: function (enabled) {
    renderer.shadowMap.enabled = enabled;
    directionalLight.castShadow = enabled;
    scene.traverse(function (object) {
      if (object instanceof THREE.Mesh) {
        object.castShadow = enabled;
        object.receiveShadow = enabled;
      }
    });
  },
  updateLightColor: function (color) {
    directionalLight.color.setHex(color);
  },
  fogToggle: (enabled) => {
    if (enabled) {
      scene.fog = new THREE.FogExp2(
        guiParams.fogParams.fogColor,
        guiParams.fogParams.fogDensity
      );
    } else {
      scene.fog = null;
    }
  },
  updateCamera: function () {
    camera.fov = guiParams.fov;
    camera.position.z = guiParams.z;
    camera.far = guiParams.far;
    camera.updateProjectionMatrix();
  },
};

// Create GUI
const gui = createBasicGui(guiParams, guiCallbacks);
addCameraControls(gui, guiParams, guiCallbacks.updateCamera);

// GLTFLoader setup with DRACOLoader
const loader = new GLTFLoader();

// Correct DRACOLoader setup
const dracoLoader = new DRACOLoader();
// Draco decoder path:
dracoLoader.setDecoderPath(
  "https://www.gstatic.com/draco/versioned/decoders/1.5.7/"
);

loader.setDRACOLoader(dracoLoader);

const lod = new LOD();
scene.add(lod);

const modelPaths = [
  "./assets/models/Shackle/LOD_0.glb",
  "./assets/models/Shackle/LOD_1.glb",
  "./assets/models/Shackle/LOD_2.glb",
  "./assets/models/Shackle/LOD_3.glb",
  "./assets/models/Shackle/LOD_4.glb",
  "./assets/models/Shackle/LOD_5.glb",
];

// Load models and assign LOD levels
modelPaths.forEach((path, index) => {
  loader.load(
    path,
    (gltf) => {
      const model = gltf.scene;
      model.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = true;
          node.receiveShadow = true;
        }
      });

      adjustModel(model);
      const distanceThreshold = index * 20;
      lod.addLevel(model, distanceThreshold); // Adjust the distance threshold
      console.log(
        `LOD ${index} loaded with distance threshold: ${distanceThreshold}`
      );
    },
    (xhr) => {
      console.log(`${((xhr.loaded / xhr.total) * 100).toFixed(2)}% loaded`);
    },
    (error) => {
      console.error("An error occurred while loading the model:", error);
    }
  );
});

// Adjust model scale and position
function adjustModel(model) {
  model.position.set(0, 0, 0);
  const boundingBox = new THREE.Box3().setFromObject(model);
  const size = new THREE.Vector3();
  boundingBox.getSize(size);
  const desiredSize = 15;
  const scaleFactor = desiredSize / Math.max(size.x, size.y, size.z);
  model.scale.set(scaleFactor, scaleFactor, scaleFactor);
  const center = boundingBox.getCenter(new THREE.Vector3());
  model.position.sub(center.multiplyScalar(scaleFactor));
}

// Camera transition for smooth movement
function transitionCamera(newPosition, newLookAt, duration = 2000) {
  const positionTween = new TWEEN.Tween(camera.position)
    .to(newPosition, duration)
    .easing(TWEEN.Easing.Quadratic.Out)
    .onUpdate(() => camera.updateProjectionMatrix())
    .start();

  const lookAtObj = {
    x: camera.position.x,
    y: camera.position.y,
    z: camera.position.z,
  };

  const lookAtTween = new TWEEN.Tween(lookAtObj)
    .to(newLookAt, duration)
    .easing(TWEEN.Easing.Quadratic.Out)
    .onUpdate(function () {
      camera.lookAt(new THREE.Vector3(this.x, this.y, this.z));
    })
    .start();
}

// Camera focus button
document.addEventListener("DOMContentLoaded", function () {
  const camFocus = document.getElementById("camFocus");
  if (!camFocus) {
    console.log("Button not found!");
    return;
  }
  console.log("Button found, adding listener");
  camFocus.addEventListener("click", () => {
    console.log("Button clicked!");
    const newPosition = { x: 10, y: 10, z: 10 };
    const newLookAt = { x: 0, y: 0, z: 0 };
    transitionCamera(newPosition, newLookAt);
  });
});

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  updateLODBasedOnAngle(camera, lod);
  TWEEN.update();
  renderer.render(scene, camera);
  orbitControls.update();
  const camDistance = camera.position.distanceTo(lod.position);
  //console.log(`Camera distance: ${camDistance}`);
  // Check which LOD level is currently being used
  lod.levels.forEach((level, index) => {
    if (level.object.visible) {
      console.log(
        `Active LOD: ${index}, Distance threshold: ${lod.levels[index].distance}`
      );
    }
  });
  lod.update(camera);
}
animate();

// Handle window resizing
window.addEventListener("resize", onWindowResize, false);

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Calculate angle and update LOD visibility based on angle and distance
function calculateViewAngle(camera, object) {
  const cameraDirection = new THREE.Vector3();
  camera.getWorldDirection(cameraDirection);
  const objectDirection = new THREE.Vector3()
    .subVectors(object.position, camera.position)
    .normalize();
  return cameraDirection.dot(objectDirection);
}

function updateLODBasedOnAngle(camera, lod) {
  const distanceThresholds = [20, 50, 100, 150]; // Adjust based on scene scale
  const cosAngleThresholdHigh = Math.cos((30 * Math.PI) / 180);
  const cosAngleThresholdLow = Math.cos((60 * Math.PI) / 180);
  const cameraDistance = camera.position.distanceTo(lod.position);

  lod.levels.forEach((level, index) => {
    const angleCos = calculateViewAngle(camera, level.object);
    if (
      cameraDistance < distanceThresholds[index] &&
      angleCos > cosAngleThresholdLow
    ) {
      level.object.visible = angleCos > cosAngleThresholdHigh;
    } else {
      level.object.visible = false;
    }
  });
}
