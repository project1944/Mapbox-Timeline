## Mapbox Timeline

This project was created by the Project '44 team (see [https://map.project44.ca](https://map.project44.ca)) for the Dieppe campaign. It was developed in coordination with [Mapster Technology Inc](https://mapster.me).

It uses core code from the [Knightlab Timeline](https://github.com/NUKnightLab/TimelineJS3) and mushes this together with Mapbox, throwing in some different options for animation, customization, and more. It also makes use of TurfJS for calculating paths for animations.

**This repo and design is made for larger screens, and is not made to be mobile-friendly. Please contribute a pull request if you do fixes to make this work nicely!**

Please run the example to see the basic features at work. Make sure to enter your own Mapbox access token.

## Usage

To use this, take a quick look at the example folder. Run locally using a server so assets and files can be loaded without cross-origin errors. To customize this, you must understand the Knightlab spreadsheet as well as the format for the geoJSON file used to put data onto the map.

To connect the spreadsheet events from your Knightlab Google Sheet to the geoJSON you create, you must "slugify" the title of the slide. For instance, "Timeline Event 1" will become "timeline-event-1".

There are few special parts that you can choose to use or not, which we'll detail from here.

### Animation

To do animation, you definitely need to be comfortable with GeoJSONs. You will need to create points that are linked to specific LineStrings, and keep them in the same GeoJSON. We provide an example in the examples folder, but here's how it works.

- The `group_id` property on the geoJSON links together a Point and a LineString (they must be the same).
- The two shapes must also have the same `timeline_id`
- The corresponding point will then move along the path of the LineString, without displaying the LineString, over approximately 3.5 seconds

```
[
{"type":"Feature","geometry":{"type":"Point","coordinates":[1.0396476168263034,49.981590212351044]},"properties":{"unit":"LCP-Group-2","timeline_id":"time-bucket-eighteen","group_id":"LCP-Group-2-0630m"}},

{"type":"Feature","geometry":{"type":"LineString","coordinates":[[1.0396476168263007,49.98159021235108],[1.0594903853373043,49.948832634622605]]},"properties":{"Shape_Leng":0,"unit":"LCP-Group-2","timeline_id":"time-bucket-eighteen","group_id":"LCP-Group-2-0630m"}}
]
```

### Custom Circle Styling

All Points that should be rendered as circles **should not have the `icon` property**. If they are marked as icons, they will be excluded from the circle styling.

We make heavy use of Mapbox Expressions to handle styling from a single GeoJSON. To do this, you should have some kind of "identifying property" on the Points in your GeoJSON. This will allow you to refer to a specific point or set of points, and style them in a common way in the `scripts.js`. This is customizable and requires you to dig in a little to make things look the way you want.

```
let identifyingProperty = 'unit';

// Example of a Mapbox Expression at work
"circle-color": [
  'match',
  ['get', identifyingProperty],
  ["LSI-Glengyle", "White Beach Recovery", "LSI-Glengyle-LCA"],
  "#FFFFFF",
  ["LSI-Albert", "4 Cdo-section", "4 Cdo", "LSI-Albert-LCA"],
  "#c97b14",
  "#000000"
]
```

### Custom Icons

All Points that should be rendered as icons **must have the `icon` property**. If they are marked as icons, they will be included in the icon symbol styling.

Custom icons, to help speed up loading, are pulled directly from the Mapbox Style. In order to add these custom icons so that they are "baked in" to your style (and thus to avoid loading them locally every time the map is loaded), you must drag and drop them into your Mapbox Style in Mapbox Studio. This will also tell you the name to use for the image reference in your Mapbox expression.

Similar to circle styling, we use Mapbox expressions to match the "identifying property" in your geoJSON to a specific icon you've loaded in your Mapbox style.

```
let identifyingProperty = 'unit';

// Example of a Mapbox Expression at work
"icon-image": [
  'match',
  ['get', identifyingProperty],
  "Property-1",
  "Icon_Image_1",
  "Property-2",
  "Icon_Image_2",
  "Property-3",
  "Icon_Image_3",
  "Default_Icon_image"
]
```
