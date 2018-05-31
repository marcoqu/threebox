import { Group, Matrix4 } from 'three';
import { makePerspectiveMatrix } from '../Utils/Utils.js';
import { WORLD_SIZE } from '../constants.js';

import { Map } from 'mapbox-gl';

class CameraSync {

    /**
     * @param {Map & { transform: any }} map
     * @param {THREE.PerspectiveCamera} camera
     * @param {THREE.Group} world
     */
    constructor(map, camera, world) {
        this._map = map;
        this._world = world;
        this._camera = camera;
        this._camera.matrixAutoUpdate = false; // We're in charge of the camera now!

        // Position and configure the world group so we can scale it appropriately when the camera zooms
        this._world = world || new Group();
        this._world.position.x = this._world.position.y = WORLD_SIZE / 2;
        this._world.matrixAutoUpdate = false;
    }

    updateCamera(ev) {
        // Build a projection matrix, paralleling the code found in Mapbox GL JS
        const fov = 0.6435011087932844;
        const cameraToCenterDistance = 0.5 / Math.tan(fov / 2) * this._map.transform.height;
        const halfFov = fov / 2;
        const groundAngle = Math.PI / 2 + this._map.transform._pitch;
        const topHalfSurfaceDistance = Math.sin(halfFov) * cameraToCenterDistance / Math.sin(Math.PI - groundAngle - halfFov);

        // Calculate z distance of the farthest fragment that should be rendered.
        const furthestDistance = Math.cos(Math.PI / 2 - this._map.transform._pitch) * topHalfSurfaceDistance + cameraToCenterDistance;

        // Add a bit extra to avoid precision problems when a fragment's distance is exactly `furthestDistance`
        const farZ = furthestDistance * 1.01;

        this._camera.projectionMatrix = makePerspectiveMatrix(fov, this._map.transform.width / this._map.transform.height, 1, farZ);

        var cameraWorldMatrix = new Matrix4();
        var cameraTranslateZ = new Matrix4().makeTranslation(0, 0, cameraToCenterDistance);
        var cameraRotateX = new Matrix4().makeRotationX(this._map.transform._pitch);
        var cameraRotateZ = new Matrix4().makeRotationZ(this._map.transform.angle);

        // Unlike the Mapbox GL JS camera, separate camera translation and rotation out into its world matrix
        // If this is applied directly to the projection matrix, it will work OK but break raycasting
        cameraWorldMatrix
            .premultiply(cameraTranslateZ)
            .premultiply(cameraRotateX)
            .premultiply(cameraRotateZ);

        this._camera.matrixWorld.copy(cameraWorldMatrix);

        var zoomPow = this._map.transform.scale;
        // Handle scaling and translation of objects in the map in the world's matrix transform, not the camera
        var scale = new Matrix4();
        var translateCenter = new Matrix4();
        var translateMap = new Matrix4();
        var rotateMap = new Matrix4();

        scale.makeScale(zoomPow, zoomPow, zoomPow);
        translateCenter.makeTranslation(WORLD_SIZE / 2, -WORLD_SIZE / 2, 0);
        translateMap.makeTranslation(-this._map.transform.x, this._map.transform.y, 0);
        rotateMap.makeRotationZ(Math.PI);
        this._world.matrix = new Matrix4();
        this._world.matrix
            .premultiply(rotateMap)
            .premultiply(translateCenter)
            .premultiply(scale)
            .premultiply(translateMap);
    }

};

export default exports = CameraSync;
