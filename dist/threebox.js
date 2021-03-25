"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Threebox = void 0;
const mapbox_gl_1 = require("mapbox-gl");
const three_1 = require("three");
const Projection_1 = require("./Projection");
var Projection_2 = require("./Projection");
Object.defineProperty(exports, "Projection", { enumerable: true, get: function () { return Projection_2.Projection; } });
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
        this._setupCamera();
    }
    _setupCamera() {
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
        this._renderer.state.reset();
        this._renderer.render(this.scene, this._camera);
        this._map.triggerRepaint();
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
        window.requestAnimationFrame((t) => this.update(t));
    }
    addAtCoordinate(obj, lnglat = [0, 0, 0]) {
        this.world.add(obj);
        obj.position.copy(Projection_1.Projection.coordsToVector3(lnglat));
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
    metersToMercatorUnit(meters, lat) {
        const coord = mapbox_gl_1.MercatorCoordinate.fromLngLat([0, lat]);
        return meters * coord.meterInMercatorCoordinateUnits();
    }
    mercatorUnitToMeters(units, lat) {
        const coord = mapbox_gl_1.MercatorCoordinate.fromLngLat([0, lat]);
        return units / coord.meterInMercatorCoordinateUnits();
    }
    zoomToAltitude(lat, zoom) {
        const scale = Projection_1.Projection.zoomToScale(zoom) * (Projection_1.Projection.TILE_SIZE / Projection_1.Projection.WORLD_SIZE);
        const pixelsPerMeter = Projection_1.Projection.projectedUnitsPerMeter(lat) * scale;
        return this._cameraToCenterDistance / pixelsPerMeter;
    }
    altitudeToZoom(lat, height) {
        const pixelsPerMeter = this._cameraToCenterDistance / height;
        const scale = (pixelsPerMeter / Projection_1.Projection.projectedUnitsPerMeter(lat)) / (Projection_1.Projection.TILE_SIZE / Projection_1.Projection.WORLD_SIZE);
        return Projection_1.Projection.scaleToZoom(scale);
    }
    cameraToVector3AndEuler(pos) {
        if (!pos.center || !pos.zoom)
            throw new Error("Camera must have a center and a zoom position");
        if (!this._map)
            throw new Error("Layer must be added to the map");
        const c = mapbox_gl_1.LngLat.convert(pos.center);
        const p = (pos.pitch || 0) * Projection_1.Projection.DEG2RAD;
        const b = (pos.bearing || 0) * Projection_1.Projection.DEG2RAD;
        const position = [c.lng, c.lat, this.zoomToAltitude(c.lat, pos.zoom)];
        const projected = Projection_1.Projection.coordsToVector3(position);
        projected.x += projected.z * Math.sin(-p) * Math.sin(b);
        projected.y += projected.z * Math.sin(-p) * Math.cos(b);
        projected.z = projected.z * Math.cos(-p);
        return [projected, new three_1.Euler(p, 0, b)];
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
        const zoomPow = tr.scale * Projection_1.Projection.TILE_SIZE / Projection_1.Projection.WORLD_SIZE;
        // Handle scaling and translation of objects in the map in the world's matrix transform, not the camera
        const scale = new three_1.Matrix4();
        const translateMap = new three_1.Matrix4();
        const rotateMap = new three_1.Matrix4();
        scale.makeScale(zoomPow, zoomPow, zoomPow);
        translateMap.makeTranslation(-tr.point.x, tr.point.y, 0);
        rotateMap.makeRotationZ(Math.PI);
        this.world.matrix = new three_1.Matrix4();
        this.world.matrix
            .premultiply(rotateMap)
            .premultiply(this._translateCenter)
            .premultiply(scale)
            .premultiply(translateMap);
        // this._camera.projectionMatrixInverse.getInverse(this._camera.projectionMatrix);
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
