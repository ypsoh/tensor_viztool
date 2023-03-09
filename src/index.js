import {
  PerspectiveCamera,
  Scene,
  WebGLRenderer,
  MeshStandardMaterial,
  Mesh,
  Color,
  HemisphereLight,
  DirectionalLight,
  DirectionalLightHelper,
  HemisphereLightHelper,
  FileLoader,
  ShaderMaterial,
  Float32BufferAttribute,
  DynamicDrawUsage,
  BufferGeometry,
  BoxGeometry,
  Points,
  GridHelper,
  Geometry,
  Vector3,
  PointCloudMaterial,
  PointCloud,
  Material,
  MeshBasicMaterial,
  PointsMaterial,
  PlaneGeometry,
  OrthographicCamera,
  LineBasicMaterial,
  LineSegments,
  MeshNormalMaterial,
} from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { TransformControls } from 'three/examples/jsm/controls/TransformControls'

let container;
let scene;
let camera;
let renderer;
let controls;
let transformControls;
let tensorData;

function loadTensorData(filename) {
    const tensorData = {};
    return loadFile(filename).then(res => {
        let x, y, z, rest;
        let minX = 1e9;
        let minY = 1e9;
        let minZ = 1e9;
        let maxX = 0;
        let maxY = 0;
        let maxZ = 0;
        let val;
        const vertices = [];
        const values = [];
        
        res.split(/\r?\n/).forEach((line) => {
            [x, y, z, ...rest] = line.split(" ");
            val = rest[rest.length - 1];
            x = parseFloat(x);
            y = parseFloat(y);
            z = parseFloat(z);
            val = parseFloat(val);
            vertices.push(x, y, z);
            values.push(val);

            if (minX > x) minX = x;
            if (minY > y) minY = y;
            if (minZ > z) minZ = z;

            if (maxX < x) maxX = x;
            if (maxY < y) maxY = y;
            if (maxZ < z) maxZ = z;
        });
        if (rest.length > 2) {
            console.log("More than 3-modes, only showing first three dimensions of tensor");
        }

        return new Promise(resolve => {
            resolve({
                vertices,
                values,
                minVertices: [minX, minY, minZ],
                maxVertices: [maxX, maxY, maxZ],
            });
        });    
    });
}

async function init() {
  container = document.querySelector("#container");
  scene = new Scene();
  scene.background = new Color("white");

  tensorData = await loadTensorData('small_uber.tns');
  console.log(tensorData);
  createLights(); // Adds light to scene
  createCamera(); // Creates and adds camera
  createGridHelper(tensorData);
//   createCube(); // Creates Cube

  createRenderer(); // Appends renderer dom element to html container
  createControls();
  createTensor(tensorData);

  renderer.setAnimationLoop(() => {
    update();
    render();
  });
}

function createGridHelper({ minVertices, maxVertices }) {
    let minX, minY, minZ;
    let maxX, maxY, maxZ;
    [minX, minY, minZ] = minVertices;
    [maxX, maxY, maxZ] = maxVertices;

    const divisions = 10; 
    // const gridHelperX = new GridHelper( sizeX, divisions );
    // const gridHelperY = new GridHelper( sizeY, divisions );
    // gridHelperY.geometry.rotateX(Math.PI * 0.5);
    // scene.add(gridHelperX);
    // scene.add(gridHelperY);

    const gridHelperX = new BoxGeometry(100, 100, 100);
    // const gridHelperY = new PlaneGeometry(100, 1000, divisions, divisions);
    // window.a = gridHelperY;
    // gridHelperY.rotateX(Map.Pi * 0.5);
    // gridHelperY.rotateX(Math.PI * -0.5); 
    let mXY = new LineBasicMaterial({ color: 'aqua'});
    // let mXZ = new LineBasicMaterial({ color: 'yellow'});
    // gridHelperY.geometry.rotateX(Math.PI * 0.5);
    scene.add(new LineSegments(gridHelperX, mXY));
    // scene.add(new LineSegments(gridHelperY, mXZ));
}

