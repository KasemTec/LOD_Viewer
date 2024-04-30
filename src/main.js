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

// TransformControls

// const control = new TransformControls(camera, renderer.domElement);
// scene.add(control);
// control.enabled = false;

// const raycaster = new THREE.Raycaster();
// const mouse = new THREE.Vector2();

// function onMouseDown(event) {
//   mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
//   mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

//   raycaster.setFromCamera(mouse, camera);
//   const intersects = raycaster.intersectObjects(scene.children, true);

//   if (intersects.length > 0) {
//     control.attach(intersects[0].object);
//   }
// }

// window.addEventListener("mousedown", onMouseDown, false);

// OrbitControl
const orbitControls = new OrbitControls(camera, renderer.domElement);
orbitControls.enableDamping = true;
orbitControls.minDistance = 10;
orbitControls.maxDistance = 500;

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

modelPaths.forEach((path, index) => {
  loader.load(
    path,
    (gltf) => {
      const model = gltf.scene;
      model.traverse((node) => {
        if (node.isMesh) {
          node.castShadow = true; // Enable casting shadows
          node.receiveShadow = true; // Enable receiving shadows
        }
      });

      adjustModel(model);
      lod.addLevel(model, index * 20); // You might need to adjust this based on actual distance.
      console.log(`LOD ${index} loaded`);
    },
    (xhr) => {
      console.log(`${((xhr.loaded / xhr.total) * 100).toFixed(2)}% loaded`);
    },
    (error) => {
      console.error("An error happened:", error);
    }
  );
});

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
  // Debugging camera distance to the LOD
  const distance = camera.position.distanceTo(lod.position);
  console.log(`Camera distance: ${distance}`); // Check if this value crosses LOD thresholds
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
