import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { TrackballControls } from 'three/addons/controls/TrackballControls.js';

const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Sets the color of the background.
renderer.setClearColor(0xFEFEFE);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
);

// Sets orbit control to move the camera around.
const orbit = new OrbitControls(camera, renderer.domElement);

orbit.enableDamping = true;
orbit.dampingFactor = 0.15;
orbit.enableZoom = false;

const controls2 = new TrackballControls(camera, renderer.domElement);
controls2.noRotate = true;
controls2.noPan = true;
controls2.noZoom = false;
controls2.zoomSpeed = 1.5;

// Camera positioning.
camera.position.set(6, 8, 14);
// Has to be done everytime we update the camera position.
orbit.update();

// Creates a 12 by 12 grid helper.
const gridHelper = new THREE.GridHelper(12, 12);
scene.add(gridHelper);

// Creates an axes helper with an axis length of 4.
const axesHelper = new THREE.AxesHelper(4);
scene.add(axesHelper);

function animate() {
  const target = orbit.target;
  controls2.target.set(target.x, target.y, target.z);

  orbit.update();
  controls2.update();

  renderer.render(scene, camera);
}

renderer.setAnimationLoop(animate);

window.addEventListener('resize', function() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});