import THREE, { WebGLRenderer, Scene, PerspectiveCamera, Group, Vector3, AmbientLight, DirectionalLight } from 'three';
import { MERCATOR_A, DEG2RAD, PROJECTION_WORLD_SIZE, WORLD_SIZE, EARTH_CIRCUMFERENCE } from './constants.js';
import CameraSync from './Camera/CameraSync.js';

class Threebox {

    constructor(map) {
        if (!THREE) {
            throw Error('no threejs found. Run `npm i three --save`');
        }
        this.map = map;
        // Set up a THREE.js scene
        this.renderer = new WebGLRenderer({ alpha: true, antialias: true });
        this.renderer.setSize(this.map.transform.width, this.map.transform.height);
        this.renderer.shadowMap.enabled = true;
        this.map._container.appendChild(this.renderer.domElement);
        this.renderer.domElement.style['position'] = 'relative';
        this.renderer.domElement.style['pointer-events'] = 'none';
        this.renderer.domElement.style['z-index'] = 1000;
        var _this = this;
        this.map.on('resize', function() { _this.renderer.setSize(_this.map.transform.width, _this.map.transform.height); });
        this.scene = new Scene();
        this.camera = new PerspectiveCamera(28, window.innerWidth / window.innerHeight, 0.000001, 5000000000);

        // The CameraSync object will keep the Mapbox and THREE.js camera movements in sync.
        // It requires a world group to scale as we zoom in. Rotation is handled in the camera's
        // projection matrix itself (as is field of view and near/far clipping)
        // It automatically registers to listen for move events on the map so we don't need to do that here
        this.world = new Group();
        this.scene.add(this.world);
        this.cameraSynchronizer = new CameraSync(this.map, this.camera, this.world);
    }

    render() {
        this.renderer.render(this.scene, this.camera);
    }

    syncCamera() {
        this.cameraSynchronizer.updateCamera();
    }

    updateOnce() {
        this.syncCamera();
        this.render();
    }

    update(timestamp) {
        // Render the scene
        this.updateOnce();

        // Run this again next frame
        var thisthis = this;
        window.requestAnimationFrame(function(timestamp) { thisthis.update(timestamp); });
    }

    projectToWorld(coords) {
        // Spherical mercator forward projection, re-scaling to WORLD_SIZE
        var projected = [
            -MERCATOR_A * coords[0] * DEG2RAD * PROJECTION_WORLD_SIZE,
            -MERCATOR_A * Math.log(Math.tan((Math.PI * 0.25) + (0.5 * coords[1] * DEG2RAD))) * PROJECTION_WORLD_SIZE
        ];

        var pixelsPerMeter = this.projectedUnitsPerMeter(coords[1]);

        // z dimension
        var height = coords[2] || 0;
        projected.push(height * pixelsPerMeter);

        var result = new Vector3(projected[0], projected[1], projected[2]);

        return result;
    }

    projectedUnitsPerMeter(latitude) {
        return Math.abs(WORLD_SIZE * (1 / Math.cos(latitude * Math.PI / 180)) / EARTH_CIRCUMFERENCE);
    }

    unprojectFromWorld(pixel) {
        var unprojected = [
            -pixel.x / (MERCATOR_A * DEG2RAD * PROJECTION_WORLD_SIZE),
            2 * (Math.atan(Math.exp(pixel.y / (PROJECTION_WORLD_SIZE * (-MERCATOR_A)))) - Math.PI / 4) / DEG2RAD
        ];

        var pixelsPerMeter = this.projectedUnitsPerMeter(unprojected[1]);

        // z dimension
        var height = pixel.z || 0;
        unprojected.push(height / pixelsPerMeter);
        return unprojected;
    }

    addAtCoordinate(obj, lnglat, options) {
        var geoGroup = new Group();
        geoGroup.userData.isGeoGroup = true;
        geoGroup.add(obj);
        this.world.add(geoGroup);
        this.moveToCoordinate(obj, lnglat, options);
        return obj;
    }

    moveToCoordinate(obj, lnglat, options) {
        /** Place the given object on the map, centered around the provided longitude and latitude
            The object's internal coordinates are assumed to be in meter-offset format, meaning
            1 unit represents 1 meter distance away from the provided coordinate.
        */

        if (options === undefined) options = {};
        if (options.preScale === undefined) options.preScale = 1.0;
        if (options.scaleToLatitude === undefined || obj.userData.scaleToLatitude) options.scaleToLatitude = true;

        obj.userData.scaleToLatitude = options.scaleToLatitude;

        if (typeof options.preScale === 'number') options.preScale = new Vector3(options.preScale, options.preScale, options.preScale);
        else if (options.preScale.constructor === Array && options.preScale.length === 3) options.preScale = new Vector3(options.preScale[0], options.preScale[1], options.preScale[2]);
        else if (options.preScale.constructor !== Vector3) {
            console.warn('Invalid preScale value: number, Array with length 3, or THREE.Vector3 expected. Defaulting to [1,1,1]');
            options.preScale = new Vector3(1, 1, 1);
        }

        var scale = options.preScale;

        // Figure out if this object is a geoGroup and should be positioned and scaled directly, or if its parent
        var geoGroup;
        if (obj.userData.isGeoGroup) geoGroup = obj;
        else if (obj.parent && obj.parent.userData.isGeoGroup) geoGroup = obj.parent;
        else return console.error("Cannot set geographic coordinates of object that does not have an associated GeoGroup. Object must be added to scene with 'addAtCoordinate()'.");

        if (options.scaleToLatitude) {
            // Scale the model so that its units are interpreted as meters at the given latitude
            var pixelsPerMeter = this.projectedUnitsPerMeter(lnglat[1]);
            scale.multiplyScalar(pixelsPerMeter);
        }

        geoGroup.scale.copy(scale);

        geoGroup.position.copy(this.projectToWorld(lnglat));
        obj.coordinates = lnglat;

        return obj;
    }

    remove(obj) {
        this.world.remove(obj);
    }

    setupDefaultLights() {
        this.scene.add(new AmbientLight(0xCCCCCC));

        var sunlight = new DirectionalLight(0xffffff, 0.5);
        sunlight.position.set(0, 800, 1000);
        sunlight.matrixWorldNeedsUpdate = true;
        this.world.add(sunlight);
    }

}

export default exports = Threebox;
