//import * as THREE from 'https://unpkg.com/three@0.108.0/build/three.module.js';
import Stats from 'https://threejsfundamentals.org/threejs/resources/threejs/r108/examples/jsm/libs/stats.module.js';
import { FlyControls } from 'https://threejsfundamentals.org/threejs/resources/threejs/r108/examples/jsm/controls/FlyControls.js';
import { OBJLoader } from 'https://threejsfundamentals.org/threejs/resources/threejs/r108/examples/jsm/loaders/OBJLoader.js';

let container, stats, controls, gem, metal, rock , raycaster, player, playerShape;
let materialNoise, start = Date.now();
let camera, cubeCameraGem,scene, renderer, ambLight, toRemove;
var clock = new THREE.Clock();
let nightColor = new THREE.Color("#001526").getHex();
let dayColor = new THREE.Color("#95f4d7").getHex();
let gradientImage;


init();
addObjects();
animate();


function init() {
  container = document.createElement( 'div' );
  document.body.appendChild( container );

  scene = new THREE.Scene();

  //checks if it is between 6am and 6pm in UTC timezone
  //Source: https://stackoverflow.com/questions/2250036/how-to-determine-if-it-is-day-or-night-in-javascript-or-jquery
  if((Date.now() + 21600000) % 86400000 / 3600000 > 12){
    scene.fog = new THREE.Fog(nightColor ,100, 5000 );
    scene.background = new THREE.Color(nightColor);
    gradientImage = new THREE.TextureLoader().load( 'img/gradient_night.PNG' );
    ambLight = new THREE.AmbientLight( 0xffffff, .4 );
  } else{
    scene.fog = new THREE.Fog(dayColor , 1000, 5000 );
    scene.background = new THREE.Color(dayColor);
    gradientImage = new THREE.TextureLoader().load( 'img/gradient.PNG' );
    ambLight = new THREE.AmbientLight( 0xffffff, .7 );
  }
  //lights
  scene.add(ambLight);

  //cameras
  camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 1, 5000);

  cubeCameraGem = new THREE.CubeCamera( 1, 5000, 256 );
  cubeCameraGem.renderTarget.texture.generateMipmaps = true;
  cubeCameraGem.renderTarget.texture.minFilter = THREE.LinearMipmapLinearFilter;
  scene.add( cubeCameraGem );


  //renderer
  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  container.appendChild( renderer.domElement );
  //player
  playerShape = initializePlayerShape();
  playerShape.position.set(0, -10, -25);
  player = new THREE.Object3D();
  player.add(camera);
  player.add(playerShape);
  scene.add(player);
  let playerJson = playerShape.clone();
  console.log(playerJson);
  playerJson.children[1].material.envMap = null;
  let playerJSON = playerJson.toJSON();
  console.log(playerJSON);
  playerJson.children[1].material.envMap = cubeCameraGem.renderTarget.texture;

  //controls
  controls = new FlyControls( player, renderer.domElement );
  controls.movementSpeed = 200;
  controls.lookSpeed = 0.2;
  controls.rollSpeed = Math.PI / 12;
  controls.autoForward = false;
  controls.dragToLook = false;
  scene.add(controls.object);

  raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3( 0, - 1, 0 ), 0, 30);
  //stats
  stats = new Stats();
  container.appendChild( stats.dom );
  window.addEventListener( 'resize', onWindowResize, false );
}


function addObjects(){

  scene.add(addTerrain());
  let stars = addStars();
  for(let i in stars){
    scene.add(stars[i]);
  }
  toRemove = addIco(2,0,0,-300);
  toRemove.name = 'toRemove';
  addIco(1,0,0,-300);

  addIco(2,0,-1000,0);
  addIco(1,0,-1000,0);
}

function initializePlayerShape(){
  let group = new THREE.Group();
  rock = addIco(2,0,0,0);
  gem = addIco(1,0,0,0);
  group.add(rock);
  group.add(gem);

  return group;

}
function addStars(){
  let stars = [];
  let geometry = new THREE.SphereBufferGeometry(10);
  let material = new THREE.MeshBasicMaterial({color: new THREE.Color("#fffad6").getHex()});
  material.fog=false;
  //glow effect
  var spriteMaterial = new THREE.SpriteMaterial(
  {
    map: new THREE.TextureLoader().load( 'img/glow.png' ),
    color: 0xfffad6, transparent: true, blending: THREE.AdditiveBlending
  });

  for(let i=0;i<500;i++){
    let star;
    star = new THREE.Mesh( geometry, material );
    star.position.set(-2000+(Math.random()*4000), -2000+(Math.random()*4000), -2000+(Math.random()*4000));
    star.name='star';
    var sprite = new THREE.Sprite( spriteMaterial );
    sprite.scale.set(50, 50, 1.0);
    star.add(sprite);
    stars.push(star);
  }
  return stars;
}
function addStar(position){
  let star;
  let geometry = new THREE.SphereBufferGeometry(10);
  let material = new THREE.MeshBasicMaterial({color: new THREE.Color("#fffad6").getHex()});
  material.fog=false;

  star = new THREE.Mesh( geometry, material );
  star.position.set(position.x, position.y, position.z);
  star.name='star';
  scene.add( star );

  // SUPER SIMPLE GLOW EFFECT
  var spriteMaterial = new THREE.SpriteMaterial(
  {
    map: new THREE.TextureLoader().load( 'img/glow.png' ),
    color: 0xfffad6, transparent: true, blending: THREE.AdditiveBlending
  });
  var sprite = new THREE.Sprite( spriteMaterial );
  sprite.scale.set(50, 50, 1.0);
  star.add(sprite); // this centers the glow at the mesh

}

