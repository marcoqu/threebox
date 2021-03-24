import { Vector3 } from 'three';

export class Projection {

    static TILE_SIZE = 512;
    static WORLD_SIZE = 1024000;
    static MERCATOR_A = 6378137.0; // 900913 projection property
    static PROJECTION_WORLD_SIZE = Projection.WORLD_SIZE / (Projection.MERCATOR_A * Math.PI) / 2;
    static DEG2RAD = Math.PI / 180;
    static RAD2DEG = 180 / Math.PI;
    static EARTH_CIRCUMFERENCE = 40075000; // In meters

    static zoomToScale(zoom: number) {
        return Math.pow(2, zoom);
    }

    static scaleToZoom(scale: number) {
        return Math.log(scale) / Math.LN2;
    }
    
    static coordsToVector3(coords: number[]) {
        const pixelsPerMeter = Projection.projectedUnitsPerMeter(coords[1]);
        const height = coords[2] || 0;
    
        // Spherical mercator forward projection, re-scaling to WORLD_SIZE
        const projected = [
            -Projection.MERCATOR_A * coords[0] * Projection.DEG2RAD * Projection.PROJECTION_WORLD_SIZE,
            -Projection.MERCATOR_A * Math.log(Math.tan((Math.PI * 0.25) + (0.5 * coords[1] * Projection.DEG2RAD))) * Projection.PROJECTION_WORLD_SIZE,
            height * pixelsPerMeter
        ];
    
        return new Vector3(projected[0], projected[1], projected[2]);
    };
    
    static vector3ToCoords(pixel: Vector3) {
        const unprojected = [
            -pixel.x / (Projection.MERCATOR_A * Projection.DEG2RAD * Projection.PROJECTION_WORLD_SIZE),
            2 * (Math.atan(Math.exp(pixel.y / (Projection.PROJECTION_WORLD_SIZE * (-Projection.MERCATOR_A)))) - Math.PI / 4) / Projection.DEG2RAD
        ];
    
        const pixelsPerMeter = Projection.projectedUnitsPerMeter(unprojected[1]);
        const height = pixel.z || 0;
        unprojected.push(height / pixelsPerMeter);
    
        return unprojected;
    };
    
    static projectedUnitsPerMeter(latitude: number) {
        return Math.abs(Projection.WORLD_SIZE * (1 / Math.cos(latitude * Projection.DEG2RAD)) / Projection.EARTH_CIRCUMFERENCE);
    };

}

