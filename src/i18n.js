// -----------------------------------------------------------------------------
// Every text the integration produces, in the four languages of the Gladys
// interface: English, French, German ("du") and Spanish ("usted").
//
// The five levels of the German air quality index (Luftqualitätsindex) are
// translated from their official names: sehr gut, gut, mäßig, schlecht, sehr
// schlecht (UBA, in English: very good, good, moderate, poor, very poor).
// -----------------------------------------------------------------------------

/** The index levels, 0 to 4, by stable key (scene filters and outputs). */
export const LEVEL_KEYS = ['very_good', 'good', 'moderate', 'poor', 'very_poor'];

export const LEVELS = {
  very_good: { en: 'Very good', fr: 'Très bon', de: 'Sehr gut', es: 'Muy buena' },
  good: { en: 'Good', fr: 'Bon', de: 'Gut', es: 'Buena' },
  moderate: { en: 'Moderate', fr: 'Modéré', de: 'Mäßig', es: 'Moderada' },
  poor: { en: 'Poor', fr: 'Mauvais', de: 'Schlecht', es: 'Mala' },
  very_poor: { en: 'Very poor', fr: 'Très mauvais', de: 'Sehr schlecht', es: 'Muy mala' },
};

/** Chemical formulas: the same in every language. */
export const FORMULAS = {
  pm25: 'PM2.5',
  pm10: 'PM10',
  no2: 'NO₂',
  o3: 'O₃',
  so2: 'SO₂',
};

/** Feature names, by language (fixed when the device is added). */
export const NAMES = {
  en: {
    index: 'Air quality index',
    quality: 'Air quality',
    pm25: 'PM2.5',
    pm10: 'PM10',
    no2: 'Nitrogen dioxide (NO₂)',
    o3: 'Ozone (O₃)',
    so2: 'Sulphur dioxide (SO₂)',
    age: 'Measurement age',
  },
  fr: {
    index: "Indice de qualité de l'air",
    quality: "Qualité de l'air",
    pm25: 'PM2.5',
    pm10: 'PM10',
    no2: "Dioxyde d'azote (NO₂)",
    o3: 'Ozone (O₃)',
    so2: 'Dioxyde de soufre (SO₂)',
    age: 'Âge de la mesure',
  },
  de: {
    index: 'Luftqualitätsindex',
    quality: 'Luftqualität',
    pm25: 'PM2.5',
    pm10: 'PM10',
    no2: 'Stickstoffdioxid (NO₂)',
    o3: 'Ozon (O₃)',
    so2: 'Schwefeldioxid (SO₂)',
    age: 'Alter der Messung',
  },
  es: {
    index: 'Índice de calidad del aire',
    quality: 'Calidad del aire',
    pm25: 'PM2.5',
    pm10: 'PM10',
    no2: 'Dióxido de nitrógeno (NO₂)',
    o3: 'Ozono (O₃)',
    so2: 'Dióxido de azufre (SO₂)',
    age: 'Antigüedad de la medición',
  },
};

