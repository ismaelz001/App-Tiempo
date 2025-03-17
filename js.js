const apiKey = "4FHQUWM6CPZCPPDQSBHM4RLBF";
const apiGeo = "http://geodb-free-service.wirefreethought.com/v1/geo/cities";

$("#tiempoActual").click(obtenerTiempoActual);
$("#localizacion").click(obtenerLocalizacion);
$("#diezDias").click(obtenerPrevisionDiez);

$(document).ready(function () {
  $("#ubicacion").on("input", function () {
    const query = $(this).val();
    if (query.length > 2) {
      obtenerSugerencias(query);
    } else {
      $("#sugerencias").empty();
    }
  });
});
async function obtenerSugerencias(query) {
  try {
    const respuesta = await fetch(
      `${apiGeo}?namePrefix=${query}&limit=5&languageCode=es&apiKey=${apiKey}`
    );
    const datos = await respuesta.json();
    mostrarSugerencias(datos.data);
  } catch (error) {
    console.error("Error al obtener sugerencias:", error);
  }
}

function mostrarSugerencias(sugerencias) {
  const lista = $("#sugerencias");
  lista.empty();
  sugerencias.forEach((sugerencia) => {
    const item = $("<li>")
      .text(`${sugerencia.city}, ${sugerencia.region || sugerencia.country}`)
      .css({
        cursor: "pointer",
        padding: "5px",
        borderBottom: "1px solid #ccc",
        overflowY: "auto",
        maxheight: "600px",
      })
      .on("click", function () {
        $("#ubicacion").val(`${sugerencia.city}, ${sugerencia.countryCode}`);
        $("#sugerencias").empty();
        actualizarMap(sugerencia.latitude, sugerencia.longitude);
        obtenerTiempoActual(sugerencia.latitude, sugerencia.longitude);
      });
    lista.append(item);
  });
}

async function obtenerTiempoActual() {
  const ubicacion = $("#ubicacion").val();
  const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${ubicacion}?unitGroup=metric&key=${apiKey}`;
  try {
    const datos = await fetchDatos(url);
    if (datos.days) {
      mostrarResultado(datos);
    } else {
      mostrarError("No se encontraron datos para el tiempo actual.");
    }
    //actualizarMap(datos.latitude, datos.longitude);
  } catch (error) {
    console.error("Error al obtener el tiempo actual:", error);
    mostrarError(
      "Error al obtener el tiempo actual. Por favor, intenta de nuevo más tarde."
    );
  }
}

async function obtenerLocalizacion() {
  const ubicacion = $("#ubicacion").val();
  $("#ubicacion").css({
    display: "flex",
    "justify-content": "center",
    "align-items": "ceter",
  });
  let pais = "";
  let ciudad = ubicacion;

  // Verificar si la ubicación contiene una coma
  if (ubicacion.includes(",")) {
    const partes = ubicacion.split(",").map((part) => part.trim());
    ciudad = partes[0]; // La primera parte es la ciudad

    // Verificar si hay más una ciudad, país
    if (partes.length > 1) {
      const posiblePais = partes[1].toUpperCase();

      // Si el posible país no es España, usamos ese país
      if (posiblePais !== "ES") {
        pais = posiblePais;
      }
    }
  }

  try {
    const url = pais
      ? `${apiGeo}?namePrefix=${ciudad}&country=${pais}&limit=1&languageCode=es`
      : `${apiGeo}?namePrefix=${ciudad}&limit=5&languageCode=es`;

    const respuesta = await fetch(url);
    const datos = await respuesta.json();
    console.log(datos);
    console.log(datos.data);

    if (datos.data && datos.data.length > 0) {
      let ciudadData;
      if (pais) {
        ciudadData = datos.data[0];
      } else {
        const ciudadesEspañolas = datos.data.filter(
          (ciudad) => ciudad.countryCode === "ES"
        );

        ciudadData =
          ciudadesEspañolas.length > 0 ? ciudadesEspañolas[0] : datos.data[0]; // Tomar la primera ciudad española o la primera ciudad encontrada
      }

      if (!isNaN(ciudadData.latitude) && !isNaN(ciudadData.longitude)) {
        mostrarLocalizacion(ciudadData);
        actualizarMap(ciudadData.latitude, ciudadData.longitude);
      } else {
        mostrarError("Coordenadas inválidas.");
      }
    } else {
      mostrarError("No se encontraron datos para la ubicación especficada");
    }
  } catch (error) {
    console.error("Error al obtener la información de ubicación:", error);
    mostrarError(
      "Error al obtener la información de la ubicación. Por favor, intenta de nuevo más tarde."
    );
  }
}

async function obtenerPrevisionDiez() {
  const ubicacion = $("#ubicacion").val();
  const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${ubicacion}?unitGroup=metric&forecastDays=10&key=${apiKey}`;
  try {
    const datos = await fetchDatos(url);
    if (datos.days) {
      mostrarPrevisionDiez(datos);
      //actualizarMap();
    } else {
      mostrarError("No se encontraron datos para la previsión del tiempo.");
    }
  } catch (error) {
    console.error("Error al obtener la previsión del tiempo:", error);
    mostrarError(
      "Error al obtener la previsión del tiempo. Por favor, intenta de nuevo más tarde."
    );
  }
}

