"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const three_1 = require("three");
const Utils_1 = require("../Utils/Utils");
const projection_1 = require("../projection");
class CameraSync {
    get camera() { return this._camera; }
    /**
     * @param {Map & { transform: any }} map
     * @param {THREE.PerspectiveCamera} camera
     * @param {THREE.Group} world
     */
    constructor(map, world) {
        this._map = map;
        this._world = world;
        this._camera = new three_1.PerspectiveCamera();
        this._camera.matrixAutoUpdate = false; // We're in charge of the camera now!
    }
    updateCamera() {
        // Build a projection matrix, paralleling the code found in Mapbox GL JS
        const fov = exports.CAMERA_FOV;
        const cameraToCenterDistance = 0.5 / Math.tan(fov / 2) * this._map.transform.height;
        const halfFov = fov / 2;
        const groundAngle = Math.PI / 2 + this._map.transform._pitch;
        const topHalfSurfaceDistance = Math.sin(halfFov) * cameraToCenterDistance / Math.sin(Math.PI - groundAngle - halfFov);
        const furthestDistance = Math.cos(Math.PI / 2 - this._map.transform._pitch) * topHalfSurfaceDistance + cameraToCenterDistance;
        const farZ = furthestDistance * 1.01; // Add a bit extra to avoid precision problems
        this._camera.projectionMatrix = Utils_1.makePerspectiveMatrix(fov, this._map.transform.width / this._map.transform.height, 1, farZ);
        const cameraWorldMatrix = new three_1.Matrix4();
        const cameraTranslateZ = new three_1.Matrix4().makeTranslation(0, 0, cameraToCenterDistance);
        const cameraRotateX = new three_1.Matrix4().makeRotationX(this._map.transform._pitch);
        const cameraRotateZ = new three_1.Matrix4().makeRotationZ(this._map.transform.angle);
        // Unlike the Mapbox GL JS camera, separate camera translation and rotation out into its world matrix
        // If this is applied directly to the projection matrix, it will work OK but break raycasting
        cameraWorldMatrix
            .premultiply(cameraTranslateZ)
            .premultiply(cameraRotateX)
            .premultiply(cameraRotateZ);
        this._camera.matrixWorld.copy(cameraWorldMatrix);
        const zoomPow = this._map.transform.scale;
        // Handle scaling and translation of objects in the map in the world's matrix transform, not the camera
        const scale = new three_1.Matrix4();
        const translateCenter = new three_1.Matrix4();
        const translateMap = new three_1.Matrix4();
        const rotateMap = new three_1.Matrix4();
        scale.makeScale(zoomPow, zoomPow, zoomPow);
        translateCenter.makeTranslation(projection_1.WORLD_SIZE / 2, -projection_1.WORLD_SIZE / 2, 0);
        translateMap.makeTranslation(-this._map.transform.x, this._map.transform.y, 0);
        rotateMap.makeRotationZ(Math.PI);
        this._world.matrix = new three_1.Matrix4();
        this._world.matrix
            .premultiply(rotateMap)
            .premultiply(translateCenter)
            .premultiply(scale)
            .premultiply(translateMap);
    }
}
exports.CameraSync = CameraSync;
;
exports.CAMERA_FOV = 0.6435011087932844;
