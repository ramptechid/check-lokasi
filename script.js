const checkingPage = document.getElementById("checkingPage");
const allowedPage = document.getElementById("allowedPage");
const blockedPage = document.getElementById("blockedPage");

const statusBox = document.getElementById("statusBox");
const btnRetry = document.getElementById("btnRetry");
const btnRetryBlocked = document.getElementById("btnRetryBlocked");

const latitudeEl = document.getElementById("latitude");
const longitudeEl = document.getElementById("longitude");
const accuracyEl = document.getElementById("accuracy");
const timeEl = document.getElementById("time");
const detectedAreaEl = document.getElementById("detectedArea");

const roadEl = document.getElementById("road");
const villageEl = document.getElementById("village");
const districtEl = document.getElementById("district");
const cityEl = document.getElementById("city");
const provinceEl = document.getElementById("province");
const postcodeEl = document.getElementById("postcode");
const countryEl = document.getElementById("country");
const fullAddressEl = document.getElementById("fullAddress");

const blockedMessageEl = document.getElementById("blockedMessage");
const blockedLatEl = document.getElementById("blockedLat");
const blockedLngEl = document.getElementById("blockedLng");
const blockedAddressEl = document.getElementById("blockedAddress");

let jabodetabekGeojson = null;

window.addEventListener("load", async () => {
  await init();
});

btnRetry.addEventListener("click", async () => {
  await requestUserLocation();
});

btnRetryBlocked.addEventListener("click", async () => {
  await requestUserLocation();
});

async function init() {
  showPage("checking");
  setStatus("Memuat data batas wilayah Jabodetabek...", "loading");

  try {
    const response = await fetch("data/jabodetabek.geojson");

    if (!response.ok) {
      throw new Error("File jabodetabek.geojson tidak ditemukan.");
    }

    jabodetabekGeojson = await response.json();

    await requestUserLocation();

  } catch (error) {
    console.error(error);

    setStatus(
      "Gagal memuat data batas wilayah. Pastikan file data/jabodetabek.geojson sudah ada.",
      "error"
    );
  }
}

async function requestUserLocation() {
  showPage("checking");
  setStatus("Meminta akses lokasi...", "loading");
  resetAllowedData();

  if (!jabodetabekGeojson) {
    setStatus("Data batas wilayah belum siap.", "error");
    return;
  }

  if (!navigator.geolocation) {
    showBlocked("Browser Anda tidak mendukung fitur lokasi.");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async function success(position) {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const accuracy = position.coords.accuracy;
      const timestamp = new Date(position.timestamp);

      setStatus("Lokasi didapat. Mengecek area Jabodetabek...", "loading");

      const checkResult = checkPointInsideGeojson(lng, lat, jabodetabekGeojson);

      const addressData = await getAddressDetail(lat, lng);

      if (checkResult.allowed) {
        fillAllowedData({
          lat,
          lng,
          accuracy,
          timestamp,
          area: checkResult.areaName,
          addressData
        });

        showPage("allowed");
      } else {
        showBlocked(
          "Maaf, area Anda belum masuk dalam wilayah layanan kami.",
          lat,
          lng,
          addressData?.fullAddress || "-"
        );
      }
    },

    function error(err) {
      console.error(err);

      if (err.code === err.PERMISSION_DENIED) {
        showBlocked("Akses lokasi ditolak. Silakan izinkan akses lokasi untuk membuka website ini.");
      } else if (err.code === err.POSITION_UNAVAILABLE) {
        showBlocked("Lokasi tidak tersedia. Pastikan GPS aktif dan koneksi internet stabil.");
      } else if (err.code === err.TIMEOUT) {
        showBlocked("Permintaan lokasi terlalu lama. Silakan coba lagi.");
      } else {
        showBlocked("Terjadi error saat mengambil lokasi.");
      }
    },

    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    }
  );
}

function checkPointInsideGeojson(lng, lat, geojson) {
  const point = [lng, lat];

  for (const feature of geojson.features) {
    const inside = pointInFeature(point, feature);

    if (inside) {
      return {
        allowed: true,
        areaName: feature.properties?.area_name || "Jabodetabek"
      };
    }
  }

  return {
    allowed: false,
    areaName: null
  };
}

function pointInFeature(point, feature) {
  if (!feature || !feature.geometry) return false;

  const geometry = feature.geometry;

  if (geometry.type === "Polygon") {
    return pointInPolygon(point, geometry.coordinates);
  }

  if (geometry.type === "MultiPolygon") {
    return geometry.coordinates.some((polygon) => pointInPolygon(point, polygon));
  }

  return false;
}

