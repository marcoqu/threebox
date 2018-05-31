import { Group, Matrix4 } from 'three';
import { makePerspectiveMatrix } from '../Utils/Utils.js';
import { WORLD_SIZE } from '../constants.js';

class CameraSync {

    constructor(map, camera, world) {
        this.map = map;
        this.camera = camera;
        this.active = true;
        this.camera.matrixAutoUpdate = false; // We're in charge of the camera now!

        // Position and configure the world group so we can scale it appropriately when the camera zooms
        this.world = world || new Group();
        this.world.position.x = this.world.position.y = WORLD_SIZE / 2;
        this.world.matrixAutoUpdate = false;
    }

    updateCamera(ev) {
        if (!this.camera) {
            console.log('nocamera');
            return;
        }

        // Build a projection matrix, paralleling the code found in Mapbox GL JS
        const fov = 0.6435011087932844;
        var cameraToCenterDistance = 0.5 / Math.tan(fov / 2) * this.map.transform.height;
        const halfFov = fov / 2;
        const groundAngle = Math.PI / 2 + this.map.transform._pitch;
        const topHalfSurfaceDistance = Math.sin(halfFov) * cameraToCenterDistance / Math.sin(Math.PI - groundAngle - halfFov);

        // Calculate z distance of the farthest fragment that should be rendered.
        const furthestDistance = Math.cos(Math.PI / 2 - this.map.transform._pitch) * topHalfSurfaceDistance + cameraToCenterDistance;

        // Add a bit extra to avoid precision problems when a fragment's distance is exactly `furthestDistance`
        const farZ = furthestDistance * 1.01;

        this.camera.projectionMatrix = makePerspectiveMatrix(fov, this.map.transform.width / this.map.transform.height, 1, farZ);

        var cameraWorldMatrix = new Matrix4();
        var cameraTranslateZ = new Matrix4().makeTranslation(0, 0, cameraToCenterDistance);
        var cameraRotateX = new Matrix4().makeRotationX(this.map.transform._pitch);
        var cameraRotateZ = new Matrix4().makeRotationZ(this.map.transform.angle);

        // Unlike the Mapbox GL JS camera, separate camera translation and rotation out into its world matrix
        // If this is applied directly to the projection matrix, it will work OK but break raycasting
        cameraWorldMatrix
            .premultiply(cameraTranslateZ)
            .premultiply(cameraRotateX)
            .premultiply(cameraRotateZ);

        this.camera.matrixWorld.copy(cameraWorldMatrix);

        var zoomPow = this.map.transform.scale;
        // Handle scaling and translation of objects in the map in the world's matrix transform, not the camera
        var scale = new Matrix4();
        var translateCenter = new Matrix4();
        var translateMap = new Matrix4();
        var rotateMap = new Matrix4();

        scale.makeScale(zoomPow, zoomPow, zoomPow);
        translateCenter.makeTranslation(WORLD_SIZE / 2, -WORLD_SIZE / 2, 0);
        translateMap.makeTranslation(-this.map.transform.x, this.map.transform.y, 0);
        rotateMap.makeRotationZ(Math.PI);
        this.world.matrix = new Matrix4();
        this.world.matrix
            .premultiply(rotateMap)
            .premultiply(translateCenter)
            .premultiply(scale)
            .premultiply(translateMap);

        // utils.prettyPrintMatrix(this.camera.projectionMatrix.elements);
    }

};

export default exports = CameraSync;
