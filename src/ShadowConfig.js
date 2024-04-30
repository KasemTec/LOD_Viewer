import * as THREE from "three";

// Configure and add Shadow to a Light

export function setupShadow(light) {
  if (
    light instanceof THREE.DirectionalLight ||
    light instanceof THREE.SpotLight
  ) {
    // activate the shadow casting on the light
    light.castShadow = false;

    light.shadow.mapSize.width = 2048; // Default is 512
    light.shadow.mapSize.height = 2048; // Default is 512
    light.shadow.camera.near = 5;
    light.shadow.camera.far = 500;
    light.shadow.camera.left = -50;
    light.shadow.camera.right = 50;
    light.shadow.camera.top = 50;
    light.shadow.camera.bottom = -50;

    // set the type of shadow_map
    light.shadow.mapSize.width = 2048;
    light.shadow.mapSize.height = 2048;
    light.shadow.camera.near = 20;
    light.shadow.camera.far = 500;
    light.shadow.camera.left = -50;
    light.shadow.camera.right = 50;
    light.shadow.camera.top = 50;
    light.shadow.camera.bottom = -50;

    // set shadow type to PCF ( softschadow)
    light.shadow.type = THREE.PCFSoftShadowMap;

    // Optionally add a helper to visualize the shadow camera
    // const helper = new THREE.CameraHelper(light.shadow.camera);
    // return helper; // Return helper for optional addition to the scene
  } else {
    console.error(`${light} this Light is unsupportet for shadows!`);
    return null;
  }
}
