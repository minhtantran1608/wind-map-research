import { useState, useRef, useEffect } from "react";
import mapboxgl from "!mapbox-gl"; // eslint-disable-line import/no-webpack-loader-syntax
import { MAPBOX_ACCESS_TOKEN } from "../constants";
import styles from "./Map.style.module.css";
import { ScalarFill, WindLayer, Particles } from "@sakitam-gis/mapbox-wind";
// import windData from "../data.json";
import windData from "../current-wind-surface-level-gfs-1.0.json";
import * as dat from "dat.gui";
import buildGrid from "../utils";

mapboxgl.accessToken = MAPBOX_ACCESS_TOKEN;

const INITIAL_ZOOM = 7;
const STREET_MODE = 1;
const SATELLITE_MODE = 2;

const color = {
  temp: [
    [203, [115, 70, 105, 255]],
    [218, [202, 172, 195, 255]],
    [233, [162, 70, 145, 255]],
    [248, [143, 89, 169, 255]],
    [258, [157, 219, 217, 255]],
    [265, [106, 191, 181, 255]],
    [269, [100, 166, 189, 255]],
    [273.15, [93, 133, 198, 255]],
    [274, [68, 125, 99, 255]],
    [283, [128, 147, 24, 255]],
    [294, [243, 183, 4, 255]],
    [303, [232, 83, 25, 255]],
    [320, [71, 14, 0, 255]],
  ],
  wind: [
    [0, [98, 113, 183, 255]],
    [1, [57, 97, 159, 255]],
    [3, [74, 148, 169, 255]],
    [5, [77, 141, 123, 255]],
    [7, [83, 165, 83, 255]],
    [9, [53, 159, 53, 255]],
    [11, [167, 157, 81, 255]],
    [13, [159, 127, 58, 255]],
    [15, [161, 108, 92, 255]],
    [17, [129, 58, 78, 255]],
    [19, [175, 80, 136, 255]],
    [21, [117, 74, 147, 255]],
    [24, [109, 97, 163, 255]],
    [27, [68, 105, 141, 255]],
    [29, [92, 144, 152, 255]],
    [36, [125, 68, 165, 255]],
    [46, [231, 215, 215, 255]],
    [51, [219, 212, 135, 255]],
    [77, [205, 202, 112, 255]],
    [104, [128, 128, 128, 255]],
  ],
};

// function spread(p, low, high) {
//   return p * (high - low) + low;
// }

function formatScalar(value, units) {
  return (value * 3.6).toFixed(0) + " " + units;
}

function formatVector(wind, units) {
  var τ = 2 * Math.PI;
  console.log(wind);
  var d = (Math.atan2(-wind[0], -wind[1]) / τ) * 360; // calculate into-the-wind cardinal degrees
  var wd = Math.round(((d + 360) % 360) / 5) * 5; // shift [-180, 180] to [0, 360], and round to nearest 5.
  return wd.toFixed(0) + "° @ " + formatScalar(wind[2], units);
}

