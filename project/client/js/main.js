


///////GAME LOGIC////////
//player class
let Player = function(initPack){
  let self = {};
  self.id = initPack.id;
  self.object = initPack.object;
  self.x = initPack.x;
  self.y = initPack.y;
  self.z = initPack.z;

  Player.list[self.id]=self;
  return self;
}

Player.list = {};

// //bullet class
// let Bullet = function(initPack){
//   let self = {};
//   self.id = initPack.id;
//   self.x = initPack.x;
//   self.y = initPack.y;
//   self.draw = function(){
//     ctx.fillRect(self.x-5,self.y-5,10,10);
//   }
//   Bullet.list[self.id]=self;
//   return self;
// }
//
// Bullet.list = {};



//initialise player or bullet from server
socket.on('init', function(data){
  for(let i=0;i<data.player.length;i++){
    new Player(data.player[i]);
    gameScene.add(data.player[i].object);
    data.player[i].object.position.set(data.player[i].x)
  }

  // for(let i = 0 ; i < data.bullet.length; i++){
  //   new Bullet(data.bullet[i]);
  // }
});

//update positions of player or bullet from server
socket.on('update',function(data){
    //{ player : [{id:123,x:0,y:0},{id:1,x:0,y:0}], bullet: []}
    for(let i = 0 ; i < data.player.length; i++){
        let pack = data.player[i];
        let p = Player.list[pack.id];
        if(p){
            if(pack.x !== undefined)
                p.x = pack.x;
            if(pack.y !== undefined)
                p.y = pack.y;
            if(pack.z !== undefined)
                p.z = pack.z;
        }
    }
    // for(let i = 0 ; i < data.bullet.length; i++){
    //     let pack = data.bullet[i];
    //     let b = Bullet.list[data.bullet[i].id];
    //     if(b){
    //         if(pack.x !== undefined)
    //             b.x = pack.x;
    //         if(pack.y !== undefined)
    //             b.y = pack.y;
    //     }
    // }
});

//remove player or bullet
socket.on('remove',function(data){
    //{player:[12323],bullet:[12323,123123]}
    for(let i = 0 ; i < data.player.length; i++){
        delete Player.list[data.player[i]];
    }
    // for(let i = 0 ; i < data.bullet.length; i++){
    //     delete Bullet.list[data.bullet[i]];
    // }
});

//diplay each bullet and player from their respective lists
setInterval(function(){
    ctx.clearRect(0,0,500,500);
    for(let i in Player.list)
        Player.list[i].draw();
    for(let i in Bullet.list)
        Bullet.list[i].draw();
},1000/25);

import Stats from 'https://threejsfundamentals.org/threejs/resources/threejs/r108/examples/jsm/libs/stats.module.js';
import { OrbitControls } from 'https://threejsfundamentals.org/threejs/resources/threejs/r108/examples/jsm/controls/OrbitControls.js';
import { FlyControls } from 'https://threejsfundamentals.org/threejs/resources/threejs/r108/examples/jsm/controls/FlyControls.js';
import { GLTFExporter } from 'https://threejsfundamentals.org/threejs/resources/threejs/r108/examples/jsm/exporters/GLTFExporter.js';
import { GLTFLoader } from 'https://threejsfundamentals.org/threejs/resources/threejs/r108/examples/jsm/loaders/GLTFLoader.js';
//import { LegacyJSONLoader} from 'https://threejsfundamentals.org/threejs/resources/threejs/r108/examples/jsm/loaders/deprecated/LegacyJSONLoader.js'

let container, stats, guiControls={},controls, gem, metal, rock , raycaster, player, playerShape;
let materialNoise, start = Date.now();
let camera, cubeCamera,cameraGame,scene,sceneGame, renderer, ambLight, toRemove;
var clock = new THREE.Clock();
let nightColor = new THREE.Color("#001526").getHex();
let dayColor = new THREE.Color("#95f4d7").getHex();
let gradientImage;
let onGame = false;

//GUI
guiControls = { color: "#ff66ee", size: 1, sizeMetal: 1, colorMetal: "#ffffff", reflectivity: 0.7};
var gui = new dat.GUI();
var c_mesh_size = gui.add(guiControls, 'size', 0,2);
var c_mesh_color = gui.addColor(guiControls, 'color', 0,100);
var c_mesh_metal_size = gui.add(guiControls, 'sizeMetal', 0,2);
var c_mesh_metal_color = gui.addColor(guiControls, 'colorMetal', 0,100);
var c_mesh_metal_refl = gui.add(guiControls, 'reflectivity', 0,1);

//initialise connection socket connection between client & server
let socket = io();

init();
addObjects();
animate();

//start game
let button = document.getElementById('start-game')
button.onclick = function(){
  socket.emit('signIn',{/*OBJECT*/});
}

//server response for sign in
socket.on('signInResponse',function(data){
    if(data.success){
      initGame();
      addObjectsGame();
      onGame = true;
      button.display = 'none';
    } else
        alert("Sign in unsuccessul.");
});