/** Fixed texts. */
export const TEXT = {
  notConfigured: {
    en: 'No station yet: use "Find a station", then type its number.',
    fr: 'Aucune station : utilisez « Trouver une station », puis saisissez son numéro.',
    de: 'Noch keine Station: nutze „Station finden“ und gib dann ihre Nummer ein.',
    es: 'Ninguna estación: use «Buscar una estación» y escriba su número.',
  },
  apiUnreachable: {
    en: 'The UBA API does not answer: the values are not updated.',
    fr: "L'API de l'UBA ne répond pas : les valeurs ne sont plus mises à jour.",
    de: 'Die UBA-API antwortet nicht: Die Werte werden nicht aktualisiert.',
    es: 'La API de la UBA no responde: los valores no se actualizan.',
  },
  initFailed: {
    en: 'The integration could not start: see the Logs tab.',
    fr: "L'intégration n'a pas pu démarrer : voir l'onglet Journaux.",
    de: 'Die Integration konnte nicht starten: siehe Reiter Protokolle.',
    es: 'La integración no pudo iniciarse: consulte la pestaña Registros.',
  },
  noReading: {
    en: 'No air quality reading yet.',
    fr: "Pas encore de relevé de la qualité de l'air.",
    de: 'Noch keine Messung der Luftqualität.',
    es: 'Todavía no hay lectura de la calidad del aire.',
  },
  noStation: {
    en: 'No station added to Gladys yet.',
    fr: 'Aucune station ajoutée à Gladys.',
    de: 'Noch keine Station zu Gladys hinzugefügt.',
    es: 'Ninguna estación añadida a Gladys.',
  },
  unknownStation: {
    en: 'This station is no longer read: check the configuration.',
    fr: "Cette station n'est plus lue : vérifiez la configuration.",
    de: 'Diese Station wird nicht mehr gelesen: prüfe die Konfiguration.',
    es: 'Esta estación ya no se lee: compruebe la configuración.',
  },
  nothingConfigured: {
    en: 'No station is configured.',
    fr: "Aucune station n'est configurée.",
    de: 'Keine Station ist konfiguriert.',
    es: 'No hay ninguna estación configurada.',
  },
  noHouse: {
    en: 'Type a name, or set the location of a house in Settings → Houses.',
    fr: 'Saisissez un nom, ou placez une maison dans Paramètres → Maisons.',
    de: 'Gib einen Namen ein oder lege den Standort eines Hauses unter Einstellungen → Zuhause fest.',
    es: 'Escriba un nombre, o defina la ubicación de una casa en Configuración → Viviendas.',
  },
  catalogUnavailable: {
    en: 'The list of the UBA stations cannot be read now: try again in a minute.',
    fr: "La liste des stations de l'UBA est illisible pour le moment : réessayez dans une minute.",
    de: 'Die Liste der UBA-Stationen ist gerade nicht lesbar: versuche es in einer Minute erneut.',
    es: 'La lista de estaciones de la UBA no se puede leer ahora: inténtelo de nuevo en un minuto.',
  },
  airQuality: {
    en: 'Air quality',
    fr: "Qualité de l'air",
    de: 'Luftqualität',
    es: 'Calidad del aire',
  },
  measured: { en: 'Measured', fr: 'Mesuré', de: 'Gemessen', es: 'Medido' },
  noData: { en: 'No data', fr: 'Pas de donnée', de: 'Keine Daten', es: 'Sin datos' },
  noIndex: { en: 'No index', fr: "Pas d'indice", de: 'Kein Index', es: 'Sin índice' },
  source: {
    en: 'German index · Umweltbundesamt, Länder networks',
    fr: 'Indice allemand · Umweltbundesamt, réseaux des Länder',
    de: 'Luftqualitätsindex · Umweltbundesamt, Messnetze der Länder',
    es: 'Índice alemán · Umweltbundesamt, redes de los Länder',
  },
};

