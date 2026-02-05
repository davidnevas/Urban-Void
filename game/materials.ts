import * as THREE from 'three';

// This shader injects a discard logic into a standard material
// to create transparent "holes" where the players are.
export const createGroundMaterial = (texture: THREE.Texture) => {
  const material = new THREE.MeshStandardMaterial({
    map: texture,
    roughness: 0.8,
    metalness: 0.2,
    color: new THREE.Color('#333333')
  });

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uHoles = { value: [
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 0, 0)
    ] };
    shader.uniforms.uHoleCount = { value: 0 };

    shader.vertexShader = `
      varying vec3 vWorldPosition;
      ${shader.vertexShader}
    `.replace(
      '#include <worldpos_vertex>',
      `
      #include <worldpos_vertex>
      vWorldPosition = (modelMatrix * vec4(transformed, 1.0)).xyz;
      `
    );

    shader.fragmentShader = `
      uniform vec3 uHoles[4];
      uniform int uHoleCount;
      varying vec3 vWorldPosition;
      ${shader.fragmentShader}
    `.replace(
      '#include <dithering_fragment>',
      `
      #include <dithering_fragment>
      
      // Check distance to all holes
      for(int i = 0; i < 4; i++) {
        if (i >= uHoleCount) break;
        float dist = distance(vWorldPosition.xz, uHoles[i].xz);
        // Soft edge for smoother look, or hard cut
        if (dist < uHoles[i].y) {
           discard;
        }
      }
      `
    );
  };

  return material;
};