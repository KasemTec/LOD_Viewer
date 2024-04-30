import { DragControls } from "three/examples/jsm/controls/DragControls.js";

export function setupDragControls(objects, camera, renderer, orbitControls) {
  const dragControls = new DragControls(objects, camera, renderer.domElement);

  // Disable orbit controls while dragging
  dragControls.addEventListener("dragstart", function (event) {
    orbitControls.enabled = false;
  });

  // Re-enable orbit controls once dragging ends
  dragControls.addEventListener("dragend", function (event) {
    orbitControls.enabled = true;
  });

  return dragControls;
}
