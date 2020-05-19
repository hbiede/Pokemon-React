/**
 * The utils for the Pokemon Battle React Native app
 *
 * @format
 * @flow strict-local
 */

/**
 * Converts the first letter of a string to a capital letter
 * @param input {string} The string to be converted
 * @returns {string} The input string with the first character made capital
 */
export function titleCase(input: String): String {
  return input[0].toUpperCase() + input.substring(1);
}

/**
 * Takes a Pokemon JSON object and search for a stat with the given name
 * @param userPokemon An object describing a Pokemon (will contain an array `stats` ideally containing the stat desired
 * @param statName {string} The name of the stat being sought after
 * @returns {number|*} The value associated with the statName given. Returns -1 if the stat does not exist, and -2 if the object given is invalid
 */
export function findStat(userPokemon, statName: String): Number {
  if (!userPokemon.stats) {
    return -2;
  }
  for (let i = 0; i < userPokemon.stats.length; i++) {
    if (statName === userPokemon.stats[i].stat.name) {
      return userPokemon.stats[i].base_stat;
    }
  }

  return -1;
}

/**
 * Calculates the damage associated with the move being performed
 * @param level {Number} The level of the Pokemon
 * @param move {MoveRecord} The details about the move performed
 * @param attack {Number} The attack value of the Pokemon
 * @param opponentDefense {Number} The defense value of the opponent Pokemon
 * @param speed {Number} The speed of the Pokemon
 * @param typesOfPokemon {Array.<Type>} The types of Pokemon performing the move
 * @returns {MovePerformance} The damage done, and booleans representing if the move was a critical hit or a miss (the booleans are exclusive)
 */
export function calculateDamage(
  level: Number,
  move: MoveRecord,
  attack: Number,
  opponentDefense: Number,
  speed: Number,
  typesOfPokemon: Array<Type>,
) {
  /**
   * Checks if the move performed gets a same-type attack bonus (STAB)
   * @param {String} moveType The type of the move performed
   * @param {Array.<Type>} pokemonTypes The types associated with the pokemon performing the move
   * @return {Boolean} True iff the move earns a STAB
   */
  function didStab(moveType: String, pokemonTypes: Array<Type>) {
    for (let i = 0; i < pokemonTypes.length; i++) {
      if (pokemonTypes[i].type.name === moveType) {
        return true;
      }
    }
    return false;
  }

  /**
   * Calculates if the hit was landed critically
   * @param pokemonSpeed The speed of the pokemon in question
   * @returns {boolean} True iff the critical hit was landed, else false
   */
  function didCriticallyHit(pokemonSpeed: Number): Boolean {
    let critRate = Math.min(Math.floor(pokemonSpeed / 2), 255);
    return Math.floor(Math.random() * 255) < critRate;
  }

  // The data about how the move performed
  let returnValue: MovePerformance = {
    damage: 0,
    missed: move.accuracy <= Math.floor(Math.random() * 100),
    criticalHit: didCriticallyHit(speed),
    stab: didStab(move.type, typesOfPokemon),
  };

  if (!returnValue.missed) {
    // Use the convoluted equation for attack damage Pokemon uses
    returnValue.damage =
      Math.floor(
        Math.floor(
          (Math.floor((2 * level) / 5 + 2) * attack * move.power) /
            opponentDefense,
        ) / 50,
      ) + 2;

    if (returnValue.criticalHit) {
      returnValue.damage *= 1.5;
    }
    if (returnValue.stab) {
      // Same-type attack bonus (STAB)
      returnValue.damage *= 1.5;
    }
  }
  return returnValue;
}

/**
 * Create a message describing the move performed
 * @param name {String} The name of the Pokemon
 * @param moveName {String} The name of the move performed
 * @param movePerformance {MovePerformance} The information pertaining to the move's performance (as defined by {@link calculateDamage})
 * @returns {undefined}
 */
export function formatAttackMessage(name, moveName, movePerformance) {
  let titledName = titleCase(name);
  if (movePerformance.missed) {
    return `${titledName} missed`;
  } else {
    return `${titledName} used ${moveName} and hit ${
      movePerformance.criticalHit ? 'critically ' : ''
    }for ${movePerformance.damage} damage${
      movePerformance.stab ? ' (STAB)' : ''
    }`;
  }
}
