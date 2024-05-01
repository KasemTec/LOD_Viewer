import { DragControls } from "three/examples/jsm/controls/DragControls.js";

let dragControls = null; // Define dragControls at the module level to manage its lifecycle globally

/**
 * Setup and return DragControls for given objects in a Three.js scene.
 *
 * @param {THREE.Object3D[]} objects - The objects that should be draggable.
 * @param {THREE.Camera} camera - The camera used in the scene.
 * @param {THREE.Renderer} renderer - The renderer used for the scene.
 * @param {THREE.OrbitControls} orbitControls - OrbitControls used in the scene to disable during drag.
 * @return {DragControls} The configured DragControls instance.
 */
export function setupDragControls(objects, camera, renderer, orbitControls) {
  if (dragControls) {
    // Dispose existing controls if they exist
    dragControls.dispose();
  }

  //   dragControls = new DragControls(objects, camera, renderer.domElement);

  //   dragControls.addEventListener("dragstart", function (event) {
  //     orbitControls.enabled = false;
  //     console.log("Dragging object at position:", event.object.position);
  //   });

  //   dragControls.addEventListener("dragend", function (event) {
  //     orbitControls.enabled = true;
  //     console.log("Stopped dragging object at position:", event.object.position);
  //   });
  dragControls.addEventListener("dragstart", function (event) {
    orbitControls.enabled = false;
    console.log("Dragging started for object at:", event.object.position);
  });

  dragControls.addEventListener("dragend", function (event) {
    orbitControls.enabled = true;
    console.log("Dragging ended for object at:", event.object.position);
  });

  return dragControls;
}

/**
 * Disable and dispose of the DragControls instance.
 */
export function disableDragControls() {
  //   if (dragControls) {
  //     dragControls.dispose();
  //     dragControls = null;
  //     console.log("DragControls have been disabled and disposed.");
  //   }
  if (dragControls) {
    dragControls.enabled = false;
    // Reset positions
    draggableObjects.forEach((object) => {
      const initial = initialTransforms.get(object);
      object.position.copy(initial.position);
      object.rotation.copy(initial.rotation);
      object.scale.copy(initial.scale);
    });
    dragControls.enabled = true;
  }
}

export function resetDraggableObjects() {
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