function pointInPolygon(point, polygon) {
  if (!polygon || polygon.length === 0) return false;

  const outerRing = polygon[0];
  const holes = polygon.slice(1);

  const insideOuter = pointInRing(point, outerRing);

  if (!insideOuter) return false;

  for (const hole of holes) {
    if (pointInRing(point, hole)) {
      return false;
    }
  }

  return true;
}

function pointInRing(point, ring) {
  const x = point[0];
  const y = point[1];

  let inside = false;

  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const xi = ring[i][0];
    const yi = ring[i][1];
    const xj = ring[j][0];
    const yj = ring[j][1];

    const intersect =
      yi > y !== yj > y &&
      x < ((xj - xi) * (y - yi)) / (yj - yi) + xi;

    if (intersect) inside = !inside;
  }

  return inside;
}

async function getAddressDetail(lat, lng) {
  const url =
    `https://nominatim.openstreetmap.org/reverse` +
    `?format=jsonv2` +
    `&lat=${lat}` +
    `&lon=${lng}` +
    `&zoom=18` +
    `&addressdetails=1` +
    `&accept-language=id`;

  try {
    const response = await fetch(url, {
      headers: {
        "Accept": "application/json"
      }
    });

    if (!response.ok) {
      throw new Error("Gagal mengambil data alamat.");
    }

    const data = await response.json();
    const address = data.address || {};

    return {
      road:
        address.road ||
        address.pedestrian ||
        address.footway ||
        address.path ||
        address.neighbourhood ||
        "-",

      village:
        address.village ||
        address.hamlet ||
        address.suburb ||
        address.quarter ||
        address.neighbourhood ||
        address.city_district ||
        "-",

      district:
        address.county ||
        address.district ||
        address.city_district ||
        address.municipality ||
        "-",

      city:
        address.city ||
        address.town ||
        address.regency ||
        address.county ||
        address.municipality ||
        "-",

      province:
        address.state ||
        address.region ||
        "-",

      postcode:
        address.postcode ||
        "-",

      country:
        address.country ||
        "-",

      fullAddress:
        data.display_name || "-"
    };

  } catch (error) {
    console.error(error);

    return {
      road: "-",
      village: "-",
      district: "-",
      city: "-",
      province: "-",
      postcode: "-",
      country: "-",
      fullAddress: "Gagal mengambil alamat lengkap."
    };
  }
}

function fillAllowedData(data) {
  latitudeEl.textContent = data.lat;
  longitudeEl.textContent = data.lng;
  accuracyEl.textContent = `${Math.round(data.accuracy)} meter`;
  timeEl.textContent = data.timestamp.toLocaleString("id-ID");
  detectedAreaEl.textContent = data.area;

  roadEl.textContent = data.addressData?.road || "-";
  villageEl.textContent = data.addressData?.village || "-";
  districtEl.textContent = data.addressData?.district || "-";
  cityEl.textContent = data.addressData?.city || "-";
  provinceEl.textContent = data.addressData?.province || "-";
  postcodeEl.textContent = data.addressData?.postcode || "-";
  countryEl.textContent = data.addressData?.country || "-";
  fullAddressEl.textContent = data.addressData?.fullAddress || "-";
}

function showBlocked(message, lat = "-", lng = "-", address = "-") {
  blockedMessageEl.textContent = message;
  blockedLatEl.textContent = lat;
  blockedLngEl.textContent = lng;
  blockedAddressEl.textContent = address;

  showPage("blocked");
}

function showPage(pageName) {
  checkingPage.classList.remove("active");
  allowedPage.classList.remove("active");
  blockedPage.classList.remove("active");

  if (pageName === "checking") {
    checkingPage.classList.add("active");
  }

  if (pageName === "allowed") {
    allowedPage.classList.add("active");
  }

  if (pageName === "blocked") {
    blockedPage.classList.add("active");
  }
}

function setStatus(message, type) {
  statusBox.textContent = message;
  statusBox.className = `status ${type}`;
}

function resetAllowedData() {
  latitudeEl.textContent = "-";
  longitudeEl.textContent = "-";
  accuracyEl.textContent = "-";
  timeEl.textContent = "-";
  detectedAreaEl.textContent = "-";

  roadEl.textContent = "-";
  villageEl.textContent = "-";
  districtEl.textContent = "-";
  cityEl.textContent = "-";
  provinceEl.textContent = "-";
  postcodeEl.textContent = "-";
  countryEl.textContent = "-";
  fullAddressEl.textContent = "-";
}