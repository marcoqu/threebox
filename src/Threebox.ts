import { Map } from "mapbox-gl";
import {
    AmbientLight,
    DirectionalLight,
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
    private _canvas: HTMLCanvasElement;

    constructor(map: PrivateMap) {
        this._map = map;

        this._renderer = new WebGLRenderer({ alpha: true, antialias: true });
        this._renderer.setSize(this._map.transform.width, this._map.transform.height);
        this._renderer.shadowMap.enabled = true;

        this._canvas = this._renderer.domElement;
        this._canvas.style.position = "relative";
        this._canvas.style.pointerEvents = "none";
        this._canvas.style.zIndex = (+(this._map.getCanvas().style.zIndex || 0) + 1).toString();

        this._map.getCanvasContainer().appendChild(this._canvas);
        this._map.on("resize", () => this._onMapResize());

        this.world = new Group();
        this.world.position.x = this.world.position.y = Projection.WORLD_SIZE / 2;
        this.world.matrixAutoUpdate = false;

        this._camera = new PerspectiveCamera();
        this._camera.matrixAutoUpdate = false;

        this.scene = new Scene();
        this.scene.add(this.world);
    }

    public render() {
        this._renderer.render(this.scene, this._camera);
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
        obj.position.copy(Projection.projectToWorld(lnglat));
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

    private _updateCamera(): void {
        // Build a projection matrix, paralleling the code found in Mapbox GL JS
        const halfFov = CAMERA_FOV / 2;
        const cameraToCenterDistance = 0.5 / Math.tan(halfFov) * this._map.transform.height;
        const groundAngle = Math.PI / 2 + this._map.transform._pitch;

        const topHalfSurfaceDistance =
            Math.sin(halfFov) * cameraToCenterDistance /
            Math.sin(Math.PI - groundAngle - halfFov);

        const furthestDistance =
            Math.cos(Math.PI / 2 - this._map.transform._pitch) *
            topHalfSurfaceDistance + cameraToCenterDistance;

        const farZ = furthestDistance * 1.01; // Add a bit extra to avoid precision problems

        this._camera.projectionMatrix = this._makePerspectiveMatrix(
            CAMERA_FOV,
            this._map.transform.width / this._map.transform.height,
            1,
            farZ);

        const cameraWorldMatrix = new Matrix4();
        const cameraTranslateZ = new Matrix4().makeTranslation(0, 0, cameraToCenterDistance);
        const cameraRotateX = new Matrix4().makeRotationX(this._map.transform._pitch);
        const cameraRotateZ = new Matrix4().makeRotationZ(this._map.transform.angle);

        // Unlike the Mapbox GL JS camera, separate camera translation and rotation out into its world matrix
        // If this is applied directly to the projection matrix, it will work OK but break raycasting
        cameraWorldMatrix
            .premultiply(cameraTranslateZ)
            .premultiply(cameraRotateX)
            .premultiply(cameraRotateZ);

        this._camera.matrixWorld.copy(cameraWorldMatrix);

        const zoomPow = this._map.transform.scale;
        // Handle scaling and translation of objects in the map in the world's matrix transform, not the camera
        const scale = new Matrix4();
        const translateCenter = new Matrix4();
        const translateMap = new Matrix4();
        const rotateMap = new Matrix4();

        scale.makeScale(zoomPow, zoomPow, zoomPow);
        translateCenter.makeTranslation(Projection.WORLD_SIZE / 2, -Projection.WORLD_SIZE / 2, 0);
        translateMap.makeTranslation(-this._map.transform.x, this._map.transform.y, 0);
        rotateMap.makeRotationZ(Math.PI);
        this.world.matrix = new Matrix4();
        this.world.matrix
            .premultiply(rotateMap)
            .premultiply(translateCenter)
            .premultiply(scale)
            .premultiply(translateMap);
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

    private _onMapResize() {
        this._renderer.setSize(this._map.transform.width, this._map.transform.height);
    }

}

const CAMERA_FOV = 0.6435011087932844;