function createRenderer() {
    renderer = new WebGLRenderer({ antialias: true });
    renderer.setSize(container.clientWidth, container.clientHeight);
//   renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.gammaFactor = 2.2;
  renderer.gammaOutput = true;
  renderer.useLegacyLights = true;

  container.appendChild(renderer.domElement);
}

function createCamera() {
    camera = new OrthographicCamera(
        container.clientWidth / -2,
        container.clientWidth / 2,
        container.clientHeight / 2, 
        container.clientHeight / -2, 1, 1000);
    camera.position.set(1, 1, 100);
}

function createMaterials() {
  const wireframe = new MeshStandardMaterial({
    wireframe: true
  });

  const standard = new MeshStandardMaterial({
    color: 0x2233ff
  });
  standard.color.convertSRGBToLinear();

  return {
    wireframe,
    standard
  };
}

function createTensor({ vertices }) {
    let geometry = new BufferGeometry();
    let material = new ShaderMaterial({ 
        uniforms: {
            color: { value: new Color(0xff00ff)},
        }
    });

    const positions = [];
    const colors = [];
    const sizes = [];

    const color = new Color('green');
    let tensor;

    geometry.setAttribute( 'position', new Float32BufferAttribute( vertices, 3 ) );

    material = new PointsMaterial( { size: 3 } );
    // const material = new THREE.PointsMaterial( { size: 15, vertexColors: true } );

    material.color.setHSL( 1.0, 0.5, 0.1 );

    const particles = new Points( geometry, material );
    scene.add( particles );

    transformControls.attach(particles);

}

async function createShaderMaterial({ fragmentShaderUrl, vertexShaderUrl }) {
  const fragment = await loadFile(fragmentShaderUrl);
  const vertex = await loadFile(vertexShaderUrl);

  const material = new ShaderMaterial({
    fragmentShader: fragment,
    vertexShader: vertex
  });

  return material;
}

function createLights() {
  const directionalLight = new DirectionalLight(0xffffff, 5);
  directionalLight.position.set(5, 5, 10);

  const directionalLightHelper = new DirectionalLightHelper(
    directionalLight,
    5
  );

  const hemisphereLight = new HemisphereLight(0xddeeff, 0x202020, 3);
  const hemisphereLightHelper = new HemisphereLightHelper(hemisphereLight, 5);
  scene.add(
    directionalLight,
    directionalLightHelper,
    hemisphereLight,
    hemisphereLightHelper
  );
}

function createCube() {
    const geometry = new BoxGeometry(100, 100, 100, 10, 10, 10);
    const material = new MeshBasicMaterial({ color: 0xffeeee });
    material.transparent = true;
    material.opacity = 0.3;
  const mesh = new Mesh(geometry, material);
  scene.add(mesh);
}

function createControls() {
    const geometry = new BoxGeometry()
    const material = new MeshNormalMaterial({ transparent: true })

    controls = new OrbitControls(camera, renderer.domElement);
    
    transformControls = new TransformControls(camera, renderer.domElement);

    transformControls.setMode('translate')
    scene.add(transformControls);
    transformControls.addEventListener('dragging-changed', function (event) {
        controls.enabled = !event.value
        //dragControls.enabled = !event.value
    })
    
}

function loadFile(url) {
  const loader = new FileLoader();

  return new Promise(resolve => {
    loader.load(url, result => {
      resolve(result);
    });
  });
}

function update() {}

function render() {
  renderer.render(scene, camera);
}

init();

function onWindowResize() {
  camera.aspect = container.clientWidth / container.clientHeight;

  // Update camera frustum
  camera.updateProjectionMatrix();

  renderer.setSize(container.clientWidth, container.clientHeight);
}
window.addEventListener("resize", onWindowResize, false);


window.addEventListener('keydown', function (event) {
    switch (event.key) {
        case 'g':
            transformControls.setMode('translate')
            break
        case 'r':
            transformControls.setMode('rotate')
            break
        case 's':
            transformControls.setMode('scale')
            break
    }
})