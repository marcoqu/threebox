"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const three_1 = require("three");
const Projection_1 = require("./Projection");
var Projection_2 = require("./Projection");
exports.Projection = Projection_2.Projection;
class Threebox {
    constructor(map, glContext) {
        this._map = map;
        this._renderer = new three_1.WebGLRenderer({
            alpha: true,
            antialias: true,
            canvas: map.getCanvas(),
            context: glContext
        });
        this._renderer.shadowMap.enabled = true;
        this._renderer.autoClear = false;
        this.world = new three_1.Group();
        this.world.position.x = this.world.position.y = Projection_1.Projection.WORLD_SIZE / 2;
        this.world.matrixAutoUpdate = false;
        this._camera = new three_1.PerspectiveCamera(28, window.innerWidth / window.innerHeight, 0.000000000001, Infinity);
        this._camera.matrixAutoUpdate = false;
        this.scene = new three_1.Scene();
        this.scene.add(this.world);
    }
    setupCamera() {
        var t = this._map.transform;
        const halfFov = CAMERA_FOV / 2;
        var cameraToCenterDistance = 0.5 / Math.tan(halfFov) * t.height;
        const groundAngle = Math.PI / 2 + t._pitch;
        this._translateCenter = new three_1.Matrix4().makeTranslation(Projection_1.Projection.WORLD_SIZE / 2, -Projection_1.Projection.WORLD_SIZE / 2, 0);
        this._cameraToCenterDistance = cameraToCenterDistance;
        this._cameraTranslateZ = new three_1.Matrix4().makeTranslation(0, 0, cameraToCenterDistance);
        this._topHalfSurfaceDistance =
            Math.sin(halfFov) * cameraToCenterDistance /
                Math.sin(Math.PI - groundAngle - halfFov);
        this._updateCamera();
    }
    render() {
        // if (this._map.repaint) this._map.repaint = false
        this._renderer.state.reset();
        this._renderer.render(this.scene, this._camera);
        this._map.triggerRepaint();
    }
    // public repaint(): void {
    //     this._map.repaint = true;
    // }
    syncCamera() {
        this._updateCamera();
    }
    updateOnce() {
        this.syncCamera();
        this.render();
    }
    update(timestamp) {
        this.updateOnce();
        window.requestAnimationFrame((t) => this.update(t));
    }
    addAtCoordinate(obj, lnglat = [0, 0, 0]) {
        this.world.add(obj);
        obj.position.copy(Projection_1.Projection.projectToWorld(lnglat));
        return obj;
    }
    remove(obj) {
        this.world.remove(obj);
    }
    setupDefaultLights() {
        this.scene.add(new three_1.AmbientLight(0xCCCCCC));
        const sunlight = new three_1.DirectionalLight(0xFFFFFF, 0.5);
        sunlight.position.set(0, 800, 1000);
        sunlight.matrixWorldNeedsUpdate = true;
        this.world.add(sunlight);
    }
    _getCameraToCenterDistance() {
        const halfFov = CAMERA_FOV / 2;
        return 0.5 / Math.tan(halfFov) * this._map.transform.height;
    }
    zoomToHeight(lat, zoom) {
        const pixelsPerMeter = Projection_1.Projection.projectedUnitsPerMeter(lat) * Projection_1.Projection.zoomScale(zoom);
        return this._getCameraToCenterDistance() / pixelsPerMeter;
    }
    heightToZoom(lat, height) {
        const pixelsPerMeter = this._getCameraToCenterDistance() / height;
        const scale = pixelsPerMeter / Projection_1.Projection.projectedUnitsPerMeter(lat);
        return Projection_1.Projection.scaleZoom(scale);
    }
    _updateCamera() {
        const tr = this._map.transform;
        const furthestDistance = Math.cos(Math.PI / 2 - tr._pitch) *
            this._topHalfSurfaceDistance + this._cameraToCenterDistance;
        const farZ = furthestDistance * 1.01; // Add a bit extra to avoid precision problems
        this._camera.projectionMatrix = this._makePerspectiveMatrix(CAMERA_FOV, tr.width / tr.height, 1, farZ);
        const cameraWorldMatrix = new three_1.Matrix4();
        const cameraRotatePitch = new three_1.Matrix4().makeRotationX(tr._pitch);
        const cameraRotateBearing = new three_1.Matrix4().makeRotationZ(tr.angle);
        // Unlike the Mapbox GL JS camera, separate camera translation and rotation out into its world matrix
        // If this is applied directly to the projection matrix, it will work OK but break raycasting
        cameraWorldMatrix
            .premultiply(this._cameraTranslateZ)
            .premultiply(cameraRotatePitch)
            .premultiply(cameraRotateBearing);
        this._camera.matrixWorld.copy(cameraWorldMatrix);
        const zoomPow = tr.scale * 512 / Projection_1.Projection.WORLD_SIZE;
        // Handle scaling and translation of objects in the map in the world's matrix transform, not the camera
        const scale = new three_1.Matrix4();
        const translateMap = new three_1.Matrix4();
        const rotateMap = new three_1.Matrix4();
        scale.makeScale(zoomPow, zoomPow, zoomPow);
        translateMap.makeTranslation(-tr.x, tr.y, 0);
        rotateMap.makeRotationZ(Math.PI);
        this.world.matrix = new three_1.Matrix4();
        this.world.matrix
            .premultiply(rotateMap)
            .premultiply(this._translateCenter)
            .premultiply(scale)
            .premultiply(translateMap);
        this._camera.projectionMatrixInverse.getInverse(this._camera.projectionMatrix);
    }
    _makePerspectiveMatrix(fovy, aspect, near, far) {
        const out = new three_1.Matrix4();
        const f = 1.0 / Math.tan(fovy / 2);
        const nf = 1 / (near - far);
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
}
exports.Threebox = Threebox;
const CAMERA_FOV = 0.6435011087932844;