////CONEPTION SCREEN/////
function init() {
  container = document.getElementById('container');
  scene = new THREE.Scene();
  scene.background = new THREE.Color( new THREE.Color("#ccfbff").getHex());
  //cameras
  camera = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 1, 5000);
  camera.position.z = 30;

  cubeCamera = new THREE.CubeCamera( 1, 1000, 256 );
  cubeCamera.renderTarget.texture.generateMipmaps = true;
  cubeCamera.renderTarget.texture.minFilter = THREE.LinearMipmapLinearFilter;
  scene.add( cubeCamera );

  //light
  ambLight = new THREE.AmbientLight( 0xffffff, .7 );
  scene.add(ambLight);

  //renderer
  renderer = new THREE.WebGLRenderer();
  renderer.setPixelRatio( window.devicePixelRatio );
  renderer.setSize( window.innerWidth, window.innerHeight );
  container.appendChild( renderer.domElement );
  //controls
  controls = new OrbitControls( camera, renderer.domElement );
  controls.enableZoom = true;
  controls.enablePan = false;
  controls.minPolarAngle = Math.PI / 4;
  controls.maxPolarAngle = Math.PI / 1.5;
  //stats
  stats = new Stats();
  container.appendChild( stats.dom );
  window.addEventListener( 'resize', onWindowResize, false );
}

function addObjects(){
  playerShape = new THREE.Object3D()
  rock = addIco(2);
  gem = addIco(1);
  metal = addTorus();
  playerShape.add(rock);
  playerShape.add(gem);
  playerShape.add(metal);
  scene.add(playerShape);
  console.log(playerShape);
}

function addIco(choice){
  var ship = new THREE.Object3D();
  if (choice === 1){
    var mat = new THREE.MeshBasicMaterial( { color: guiControls.color, side: THREE.DoubleSide, envMap: cubeCamera.renderTarget.texture,refractionRatio: 0.55 } );

    c_mesh_color.onChange(function(){
      ship.material = new THREE.MeshBasicMaterial( { color: guiControls.color, side: THREE.DoubleSide,  envMap: cubeCamera.renderTarget.texture, refractionRatio: 0.55 } );
    });
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
    var mat = new THREE.MeshBasicMaterial( { color: 0xeeeeee, map: texture,bumpMap: bumpMap, side: THREE.DoubleSide, shininess: 0} );
  }
  //var mat = new THREE.MeshLambertMaterial( { color: 0xffffff, envMap: reflectionCube } );
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
  ship.frustumCulled = false;
  ship.castShadow = true;
  ship.receiveShadow = true;
  ship.scale.set(guiControls.size,guiControls.size,guiControls.size);
  c_mesh_size.onChange(function(){
    ship.scale.set(guiControls.size,guiControls.size,guiControls.size);
  });

  //scene.add(ship);
  return ship;
}

