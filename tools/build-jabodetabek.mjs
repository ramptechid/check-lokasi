import fs from "fs";
import path from "path";

const outputDir = path.resolve("data");
const outputFile = path.join(outputDir, "jabodetabek.geojson");

const sources = [
  // DKI Jakarta
  {
    name: "Jakarta Barat",
    province: "DKI Jakarta",
    url: "https://raw.githubusercontent.com/mahendrayudha/indonesia-geojson/main/Jakarta/Kabupaten-Kota/Jakarta%20Barat/Jakarta%20Barat.geojson"
  },
  {
    name: "Jakarta Pusat",
    province: "DKI Jakarta",
    url: "https://raw.githubusercontent.com/mahendrayudha/indonesia-geojson/main/Jakarta/Kabupaten-Kota/Jakarta%20Pusat/Jakarta%20Pusat.geojson"
  },
  {
    name: "Jakarta Selatan",
    province: "DKI Jakarta",
    url: "https://raw.githubusercontent.com/mahendrayudha/indonesia-geojson/main/Jakarta/Kabupaten-Kota/Jakarta%20Selatan/Jakarta%20Selatan.geojson"
  },
  {
    name: "Jakarta Timur",
    province: "DKI Jakarta",
    url: "https://raw.githubusercontent.com/mahendrayudha/indonesia-geojson/main/Jakarta/Kabupaten-Kota/Jakarta%20Timur/Jakarta%20Timur.geojson"
  },
  {
    name: "Jakarta Utara",
    province: "DKI Jakarta",
    url: "https://raw.githubusercontent.com/mahendrayudha/indonesia-geojson/main/Jakarta/Kabupaten-Kota/Jakarta%20Utara/Jakarta%20Utara.geojson"
  },
  {
    name: "Kepulauan Seribu",
    province: "DKI Jakarta",
    url: "https://raw.githubusercontent.com/mahendrayudha/indonesia-geojson/main/Jakarta/Kabupaten-Kota/Kepulauan%20Seribu/Kepulauan%20Seribu.geojson"
  },

  // Jawa Barat
  {
    name: "Kota Bogor",
    province: "Jawa Barat",
    url: "https://raw.githubusercontent.com/mahendrayudha/indonesia-geojson/main/Jawa%20Barat/Kabupaten-Kota/Kota%20Bogor/Kota%20Bogor.geojson"
  },
  {
    name: "Kabupaten Bogor",
    province: "Jawa Barat",
    url: "https://raw.githubusercontent.com/mahendrayudha/indonesia-geojson/main/Jawa%20Barat/Kabupaten-Kota/Bogor/Bogor.geojson"
  },
  {
    name: "Kota Depok",
    province: "Jawa Barat",
    url: "https://raw.githubusercontent.com/mahendrayudha/indonesia-geojson/main/Jawa%20Barat/Kabupaten-Kota/Depok/Depok.geojson"
  },
  {
    name: "Kota Bekasi",
    province: "Jawa Barat",
    url: "https://raw.githubusercontent.com/mahendrayudha/indonesia-geojson/main/Jawa%20Barat/Kabupaten-Kota/Kota%20Bekasi/Kota%20Bekasi.geojson"
  },
  {
    name: "Kabupaten Bekasi",
    province: "Jawa Barat",
    url: "https://raw.githubusercontent.com/mahendrayudha/indonesia-geojson/main/Jawa%20Barat/Kabupaten-Kota/Bekasi/Bekasi.geojson"
  },

  // Banten
  {
    name: "Kota Tangerang",
    province: "Banten",
    url: "https://raw.githubusercontent.com/mahendrayudha/indonesia-geojson/main/Banten/Kabupaten-Kota/Kota%20Tangerang/Kota%20Tangerang.geojson"
  },
  {
    name: "Kota Tangerang Selatan",
    province: "Banten",
    url: "https://raw.githubusercontent.com/mahendrayudha/indonesia-geojson/main/Banten/Kabupaten-Kota/Tangerang%20Selatan/Tangerang%20Selatan.geojson"
  },
  {
    name: "Kabupaten Tangerang",
    province: "Banten",
    url: "https://raw.githubusercontent.com/mahendrayudha/indonesia-geojson/main/Banten/Kabupaten-Kota/Tangerang/Tangerang.geojson"
  }
];

function normalizeGeojsonToFeatures(geojson, source) {
  if (geojson.type === "FeatureCollection") {
    return geojson.features.map((feature) => ({
      ...feature,
      properties: {
        ...(feature.properties || {}),
        area_name: source.name,
        province: source.province,
        region_group: "Jabodetabek"
      }
    }));
  }

  if (geojson.type === "Feature") {
    return [
      {
        ...geojson,
        properties: {
          ...(geojson.properties || {}),
          area_name: source.name,
          province: source.province,
          region_group: "Jabodetabek"
        }
      }
    ];
  }

  return [
    {
      type: "Feature",
      properties: {
        area_name: source.name,
        province: source.province,
        region_group: "Jabodetabek"
      },
      geometry: geojson
    }
  ];
}

async function build() {
  const allFeatures = [];

  for (const source of sources) {
    console.log(`Downloading: ${source.name}`);

    const response = await fetch(source.url);

    if (!response.ok) {
      throw new Error(`Gagal download ${source.name}: ${response.status}`);
    }

    const geojson = await response.json();
    const features = normalizeGeojsonToFeatures(geojson, source);

    allFeatures.push(...features);
  }

  const finalGeojson = {
    type: "FeatureCollection",
    name: "Jabodetabek",
    features: allFeatures
  };

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
  }

  fs.writeFileSync(outputFile, JSON.stringify(finalGeojson));

  console.log("");
  console.log("Selesai.");
  console.log(`File dibuat: ${outputFile}`);
  console.log(`Total polygon/feature: ${allFeatures.length}`);
}

build().catch((error) => {
  console.error(error);
  process.exit(1);
});