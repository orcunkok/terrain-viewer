import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { TrackballControls } from 'three/addons/controls/TrackballControls.js';

const renderer = new THREE.WebGLRenderer({antialias: true});
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

//renderer.setClearColor(0xFEFEFE);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
    45,
    window.innerWidth / window.innerHeight,
    0.1,
    1000000
);

const orbit = new OrbitControls(camera, renderer.domElement);
orbit.enableDamping = true;
orbit.dampingFactor = 0.15;
orbit.enableZoom = false;

const controls2 = new TrackballControls(camera, renderer.domElement);
controls2.noRotate = true;
controls2.noPan = true;
controls2.noZoom = false;
controls2.zoomSpeed = 1.5;

// Calculate real-world tile size
const EARTH_CIRCUMFERENCE = 40075016.686; // meters
const zoomLevel = 11;
const tileY = 815; // Your tile Y coordinate
const latitude = (1 - (2 * tileY) / Math.pow(2, zoomLevel)) * Math.PI;
const tileSizeMeters = EARTH_CIRCUMFERENCE * Math.cos(latitude) / Math.pow(2, zoomLevel);

// Scale factor (1:10 means dividing by 10)
const SCALE_FACTOR = 10;
const scaledTileSize = tileSizeMeters / SCALE_FACTOR;

// Adjust camera position based on scaled size
camera.position.set(scaledTileSize/2, scaledTileSize/2, scaledTileSize);
orbit.update();

// Adjust grid helper to match tile size
const gridHelper = new THREE.GridHelper(scaledTileSize, 12);
scene.add(gridHelper);

const axesHelper = new THREE.AxesHelper(scaledTileSize/2);
scene.add(axesHelper);

// Add lighting
const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
scene.add(ambientLight);
const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
directionalLight.position.set(scaledTileSize/2, scaledTileSize/2, scaledTileSize/2);
scene.add(directionalLight);

// Create heightmap from terrain tile
const textureLoader = new THREE.TextureLoader();
textureLoader.load(
  "../AWS-Dem-Downloader/terrain_tiles/11/348/815.png",
  (texture) => {
    // Create geometry matching the real-world size
    const geometry = new THREE.PlaneGeometry(
      scaledTileSize, 
      scaledTileSize, 
      255, 
      255
    );
    
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    canvas.width = texture.image.width;
    canvas.height = texture.image.height;
    ctx.drawImage(texture.image, 0, 0);
    const imageData = ctx.getImageData(
      0,
      0,
      texture.image.width,
      texture.image.height
    ).data;

    // Modify vertices based on height data
    const vertices = geometry.attributes.position.array;
    for (let i = 0; i < vertices.length; i += 3) {
      const x = Math.floor((i / 3) % 256);
      const y = Math.floor((i / 3) / 256);
      const idx = (y * texture.image.width + x) * 4;
      
      // Decode height from RGB values (Terrarium format)
      const r = imageData[idx];
      const g = imageData[idx + 1];
      const b = imageData[idx + 2];
      const heightMeters = (r * 256 + g + b / 256) - 32768;
      
      // Scale height according to the same scale factor
      vertices[i + 2] = heightMeters / SCALE_FACTOR;
    }
    geometry.attributes.position.needsUpdate = true;
    geometry.computeVertexNormals();

    // Create material and mesh
    const material = new THREE.MeshPhongMaterial({
      color: 0x808080,
      wireframe: false,
      flatShading: true,
    });
    const terrain = new THREE.Mesh(geometry, material);
    
    // Rotate to align with grid (by default PlaneGeometry is XY, we want XZ)
    terrain.rotation.x = -Math.PI / 2;
    
    // Position to center on grid
    terrain.position.set(0, 0, 0);
    scene.add(terrain);
  }
);

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
