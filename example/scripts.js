$(() => {

  // Setup variables
  let accessToken = 'ACCESS_TOKEN_HERE';
  let mapboxStyle = 'mapbox://styles/mapbox/streets-v9';
  let centerStart = [-33.22265625, 32.32427558887655];
  let zoomStart = 3;
  let bearingStart = 0;
  let pitchStart = 0;

  let timelineSheetURL = 'https://docs.google.com/spreadsheets/d/1lwHTnAEuton6oIyw5y28i-Rl-t1bt1XtmiX3com9JBM/edit#gid=0';
  let startingEventSlug = "google-spreadsheet-example";

  let geoJSONURL = './data/sample-data.json';
  let identifyingProperty = 'identity';

  /* Mapbox setup */
  mapboxgl.accessToken = accessToken;

  const map = new mapboxgl.Map({
    container: 'map', // container ID
    style: mapboxStyle, // style URL
    center: centerStart, // starting position [lng, lat]
    zoom: zoomStart, // starting zoom
    bearing: bearingStart,
    pitch: pitchStart,
  });

  let currentStyleURL = mapboxStyle

  let timeline = new TL.Timeline('timeline-embed', timelineSheetURL, {
      // hash_bookmark : true,
      // height: 100,
      // timenav_height : 500,
      // timenav_height_percentage: 10,
      // optimal_tick_width: 500,
      // scale_factor : 0.5,
      // initial_zoom: 0
    }
  );

  let fetchedData;
  let starterEventID = startingEventSlug;

  // Fetch data and set map bounds
  const onload = () => {
    fetch(geoJSONURL).then(resp => resp.json()).then(response => {
      fetchedData = response;
      var bbox = turf.bbox(fetchedData);
      map.fitBounds(bbox, {
        padding: 20,
        duration: 0
      })

      init();

      loadAnimation(timeline.current_id)

      timeline.on('change', (e) => {
        clearAllTimeouts()
        loadAnimation(e.unique_id)
      });
    })
  }

  // When map style changes, reload layers
  map.on("style.load", ()=>{
    const waiting = () => {
      if (!map.isStyleLoaded()) {
        setTimeout(waiting, 200);
      } else {
        onload();
      }
    };
    waiting();
  })


  //create all sources
  function init() {

    let pointCollection = {
      type: "FeatureCollection",
      features: []
    }
    console.log(map.getSource("points"))
      map.addSource("points", {
        type: "geojson",
        data: pointCollection
      });
      map.addLayer({
        id: "points",
        source: "points",
        type: "circle",
        paint: {
          "circle-radius": ["case",
            ["has", 'icon'],
            0,
            [
              'match',
              ['get', identifyingProperty],
              ["Property-1", "Property-2"],
              9,
              ["Property-3",],
              3,
              5
            ]
          ],
          "circle-color": [
            'match',
            ['get', identifyingProperty],
            ["Property-1", "Property-2"],
            "#FFFFFF",
            ["Property-3",],
            "#32a852",
            "#000000"
          ],
          "circle-opacity": [
            'match',
            ['get', identifyingProperty],
            ["Property-1", "Property-2"],
            0.5,
            1
          ],
          "circle-stroke-width": [
            'match',
            ['get', identifyingProperty],
            ["Property-1", "Property-2"],
            4,
            2
          ],
          "circle-stroke-color": [
            'match',
            ['get', identifyingProperty],
            ["Property-1", "Property-2"],
            "#FFFFFF",
            "#000000"
          ],
          "circle-stroke-opacity": [
            'match',
            ['get', identifyingProperty],
            ["Property-1", "Property-2"],
            0.5,
            1
          ]
        },
        filter: ['!', ['has', 'icon']]
      })

      map.addLayer({
        id: "symbol-points",
        source: "points",
        type: "symbol",
        layout: {
          'icon-size': 0.05,
          'icon-allow-overlap': true,
          'icon-ignore-placement': true,
          'icon-rotation-alignment': "viewport",
          "icon-rotate": [
            "case",
            ["get", 'followsLine'],
            ["get", 'icon-bearing'],
            0
          ],
          "icon-size": [
            'match',
            ['get', identifyingProperty],
            ["Property-2"],
            0.8,
            2
          ],
          "icon-image": [
            'match',
            ['get', identifyingProperty],
            "Property-2",
            "fire-station-11",
            ""
          ]
        },
        filter: ['has', 'icon']
      })
    // }
  }

  // Clears any current animations
  const clearAllTimeouts = () => {
    var id = window.setTimeout(function() {}, 0);
    while (id--) {
      window.clearTimeout(id);
    }
  }

  function loadAnimation(eventID) {
    let pointCollection = {
      type: "FeatureCollection",
      features: []
    }
    pointCollection.features = fetchedData.features.filter(feature => feature.geometry.type === "Point" && feature.properties.timeline_id === eventID);

    // This will be numerous points
    const pointFeatures = fetchedData.features.filter(feature => feature.geometry.type === "Point" && feature.properties.timeline_id === eventID); //all the points with a line string

    const pointAndLineFeatures = pointFeatures.map(pointFeature => {
      const correspondingLineFeature = fetchedData.features.find(feature => feature.geometry.type === "LineString" && feature.properties.timeline_id === eventID && feature.properties.group_id === pointFeature.properties.group_id)

      return {
        group_id: pointFeature.properties.group_id,
        pointFeature: pointFeature,
        lineFeature: correspondingLineFeature
      }
    })

    const animatedCoords = {};
    pointAndLineFeatures.forEach(pointAndLineFeature => {
      const lineFeature = pointAndLineFeature.lineFeature;
      const pointFeature = pointAndLineFeature.pointFeature;
      let lineLength = lineFeature ? turf.length(lineFeature) / 60 : null;

      for (let i = 1; i <= 60; i++) {
        if (!lineFeature) {
          if (animatedCoords[pointAndLineFeature.group_id]) {
            animatedCoords[pointAndLineFeature.group_id].push(pointFeature.geometry);
          } else {
            animatedCoords[pointAndLineFeature.group_id] = [(pointFeature.geometry)];

          }
        } else {

          if (animatedCoords[pointAndLineFeature.group_id]) {
            animatedCoords[pointAndLineFeature.group_id].push(turf.along(lineFeature, lineLength * i).geometry);
          } else {
            animatedCoords[pointAndLineFeature.group_id] = [(turf.along(lineFeature, lineLength * i).geometry)];

          }
        }
      }
    });

    let stepNumber = 0;

    const geojsonAnimationFrame = []

    for (let i = 1; i <= 60; i++) {
      let newGeoJSON = JSON.parse(JSON.stringify(pointCollection))

      pointAndLineFeatures.forEach(pointAndLineFeature => {
        const lineFeature = pointAndLineFeature.lineFeature;
        const pointFeature = pointAndLineFeature.pointFeature;
        let thisIndex = pointCollection.features.findIndex(feature => feature.geometry.type === "Point" && feature.properties.timeline_id === eventID && feature.properties.group_id === pointFeature.properties.group_id)
        newGeoJSON.features[thisIndex].geometry = animatedCoords[pointFeature.properties.group_id][stepNumber]
        //set bearing
        let point1;
        let point2;

        if (animatedCoords[pointFeature.properties.group_id][stepNumber + 1]) {
          point1 = turf.point(animatedCoords[pointFeature.properties.group_id][stepNumber].coordinates);
          point2 = turf.point(animatedCoords[pointFeature.properties.group_id][stepNumber + 1].coordinates);
        } else {
          point1 = turf.point(animatedCoords[pointFeature.properties.group_id][stepNumber - 1].coordinates);
          point2 = turf.point(animatedCoords[pointFeature.properties.group_id][stepNumber].coordinates);
        }
        const bearing = turf.bearing(point1, point2)
        newGeoJSON.features[thisIndex].properties['icon-bearing'] = bearing - 90
      })
      stepNumber = stepNumber + 1;
      geojsonAnimationFrame.push(newGeoJSON)
    }

    let index = 0;
    const intervalID = setInterval(() => {
      if (index !== geojsonAnimationFrame.length - 1) {
        // console.log(map.getSource('points'))
        map.getSource('points').setData(geojsonAnimationFrame[index])
        index++;
      } else {
        clearInterval(intervalID)
      }
    }, 60);

  }

  $( "#satellite-btn" ).click(() => {
    // Change mapbox style
  });

  $( "#topography-btn" ).click(() => {
    // Change mapbox style
  });

  // Menu sliding
  $( "#toggle-menu-btn" ).click(() => {
    $('#toggle-menu-btn').toggleClass('active');
    $("#side-menu").toggleClass('active');
  });

  $( "#close-menu-btn" ).click(() => {
    $('#toggle-menu-btn').toggleClass('active');
    $("#side-menu").toggleClass('active');
  });


})
