# `threebox`

A three.js plugin for Mapbox GL JS, with support for basic animation and advanced 3D rendering.

## Installation

Add it to your project via `npm`:

`npm install threebox`

## Documentation

## `Threebox`

Set up and handle the core translations between a Three.js scene graph and the Mapbox GL JS map.

### `var threebox = new Threebox(map);`

Instantiates a threebox canvas atop the Mapbox GL JS canvas object in `map`. Automatically sets up a new canvas DOM element for Three.js and synchronizes the camera movement and events between Three.js and Mapbox GL JS.

### `threebox.setupDefaultLights();`

Set up some default lights. If you don't call this and don't set up your own lights, all objects added to the scene will appear black.


### `threebox.addAtCoordinate(object, position);`

Manually add a Three.js `Object3D` to your map.

- `object` - any Three.js `Object3D` to add to the map
- `position` - An `array` containing [`longitude`, `latitude`, `altitude`] specifying where the object will be added. The `altitude` is in meters.

### `threebox.remove(object)`

Remove an object from the map.



### `threebox.projectToWorld(lnglatalt)`

Given an input of `lnglatalt` as an `array` of geographic [`longitude`, `latitude`, `altitude`], return a Three.js `Vector3` representing the corresponding point in the scenegraph coordinate system.

### `threebox.unprojectFromWorld(point)`

Given an input of `point` as a Three.js `Vector3` representing a point in the scenegraph coordinate system, return an `array` of the corresponding [`longitude`, `latitude`, `altitude`] in geographic space.



## Building

`npm run build`
