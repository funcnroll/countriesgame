"use strict";

import { TIMEOUT_MS, API_URL, API_ERROR_MSG } from "./config.js";

let currentCountry = null;
const countries = [];
const scoreDOM = document.querySelector(".score");
const highscoreDOM = document.querySelector(".highscore");
const flag = document.querySelector(".flag");
const errorMsg = document.querySelector(".errMsg");
const errorMsgText = document.querySelector(".errMsg__p");
const btn = document.querySelector(".done");
const form = document.querySelector(".form");
let score = 0;
let highscore = 0;

function timeout() {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new Error(`Couldn't connect to API`)), TIMEOUT_MS);
  });
}

/**
 * Get all country names by fetching all countries from the API and pushing them to the countries variable (as array)
 * @async
 * @returns {*}
 */
async function getCountryNames() {
  try {
    const req = await Promise.race([
      fetch(`${API_URL}/all?fields=cioc`),
      timeout(),
    ]);

    if (!req.ok) {
      errorMsg.classList.remove("hidden");
      errorMsgText.textContent = `${API_ERROR_MSG} (${req.status})`;
      throw new Error(`HTTP error! status: ${req.status}`);
    }

    const data = await req.json();
    data.forEach((country) => {
      if (country.cioc !== undefined) {
        countries.push(country.cioc);
      }
    });
  } catch (err) {
    throw err;
  }
}

/**
 *  Get a random country
 * @param {Array} countryArr An array of country names
 * @returns {Array | Error} returns the country array (Array that includes one object), times out after specified time if theres no connection
 */
async function getRandomCountry(countryArr) {
  try {
    const randomCountry =
      countryArr[Math.floor(Math.random() * countryArr.length)];
    const req = Promise.race([
      fetch(`${API_URL}/alpha/${randomCountry}`),
      timeout(),
    ]);

    const res = await req;

    if (!res.ok) {
      errorMsg.classList.remove("hidden");
      errorMsgText.textContent = `${API_ERROR_MSG} (${res.status}) `;
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();
    return data;
  } catch (err) {
    throw err;
  }
}

/**
 * Calculate the Highscore
 */
function calcHighscore() {
  if (score > highscore) {
    highscore = score;
    highscoreDOM.textContent = `Highscore: ${highscore}`;
  }
}

/**
 *
 * Checks the input value of all values filled in the form (everything must be filled), increase score if a value is correct, decrement score if the score is incorrect
 * @async
 * @returns {*}
 */
async function checkInput() {
  errorMsg.classList.add("hidden");

  // generate the countries array

  await getCountryNames();

  // get a random country

  let data = currentCountry[0];
  let { svg, alt } = data.flags;
  const { common: countryName } = data.name;
  const capital = data.capital[0];
  const countryContinent = data.continents;
  const landlocked = data.landlocked;
  const languages = Object.values(data.languages);

  flag.src = svg;
  flag.alt = alt;

  const formData = new FormData(form);
  // formValues[0] == Capital, formValues[1] == Country etc.
  const formValues = [...formData.values()].map((value) => value.trim());

  // user must input on all fields
  if (formValues.some((value) => value === "")) {
    errorMsg.classList.remove("hidden");
    errorMsgText.textContent = `Please fill in all fields.`;
    return;
  }

  //check capital
  if (formValues[0].toLowerCase() === capital.toLowerCase()) score++;
  else {
    score--;
  }
  //check country name
  if (formValues[1].toLowerCase() === countryName.toLowerCase()) score++;
  else {
    score--;
  }
  // check if the country is intercontinental
  if (countryContinent.length > 1) {
    const inputContinent = formValues[2].split(",");

    // if inputContinents contains more  2 continents, check if input is correct
    if (
      inputContinent.length === 2 &&
      countryContinent.some(
        (continent) =>
          inputContinent[0].toLowerCase().trim() === continent.toLowerCase() ||
          inputContinent[1].toLowerCase().trim() === continent.toLowerCase()
      ) &&
      countryContinent.some(
        (continent) =>
          inputContinent[1].toLowerCase().trim() === continent.toLowerCase() ||
          inputContinent[0].toLowerCase().trim() === continent.toLowerCase()
      )
    )
      score++;
    else {
      score--;
    }
  }
  // check the countrys continent input
  // nest so else works when input is wrong, not if the country is just intercontinental
  if (countryContinent.length === 1) {
    if (formValues[2].toLowerCase() === countryContinent[0].toLowerCase())
      score++;
    else {
      score--;
    }
  }

  if (formValues[3].toLowerCase() === "yes" && landlocked) score++;
  else if (formValues[3].toLowerCase() === "no" && !landlocked) score++;
  else {
    score--;
  }

  // check ANY officiallanguage
  if (
    languages.some(
      (language) => formValues[4].toLowerCase() === language.toLowerCase()
    )
  )
    score++;
  else {
    score--;
  }

  scoreDOM.textContent = `Score: ${score}`;

  calcHighscore();

  form.reset();
  currentCountry = await getRandomCountry(countries);
  data = currentCountry[0];
  svg = data.flags.svg;
  alt = data.flags.alt;
  flag.src = svg;
  flag.alt = alt;
}

/**
 * Initialise the game by setting the flag of the current country and setting the currentCountry variable
 * @async
 * @returns {*}
 */
async function init() {
  // generate the countries array
  await getCountryNames();

  // get a random country and display the flag
  currentCountry = await getRandomCountry(countries);
  const data = currentCountry[0];
  const { svg, alt } = data.flags;
  flag.src = svg;
  flag.alt = alt;

  btn.addEventListener("click", checkInput);
}

init();
