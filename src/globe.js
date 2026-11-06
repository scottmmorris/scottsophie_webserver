import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// Scene setup
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  55,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(15, 0, 5);
scene.add(camera);

const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Load texture
const textureLoader = new THREE.TextureLoader();
const earthTexture = textureLoader.load(
  '../images/earth_atmos_2048.jpg'
);
const starsTexture = textureLoader.load(
  '../images/2k_stars_milky_way.jpg'
);

// Globe
const radius = 5; // globe radius
const geometry = new THREE.SphereGeometry(radius, 64, 64);
const material = new THREE.MeshStandardMaterial({ map: earthTexture });
const globe = new THREE.Mesh(geometry, material);
scene.add(globe);

// Starfield background (big inverted sphere)
const starsGeometry = new THREE.SphereGeometry(90, 64, 64);
const starsMaterial = new THREE.MeshBasicMaterial({
  map: starsTexture,
  side: THREE.BackSide, // render inside of sphere
});
const starfield = new THREE.Mesh(starsGeometry, starsMaterial);
scene.add(starfield);

// Lighting
const light = new THREE.DirectionalLight(0xffffff, 1.2);
scene.add(light);
light.target = globe;
scene.add(light.target);

// Ambient light to soften shadows
scene.add(new THREE.AmbientLight(0x404040, 0.5));

// Controls
const controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.enableZoom = true;
controls.maxDistance = 50;
controls.minDistance = 7;

function latLonToVector3(lat, lon, radius) {
  const phi = (90 - lat) * (Math.PI / 180);
  const theta = (lon + 180) * (Math.PI / 180);
  return new THREE.Vector3(
    -radius * Math.sin(phi) * Math.cos(theta),
     radius * Math.cos(phi),
     radius * Math.sin(phi) * Math.sin(theta)
  );
}

const markerGeometry = new THREE.SphereGeometry(0.05, 16, 16);
const markers = [];

function addMarker(name, radius, scene, markers, lat, lon) {
	const markerGeometry = new THREE.SphereGeometry(0.04, 16, 16);
	const newMarker = new THREE.Mesh(markerGeometry, new THREE.MeshBasicMaterial({ color: 0xff0000 }));
	newMarker.name = name;
	newMarker.position.copy(latLonToVector3(lat, lon, radius + 0.05));
	scene.add(newMarker);
	markers.push(newMarker);
}

