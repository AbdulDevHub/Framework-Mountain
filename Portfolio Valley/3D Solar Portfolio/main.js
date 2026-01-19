import './style.css'
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

//Canvas Scene Set
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera( 75, window.innerWidth / window.innerHeight, 0.1, 1000 );
const renderer = new THREE.WebGLRenderer({
  canvas: document.querySelector('#bg'),
})

renderer.setPixelRatio( window.devicePixelRatio );
renderer.setSize( window.innerWidth, window.innerHeight );
camera.position.setZ(30);
renderer.render( scene, camera );



//Add Torus Shape
const geometry = new THREE.TorusGeometry( 10, 3, 16, 100 )
const material = new THREE.MeshStandardMaterial( { color: 0x9913CF  });
const torus = new THREE.Mesh( geometry, material );
scene.add(torus)


//Add Light Texture
const pointLight = new THREE.PointLight(0xffffff)
pointLight.position.set(20,5,5)
const ambientLight = new THREE.AmbientLight(0xffffff);
scene.add(pointLight, ambientLight);



//Add Light Camera Helper and Grid Helper 
const lightHelper = new THREE.PointLightHelper(pointLight)
const gridHelper = new THREE.GridHelper(200, 50);
// scene.add(lightHelper, gridHelper);


//Adding of Interactive Orbital Controls
const controls = new OrbitControls(camera, renderer.domElement);


//Space Background Function
function addStar() {
  const geometry = new THREE.SphereGeometry(0.25, 24, 24);
  const material = new THREE.MeshStandardMaterial( { color: 0xffffff })
  const star = new THREE.Mesh( geometry, material );

  const [x, y, z] = Array(3).fill().map(() => THREE.MathUtils.randFloatSpread( 100 ) );

  star.position.set(x, y, z);
  scene.add(star)
}

Array(200).fill().forEach(addStar)
const spaceTexture = new THREE.TextureLoader().load('./space.jpg');
scene.background = spaceTexture;



//Game Loop Function
function animate () {
  requestAnimationFrame( animate );
    torus.rotation.x += 0.01;
    torus.rotation.y += 0.005;
    torus.rotation.z += 0.01;
  controls.update();
  renderer.render( scene, camera);
}
animate()


//Avatar 
const tristanTexture = new THREE.TextureLoader().load('./profile.png');

const Tristan = new THREE.Mesh(
  new THREE.BoxGeometry(4, 4, 4),
  new THREE.MeshBasicMaterial({ map: tristanTexture })
);

scene.add(Tristan);



//Earth
const earthTexture = new THREE.TextureLoader().load('./earth.jpg');
const normalTexture = new THREE.TextureLoader().load('./normal.jpg')
const earth = new THREE.Mesh(
  new THREE.SphereGeometry(3, 32, 32),
  new THREE.MeshStandardMaterial( {
    map: earthTexture,
    normalMap: normalTexture
  })
);

earth.position.z = 30;
earth.position.setX(-10);
scene.add(earth)


//Sun
const sunTexture = new THREE.TextureLoader().load('./sun.jpg');
const sun = new THREE.Mesh(
  new THREE.SphereGeometry(3, 32, 32),
  new THREE.MeshStandardMaterial( {
    map: sunTexture,
    normalMap: normalTexture
  })
);

sun.position.z = 15;
sun.position.setX(10);
scene.add(sun)


//MoveCamera

function moveCamera() {

  const t = document.body.getBoundingClientRect().top;

  earth.rotation.y += 0.05;

  sun.rotation.x += 0.05;
  sun.rotation.y += 0.075;
  sun.rotation.z += 0.05;

  Tristan.rotation.y += 0.01;
  Tristan.rotation.z += 0.01;
  
  camera.position.z = t * -0.01;
  camera.position.x = t * -0.0002;
  camera.position.y = t * -0.0002;

}

document.body.onscroll = moveCamera;
// moveCamera();