function fetchDatos(url) {
  return $.ajax({
    url: url,
    dataType: "json",
  });
}

function actualizarMap(latitude, longitude) {
  // Verificar si las coordenadas son números válidos
  if (!isNaN(latitude) && !isNaN(longitude)) {
    const url = `https://www.openstreetmap.org/export/embed.html?bbox=${
      longitude - 0.05
    },${latitude - 0.05},${longitude + 0.05},${latitude + 0.05}&layer=mapnik`;

    $("#mapFrame").attr("src", url);
  } else {
    console.error("Coordenadas inválidas para actualizar el mapa.");
    mostrarError(
      "No se pudieron obtener coordenadas válidas para actualizar el mapa."
    );
  }
}

async function obtenerTiempoPorCoordenadas(lat, lng) {
  const url = `https://weather.visualcrossing.com/VisualCrossingWebServices/rest/services/timeline/${lat},${lng}?unitGroup=metric&key=${apiKey}`;
  return fetchDatos(url);
}

function mostrarResultado(datos) {
  const resultado = document.getElementById("resultado");
  let prevision = "";

  const descripcionesEnIngles = {
    "Clear conditions throughout the day.":
      "Cielo despejado durante todo el día.",
    "Partly cloudy throughout the day.":
      "Condiciones parcialmente nubladas durante todo el día.",
    "Cloudy with a chance of rain.": "Nublado con probabilidad de lluvia.",
    "Light rain showers throughout the day.":
      "Lluvia ligera durante todo el día.",
    "Heavy rain showers throughout the day.":
      "Lluvia intensa durante todo el día.",
    "Cloudy skies throughout the day with rain.":
      "Cielos nubosos durante todo el dia con lluvia",
    "Snow showers throughout the day.": "Nevadas durante todo el día.",
    "Clearing in the afternoon with early morning rain.":
      "Cielo despejado por la mañana con lluvia tempano",
    "Light snow showers throughout the day.":
      "Nevadas ligeras durante todo el día.",
    "Heavy snow showers throughout the day.":
      "Nevadas intensas durante todo el día.",
    "Thunderstorms throughout the day.":
      "Tormentas eléctricas durante todo el día.",
    "Clearing in the afternoon.": "Cielos despejados por la tarde",
    "Mist or light fog.": "Niebla ligera.",
    "Light fog.": "Niebla ligera.",
    "Mist.": "Niebla.",
    "Fog.": "Niebla densa.",
  };

  const condicionesEnIngles = {
    Clear: "Despejado",
    Partly: "Parcialmente",
    "Partially cloudy": "Parcialmente Nublado",
    Cloudy: "Nublado",
    Rain: "Lluvia",
    Snow: "Nieve",
    Thunderstorm: "Tormenta",
    Mist: "Niebla",
    Fog: "Niebla",
    Overcast: "Nublado",
    "Rain, Overcast": "Niebla y Lluvia",
    "Rain, Partially cloudy": "LLuvia, parcialmente Cubiero",
  };

  const today = datos.days[0];
  //console.log(`icono del tiempo de hoy: ${today.icon}`);
  const iconoUrl = obtenerIconos(today.icon);

  $("#resultado").css({
    width: "70%",
    "max-height": "600px",
    "max-width": "600px",
    "overflow-y": "auto",
    "margin-right": "20%",
    "margin-bottom": "20px",
  });

  const estadoTiempo =
    condicionesEnIngles[today.conditions] || today.conditions;

  const descripEsp =
    descripcionesEnIngles[today.description] || today.description;

  prevision += `<img src="${iconoUrl}" alt="Icono del tiempo" style="display: block; margin: 0 auto; width: 100px; height: auto;">`;
  prevision += `<h2>Previsión para hoy (${today.datetime}):</h2>`;
  prevision += `<p>Nombre de las Estaciones Meteorologica: ${today.stations}</p>`;
  prevision += `<p>Temperatura máxima: ${today.tempmax}°C</p>`;
  prevision += `<p>Temperatura mínima: ${today.tempmin}°C</p>`;
  prevision += `<p>Viento: ${today.windspeed} m/s, ${obtenerDireccionViento(
    today.winddir
  )}</p>`;
  prevision += `<p>Estado del tiempo: ${estadoTiempo}</p>`;
  prevision += `<p>Descripción: ${descripEsp}</p>`;
  prevision += `<p>Llueve: ${today.precip > 0 ? "Sí" : "No"}</p>`;
  prevision += `<p>Visibilidad: ${today.visibility} km</p>`;
  prevision += `<p>Humedad: ${today.humidity}%</p>`;
  prevision += "</div>";

  // Cerramos el contenedortiempo para hoy
  prevision += "</div>";

  resultado.innerHTML = prevision;
}