addMarker('barcelona2024.html', radius, scene, markers, 41.3851, 2.1734);
addMarker('madrid2024.html', radius, scene, markers, 40.4168, -3.7038);
addMarker('seville2024.html', radius, scene, markers, 37.3925, -5.9941);
addMarker('bansko2025.html', radius, scene, markers, 41.8399, 23.4860);
addMarker('reykjavik2025.html', radius, scene, markers, 64.1466, -21.9431);
addMarker('amsterdam2024.html', radius, scene, markers, 52.3667, 4.9424);
addMarker('frankfurt2025.html', radius, scene, markers,  50.1109, 8.6821);
addMarker('dortmund2025.html', radius, scene, markers, 51.5142, 7.4684);
addMarker('dusseldorf2025.html', radius, scene, markers, 51.2333, 6.7833);
addMarker('koln2025.html', radius, scene, markers, 50.9352, 6.9531);
addMarker('berlin2025.html', radius, scene, markers, 52.5200, 13.4050);
addMarker('fontainebleau2025.html', radius, scene, markers, 48.4039, 2.7010);
addMarker('corfu2025.html', radius, scene, markers, 39.6265, 19.9210);
addMarker('sarande2025.html', radius, scene, markers, 40.1017, 19.7447);
addMarker('tirana2025.html', radius, scene, markers, 41.3275, 19.8189);
addMarker('milan2025.html', radius, scene, markers, 45.4699, 9.1788);
addMarker('sorrento2025.html', radius, scene, markers, 40.6265, 14.3769);
addMarker('inverness2025.html', radius, scene, markers, 57.4780, -4.2262);
addMarker('pembroke2025.html', radius, scene, markers, 51.6524, -4.8312);
addMarker('portland2025.html', radius, scene, markers, 50.5491, -2.43302);
addMarker('venice2025.html', radius, scene, markers, 45.4349, 12.3269);
addMarker('cogne2025.html', radius, scene, markers, 45.6084, 7.3559);
addMarker('dartmoor2025.html', radius, scene, markers, 50.5063, -3.8922);
addMarker('blakeney2025.html', radius, scene, markers, 52.9598, 1.0110);
addMarker('stantons2025.html', radius, scene, markers, 47.1301, 10.2754);
addMarker('cairngorms2026.html', radius, scene, markers, 57.1886, -3.8288);
addMarker('shanghai2026.html', radius, scene, markers, 31.2222, 121.4581);
addMarker('zhangjiajie2026.html', radius, scene, markers, 29.1294, 110.4783);
addMarker('beijing2026.html', radius, scene, markers, 39.9075, 116.3972);
addMarker('lofoten2026.html', radius, scene, markers, 68.1667, 13.7500);
addMarker('hongkong2026.html', radius, scene, markers, 22.3027, 114.1772);
addMarker('normandy2026.html', radius, scene, markers, 49.9200, 1.0800);
addMarker('chamonix2026.html', radius, scene, markers, 46.9238, 6.2693);
addMarker('hamburg2026.html', radius, scene, markers, 53.4818, 9.9958);
addMarker('bern2026.html', radius, scene, markers, 46.9480, 7.4474);
addMarker('bolzano2026.html', radius, scene, markers, 46.5000, 11.3500);
addMarker('dubrovnik2026.html', radius, scene, markers, 42.6403, 18.1083);
addMarker('montreux2026.html', radius, scene, markers, 46.4312, 6.9107);
addMarker('rome2026.html', radius, scene, markers, 41.9028, 12.4963);
addMarker('split2026.html', radius, scene, markers, 43.5081, 16.4402);
addMarker('wengen2026.html', radius, scene, markers, 46.6030, 7.9190);
addMarker('zurich2026.html', radius, scene, markers, 47.3744, 8.5411);

// 🖱️ Raycaster for clicks
const raycaster = new THREE.Raycaster();
const pointer = new THREE.Vector2();

function onPointerMove(event) {
  const rect = renderer.domElement.getBoundingClientRect();

  // calculate pointer position in normalized device coordinates (-1 to +1) for both components
  pointer.x = ( ( event.clientX - rect.left ) / rect.width ) * 2 - 1;
  pointer.y = - ( ( event.clientY - rect.top ) / rect.height ) * 2 + 1;

  // update the picking ray with the camera and pointer position
  raycaster.setFromCamera(pointer, camera)

  // calculate objects intersecting the picking ray
  const intersects = raycaster.intersectObjects(markers);
 
  if (intersects.length > 0) {
    document.body.style.cursor = "pointer"; // set the cursor to a pointer when highlighting a marker
    intersects[0].object.material.color.set(0x32cd32); // set the marker that is highlighted to green
  } else {
    document.body.style.cursor = "default"; // reset the cursor
    for (const marker of markers) { marker.material.color.set(0xff0000); } // reset the highlighting
  }
}

function onClick(event) {
  raycaster.setFromCamera(pointer, camera);
  const intersects = raycaster.intersectObjects(markers);

  if (intersects.length > 0) {
    window.location.href = intersects[0].object.name; // redirect to another page
  }
}
window.addEventListener('pointermove', onPointerMove);
window.addEventListener('mousedown', onClick);

// Responsive resize
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});

// Animate
function animate() {
  requestAnimationFrame(animate);

  // Light always from camera direction
  light.position.copy(camera.position);

  controls.update();
  renderer.render(scene, camera);
}
animate();
