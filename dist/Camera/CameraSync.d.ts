import { Group, PerspectiveCamera } from 'three';
import { PrivateMap } from '../Threebox';
export declare class CameraSync {
    _map: PrivateMap;
    _world: Group;
    _camera: PerspectiveCamera;
    readonly camera: PerspectiveCamera;
    /**
     * @param {Map & { transform: any }} map
     * @param {THREE.PerspectiveCamera} camera
     * @param {THREE.Group} world
     */
    constructor(map: PrivateMap, world: Group);
    updateCamera(): void;
}
export declare const CAMERA_FOV = 0.6435011087932844;