/** Texts built from values. */
export const MESSAGES = {
  /** "3 h ago", or "Outdated (2 d)" when stale. */
  measuredAgo(minutes, stale) {
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(minutes / 1440);
    const span =
      minutes < 60
        ? {
            en: `${minutes} min`,
            fr: `${minutes} min`,
            de: `${minutes} Min.`,
            es: `${minutes} min`,
          }
        : minutes < 2880
          ? { en: `${hours} h`, fr: `${hours} h`, de: `${hours} Std.`, es: `${hours} h` }
          : { en: `${days} d`, fr: `${days} j`, de: `${days} Tg.`, es: `${days} d` };
    if (stale) {
      return {
        en: `Outdated (${span.en})`,
        fr: `Périmée (${span.fr})`,
        de: `Veraltet (${span.de})`,
        es: `Desactualizada (${span.es})`,
      };
    }
    return {
      en: `${span.en} ago`,
      fr: `il y a ${span.fr}`,
      de: `vor ${span.de}`,
      es: `hace ${span.es}`,
    };
  },

  /**
   * "UBA Berlin Wedding: Good · PM2.5 4 µg/m³ · PM10 6 µg/m³".
   * @param {{ station: string, level: string|null, values: Record<string, number> }} options
   */
  summary({ station, level, values }) {
    const parts = ['pm25', 'pm10', 'no2', 'o3']
      .filter((key) => typeof values[key] === 'number')
      .map((key) => `${FORMULAS[key]} ${formatNumber(values[key])} µg/m³`);
    return Object.fromEntries(
      ['en', 'fr', 'de', 'es'].map((lang) => {
        const label = level ? LEVELS[level][lang] : TEXT.noIndex[lang];
        const colon = lang === 'fr' ? ' :' : ':';
        return [lang, [`${station}${colon} ${label}`, ...parts].join(' · ')];
      }),
    );
  },

  /** One line of the "Check the stations" report. */
  checkStation({ id, name, level, minutes, pollutants = [], error, unknown }) {
    const head = `#${id} ${name ?? ''}`.trim();
    if (unknown) {
      return {
        en: `${head}: not a UBA station (see "Find a station")`,
        fr: `${head} : pas une station de l'UBA (voir « Trouver une station »)`,
        de: `${head}: keine UBA-Station (siehe „Station finden“)`,
        es: `${head}: no es una estación de la UBA (vea «Buscar una estación»)`,
      };
    }
    if (error) {
      return {
        en: `${head}: error (${error})`,
        fr: `${head} : erreur (${error})`,
        de: `${head}: Fehler (${error})`,
        es: `${head}: error (${error})`,
      };
    }
    const list = pollutants.map((key) => FORMULAS[key]).join(', ') || '-';
    const ago = minutes === null || minutes === undefined ? null : MESSAGES.measuredAgo(minutes);
    const out = {};
    for (const lang of ['en', 'fr', 'de', 'es']) {
      const label = level ? LEVELS[level][lang] : TEXT.noIndex[lang];
      const colon = lang === 'fr' ? ' :' : ':';
      out[lang] = `${head}${colon} ${label}, ${list}${ago ? ` (${ago[lang]})` : ''}`;
    }
    return out;
  },

  invalidIds(ids) {
    const list = ids.join(', ');
    return {
      en: `Ignored, not station numbers: ${list}`,
      fr: `Ignorés, ce ne sont pas des numéros de station : ${list}`,
      de: `Ignoriert, keine Stationsnummern: ${list}`,
      es: `Ignorados, no son números de estación: ${list}`,
    };
  },

  tooManyIds(max) {
    return {
      en: `Only the first ${max} stations are read.`,
      fr: `Seules les ${max} premières stations sont lues.`,
      de: `Nur die ersten ${max} Stationen werden gelesen.`,
      es: `Solo se leen las ${max} primeras estaciones.`,
    };
  },

  /**
   * The result of "Find a station".
   * @param {{ query: string, house?: string, stations: Array<{ id: string, name: string, distanceKm?: number }>, more: number }} options
   */
  found({ query, house, stations, more }) {
    const where = query
      ? {
          en: `for "${query}"`,
          fr: `pour « ${query} »`,
          de: `für „${query}“`,
          es: `para «${query}»`,
        }
      : {
          en: `near ${house}`,
          fr: `autour de ${house}`,
          de: `in der Nähe von ${house}`,
          es: `cerca de ${house}`,
        };
    if (stations.length === 0) {
      return {
        en: `No active UBA station ${where.en}.`,
        fr: `Aucune station active de l'UBA ${where.fr}.`,
        de: `Keine aktive UBA-Station ${where.de}.`,
        es: `Ninguna estación activa de la UBA ${where.es}.`,
      };
    }
    const lines = stations.map(
      (station) =>
        `#${station.id} ${station.name}${station.code ? ` [${station.code}]` : ''}${
          station.distanceKm === undefined ? '' : ` (${formatNumber(station.distanceKm)} km)`
        }`,
    );
    const head = {
      en: `UBA stations ${where.en}, numbers to type in "Stations":`,
      fr: `Stations de l'UBA ${where.fr}, numéros à saisir dans « Stations » :`,
      de: `UBA-Stationen ${where.de}, Nummern für „Stationen“:`,
      es: `Estaciones de la UBA ${where.es}, números para escribir en «Estaciones»:`,
    };
    const tail = more
      ? {
          en: `…and ${more} more: refine the search.`,
          fr: `…et ${more} autres : affinez la recherche.`,
          de: `…und ${more} weitere: verfeinere die Suche.`,
          es: `…y ${more} más: afine la búsqueda.`,
        }
      : null;
    return Object.fromEntries(
      ['en', 'fr', 'de', 'es'].map((lang) => [
        lang,
        [head[lang], ...lines, ...(tail ? [tail[lang]] : [])].join('\n'),
      ]),
    );
  },
};

/** A number with one decimal at most. */
export function formatNumber(value) {
  return String(Math.round(value * 10) / 10);
}