function addTerrain(){
  materialNoise = new THREE.ShaderMaterial( {
    uniforms: {
      tExplosion: {
        type: "t",
        value: gradientImage
      },
      time: { // float initialized to 0
        type: "f",
        value: 0.0
      },
      fogColor:    { type: "c", value: scene.fog.color },
      fogNear:     { type: "f", value: scene.fog.near },
      fogFar:      { type: "f", value: scene.fog.far }
    },
    fog:true,
    vertexShader: document.getElementById( 'vertexShader' ).textContent,
    fragmentShader: document.getElementById( 'fragmentShader' ).textContent,
    side: THREE.DoubleSide
  } );


  // create a sphere and assign the material
  let mesh = new THREE.Mesh(
  new THREE.SphereBufferGeometry( 3000, 150, 150 ),
  materialNoise
  );
  mesh.name = 'terrain';
  return mesh;
}

function addIco(choice,x,y,z){
  var ship = new THREE.Object3D();
  if (choice === 1){
    var mat = new THREE.MeshLambertMaterial( { color: new THREE.Color("#fc88ef").getHex(), side: THREE.DoubleSide, envMap: cubeCameraGem.renderTarget.texture, refractionRatio: 0.55 } );
    mat.fog = true;
  } else{
    let bumpMap = new THREE.TextureLoader().load('img/rock-texture.jpg',
      function(texture){
        // this code makes the texture repeat
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set( 1, 1 );
      });
    let texture = new THREE.TextureLoader().load('img/rock-texture.jpg',
      function(texture){
        // this code makes the texture repeat
        texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
        texture.repeat.set( 1, 1 );
      });
    var mat = new THREE.MeshPhongMaterial( { color: 0xffffff, map: texture,bumpMap: bumpMap, side: THREE.DoubleSide, shininess: 0} );
  }
  //var mat = new THREE.MeshLambertMaterial( { color: 0xff0000 } );
  //var mat = new THREE.MeshNormalMaterial( { color: 0xffffff, side: THREE.FrontSide} );
  var max = 2 + 15 * Math.random()
  max *= 1.5;
  for (var i = 0; i < max; i++) {
      var geo = new THREE.TetrahedronGeometry(1, 3)
      if(choice === 1){
        var groz = .7;
      } else {
        var groz = .5
      }

      for (var j = 0; j < geo.vertices.length; j++) {
          geo.vertices[j].x += (Math.random() - .5) * groz;
          geo.vertices[j].y += (Math.random() - .5) * groz;
          geo.vertices[j].z += (Math.random() - .5) * groz;
      }
      var mesh = new THREE.Mesh(geo, mat)
      var roz = 10;
      mesh.position.x = (Math.random() - .5) * roz;
      mesh.position.y = (Math.random() / 2) * roz - 2;
      mesh.position.z = (Math.random() - .5) * roz;
      var ran = Math.random() * 1 + 1;
      mesh.scale.set(ran, ran, ran);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      ship.add(mesh);

      if (Math.random() < .9) {

          var mesh2 = mesh.clone();
          mesh2.applyMatrix(new THREE.Matrix4().makeScale(-1, 1, 1));
          mesh2.position.x = -mesh.position.x
          ship.add(mesh2)

          mesh.frustumCulled = false;
          mesh2.frustumCulled = false;
      }
  }

  // MERGE
  var geom = new THREE.Geometry()
  for (var i = 0; i < ship.children.length; i++) {
      ship.children[i].updateMatrix();
      geom.merge(ship.children[i].geometry, ship.children[i].matrix);
  }
  ship = new THREE.Mesh(geom, mat)
  ship.name = "SHIP";
  ship.frustumCulled = false;
  ship.scale.set(1,1,1);
  ship.position.set(x,y,z);
  scene.add(ship);

  return ship;
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize( window.innerWidth, window.innerHeight );
}
function animate() {
  requestAnimationFrame( animate );
  raycaster.ray.origin.copy( player.position );

  var intersections = raycaster.intersectObjects( scene.children );
  if(intersections.length > 0
    && intersections[0].distance < 20
    && intersections[0].object.name != 'star'
    && intersections[0].object.name != 'terrain'){
    addStar(player.position);
  }

  //removing an object
  // console.log(start + " " + Date.now());
  // if(Date.now() > start+3000 && toRemove){
  //   var selectedObject = scene.getObjectByName(toRemove.name);
  //   scene.remove( selectedObject );
  // }

  render();
}
function render() {
  materialNoise.uniforms[ 'time' ].value = .000025 * ( Date.now() - start );
  controls.update( clock.getDelta() );
  if(gem){
    gem.visible = false;
    rock.visible = false;
    cubeCameraGem.position.copy( gem.position );
    cubeCameraGem.update( renderer, scene );
    rock.visible = true;
    gem.visible = true;
  }



  renderer.render( scene, camera );
  stats.update();
}
