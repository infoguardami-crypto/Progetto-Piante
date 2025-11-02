// api/jotform-webhook.js
import { randomUUID } from 'node:crypto';
import fetch from 'node-fetch';

export const config = {
  api: {
    bodyParser: { type: "application/x-www-form-urlencoded", sizeLimit: "2mb" },
  },
};

// I tuoi "Field Details" di Jotform
const FILE_FIELD = 'caricafile'; // Upload Photo
const NOME_COMUNE_FIELD = 'Identificazione_Specie'; // Nome comune
const NOME_SCIENT_FIELD = 'nomeScientifico'; // Nome scientifico
const AFFIDABILITA_FIELD = 'affidabilita'; // Affidabilità (es. "91%")
const ALLERGIE_FIELD = 'allergenicita'; // Allergenicità
const CURIOSITA_FIELD = 'curiosita'; // Curiosità (opzionale)

// Mini-tabella indicativa di allergenicità per alcuni generi noti (puoi ampliarla/modificarla)
const ALLERGENICITY_BY_GENUS = {
  Ambrosia: "Altissima",
  Betula: "Alta",
  Cupressus: "Alta",
  Olmo: "Alta",
  Platanus: "Alta",
  Poa: "Alta", // Graminacee
  Artemisia: "Media",
  Quercus: "Media",
  Pino: "Media",
  Tilia: "Bassa",
  Rosa: "Bassa",
};

// Curiosità di esempio per qualche genere (facoltativo)
const CURIOSITA_BY_GENUS = {
  Quercus: "Legno usato tradizionalmente per botti e mobili.",
  Olmo: "Specie simbolo del Mediterraneo; olio dai suoi frutti.",
  Tilia: "Fiori usati per tisane rilassanti.",
};

async function bufFromUrl(url) {
  const res = await fetch(url);
  return await res.buffer();
}

// Funzione per gestire il webhook e inviare dati a PlantNet
export default async function handler(req, res) {
  const formData = req.body;

  // Ottieni i dati da Jotform
  const photoUrl = formData[FILE_FIELD];
  const nomeComune = formData[NOME_COMUNE_FIELD];
  const nomeScientifico = formData[NOME_SCIENT_FIELD];
  const affidabilita = formData[AFFIDABILITA_FIELD];
  const allergenicita = formData[ALLERGIE_FIELD];
  const curiosita = formData[CURIOSITA_FIELD];

  // Effettua una richiesta a PlantNet (e.g., per determinazione della specie)
  const plantNetResponse = await fetch('https://api.plantnet.org/v2/identify', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${process.env.PLANTNET_API_KEY}`,
    },
    body: JSON.stringify({
      images: [photoUrl],
      organs: ['leaf', 'flower', 'fruit'],  // Imposta l'organo preferito (leaf, flower, etc.)
      locale: 'it',  // Lingua della risposta
    }),
  });

  const plantData = await plantNetResponse.json();
  const species = plantData.results[0]?.species || 'Sconosciuta';

  // Risposta da inviare a Jotform
  const response = {
    nome_comune: nomeComune,
    nome_scientifico: nomeScientifico,
    affidabilita: affidabilita,
    allergenicita: allergenicita,
    curiosita: curiosita || 'Nessuna curiosità disponibile',
    specie: species,
  };

  // Invia risposta a Jotform o salvala
  res.status(200).json(response);
}
