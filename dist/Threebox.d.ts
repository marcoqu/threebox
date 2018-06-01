import { Object3D } from 'three';
import { Map } from 'mapbox-gl';
export declare type PrivateMap = Map & {
    transform: any;
};
export { Projection } from "./Projection";
export default class Threebox {
    private _camera;
    private _map;
    private _renderer;
    private _canvas;
    private _scene;
    private _world;
    constructor(map: PrivateMap);
    render(): void;
    syncCamera(): void;
    updateOnce(): void;
    update(timestamp: number): void;
    addAtCoordinate(obj: Object3D, lnglat: number[]): Object3D;
    remove(obj: Object3D): void;
    setupDefaultLights(): void;
    private _updateCamera;
    private _makePerspectiveMatrix;
    private _onMapResize;
}
