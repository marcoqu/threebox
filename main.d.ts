/** Declaration file by @marcoqu */

import { Object3D, Vector3, Euler, WebGLRenderer } from "three"
import { Map } from "mapbox-gl"
import { FeatureCollection, Point } from "geojson"

export class Threebox {
    renderer: WebGLRenderer
    map: Map
    constructor(map: Map);

    addAtCoordinate(obj: Object3D, lnglat: Threebox.Coords, options: Threebox.PositionOptions): Object3D;

    // addGeoreferencedMesh(mesh: any, options: any): void;

    addSymbolLayer(options: Threebox.SymbolLayer3DOptions): Threebox.SymbolLayer3D;

    getDataLayer(id: any): Threebox.SymbolLayer3D;

    moveToCoordinate(obj: Object3D, lnglat: Threebox.Coords, options: Threebox.PositionOptions): Object3D;

    // projectToScreen(coords: any): void;

    projectToWorld(coords: Threebox.Coords): Vector3;

    projectedUnitsPerMeter(latitude: number): number;

    remove(obj: Object3D): void;

    setupDefaultLights(): void;

    // unprojectFromScreen(pixel: any): void;

    unprojectFromWorld(pixel: Vector3): Threebox.Coords;

    update(timestamp?: number): void;
    updateOnce(): void;
    syncCamera(): void;
    render(): void;

}

export namespace Threebox {

        type SymbolLayer3DOptions = {
            id: string,
            source: FeatureCollection<Point> | string,
            modelName?: string | Threebox.GeneratorObj,
            modelDirectory?: string | Threebox.GeneratorObj,
            rotation?: Euler | Threebox.GeneratorObj,
            scale?: number | Threebox.GeneratorObj,
            scaleWithMapProjection?: boolean,
            key?: Threebox.GeneratorObj
        }

        type PositionOptions = {
            scaleToLatitude?: boolean,
            preScale?: number
        }
        type GeneratorObj = {
            generator: Function,
            property: string,
        }
        
        type Coords = [number, number] | [number, number, number]

        class SymbolLayer3D {
            constructor(parent: Threebox, options: SymbolLayer3DOptions);

            removeFeature(key: string | number): void;

            updateSourceData(source: FeatureCollection<Point>, absolute?: boolean): any;

        }

}
