# CADAnimation (Name still in work)

This repo is my graduation work. Web application for creating a 3D models animation! Created with Angular and Three.js. Also i use Angular Materials and Quill.

You can already try it by following the [link](https://cad-animation.vercel.app/) (Most of the inscriptions are in Russian and will be translated later).

![Animation](readme/Кран%20анимация%20loosyMax.gif)

## Import/Export

You can import files such as GLTF/GLB wich is natively supported by Three.js, but most important that you can load STEP/IGES and BREP files thanks to awesome [occt-import-js](https://github.com/kovacsv/occt-import-js) from [@kovacsv](https://github.com/kovacsv).
- [x] GLTF/GLB
- [x] STEP
- [x] IGES
- [x] BREP
- [ ] (maybe in the future) OBJ
- [ ] (maybe in the future) IFC

![Animation](readme/Анимация%20осей%20роборука.gif) 

This app also support animation import from CAD Kompas3D (but only translation and opacity animation).

## Features
- :muscle: Select and edit multiple parts at once with <kbd>CTRL</kbd>
- :art: Change the look of every part of your model
- :floppy_disk: Export your models to GLTF
- :ice_cube: Navigate with the handy ViewCube
- :city_sunset: Make your scene look better with background color, grid, ground reflection, orthographic camera, outlines and wireframes
- :framed_picture: Create snapshot of the size you want
- :bulb: Add and animate different types of light
- :speech_balloon: Add and animate annotation
- :scissors: Create animation with cutting planes
- :camera: Create camera animation
- :milky_way: Add axes to your scene and rotate parts around them
- :film_strip: Edit the created animation with actions and keyframes on the timeline (Use <kbd>CTRL</kbd> to select multiple objects and <kbd>SHIFT</kbd> to move actions across tracks)

![Animation](readme/Анимация%20разлёта%20и%20поворотом%20камеры.gif)

## To Do
- [x] Model explode animation (Select group of objects and them press button for exploded view)
- [x] Animation saving/loading (Save and Load your animation as a simple JSON file)
- [ ] Scene record and export to your PC
- [ ] How to use tutorials
- [ ] (maybe in the future) Three PathTracing support

![Animation](readme/Анимация%20разрезов.gif)

## Examples

You can see more examples of animations made with this app in this [folder](readme/).

## Contact
If you have any questions please email me Dimaworonin@gmail.com.
