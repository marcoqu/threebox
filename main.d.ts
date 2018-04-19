/** Declaration file by @marcoqu */

import { Object3D, Vector3, Euler } from "three"
import { Map } from "mapbox-gl"
import { NumericLiteral } from "typescript";
import { FeatureCollection, Point } from "geojson"


export type SymbolLayer3DOptions = {
    id: string,
    source: FeatureCollection<Point> | string,
    modelName?: string | GeneratorObj,
    modelDirectory?: string | GeneratorObj,
    rotation?: Euler | generator,
    scale?: number | GeneratorObj,
    scaleWithMapProjection?: boolean,
    key?: GeneratorObj
}

export class Threebox {
    constructor(map: Map);

    addAtCoordinate(obj: Object3D, lnglat: Coords, options: PositionOptions): Object3D;

    // addGeoreferencedMesh(mesh: any, options: any): void;

    addSymbolLayer(options: SymbolLayer3DOptions): Threebox.SymbolLayer3D;

    getDataLayer(id: any): Threebox.SymbolLayer3D;

    moveToCoordinate(obj: Object3D, lnglat: Coords, options: PositionOptions): Object3D;

    // projectToScreen(coords: any): void;

    projectToWorld(coords: Coords): Vector3;

    projectedUnitsPerMeter(latitude: number): number;

    remove(obj: Object3D): void;

    setupDefaultLights(): void;

    // unprojectFromScreen(pixel: any): void;

    unprojectFromWorld(pixel: Vector3): Coords;

    update(timestamp: number): void;

}

export namespace Threebox {

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