function mostrarPrevisionDiez(datos) {
  const condicionesEnIngles = {
    Clear: "Despejado",
    "Partially cloudy": "Parcialmente nublado",
    "Rain, Overcast": "Lluvia, Nublado",
    "Rain, Partially cloudy": "Lluvia, parcialmente nublado",
    Cloudy: "Nublado",
    Rain: "Lluvia",
    Sleet: "Aguanieve",
    Snow: "Nieve",
    Wind: "Viento",
    Fog: "Niebla",
    Overcast: "Nublado",
    Partly: "Parcialmente",
  };
  const resultado = document.getElementById("resultado");
  let prevision = "<h2>Previsión del Tiempo a 10 Días:</h2>";

  prevision += "<div style='overflow-x: auto;'>"; //scroll horizontal
  //  tabla
  prevision += "<table style='width: 100%; border-collapse: collapse;'>";
  prevision += "<tr>"; // Fila de cabeceras
  datos.days.forEach((day, index) => {
    if (index === 0) return;
    prevision += `<th style="border: 1px solid #ccc; padding: 10px;">${day.datetime}</th>`;
  });
  prevision += "</tr>";

  //  iconos
  prevision += "<tr>";
  datos.days.forEach((day, index) => {
    if (index === 0) return;
    const horaCentral = day.hours.find((hora) =>
      hora.datetime.includes("12:00:00")
    );
    const iconoUrl = obtenerIconos(horaCentral ? horaCentral.icon : day.icon);
    prevision += `<td style="border: 1px solid #ccc; padding: 10px; text-align: center;"><img src="${iconoUrl}" alt="Icono del tiempo"></td>`;
  });
  prevision += "</tr>";

  // temperaturas máximas
  prevision += "<tr>";
  datos.days.forEach((day, index) => {
    if (index === 0) return;
    prevision += `<td style="border: 1px solid #ccc; padding: 10px; text-align: center;">${day.tempmax}°C</td>`;
  });
  prevision += "</tr>";

  // temperaturas mínimas
  prevision += "<tr>";
  datos.days.forEach((day, index) => {
    if (index === 0) return;
    prevision += `<td style="border: 1px solid #ccc; padding: 10px; text-align: center;">${day.tempmin}°C</td>`;
  });
  prevision += "</tr>";

  // condiciones
  prevision += "<tr>";
  datos.days.forEach((day, index) => {
    if (index === 0) return;
    let condDay = condicionesEnIngles[day.conditions] || day.conditions;
    prevision += `<td style="border: 1px solid #ccc; padding: 10px; text-align: center;">${condDay}</td>`;
  });
  prevision += "</tr>";

  // Cerramo
  prevision += "</table>";

  resultado.innerHTML = prevision;
}

function obtenerIconos(icono) {
  const iconUrl = "icons/";
  const iconos = {
    "clear-day": "clear-day.svg",
    "clear-night": "clear-night.svg",
    "partly-cloudy-day": "partly-cloudy-day.svg",
    "partly-cloudy-night": "partly-cloudy-night.svg",
    cloudy: "cloudy.svg",
    rain: "rain.svg",
    sleet: "sleet.svg",
    snow: "snow.svg",
    wind: "wind.svg",
    fog: "fog.svg",
  };
  return `${iconUrl}${iconos[icono]}`;
}

function mostrarLocalizacion(ciudadData) {
  const resultado = document.getElementById("resultado");
  let info = "<h2>Información de la Ubicación:</h2>";

  info += `<p>Ciudad: ${ciudadData.city}</p>`;
  info += `<p>País: ${
    ciudadData.countryCode === "ES" ? "España " : ciudadData.country
  }</p>`;
  info += `<p>Región: ${ciudadData.region}</p>`;
  info += `<p>Población: ${ciudadData.population}</p>`;

  resultado.innerHTML = info;
}

function mostrarError(mensaje) {
  const resultado = document.getElementById("resultado");
  resultado.innerHTML = `<p>${mensaje}</p>`;
}

function obtenerIconos(icono) {
  const iconUrl = "icons/";
  const iconos = {
    "clear-day": "clear-day.svg",
    "clear-night": "clear-night.svg",
    "partly-cloudy-day": "partly-cloudy-day.svg",
    "partly-cloudy-night": "partly-cloudy-night.svg",
    cloudy: "cloudy.svg",
    rain: "rain.svg",
    sleet: "sleet.svg",
    snow: "snow.svg",
    wind: "wind.svg",
    fog: "fog.svg",
  };
  return `${iconUrl}${iconos[icono]}`;
}
function obtenerDireccionViento(angle) {
  const directions = ["N", "NE", "E", "SE", "S", "SW", "W", "NW"];
  const index = Math.round(angle / 45) % 8;
  return directions[index];
}
