import { CameraOptions, LngLat, Map, MercatorCoordinate } from "mapbox-gl";
import {
    AmbientLight,
    DirectionalLight,
    Euler,
    Group,
    Matrix4,
    Object3D,
    PerspectiveCamera,
    Scene,
    Vector3,
    WebGLRenderer,
} from "three";

import { Projection } from "./Projection";

export type PrivateMap = Map & { transform: any };
export { Projection } from "./Projection";

export class Threebox {

    public readonly scene: Scene;
    public readonly world: Group;

    private _camera: PerspectiveCamera;
    private _map: PrivateMap;
    private _renderer: WebGLRenderer;
    private _cameraToCenterDistance!: number;
    private _cameraTranslateZ!: Matrix4;
    private _topHalfSurfaceDistance!: number;
    private _translateCenter!: Matrix4;

    constructor(map: PrivateMap, glContext: WebGLRenderingContext) {
        this._map = map;

        this._renderer = new WebGLRenderer({
            alpha: true,
            antialias: true,
            canvas: map.getCanvas(),
            context: glContext
        } as any);

        this._renderer.shadowMap.enabled = true;
        this._renderer.autoClear = false;

        this.world = new Group();
        this.world.position.x = this.world.position.y = Projection.WORLD_SIZE / 2;
        this.world.matrixAutoUpdate = false;

        this._camera = new PerspectiveCamera(28, window.innerWidth / window.innerHeight, 0.000000000001, Infinity);
        this._camera.matrixAutoUpdate = false;

        this.scene = new Scene();
        this.scene.add(this.world);
        this._setupCamera()
    }

    public _setupCamera() {
        var t = this._map.transform
        const halfFov = CAMERA_FOV / 2;
        var cameraToCenterDistance = 0.5 / Math.tan(halfFov) * t.height;
        const groundAngle = Math.PI / 2 + t._pitch;

        this._translateCenter = new Matrix4().makeTranslation(Projection.WORLD_SIZE / 2, -Projection.WORLD_SIZE / 2, 0);
        this._cameraToCenterDistance = cameraToCenterDistance;
        this._cameraTranslateZ = new Matrix4().makeTranslation(0, 0, cameraToCenterDistance);
        this._topHalfSurfaceDistance =
            Math.sin(halfFov) * cameraToCenterDistance /
            Math.sin(Math.PI - groundAngle - halfFov);
    
        this._updateCamera();
    }

    public render() {
        this._renderer.state.reset();
        this._renderer.render(this.scene, this._camera);
        this._map.triggerRepaint();
    }

    public syncCamera() {
        this._updateCamera();
    }

    public updateOnce() {
        this.syncCamera();
        this.render();
    }

    public update(timestamp: number) {
        this.updateOnce();
        window.requestAnimationFrame((t) => this.update(t));
    }

    public addAtCoordinate(obj: Object3D, lnglat: number[] = [0, 0, 0]) {
        this.world.add(obj);
        obj.position.copy(Projection.coordsToVector3(lnglat));
        return obj;
    }

    public remove(obj: Object3D) {
        this.world.remove(obj);
    }

    public setupDefaultLights() {
        this.scene.add(new AmbientLight(0xCCCCCC));

        const sunlight = new DirectionalLight(0xFFFFFF, 0.5);
        sunlight.position.set(0, 800, 1000);
        sunlight.matrixWorldNeedsUpdate = true;
        this.world.add(sunlight);
    }

    public metersToMercatorUnit(meters: number, lat: number): number {
        const coord = MercatorCoordinate.fromLngLat([0, lat]);
        return meters * coord.meterInMercatorCoordinateUnits();
    }

    public mercatorUnitToMeters(units: number, lat: number): number {
        const coord = MercatorCoordinate.fromLngLat([0, lat]);
        return units / coord.meterInMercatorCoordinateUnits();
    }

    public zoomToAltitude(lat: number, zoom: number): number {
        const scale = Projection.zoomToScale(zoom) * (Projection.TILE_SIZE / Projection.WORLD_SIZE);
        const pixelsPerMeter = Projection.projectedUnitsPerMeter(lat) * scale;
        return this._cameraToCenterDistance / pixelsPerMeter;
    }

    public altitudeToZoom(lat: number, height: number): number {
        const pixelsPerMeter = this._cameraToCenterDistance / height;
        const scale = (pixelsPerMeter / Projection.projectedUnitsPerMeter(lat)) / (Projection.TILE_SIZE / Projection.WORLD_SIZE);
        return Projection.scaleToZoom(scale);
    }

    public cameraToVector3AndEuler(pos: CameraOptions): [Vector3, Euler] {
        if (!pos.center || !pos.zoom) throw new Error("Camera must have a center and a zoom position");
        if (!this._map) throw new Error("Layer must be added to the map");
        const c = LngLat.convert(pos.center);
        const p = (pos.pitch || 0) * Projection.DEG2RAD;
        const b = (pos.bearing || 0) * Projection.DEG2RAD;
        const position = [c.lng, c.lat, this.zoomToAltitude(c.lat, pos.zoom)] as [number, number, number];
        const projected = Projection.coordsToVector3(position);
        projected.x += projected.z * Math.sin(-p) * Math.sin(b);
        projected.y += projected.z * Math.sin(-p) * Math.cos(b);
        projected.z = projected.z * Math.cos(-p);
        return [projected, new Euler(p, 0, b)];
    }
    

    private _updateCamera(): void {
        const tr = this._map.transform
        const furthestDistance =
            Math.cos(Math.PI / 2 - tr._pitch) *
            this._topHalfSurfaceDistance + this._cameraToCenterDistance;

        const farZ = furthestDistance * 1.01; // Add a bit extra to avoid precision problems

        this._camera.projectionMatrix = this._makePerspectiveMatrix(CAMERA_FOV, tr.width / tr.height, 1, farZ);

        const cameraWorldMatrix = new Matrix4();
        const cameraRotatePitch = new Matrix4().makeRotationX(tr._pitch);
        const cameraRotateBearing = new Matrix4().makeRotationZ(tr.angle);

        // Unlike the Mapbox GL JS camera, separate camera translation and rotation out into its world matrix
        // If this is applied directly to the projection matrix, it will work OK but break raycasting
        cameraWorldMatrix
            .premultiply(this._cameraTranslateZ)
            .premultiply(cameraRotatePitch)
            .premultiply(cameraRotateBearing);

        this._camera.matrixWorld.copy(cameraWorldMatrix);

        const zoomPow = tr.scale * Projection.TILE_SIZE / Projection.WORLD_SIZE;

        // Handle scaling and translation of objects in the map in the world's matrix transform, not the camera
        const scale = new Matrix4();
        const translateMap = new Matrix4();
        const rotateMap = new Matrix4();

        scale.makeScale(zoomPow, zoomPow, zoomPow);
        translateMap.makeTranslation(-tr.point.x, tr.point.y, 0);
        rotateMap.makeRotationZ(Math.PI);
        this.world.matrix = new Matrix4();
        this.world.matrix
            .premultiply(rotateMap)
            .premultiply(this._translateCenter)
            .premultiply(scale)
            .premultiply(translateMap);

        // this._camera.projectionMatrixInverse.getInverse(this._camera.projectionMatrix);
    }

    private _makePerspectiveMatrix(fovy: number, aspect: number, near: number, far: number): Matrix4 {
        const out = new Matrix4();
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

const CAMERA_FOV = 0.6435011087932844;
