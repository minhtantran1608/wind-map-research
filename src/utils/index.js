const BOUNDARY = 0.45;
const τ = 2 * Math.PI;

function floorMod(a, n) {
  var f = a - n * Math.floor(a / n);
  // HACK: when a is extremely close to an n transition, f can be equal to n. This is bad because f must be
  //       within range [0, n). Check for this corner case. Example: a:=-1e-16, n:=10. What is the proper fix?
  return f === n ? 0 : f;
}

function isValue(x) {
  return x !== null && x !== undefined;
}

function data(file, p) {
  var uData = file[0].data,
    vData = file[1].data;
  return [uData[p], vData[p]];
}

function bilinearInterpolateVector(x, y, g00, g10, g01, g11) {
  var rx = 1 - x;
  var ry = 1 - y;
  var a = rx * ry,
    b = x * ry,
    c = rx * y,
    d = x * y;
  var u = g00[0] * a + g10[0] * b + g01[0] * c + g11[0] * d;
  var v = g00[1] * a + g10[1] * b + g01[1] * c + g11[1] * d;
  return [u, v, Math.sqrt(u * u + v * v)];
}

function sinebowColor(hue, a) {
  // Map hue [0, 1] to radians [0, 5/6τ]. Don't allow a full rotation because that keeps hue == 0 and
  // hue == 1 from mapping to the same color.
  var rad = (hue * τ * 5) / 6;
  rad *= 0.75; // increase frequency to 2/3 cycle per rad

  var s = Math.sin(rad);
  var c = Math.cos(rad);
  var r = Math.floor(Math.max(0, -c) * 255);
  var g = Math.floor(Math.max(s, 0) * 255);
  var b = Math.floor(Math.max(c, 0, -s) * 255);
  return [r, g, b, a];
}

function colorInterpolator(start, end) {
  var r = start[0],
    g = start[1],
    b = start[2];
  var Δr = end[0] - r,
    Δg = end[1] - g,
    Δb = end[2] - b;
  return function (i, a) {
    return [
      Math.floor(r + i * Δr),
      Math.floor(g + i * Δg),
      Math.floor(b + i * Δb),
      a,
    ];
  };
}

var fadeToWhite = colorInterpolator(sinebowColor(1.0, 0), [255, 255, 255]);

function extendedSinebowColor(i, a) {
  return i <= BOUNDARY
    ? sinebowColor(i / BOUNDARY, a)
    : fadeToWhite((i - BOUNDARY) / (1 - BOUNDARY), a);
}

export function gradient(v, a) {
  return extendedSinebowColor(Math.min(v, 100) / 100, a);
}

export default function buildGrid(builder) {
  // var builder = createBuilder(data);
  var header = builder[0].header;
  var λ0 = header.lo1,
    φ0 = header.la1; // the grid's origin (e.g., 0.0E, 90.0N)
  var Δλ = header.dx,
    Δφ = header.dy; // distance between grid points (e.g., 2.5 deg lon, 2.5 deg lat)
  var ni = header.nx,
    nj = header.ny; // number of grid points W-E and N-S (e.g., 144 x 73)
  var date = new Date(header.refTime);
  date.setHours(date.getHours() + header.forecastTime);

  // Scan mode 0 assumed. Longitude increases from λ0, and latitude decreases from φ0.
  // http://www.nco.ncep.noaa.gov/pmb/docs/grib2/grib2_table3-4.shtml
  var grid = [],
    p = 0;
  var isContinuous = Math.floor(ni * Δλ) >= 360;
  for (var j = 0; j < nj; j++) {
    var row = [];
    for (var i = 0; i < ni; i++, p++) {
      row[i] = data(builder, p);
    }
    if (isContinuous) {
      // For wrapped grids, duplicate first column as last column to simplify interpolation logic
      row.push(row[0]);
    }
    grid[j] = row;
  }

  function interpolate(λ, φ) {
    var i = floorMod(λ - λ0, 360) / Δλ; // calculate longitude index in wrapped range [0, 360)
    var j = (φ0 - φ) / Δφ; // calculate latitude index in direction +90 to -90

    //         1      2           After converting λ and φ to fractional grid indexes i and j, we find the
    //        fi  i   ci          four points "G" that enclose point (i, j). These points are at the four
    //         | =1.4 |           corners specified by the floor and ceiling of i and j. For example, given
    //      ---G--|---G--- fj 8   i = 1.4 and j = 8.3, the four surrounding grid points are (1, 8), (2, 8),
    //    j ___|_ .   |           (1, 9) and (2, 9).
    //  =8.3   |      |
    //      ---G------G--- cj 9   Note that for wrapped grids, the first column is duplicated as the last
    //         |      |           column, so the index ci can be used without taking a modulo.

    var fi = Math.floor(i),
      ci = fi + 1;
    var fj = Math.floor(j),
      cj = fj + 1;

    var row;
    if ((row = grid[fj])) {
      var g00 = row[fi];
      var g10 = row[ci];
      if (isValue(g00) && isValue(g10) && (row = grid[cj])) {
        var g01 = row[fi];
        var g11 = row[ci];
        if (isValue(g01) && isValue(g11)) {
          // All four points found, so interpolate the value.
          return bilinearInterpolateVector(i - fi, j - fj, g00, g10, g01, g11);
        }
      }
    }
    // console.log("cannot interpolate: " + λ + "," + φ + ": " + fi + " " + ci + " " + fj + " " + cj);
    return null;
  }

  return {
    date: date,
    interpolate: interpolate,
    forEachPoint: function (cb) {
      for (var j = 0; j < nj; j++) {
        var row = grid[j] || [];
        for (var i = 0; i < ni; i++) {
          cb(floorMod(180 + λ0 + i * Δλ, 360) - 180, φ0 - j * Δφ, row[i]);
        }
      }
    },
  };
}
