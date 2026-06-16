export function createCamera() {
  return { x: 0, y: 0, zoom: 1 };
}

export function screenToWorld(canvas, camera, clientX, clientY) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  return {
    x: camera.x + (clientX - rect.left) * scaleX / camera.zoom,
    y: camera.y + (clientY - rect.top) * scaleY / camera.zoom,
  };
}
