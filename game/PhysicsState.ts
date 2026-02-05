import * as THREE from 'three';

// Mutable storage for high-frequency data (60FPS)
// We avoid putting this in Zustand to prevent React render thrashing.
export interface PhysicsEntity {
  id: string;
  position: THREE.Vector3;
  radius: number;
  isPlayer: boolean;
}

class PhysicsManager {
  entities: Map<string, PhysicsEntity> = new Map();

  updateEntity(id: string, position: THREE.Vector3, radius: number, isPlayer: boolean) {
    const entity = this.entities.get(id);
    if (entity) {
      entity.position.copy(position);
      entity.radius = radius;
    } else {
      this.entities.set(id, {
        id,
        position: position.clone(),
        radius,
        isPlayer
      });
    }
  }

  removeEntity(id: string) {
    this.entities.delete(id);
  }

  getEntities(): PhysicsEntity[] {
    return Array.from(this.entities.values());
  }
  
  clear() {
    this.entities.clear();
  }
}

export const physicsState = new PhysicsManager();