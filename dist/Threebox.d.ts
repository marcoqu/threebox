import { Map } from "mapbox-gl";
import { Group, Object3D, Scene } from "three";
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
    setupCamera(): void;
    render(): void;
    syncCamera(): void;
    updateOnce(): void;
    update(timestamp: number): void;
    addAtCoordinate(obj: Object3D, lnglat?: number[]): Object3D;
    remove(obj: Object3D): void;
    setupDefaultLights(): void;
    private _getCameraToCenterDistance;
    zoomToHeight(lat: number, zoom: number): number;
    heightToZoom(lat: number, height: number): number;
    private _updateCamera;
    private _makePerspectiveMatrix;
}
