import { useState, useRef, useEffect } from "react";
import mapboxgl from "!mapbox-gl"; // eslint-disable-line import/no-webpack-loader-syntax
import { MAPBOX_ACCESS_TOKEN } from "../constants";
import styles from "./Map.style.module.css";
import { ScalarFill, WindLayer, Particles } from "@sakitam-gis/mapbox-wind";

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

export const MapContent = (props) => {
  const { style = 1, initialPos = [16.4533875, 107.5420937] } = props;
  const mapContainerRef = useRef(null);
  const [data, setData] = useState();
  const [globalMap, setGlobalMap] = useState();

  useEffect(() => {
    const fetchData = async () => {
      await fetch(
        "https://sakitam.oss-cn-beijing.aliyuncs.com/codepen/wind-layer/json/wind.json"
      )
        .then((res) => res.json())
        .then((data) => {
          data = data.map((item, idx) => {
            item.header = Object.assign(item.header, {
              parameterCategory: 1,
              parameterNumber: idx === 0 ? 2 : 3,
            });
            return item;
          });
          setData(data);
        });
    };
    fetchData();
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
      // fetch(
      //   "https://sakitam.oss-cn-beijing.aliyuncs.com/codepen/wind-layer/json/wind.json"
      // )
      //   .then((res) => res.json())
      //   .then((data) => {
      //     data = data.map((item, idx) => {
      //       item.header = Object.assign(item.header, {
      //         parameterCategory: 1,
      //         parameterNumber: idx === 0 ? 2 : 3,
      //       });
      //       return item;
      //     });
      //   });
      // const windInterpolateColor = color.wind.reduce(
      //   (result, item) =>
      //     result.concat(item[0], "rgba(" + item[1].join(",") + ")"),
      //   []
      // );
      // const fillLayer1 = new ScalarFill(
      //   "wind1",
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
      //         0,
      //         1,
      //         10,
      //         0,
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

      // map.addLayer(fillLayer1);

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
          frameRate: 16,
          maxAge: 80,
          globalAlpha: 0.9,
          velocityScale: 0.01,
          // paths: 5000,
          paths: 3782,
          lineWidth: 2,
        },
      });
      console.log(data);

      map.addLayer(windLayer);
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

      const particles = new Particles(
        "particles",
        {
          type: "image",
          url: "https://sakitam.oss-cn-beijing.aliyuncs.com/codepen/assets/image/uv-mc.png",
          extent: [
            [-180, 85.051129],
            [-180, -85.051129],
            [180, 85.051129],
            [180, -85.051129],
          ],
          width: 1024,
          height: 1024,
          uMin: -34.37186050415039,
          uMax: 46.51813888549805,
          vMin: -42.12305450439453,
          vMax: 49.66694259643555,
        },
        {
          wrapX: true,
          lineWidth: 2.2,
          styleSpec: {
            color: [
              "interpolate",
              ["linear"],
              ["get", "value"],
              0.0,
              "#fff",
              100.0,
              "#fff",
            ],
            opacity: [
              "interpolate",
              ["exponential", 0.5],
              ["zoom"],
              1, // zoom
              1, // opacity
              5, // zoom
              0.8, // opacity
            ],
            numParticles: [
              "interpolate",
              ["exponential", 0.5],
              ["zoom"],
              0, // zoom
              65535 * 2, // numParticles
              8, // zoom
              512, // numParticles
            ],
          },
        }
      );

      // map.addLayer(particles);
    });
    setGlobalMap(map);

    return () => map.remove();
  }, [style]); // eslint-disable-line react-hooks/exhaustive-deps

  return <div className={styles.container} ref={mapContainerRef}></div>;
};
