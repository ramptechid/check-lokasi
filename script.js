const statusBox = document.getElementById("statusBox");
const btnCheck = document.getElementById("btnCheck");

const latitudeEl = document.getElementById("latitude");
const longitudeEl = document.getElementById("longitude");
const accuracyEl = document.getElementById("accuracy");
const timeEl = document.getElementById("time");

const roadEl = document.getElementById("road");
const villageEl = document.getElementById("village");
const districtEl = document.getElementById("district");
const cityEl = document.getElementById("city");
const provinceEl = document.getElementById("province");
const postcodeEl = document.getElementById("postcode");
const countryEl = document.getElementById("country");
const fullAddressEl = document.getElementById("fullAddress");

// Setiap halaman dibuka, langsung minta lokasi
window.addEventListener("load", () => {
  requestUserLocation();
});

// Tombol cek ulang
btnCheck.addEventListener("click", () => {
  requestUserLocation();
});

function requestUserLocation() {
  setStatus("Meminta akses lokasi...", "loading");

  resetData();

  if (!navigator.geolocation) {
    setStatus("Browser ini tidak mendukung Geolocation API.", "error");
    return;
  }

  navigator.geolocation.getCurrentPosition(
    async function success(position) {
      const lat = position.coords.latitude;
      const lng = position.coords.longitude;
      const accuracy = position.coords.accuracy;
      const timestamp = new Date(position.timestamp);

      latitudeEl.textContent = lat;
      longitudeEl.textContent = lng;
      accuracyEl.textContent = `${Math.round(accuracy)} meter`;
      timeEl.textContent = timestamp.toLocaleString("id-ID");

      setStatus("Koordinat berhasil didapat. Mengambil nama daerah...", "loading");

      await getAddressDetail(lat, lng);
    },

    function error(err) {
      console.log(err);

      if (err.code === err.PERMISSION_DENIED) {
        setStatus(
          "Akses lokasi ditolak. Aktifkan izin lokasi di browser untuk melanjutkan.",
          "error"
        );
      } else if (err.code === err.POSITION_UNAVAILABLE) {
        setStatus(
          "Lokasi tidak tersedia. Pastikan GPS aktif dan koneksi internet stabil.",
          "error"
        );
      } else if (err.code === err.TIMEOUT) {
        setStatus(
          "Permintaan lokasi terlalu lama. Coba cek ulang lokasi.",
          "error"
        );
      } else {
        setStatus(
          "Terjadi error saat mengambil lokasi.",
          "error"
        );
      }
    },

    {
      enableHighAccuracy: true,
      timeout: 15000,
      maximumAge: 0
    }
  );
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

    console.log(data);

    const address = data.address || {};

    const road =
      address.road ||
      address.pedestrian ||
      address.footway ||
      address.path ||
      address.neighbourhood ||
      "-";

    const village =
      address.village ||
      address.hamlet ||
      address.suburb ||
      address.quarter ||
      address.neighbourhood ||
      address.city_district ||
      "-";

    const district =
      address.county ||
      address.district ||
      address.city_district ||
      address.municipality ||
      "-";

    const city =
      address.city ||
      address.town ||
      address.regency ||
      address.county ||
      address.municipality ||
      "-";

    const province =
      address.state ||
      address.region ||
      "-";

    const postcode =
      address.postcode ||
      "-";

    const country =
      address.country ||
      "-";

    roadEl.textContent = road;
    villageEl.textContent = village;
    districtEl.textContent = district;
    cityEl.textContent = city;
    provinceEl.textContent = province;
    postcodeEl.textContent = postcode;
    countryEl.textContent = country;

    fullAddressEl.textContent = data.display_name || "Alamat lengkap tidak ditemukan.";

    setStatus("Lokasi dan detail daerah berhasil ditampilkan.", "success");

  } catch (error) {
    console.error(error);

    setStatus(
      "Koordinat berhasil didapat, tapi gagal mengambil nama daerah.",
      "error"
    );
  }
}

function setStatus(message, type) {
  statusBox.textContent = message;
  statusBox.className = `status ${type}`;
}

function resetData() {
  latitudeEl.textContent = "-";
  longitudeEl.textContent = "-";
  accuracyEl.textContent = "-";
  timeEl.textContent = "-";

  roadEl.textContent = "-";
  villageEl.textContent = "-";
  districtEl.textContent = "-";
  cityEl.textContent = "-";
  provinceEl.textContent = "-";
  postcodeEl.textContent = "-";
  countryEl.textContent = "-";
  fullAddressEl.textContent = "-";
}