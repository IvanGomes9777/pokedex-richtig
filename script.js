let currentPokemon = [];
let offset = 0;
let limit = 20;

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

async function loadPokemon() {
  let url = `https://pokeapi.co/api/v2/pokemon?limit=${limit}&offset=${offset}`;
  let response = await fetch(url);
  let data = await response.json();
  let newPokemon = data.results;
  let requests = [];
  for (let i = 0; i < newPokemon.length; i++) {
    let pokemon = newPokemon[i];
    requests.push(fetch(pokemon.url));
  }
  let responses = await Promise.all(requests);
  for (let i = 0; i < newPokemon.length; i++) {
    let pokemonResponse = responses[i];
    let pokemonData = await pokemonResponse.json();
      newPokemon[i] = {
      id: pokemonData.id,
      name: capitalizeFirstLetter(pokemonData.name),
      imageUrl: pokemonData.sprites.other["official-artwork"].front_default,
      types: pokemonData.types.map((type) => type.type.name),
    };
  }
  currentPokemon = currentPokemon.concat(newPokemon);
  renderPokemon();
}

function returnPokemonCardHTML(pokemon, index) {
  let types = pokemon.types.join(", ");
  return `
  <div class="pokemon ${pokemon.types[0]}-type" onclick="openInfoWindow(${index}, '${pokemon.types[0]}')">
        <div class="poke-name">
        <h2>${pokemon.name}</h2>
      </div>
      <div class="poke-id">
        #${pokemon.id}
      </div>
      <div class="poke-img">
        <img src="${pokemon.imageUrl}" alt="${pokemon.name}">
      </div>
      <div class="poke-types">
        Type: ${types}
      </div>
    </div>
  `;
}

function renderPokemon() {
  let content = document.getElementById("pokedex");
  let html = content.innerHTML;
  for (let i = currentPokemon.length - limit; i < currentPokemon.length; i++) {
    let pokemon = currentPokemon[i];
    html += returnPokemonCardHTML(pokemon, i);
  }
  content.innerHTML = html;
}

async function loadMorePokemon() {
  const loadMoreButton = document.getElementById("load-more-button");
  const loadingWrapper = document.querySelector(".wrapper");
  loadMoreButton.disabled = true;
  loadingWrapper.style.display = "block";
  offset += limit;
  await loadPokemon();
  loadMoreButton.disabled = false;
  loadingWrapper.style.display = "none";
}

function returnInfoWindowHTML(pokemon, pokemonIndex) {
  return `
    <div class="windowContentUp"> 
      <div class="info-top">
        <span class="close" onclick="closeModal()">&times;</span>
        <div class="window-poke-name">
          <h2>${pokemon.name}</h2>
        </div>
        <div class="pokeWindowId">
          <span>#${pokemon.id}</span>
        </div>
      </div>
      <div class="navigation">
        <div class="arrow left-arrow" onclick="navigatePokemon(${pokemonIndex}, 'prev')">&#9664;</div>
        <div class="arrow right-arrow" onclick="navigatePokemon(${pokemonIndex}, 'next')">&#9654;</div>
      </div>
      <div class="pokeWindowImg">
        <img src="${pokemon.imageUrl}" alt="${pokemon.name}">
      </div>
    </div>
    <div class="windowContentDown">
      <div class="window-about">
        <a href="#" onclick="loadAbout(${pokemonIndex}, event)">
          <span>About</span>
        </a>
        <a href="#" onclick="loadAbility(${pokemonIndex}, event)">
          <span>Ability</span>
        </a>
        <a href="#" onclick="loadEvolution(${pokemonIndex}, event)">
          <span>Evolution</span>
        </a>
      </div>
      <div class="info-content" id="infoContent">
        <span class="placeholder-infoWindow">Here are all Informations about: <p class="info-poke-name">${pokemon.name}</p></span>
      </div>
    </div>
  `;
}

async function openInfoWindow(pokemonIndex) {
  let modal = document.getElementById("modal");
  modal.style.display = "block";
  let pokemon = currentPokemon[pokemonIndex];
  modal.innerHTML = returnInfoWindowHTML(pokemon, pokemonIndex);
  document.body.classList.add("modal-open");
}

async function loadAbout(pokemonIndex) {
  event.preventDefault();
  const pokemon = currentPokemon[pokemonIndex];
  const aboutContent = document.getElementById("infoContent");
  try {
    const pokemonData = await fetchPokemonData(pokemon.id);
    const height = pokemonData.height / 10;
    const weight = pokemonData.weight / 10;
    const speciesData = await fetchSpeciesData(pokemonData.species.url);
    const aboutText = getFlavorTextInEnglish(speciesData);
    aboutContent.innerHTML = returnAboutHTML(aboutText, height, weight);
  } catch (error) {
    console.error("Error loading About section:", error);
  }
}

function returnAboutHTML(aboutText, height, weight) {
  return `
    <p class="aboutPokemonWindow">${aboutText}</p>
    <p class="aboutPokemonWindow"><strong>Height:</strong> ${height} m</p>
    <p class="aboutPokemonWindow"><strong>Weight:</strong> ${weight} kg</p>
  `;
}

