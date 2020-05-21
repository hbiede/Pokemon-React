/**
 * The utils for the Pokemon Battle React Native app
 *
 * @format
 * @flow strict-local
 */

import {attackAdvantage} from './typeMapping';

/**
 * Converts the first letter of a string to a capital letter and the rest to lower case
 * @param input {string} The string to be converted
 * @returns {string} The input string with the first character made capital and the rest lowercase
 */
export function capitalCase(input: String): String {
  if (input.length === 0) {
    return '';
  }

  return input[0].toUpperCase() + input.substring(1).toLowerCase();
}

/**
 * Takes a Pokemon JSON object and search for a stat with the given name
 * @param userPokemon {Pokemon} An object describing a Pokemon (will contain an array `stats` ideally containing the stat desired
 * @param statName {String} The name of the stat being sought after
 * @returns {Number} The value associated with the statName given. Returns -1 if the stat does not exist, and -2 if the object given is invalid
 */
export function findStat(userPokemon: Pokemon, statName: String): Number {
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
 * @param move {MoveRecord} The details about the move performed
 * @param user {Pokemon} The Pokemon performing the move
 * @param opponent {Pokemon} The target of the move
 * @returns {MovePerformance} The damage done, and booleans representing if the move was a critical hit or a miss
 */
export function calculateDamage(
  move: MoveRecord,
  user: Pokemon,
  opponent: Pokemon,
) {
  /**
   * Checks if the move performed gets a same-type attack bonus (STAB)
   * @param moveType {String} The type of the move performed
   * @param pokemonTypes {Array.<Type>} The types associated with the pokemon performing the move
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
   * @param pokemonSpeed {Number} The speed of the pokemon in question
   * @returns {boolean} True iff the critical hit was landed, else false
   */
  function didCriticallyHit(pokemonSpeed: Number): Boolean {
    let critRate = Math.min(Math.floor(pokemonSpeed / 2), 255);
    return Math.floor(Math.random() * 255) < critRate;
  }

  const missed = move.accuracy <= Math.floor(Math.random() * 100);
  // The data about how the move performed
  let returnValue: MovePerformance = {
    damage: 0,
    missed: missed,
    criticalHit: didCriticallyHit(findStat(user, 'speed')),
    stab: !missed && didStab(move.type, user.types),
  };

  if (!returnValue.missed) {
    let adjustedDefense = findStat(opponent, 'defense');
    if (adjustedDefense <= 1) {
      adjustedDefense = 1;
    }

    // Use the convoluted equation for attack damage Pokemon uses
    returnValue.damage =
      (Math.floor(
        Math.floor(
          (Math.floor((2 * user.level ? user.level : 1) / 5 + 2) *
            findStat(user, 'attack') *
            move.power) /
            adjustedDefense,
        ) / 50,
      ) +
        2) *
      attackAdvantage(move, opponent.types);

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
 * @returns {String}
 */
export function formatAttackMessage(name, moveName, movePerformance): String {
  let titledName = capitalCase(name);
  if (movePerformance.missed) {
    return `${titledName} missed`;
  } else {
    return `${titledName} used ${moveName} and hit ${
      movePerformance.criticalHit ? 'critically ' : ''
    }for ${movePerformance.damage} damage`;
  }
}

export {attackAdvantage} from './typeMapping';
