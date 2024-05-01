import * as THREE from "three";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
import { LOD } from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { GUI } from "dat.gui";
import TWEEN from "@tweenjs/tween.js";
//import { TransformControls } from "three/examples/jsm/controls/TransformControls.js";

// Import Modules
import { setupShadow } from "./ShadowConfig";
import { createBasicGui, addCameraControls } from "./GuiControl";
import { setupDragControls, disableDragControls } from "./DragModule"; // Import the Drag Module
import { mod } from "three/examples/jsm/nodes/Nodes.js";

// Scene setup
const scene = new THREE.Scene();
THREE.ColorManagement.enabled = true;
scene.background = new THREE.Color(0x404040);

// Lighting
const ambientLight = new THREE.AmbientLight(0x404040, 3);
scene.add(ambientLight);

const directionalLight = new THREE.DirectionalLight(0xffffff, 10);
directionalLight.position.set(30, 10, 10);
//directionalLight.castShadow = true;
scene.add(directionalLight);

// Apply shadow configuration
const shadowHelper = setupShadow(directionalLight);
scene.add(shadowHelper); // Optionally add the helper to the scene for debugging

// Renderer
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
document.body.appendChild(renderer.domElement);

// Camera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  250
);
camera.position.set(0, 0, 15);

// Controls

// OrbitControl
const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;
orbitControls.minDistance = 10;
orbitControls.maxDistance = 500;

// Drag Setup
const draggableObjects = [];
const initialTransforms = new Map();
//#################  GUI  #############################

// initial values  for GUI
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

  // Gui Transformation
  enableTransform: false,
  transformationMode: "translate", // Default mode
};

const guiCallbacks = {
  toggleShadows: function (enabled) {
    renderer.shadowMap.enabled = enabled; // Dynamically enable or disable shadows
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
  // addFogControl: function (value) {
  //   scene.fog.color.setHex(guiParams.fogParams.fogColor);
  //   scene.fog.density = guiParams.fogParams.fogDensity;
  // },
  updateCamera: function () {
    camera.fov = guiParams.fov;
    camera.position.z = guiParams.z;
    camera.far = guiParams.far;
    camera.updateProjectionMatrix();
  },
  resetPositions: resetPositions,
};

const gui = createBasicGui(guiParams, guiCallbacks);

// Add camera controls
addCameraControls(gui, guiParams, guiCallbacks.updateCamera);

// Model loading and LOD setup
const loader = new GLTFLoader();
const lod = new LOD();

scene.add(lod);
const modelPaths = [
  // "./assets/models/Fighter/Fighter_LOD0.glb",
  // "./assets/models/Fighter/Fighter_LOD1.glb",
  // "./assets/models/Fighter/Fighter_LOD2.glb",
  // "./assets/models/Fighter/Fighter_LOD3.glb",

  "./assets/models/Car/Car_LOD0.glb",
  "./assets/models/Car/Car_LOD1.glb",
  "./assets/models/Car/Car_LOD2.glb",
  "./assets/models/Car/Car_LOD3.glb",
  "./assets/models/Car/Car_LOD4.glb",
];

// #### Load a Model ##############
let loadedCount = 0;

modelPaths.forEach((path, index) => {
  loader.load(
    path,
    (gltf) => {
      const model = gltf.scene;
      adjustModel(model);
      scene.add(model);
      lod.addLevel(model, index * 20);
      initialTransforms.set(model, {
        position: model.position.clone(),
        rotation: model.rotation.clone(),
        scale: model.scale.clone(),
      });
      draggableObjects.push(model); // Ensure this is fully configured

      if (++loadedCount === modelPaths.length) {
        const dragControls = setupDragControls(
          draggableObjects,
          camera,
          renderer,
          orbitControls
        );
      }
    },
    (xhr) =>
      console.log(`Loaded: ${Math.round((xhr.loaded / xhr.total) * 100)}%`),
    (error) => console.error("An error occurred:", error)
  );
});

// modelPaths.forEach((path, index) => {
//   loader.load(
//     path,
//     (gltf) => {
//       const model = gltf.scene;
//       adjustModel(model); // Ensure adjustModel does not affect initial state capture
//       scene.add(model);
//       lod.addLevel(model, index * 20);
//       initialTransforms.set(model, {
//         position: model.position.clone(),
//         rotation: model.rotation.clone(),
//         scale: model.scale.clone(),
//       });
//       draggableObjects.push(model);
//       console.log(`LOD ${index} loaded`);
//     },
//     (xhr) =>
//       console.log(`Loaded: ${Math.round((xhr.loaded / xhr.total) * 100)}%`),
//     (error) => console.error("An error occurred:", error)
//   );
// });

// function resetPositions() {
//   console.log("Resetting positions for", draggableObjects.length, "objects");
//   draggableObjects.forEach((object) => {
//     const initial = initialTransforms.get(object);
//     if (initial) {
//       console.log("Resetting object to", initial.position);
//       object.position.copy(initial.position);
//       object.rotation.copy(initial.rotation);
//       object.scale.copy(initial.scale);
//     } else {
//       console.log("No initial position stored for an object");
//     }
//   });
// }

// Add this directly in your GUI setup section
// gui

//gui.add(guiCallbacks, "resetPositions").name("Reset Positions");
// GUI setup for resetting positions
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

  console.log("This is Position intitail: ", model.position);
}

