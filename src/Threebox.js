import THREE, { WebGLRenderer, Scene, PerspectiveCamera, Group, Vector3, AmbientLight, DirectionalLight } from 'three';
import { MERCATOR_A, DEG2RAD, PROJECTION_WORLD_SIZE, WORLD_SIZE, EARTH_CIRCUMFERENCE, CAMERA_NEAR, CAMERA_FAR } from './constants.js';
import CameraSync from './Camera/CameraSync.js';

import { Map } from 'mapbox-gl';

export default class Threebox {

    /**
     * @param {Map & { transform: any }} map
     */
    constructor(map) {
        this._map = map;
        if (!THREE) { throw Error('no threejs found. Run `npm i three --save`'); }

        // Set up a THREE.js scene
        this._renderer = new WebGLRenderer({ alpha: true, antialias: true });
        this._renderer.setSize(this._map.transform.width, this._map.transform.height);
        this._renderer.shadowMap.enabled = true;

        this._canvas = this._renderer.domElement;
        this._canvas.style.position = 'relative';
        this._canvas.style.pointerEvents = 'none';
        this._canvas.style.zIndex = '1000';

        this._map.getContainer().appendChild(this._canvas);
        this._map.on('resize', () => this._onMapResize());

        this.scene = new Scene();
        this.camera = new PerspectiveCamera(
            28,
            window.innerWidth / window.innerHeight,
            CAMERA_NEAR,
            CAMERA_FAR);

        // The CameraSync object will keep the Mapbox and THREE.js camera movements in sync.
        // It requires a world group to scale as we zoom in. Rotation is handled in the camera's
        // projection matrix itself (as is field of view and near/far clipping)
        // It automatically registers to listen for move events on the map so we don't need to do that here
        this.world = new Group();
        this.scene.add(this.world);
        this.cameraSynchronizer = new CameraSync(this._map, this.camera, this.world);
    }

    _onMapResize() {
        this._renderer.setSize(this._map.transform.width, this._map.transform.height);
    }

    render() {
        this._renderer.render(this.scene, this.camera);
    }

    syncCamera() {
        this.cameraSynchronizer.updateCamera();
    }

    updateOnce() {
        this.syncCamera();
        this.render();
    }

    update(timestamp) {
        this.updateOnce();
        window.requestAnimationFrame((timestamp) => this.update(timestamp));
    }

    addAtCoordinate(obj, lnglat, options) {
        this.world.add(obj);
        obj.position.copy(Threebox.projectToWorld(lnglat));
        obj.coordinates = lnglat;
        return obj;
    }

    remove(obj) {
        this.world.remove(obj);
    }

    setupDefaultLights() {
        this.scene.add(new AmbientLight(0xCCCCCC));

        var sunlight = new DirectionalLight(0xFFFFFF, 0.5);
        sunlight.position.set(0, 800, 1000);
        sunlight.matrixWorldNeedsUpdate = true;
        this.world.add(sunlight);
    }

}

Threebox.projectToWorld = function(coords) {
    // Spherical mercator forward projection, re-scaling to WORLD_SIZE
    var projected = [
        -MERCATOR_A * coords[0] * DEG2RAD * PROJECTION_WORLD_SIZE,
        -MERCATOR_A * Math.log(Math.tan((Math.PI * 0.25) + (0.5 * coords[1] * DEG2RAD))) * PROJECTION_WORLD_SIZE
    ];

    var pixelsPerMeter = Threebox.projectedUnitsPerMeter(coords[1]);

    // z dimension
    var height = coords[2] || 0;
    projected.push(height * pixelsPerMeter);

    var result = new Vector3(projected[0], projected[1], projected[2]);

    return result;
};

Threebox.unprojectFromWorld = function(pixel) {
    var unprojected = [
        -pixel.x / (MERCATOR_A * DEG2RAD * PROJECTION_WORLD_SIZE),
        2 * (Math.atan(Math.exp(pixel.y / (PROJECTION_WORLD_SIZE * (-MERCATOR_A)))) - Math.PI / 4) / DEG2RAD
    ];

    var pixelsPerMeter = Threebox.projectedUnitsPerMeter(unprojected[1]);

    // z dimension
    var height = pixel.z || 0;
    unprojected.push(height / pixelsPerMeter);
    return unprojected;
};

Threebox.projectedUnitsPerMeter = function(latitude) {
    return Math.abs(WORLD_SIZE * (1 / Math.cos(latitude * Math.PI / 180)) / EARTH_CIRCUMFERENCE);
};
