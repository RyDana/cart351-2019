class Player {
  constructor(position, rotation, object) {
    this.position = position;
    this.rotation = rotation;
    this.cameraGem = new THREE.CubeCamera( 1, 10000, 256 );
		this.cameraGem.renderTarget.texture.generateMipmaps = true;
		this.cameraGem.renderTarget.texture.minFilter = THREE.LinearMipmapLinearFilter;
    this.object = object;
  }
}
