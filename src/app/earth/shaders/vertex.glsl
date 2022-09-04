varying vec2 vertexUV;
varying vec3 vertexNormal;

void main() {
  vertexUV = uv;
  vertexNormal = normalize(normalMatrix * normal);
  gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
}










// varying vec2 vertexUV;

// void main() {
//   vertexUV = uv;
//   gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
// }





// void main() {
//   gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
// }