function addTorus(){
  var ship = new THREE.Object3D();
  var mat = new THREE.MeshBasicMaterial( { color: guiControls.colorMetal,  envMap: cubeCamera.renderTarget.texture, combine: THREE.MixOperation, reflectivity: guiControls.reflectivity} );

  //var mat = new THREE.MeshLambertMaterial( { color: 0xffffff, side: THREE.DoubleSide, envMap: refractionCube, refractionRatio: 0.55 } );
  //var mat = new THREE.MeshLambertMaterial( { color: 0xffffff, envMap: reflectionCube } );
  var max = 3 + 15 * Math.random();
  max *= 1.5;
  for (var i = 0; i < max; i++) {
      const radius = 1;
      const tube = .5;
      const radialSegments = 8;
      const tubularSegments = 32;
      var geo = new THREE.TorusKnotGeometry(radius, tube, tubularSegments, radialSegments);
      var mesh = new THREE.Mesh(geo, mat)
      var roz = 10;
      mesh.position.x = (Math.random() - .5) * roz;
      mesh.position.y = (Math.random() / 2) * roz - 2;
      mesh.position.z = (Math.random() - .5) * roz;
      mesh.rotation.x = (Math.random() - .5) * roz;
      mesh.rotation.y = (Math.random() / 2) * roz - 2;
      mesh.rotation.z = (Math.random() - .5) * roz;
      var ran = Math.random() * 1 + 0.3;
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
  ship.frustumCulled = false;
  ship.castShadow = true;
  ship.receiveShadow = true;

  // MERGE
  var geom = new THREE.Geometry()
  for (var i = 0; i < ship.children.length; i++) {
      ship.children[i].updateMatrix();
      geom.merge(ship.children[i].geometry, ship.children[i].matrix);
  }
  ship = new THREE.Mesh(geom, mat)
  ship.frustumCulled = false;
  ship.castShadow = true;
  ship.receiveShadow = true;
  ship.scale.set(guiControls.sizeMetal,guiControls.sizeMetal,guiControls.sizeMetal);
  c_mesh_metal_size.onChange(function(){
    ship.scale.set(guiControls.sizeMetal,guiControls.sizeMetal,guiControls.sizeMetal);
  });
  c_mesh_metal_color.onChange(function(){
      ship.material = new THREE.MeshBasicMaterial( { color: guiControls.colorMetal, envMap: cubeCamera.renderTarget.texture, combine: THREE.MixOperation, reflectivity: guiControls.reflectivity } );
  });
  c_mesh_metal_refl.onChange(function(){
    ship.material = new THREE.MeshBasicMaterial( { color: guiControls.colorMetal, envMap: cubeCamera.renderTarget.texture, combine: THREE.MixOperation, reflectivity: guiControls.reflectivity } );
  });

  //scene.add(ship);
  return ship;
}

/////GAME SCREEEN//////
function initGame() {
  sceneGame = new THREE.Scene();

  //checks if it is between 6am and 6pm in UTC timezone
  //Source: https://stackoverflow.com/questions/2250036/how-to-determine-if-it-is-day-or-night-in-javascript-or-jquery
  if((Date.now() + 21600000) % 86400000 / 3600000 < 12){
    sceneGame.fog = new THREE.Fog(nightColor ,100, 5000 );
    sceneGame.background = new THREE.Color(nightColor);
    gradientImage = new THREE.TextureLoader().load( 'img/gradient_night.PNG' );
    ambLight = new THREE.AmbientLight( 0xffffff, .4 );
  } else{
    sceneGame.fog = new THREE.Fog(dayColor , 1000, 5000 );
    sceneGame.background = new THREE.Color(dayColor);
    gradientImage = new THREE.TextureLoader().load( 'img/gradient.PNG' );
    ambLight = new THREE.AmbientLight( 0xffffff, .7 );
  }
  //lights
  sceneGame.add(ambLight);

  //cameras
  cameraGame = new THREE.PerspectiveCamera( 50, window.innerWidth / window.innerHeight, 1, 5000);

  cubeCamera = new THREE.CubeCamera( 1, 5000, 256 );
  cubeCamera.renderTarget.texture.generateMipmaps = true;
  cubeCamera.renderTarget.texture.minFilter = THREE.LinearMipmapLinearFilter;
  scene.remove(cubeCamera);
  sceneGame.add( cubeCamera );

  //player
  scene.remove(playerShape);
  playerShape.position.set(0, -10, -25);
  playerShape.children[1].material.envMap = null;
  playerShape.children[2].material.envMap = null;


  player = new THREE.Object3D();
  player.add(cameraGame);
  player.add(playerShape);
  sceneGame.add(player);


  let playerJson = playerShape.clone();
  console.log(playerJson);
  let playerJSON = playerJson.toJSON();
  console.log(playerJSON);
  var loader = new THREE.ObjectLoader();
  var object = loader.parse(playerJSON);
  console.log(object);
  sceneGame.add( object );

  playerShape.children[1].material.envMap = cubeCamera.renderTarget.texture;
  playerShape.children[2].material.envMap = cubeCamera.renderTarget.texture;

  //controls
  controls = new FlyControls( player, renderer.domElement );
  controls.movementSpeed = 200;
  controls.lookSpeed = 0.2;
  controls.rollSpeed = Math.PI / 12;
  controls.autoForward = false;
  controls.dragToLook = false;
  sceneGame.add(controls.object);

  raycaster = new THREE.Raycaster(new THREE.Vector3(), new THREE.Vector3( 0, - 1, 0 ), 0, 30);
  //stats
  stats = new Stats();
  container.appendChild( stats.dom );
}


function addObjectsGame() {
  sceneGame.add(addTerrain());
  let stars = addStars();
  for(let i in stars){
    sceneGame.add(stars[i]);
  }
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
  sceneGame.add( star );

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
      fogColor:    { type: "c", value: sceneGame.fog.color },
      fogNear:     { type: "f", value: sceneGame.fog.near },
      fogFar:      { type: "f", value: sceneGame.fog.far }
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

function onWindowResize() {
  if(onGame){
    cameraGame.aspect = window.innerWidth / window.innerHeight;
    cameraGame.updateProjectionMatrix();
  } else{
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
  }
  renderer.setSize( window.innerWidth, window.innerHeight );
}
function animate() {
  requestAnimationFrame( animate );
  render();
}
function render() {
  if(onGame){
    gem.visible = false;
    metal.visible = false;
    cubeCamera.position.copy( player.position );
    cubeCamera.update( renderer, sceneGame );
    gem.visible = true;
    metal.visible = true;
    materialNoise.uniforms[ 'time' ].value = .000025 * ( Date.now() - start );
    controls.update( clock.getDelta() );
    renderer.render( sceneGame, cameraGame );
    stats.update();

  }else {
    gem.visible = false;
    metal.visible = false;
    cubeCamera.position.copy( gem.position );
    cubeCamera.update( renderer, scene );
    gem.visible = true;
    metal.visible = true;


    renderer.render( scene, camera );
    stats.update();
  }

}
