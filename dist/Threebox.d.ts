import { CameraOptions, Map } from "mapbox-gl";
import { Euler, Group, Object3D, Scene, Vector3 } from "three";
export declare type PrivateMap = Map & {
    transform: any;
};
export { Projection } from "./Projection";
export declare class Threebox {
    readonly scene: Scene;
    readonly world: Group;
    private _camera;
    private _map;
    private _renderer;
    private _cameraToCenterDistance;
    private _cameraTranslateZ;
    private _topHalfSurfaceDistance;
    private _translateCenter;
    constructor(map: PrivateMap, glContext: WebGLRenderingContext);
    _setupCamera(): void;
    render(): void;
    syncCamera(): void;
    updateOnce(): void;
    update(timestamp: number): void;
    addAtCoordinate(obj: Object3D, lnglat?: number[]): Object3D;
    remove(obj: Object3D): void;
    setupDefaultLights(): void;
    metersToMercatorUnit(meters: number, lat: number): number;
    mercatorUnitToMeters(units: number, lat: number): number;
    zoomToAltitude(lat: number, zoom: number): number;
    altitudeToZoom(lat: number, height: number): number;
    cameraToVector3AndEuler(pos: CameraOptions): [Vector3, Euler];
    private _updateCamera;
    private _makePerspectiveMatrix;
}