export const MapContent = (props) => {
  const { style = 1, initialPos = [16.4533875, 107.5420937] } = props;
  const mapContainerRef = useRef(null);
  const [data, setData] = useState();
  const [globalMap, setGlobalMap] = useState();

  useEffect(() => {
    // const fetchData = async () => {
    //   await fetch(
    //     "https://sakitam.oss-cn-beijing.aliyuncs.com/codepen/wind-layer/json/wind.json"
    //   )
    //     .then((res) => res.json())
    //     .then((data) => {
    //       data = data.map((item, idx) => {
    //         item.header = Object.assign(item.header, {
    //           parameterCategory: 1,
    //           parameterNumber: idx === 0 ? 2 : 3,
    //         });
    //         return item;
    //       });
    //       setData(data);
    //     });
    // };
    // fetchData();
    setData(windData);
  }, []);

  const getStyle = (styleId) => {
    // eslint-disable-next-line default-case
    switch (styleId) {
      case STREET_MODE:
        return process.env.REACT_APP_MAPBOX_STREET_MAP_URL;

      case SATELLITE_MODE:
        return process.env.REACT_APP_MAPBOX_SATELLITE_MAP_URL;
    }
  };

  useEffect(() => {
    if (globalMap) {
      const newStyle = getStyle(style);

      globalMap?.setStyle(newStyle);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [style]);

  useEffect(() => {
    const map = new mapboxgl.Map({
      container: mapContainerRef.current,
      style: getStyle(style),
      center: [initialPos?.[1], initialPos?.[0]],
      zoom: INITIAL_ZOOM,
      minZoom: 1,
      maxBounds: [
        [-180, -85],
        [180, 85],
      ],
      projection: "mercator",
    });

    map.addControl(new mapboxgl.NavigationControl());
    map.on("load", function () {
      // var w = window.innerWidth;
      // var h = window.innerHeight;
      // console.log(w, h);
      const windInterpolateColor = color.wind.reduce(
        (result, item) =>
          result.concat(item[0], "rgba(" + item[1].join(",") + ")"),
        []
      );

      const fillLayer1 = new ScalarFill(
        "wind1",
        {
          // type: "image",
          // url: "https://sakitam.oss-cn-beijing.aliyuncs.com/codepen/assets/image/uv.png",
          type: "jsonArray",
          data: data,
          extent: [
            [-180, 85],
            [-180, -85],
            [180, 85],
            [180, -85],
          ],
          width: 1440,
          height: 720,
          // width: w,
          // height: h,
          uMin: -34.37186050415039,
          uMax: 46.51813888549805,
          vMin: -42.12305450439453,
          vMax: 49.66694259643555,
        },
        {
          wrapX: true,
          styleSpec: {
            "fill-color": [
              "interpolate",
              ["linear"],
              ["get", "value"],
              ...windInterpolateColor,
            ],
            opacity: [
              "interpolate",
              ["exponential", 0.5],
              ["zoom"],
              0,
              1,
              10,
              0.5,
            ],
          },
          renderForm: "rg",
          // widthSegments: 720,
          // heightSegments: 360,
          widthSegments: 1,
          heightSegments: 1,
          displayRange: [0, 150],
          // mappingRange: [0, 500000],
          mappingRange: [0, 0],
          wireframe: false,
        }
      );

      map.addLayer(fillLayer1);

      // const fillLayer = new ScalarFill(
      //   "wind",
      //   {
      //     type: "image",
      //     url: "https://sakitam.oss-cn-beijing.aliyuncs.com/codepen/assets/image/uv.png",
      //     extent: [
      //       [-180, 85.051129],
      //       [-180, -85.051129],
      //       [180, 85.051129],
      //       [180, -85.051129],
      //     ],
      //     width: 1440,
      //     height: 720,
      //     uMin: -34.37186050415039,
      //     uMax: 46.51813888549805,
      //     vMin: -42.12305450439453,
      //     vMax: 49.66694259643555,
      //   },
      //   {
      //     wrapX: true,
      //     styleSpec: {
      //       "fill-color": [
      //         "interpolate",
      //         ["linear"],
      //         ["get", "value"],
      //         ...windInterpolateColor,
      //       ],
      //       opacity: [
      //         "interpolate",
      //         ["exponential", 0.5],
      //         ["zoom"],
      //         1,
      //         0,
      //         10,
      //         1,
      //       ],
      //     },
      //     renderForm: "rg",
      //     // widthSegments: 720,
      //     // heightSegments: 360,
      //     widthSegments: 1,
      //     heightSegments: 1,
      //     displayRange: [0, 150],
      //     // mappingRange: [0, 500000],
      //     mappingRange: [0, 0],
      //     wireframe: false,
      //   }
      // );

      // map.addLayer(fillLayer);

      const windLayer = new WindLayer("wind", data, {
        windOptions: {
          frameRate: 20,
          maxAge: 80,
          globalAlpha: 0.9,
          velocityScale: 0.01,
          // paths: 8000,
          paths: 3782,
          lineWidth: 2,
          // particleMultiplier: 1 / 100000,
          // colorScale: (m) => {
          //   console.log(m);
          //   return "#fff";
          // },
          // colorScale: [
          //   "rgb(36,104, 180)",
          //   "rgb(60,157, 194)",
          //   "rgb(128,205,193 )",
          //   "rgb(151,218,168 )",
          //   "rgb(198,231,181)",
          //   "rgb(238,247,217)",
          //   "rgb(255,238,159)",
          //   "rgb(252,217,125)",
          //   "rgb(255,182,100)",
          //   "rgb(252,150,75)",
          //   "rgb(250,112,52)",
          //   "rgb(245,64,32)",
          //   "rgb(237,45,28)",
          //   "rgb(220,24,32)",
          //   "rgb(180,0,35)",
          // ],
        },
      });
      // console.log(data);

      map.addLayer(windLayer);

      const grids = buildGrid(data);

      var popup = new mapboxgl.Popup({
        offset: [0, -7],
        closeButton: false,
        closeOnClick: false,
      });

      map.on("mousemove", function (e) {
        // map.getCanvas().style.cursor = "pointer";
        console.log(e);
        console.log(grids);
        const wind = grids.interpolate(e.lngLat.lng, e.lngLat.lat);
        const value = formatVector(wind, "km/h");
        const angle = -(90 - value.split(" ")[0].slice(0, -1));
        console.log(angle);
        // var coordinates = e.features[0].geometry.coordinates.slice();
        // var title = e.features[0].properties.title;
        // var description = e.features[0].properties.description;
        // var title2 = e.features[0].properties.title2;
        // var description2 = e.features[0].properties.description2;
        // // Ensure that if the map is zoomed out such that multiple
        // // copies of the feature are visible, the popup appears
        // // over the copy being pointed to.
        // while (Math.abs(e.lngLat.lng - coordinates[0]) > 180) {
        // coordinates[0] += e.lngLat.lng > coordinates[0] ? 360 : -360;
        // }
        // // Populate the popup and set its coordinates
        // // based on the feature found.
        popup
          .setLngLat(e.lngLat)
          .setHTML(
            "<div><h3>" +
              value +
              "</h3><div style='font-size: 24px; transform: rotate(" +
              angle +
              "deg)'>←</div>"
          )
          .addTo(map);
      });

      map.on("mouseleave", "wind", function () {
        map.getCanvas().style.cursor = "";
        popup.remove();
      });

      // window.windLayer.addTo(map);
      // const particlesConfig = {
      //   wrapX: true,
      //   speedFactor: 1,
      //   fadeOpacity: 0.93,
      //   dropRate: 0.003,
      //   dropRateBump: 0.002,
      //   lineWidth: 2.1,
      //   opacity: 1,
      // }
      //.051129

      // const particles = new Particles(
      //   "particles",
      //   {
      //     type: "image",
      //     url: "https://sakitam.oss-cn-beijing.aliyuncs.com/codepen/assets/image/uv-mc.png",
      //     extent: [
      //       [-180, 85],
      //       [-180, -85],
      //       [180, 85],
      //       [180, -85],
      //     ],
      //     width: 1024,
      //     height: 1024,
      //     uMin: -34.37186050415039,
      //     uMax: 46.51813888549805,
      //     vMin: -42.12305450439453,
      //     vMax: 49.66694259643555,
      //   },
      //   {
      //     wrapX: true,
      //     lineWidth: 2.2,
      //     styleSpec: {
      //       color: [
      //         "interpolate",
      //         ["linear"],
      //         ["get", "value"],
      //         0.0,
      //         "#fff",
      //         100.0,
      //         "#fff",
      //       ],
      //       opacity: [
      //         "interpolate",
      //         ["exponential", 0.5],
      //         ["zoom"],
      //         1, // zoom
      //         1, // opacity
      //         5, // zoom
      //         0.8, // opacity
      //       ],
      //       numParticles: [
      //         "interpolate",
      //         ["exponential", 0.5],
      //         ["zoom"],
      //         0, // zoom
      //         65535 * 2, // numParticles
      //         8, // zoom
      //         512, // numParticles
      //       ],
      //     },
      //   }
      // );

      // map.addLayer(particles);
      const gui = new dat.GUI();

      gui
        .add(
          {
            addScalarFill: true,
          },
          "addScalarFill"
        )
        .onChange(function (state) {
          if (state) {
            if (map.getLayer("wind1")) {
              map.addLayer(fillLayer1, "wind1");
            } else {
              map.addLayer(fillLayer1);
            }
          } else {
            console.log(map.getLayer("wind1"));
            map.removeLayer("wind1");
          }
        });

      gui
        .add(
          {
            addWind: true,
          },
          "addWind"
        )
        .onChange(function (state) {
          if (state) {
            if (map.getLayer("wind")) {
              map.addLayer(windLayer, "wind");
              document.getElementsByClassName(
                "mapbox-overlay-canvas"
              )[0].style.display = "block";
            } else {
              map.addLayer(windLayer);
              document.getElementsByClassName(
                "mapbox-overlay-canvas"
              )[0].style.display = "block";
            }
          } else {
            map.removeLayer("wind");
            document.getElementsByClassName(
              "mapbox-overlay-canvas"
            )[0].style.display = "none";
            // windLayer.remove();
          }
        });

      // gui
      //   .add(
      //     {
      //       paths: 3782,
      //     },
      //     "paths",
      //     0,
      //     10000
      //   )
      //   .onChange(function (num) {
      //     windLayer.setWindOptions({
      //       paths: num,
      //     });
      //   });

      const windConfig = {
        frameRate: 20,
        maxAge: 80,
        globalAlpha: 0.9,
        velocityScale: 0.01,
        paths: 3782,
        lineWidth: 2,
        colorScale: "#fff",
        particleMultiplier: 1 / 300,
      };

      gui.add(windConfig, "frameRate", 0, 80).onChange(function () {
        windLayer.setWindOptions(windConfig);
      });

      gui.add(windConfig, "maxAge", 0, 160).onChange(function () {
        windLayer.setWindOptions(windConfig);
      });

      gui.add(windConfig, "globalAlpha", 0, 2).onChange(function () {
        windLayer.setWindOptions(windConfig);
      });

      gui.add(windConfig, "velocityScale", 0, 0.1).onChange(function () {
        windLayer.setWindOptions(windConfig);
      });

      gui.add(windConfig, "paths", 0, 10000).onChange(function () {
        windLayer.setWindOptions(windConfig);
      });

      gui.add(windConfig, "lineWidth", 0, 10).onChange(function () {
        windLayer.setWindOptions(windConfig);
      });

      gui.add(windConfig, "particleMultiplier", 0, 0.1).onChange(function () {
        windLayer.setWindOptions(windConfig);
      });

      gui.addColor(windConfig, "colorScale").onChange(function (e) {
        windLayer.setWindOptions(windConfig);
      });
    });
    setGlobalMap(map);

    return () => map.remove();
  }, [style, data]); // eslint-disable-line react-hooks/exhaustive-deps

  return <div className={styles.container} ref={mapContainerRef}></div>;
};
