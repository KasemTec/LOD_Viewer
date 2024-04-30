import { GUI } from "dat.gui";

export function createBasicGui(params, callbacks) {
  const gui = new GUI();

  // Adding a control to toggle shadows
  if (params.shadows !== undefined && callbacks.toggleShadows) {
    gui
      .addFolder("Shadow")
      .add(params, "shadows")
      .name("Enable Shadows")
      .onChange(callbacks.toggleShadows);
  }

  // Adding controls for Directional Light, color and intensety
  if (params.lightParams && callbacks.updateLightColor) {
    const lightFolder = gui.addFolder("Directional Light");
    lightFolder
      .add(params.lightParams, "visible")
      .name("Visible")
      .onChange((value) => {
        params.lightParams.light.visible = value;
      });
    lightFolder
      .add(params.lightParams, "intensity", 0, Math.PI * 10)
      .name("Intensity")
      .onChange((value) => (params.lightParams.light.intensity = value));

    lightFolder
      .addColor(params.lightParams, "color")
      .name("Color")
      .onChange(callbacks.updateLightColor);
  }

  //   if (params.fogParams && callbacks.addFogControl) {
  //     const fogFolder = gui.addFolder("Fog");
  //     fogFolder
  //       .addColor(params.fogParams, "fogColor")
  //       .name("Fog Color")
  //       .onChange(callbacks.updateFog);
  //     fogFolder
  //       .add(params.fogParams, "fogDensity", 0, Math.PI * 0.005)
  //       .name("Fog Density")
  //       .onChange(callbacks.updateFog);
  //   }

  // Fog settings
  const fogFolder = gui.addFolder("Fog");
  fogFolder
    .add(params, "enableFog")
    .name("Enable Fog")
    .onChange(callbacks.fogToggle);
  fogFolder
    .addColor(params.fogParams, "fogColor")
    .name("Fog Color")
    .onChange((color) => {
      if (scene.fog) {
        scene.fog.color.setHex(color);
        params.fogParams.fogColor = color; // Update the color in parameters
      }
    });
  fogFolder
    .add(params.fogParams, "fogDensity", 0, 0.05)
    .name("Fog Density")
    .onChange((density) => {
      if (scene.fog) {
        scene.fog.density = density;
        params.fogParams.fogDensity = density; // Update the density in parameters
      }
    });

  // Transformatin
  //   const transformFolder = gui.addFolder("Obejct Transformation");
  //   transformFolder
  //     .add(params, "enableTransform")
  //     .name("Enable Transformation")
  //     .onChange(callbacks.toggleTransform);
  //   transformFolder
  //     .add(params, "transformationMode", ["translate", "rotate", "scale"])
  //     .name("Mode")
  //     .onChange(callbacks.changeTransformMode);

  return gui;
}

// possible to define additional functions for more specific controls as needed
export function addCameraControls(gui, cameraParams, updateFunction) {
  const folder = gui.addFolder("Camera Controls");
  folder.add(cameraParams, "fov", 40, 75).name("FOV").onChange(updateFunction);
  folder
    .add(cameraParams, "z", 0, 30)
    .name("CamPos Z")
    .onChange(updateFunction);
  folder
    .add(cameraParams, "far", 100, 2000)
    .name("Far Clipping")
    .onChange(updateFunction);
  folder.close();
}
