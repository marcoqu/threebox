import { Vector3 } from 'three';
export declare class Projection {
    static TILE_SIZE: number;
    static WORLD_SIZE: number;
    static MERCATOR_A: number;
    static PROJECTION_WORLD_SIZE: number;
    static DEG2RAD: number;
    static RAD2DEG: number;
    static EARTH_CIRCUMFERENCE: number;
    static zoomToScale(zoom: number): number;
    static scaleToZoom(scale: number): number;
    static projectToWorld(coords: number[]): Vector3;
    static unprojectFromWorld(pixel: Vector3): number[];
    static projectedUnitsPerMeter(latitude: number): number;
}
