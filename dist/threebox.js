"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const three_1 = require("three");
const Projection_1 = require("./Projection");
var Projection_2 = require("./Projection");
exports.Projection = Projection_2.Projection;
class Threebox {
    constructor(map) {
        this._map = map;
        this._renderer = new three_1.WebGLRenderer({ alpha: true, antialias: true });
        this._renderer.setSize(this._map.transform.width, this._map.transform.height);
        this._renderer.shadowMap.enabled = true;
        this._canvas = this._renderer.domElement;
        this._canvas.style.position = 'relative';
        this._canvas.style.pointerEvents = 'none';
        this._canvas.style.zIndex = (+(this._map.getCanvas().style.zIndex || 0) + 1).toString();
        this._map.getCanvasContainer().appendChild(this._canvas);
        this._map.on('resize', () => this._onMapResize());
        this._world = new three_1.Group();
        this._world.position.x = this._world.position.y = Projection_1.Projection.WORLD_SIZE / 2;
        this._world.matrixAutoUpdate = false;
        this._camera = new three_1.PerspectiveCamera();
        this._camera.matrixAutoUpdate = false;
        this._scene = new three_1.Scene();
        this._scene.add(this._world);
    }
    render() {
        this._renderer.render(this._scene, this._camera);
    }
    syncCamera() {
        this._updateCamera();
    }
    updateOnce() {
        this.syncCamera();
        this.render();
    }
    update(timestamp) {
        this.updateOnce();
        window.requestAnimationFrame((timestamp) => this.update(timestamp));
    }
    addAtCoordinate(obj, lnglat = [0, 0, 0]) {
        this._world.add(obj);
        obj.position.copy(Projection_1.Projection.projectToWorld(lnglat));
        return obj;
    }
    remove(obj) {
        this._world.remove(obj);
    }
    setupDefaultLights() {
        this._scene.add(new three_1.AmbientLight(0xCCCCCC));
        const sunlight = new three_1.DirectionalLight(0xFFFFFF, 0.5);
        sunlight.position.set(0, 800, 1000);
        sunlight.matrixWorldNeedsUpdate = true;
        this._world.add(sunlight);
    }
    _updateCamera() {
        // Build a projection matrix, paralleling the code found in Mapbox GL JS
        const halfFov = CAMERA_FOV / 2;
        const cameraToCenterDistance = 0.5 / Math.tan(halfFov) * this._map.transform.height;
        const groundAngle = Math.PI / 2 + this._map.transform._pitch;
        const topHalfSurfaceDistance = Math.sin(halfFov) * cameraToCenterDistance / Math.sin(Math.PI - groundAngle - halfFov);
        const furthestDistance = Math.cos(Math.PI / 2 - this._map.transform._pitch) * topHalfSurfaceDistance + cameraToCenterDistance;
        const farZ = furthestDistance * 1.01; // Add a bit extra to avoid precision problems
        this._camera.projectionMatrix = this._makePerspectiveMatrix(CAMERA_FOV, this._map.transform.width / this._map.transform.height, 1, farZ);
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
        translateCenter.makeTranslation(Projection_1.Projection.WORLD_SIZE / 2, -Projection_1.Projection.WORLD_SIZE / 2, 0);
        translateMap.makeTranslation(-this._map.transform.x, this._map.transform.y, 0);
        rotateMap.makeRotationZ(Math.PI);
        this._world.matrix = new three_1.Matrix4();
        this._world.matrix
            .premultiply(rotateMap)
            .premultiply(translateCenter)
            .premultiply(scale)
            .premultiply(translateMap);
    }
    _makePerspectiveMatrix(fovy, aspect, near, far) {
        var out = new three_1.Matrix4();
        var f = 1.0 / Math.tan(fovy / 2), nf = 1 / (near - far);
        out.elements[0] = f / aspect;
        out.elements[1] = 0;
        out.elements[2] = 0;
        out.elements[3] = 0;
        out.elements[4] = 0;
        out.elements[5] = f;
        out.elements[6] = 0;
        out.elements[7] = 0;
        out.elements[8] = 0;
        out.elements[9] = 0;
        out.elements[10] = (far + near) * nf;
        out.elements[11] = -1;
        out.elements[12] = 0;
        out.elements[13] = 0;
        out.elements[14] = (2 * far * near) * nf;
        out.elements[15] = 0;
        return out;
    }
    _onMapResize() {
        this._renderer.setSize(this._map.transform.width, this._map.transform.height);
    }
}
exports.Threebox = Threebox;
const CAMERA_FOV = 0.6435011087932844;