async function fetchPokemonData(pokemonId) {
  const url = `https://pokeapi.co/api/v2/pokemon/${pokemonId}`;
  const response = await fetch(url);
  return await response.json();
}

async function fetchSpeciesData(speciesUrl) {
  const response = await fetch(speciesUrl);
  return await response.json();
}

function getFlavorTextInEnglish(speciesData) {
  const flavorTextEntries = speciesData.flavor_text_entries.filter(
    (entry) => entry.language.name === "en"
  );
  return flavorTextEntries[0].flavor_text;
}

async function loadAbility(pokemonIndex) {
  event.preventDefault();
  const pokemon = currentPokemon[pokemonIndex];
  const abilityContent = document.getElementById("infoContent");
  const pokemonData = await fetchPokemonData(pokemon.id);
  const abilityDetails = await Promise.all(
    pokemonData.abilities.map(async (abilitySlot) => {
      const abilityData = await fetchAbilityData(abilitySlot.ability.url);
      const effect = getAbilityEffectInEnglish(abilityData);
      return {
        name: abilityData.name,
        effect: effect,
      };
    })
  );
  let abilitiesHTML = generateAbilityDetailsHTML(abilityDetails);
  abilityContent.innerHTML = abilitiesHTML;
}

function generateAbilityDetailsHTML(abilityDetails){
  return abilityDetails
  .map(
    (ability) => `
    <div class="ability-container">
      <span class="ability-Name">Ability: ${ability.name}</span>
      <p class="ability-effect">${ability.effect}</p>
    </div>
  `
  )
  .join("")
}

async function fetchPokemonData(pokemonId) {
  const url = `https://pokeapi.co/api/v2/pokemon/${pokemonId}`;
  const response = await fetch(url);
  return await response.json();
}

async function fetchAbilityData(abilityUrl) {
  const response = await fetch(abilityUrl);
  return await response.json();
}

function getAbilityEffectInEnglish(abilityData) {
  const effectEntry = abilityData.effect_entries.find(
    (entry) => entry.language.name === "en"
  );
  return effectEntry ? effectEntry.effect : "Effect not available.";
}

function navigatePokemon(currentIndex, direction) {
  let newIndex;
  if (direction === "prev") {
    newIndex =
      (currentIndex - 1 + currentPokemon.length) % currentPokemon.length;
  } else if (direction === "next") {
    newIndex = (currentIndex + 1) % currentPokemon.length;
  }
  openInfoWindow(newIndex);
}

function closeModal() {
  let modal = document.getElementById("modal");
  modal.style.display = "none";
  document.body.classList.remove("modal-open");
}

function searchPokemon() {
  const searchInput = document
    .getElementById("searchInput")
    .value.toLowerCase();
  const matchingPokemon = currentPokemon.filter((pokemon) =>
    pokemon.name.toLowerCase().includes(searchInput)
  );
  const content = document.getElementById("pokedex");
  content.innerHTML = returnPokemonHTML(matchingPokemon);
}

function returnPokemonHTML(pokemonList) {
  return pokemonList
    .map(
      (pokemon) => `
    <div class="pokemon ${pokemon.types[0]}-type" onclick="openInfoWindow(${
        pokemon.id - 1
      }, '${pokemon.types[0]}')">
      <div class="poke-name">
        <h2>${pokemon.name}</h2>
      </div>
      <div class="poke-id">
        #${pokemon.id}
      </div>
      <div class="poke-img">
        <img src="${pokemon.imageUrl}" alt="${pokemon.name}">
      </div>
      <div class="poke-types">
        Type: ${pokemon.types.join(", ")}
      </div>
    </div>
  `
    )
    .join("");
}

async function loadEvolution(pokemonIndex) {
  event.preventDefault();
  let pokemon = currentPokemon[pokemonIndex];
  let evolutionContent = document.getElementById("infoContent");
  let url = `https://pokeapi.co/api/v2/pokemon-species/${pokemon.id}`;
  let response = await fetch(url);
  let speciesData = await response.json();
  let evolutionChainUrl = speciesData.evolution_chain.url;
  let evolutionChainResponse = await fetch(evolutionChainUrl);
  let evolutionChainData = await evolutionChainResponse.json();
  let evolutionHTML = generateEvolutionHTML(evolutionChainData.chain);
  evolutionContent.innerHTML = evolutionHTML;
}

function generateEvolutionHTML(evolutionChain) {
  let html = '<div class="evolution-chain">';
  let currentEvo = evolutionChain;
  while (currentEvo) {
    html += createEvolutionStageHTML(currentEvo);
    if (currentEvo.evolves_to.length > 0) {
      currentEvo = currentEvo.evolves_to[0];
    } else {
      currentEvo = null;
    }
  }
  html += "</div>";
  return html;
}

function createEvolutionStageHTML(evolutionStage) {
  const pokemon = evolutionStage.species.name;
  const imageSrc = `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${getPokemonIdFromUrl(evolutionStage.species.url)}.png`;
  return `
    <div class="evolution-stage">
      <img src="${imageSrc}" alt="${pokemon}">
      <p>${capitalizeFirstLetter(pokemon)}</p>
    </div>
  `;
}

function getPokemonIdFromUrl(url) {
  let parts = url.split("/");
  return parts[parts.length - 2];
}
