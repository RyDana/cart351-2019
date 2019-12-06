class Player {
  constructor(x,y,z,rX,rY,rZ,shapeRock,shapeGem,shapeMetal) {
    this.x = x;
    this.y = y;
    this.z = z;
    this.x = rX;
    this.y = rY;
    this.z = rZ;
    this.shapeRock = shapeRock;
    this.shapeGem = shapeGem;
    this.shapeMetal = shapeMetal;
    this.cameraGem = new THREE.CubeCamera( 1, 10000, 256 );
		this.cameraGem.renderTarget.texture.generateMipmaps = true;
		this.cameraGem.renderTarget.texture.minFilter = THREE.LinearMipmapLinearFilter;
  }
}

function initializeShape(){
  let group = new THREE.Group();
  rock = addIco(2,0,0,0);
  gem = addIco(1,0,0,0);
  group.add(rock);
  group.add(gem);

  return group;

}