// Reset Drag function
/*
function resetDraggableObjects() {
  draggableObjects.forEach((object) => {
    const initial = initialTransforms.get(object);
    if (initial) {
      object.position.copy(initial.position);
      object.rotation.copy(initial.rotation);
      object.scale.copy(initial.scale);
      console.log(`Object reset to position: ${initial.position}`);
    } else {
      console.error("No initial transform data stored for an object");
    }
  });
}
document.addEventListener("DOMContentLoaded", function () {
  const resetButton = document.getElementById("resetObjects");
  if (!resetButton) {
    console.log("Reset button not found!");
    return;
  }
  console.log("Reset button found, adding listener");
  resetButton.addEventListener("click", resetDraggableObjects);
});
*/
function resetPositions() {
  console.log("Resetting positions for", draggableObjects.length, "objects");
  draggableObjects.forEach((object) => {
    const initial = initialTransforms.get(object);
    if (initial) {
      object.position.copy(initial.position);
      object.rotation.copy(initial.rotation);
      object.scale.copy(initial.scale);
      object.updateMatrix();
      console.log("Reset to initial position:", initial.position);
    } else {
      console.error("No initial transform stored for object", object);
    }
    console.log("Thisi is Transsss : ", initialTransforms.get(object));
  });
}

console.log("Position immediately after reset:", lod.position);

// GUI setup for resetting positions
gui.add({ resetAll: resetPositions }, "resetAll").name("Reset All Objects");

// Camera transition function for smooth movement
function transitionCamera(newPosition, newLookAt, duration = 2000) {
  const positionTween = new TWEEN.Tween(camera.position)
    .to(newPosition, duration)
    .easing(TWEEN.Easing.Quadratic.Out)
    .onUpdate(() => camera.updateProjectionMatrix())
    .start();

  // This object will be used to keep track of the lookAt coordinates
  const lookAtObj = {
    x: camera.position.x, // Initial values set to current camera position
    y: camera.position.y,
    z: camera.position.z,
  };

  const lookAtTween = new TWEEN.Tween(lookAtObj)
    .to(newLookAt, duration)
    .easing(TWEEN.Easing.Quadratic.Out)
    .onUpdate(function () {
      // Update camera to look at interpolated coordinates
      camera.lookAt(new THREE.Vector3(this.x, this.y, this.z));
    })
    .start();
}

// CamFocus
document.addEventListener("DOMContentLoaded", function () {
  const camFocus = document.getElementById("camFocus");
  if (!camFocus) {
    console.log("Button not found!");
    return;
  }
  console.log("Button found, adding listener");
  camFocus.addEventListener("click", () => {
    console.log("CamFocus clicked!");
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
  //  camera distance to the LOD
  //const distance = camera.position.distanceTo(lod.position);
  //console.log(`Camera distance: ${distance}`);
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

// Calculate angle and update LOD based on view angle
function calculateViewAngle(camera, object) {
  const cameraDirection = new THREE.Vector3();
  camera.getWorldDirection(cameraDirection);
  const objectDirection = new THREE.Vector3()
    .subVectors(object.position, camera.position)
    .normalize();

  return cameraDirection.dot(objectDirection); // Returns the cosine of the angle
}

function updateLODBasedOnAngle(camera, lod) {
  const distanceThresholds = [20, 50, 100, 150]; // Example distances for each LOD level
  const cosAngleThresholdHigh = Math.cos((30 * Math.PI) / 180); // Cosine of 30 degrees
  const cosAngleThresholdLow = Math.cos((60 * Math.PI) / 180); // Cosine of 60 degrees

  const cameraDistance = camera.position.distanceTo(lod.position);

  lod.levels.forEach((level, index) => {
    const angleCos = calculateViewAngle(camera, level.object);
    if (
      cameraDistance < distanceThresholds[index] &&
      angleCos > cosAngleThresholdLow
    ) {
      level.object.visible = angleCos > cosAngleThresholdHigh; // More directly facing objects are visible
    } else {
      level.object.visible = false; // Hide level if not within angle and distance criteria
    }
  });
}
