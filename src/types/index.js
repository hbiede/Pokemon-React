/**
 * The definitions of object types used in the project
 *
 * @format
 * @flow strict-local
 */

/**
 * @typedef {Object} MoveRecord
 * @property {String} name
 * @property {String} type
 * @property {Number} power
 * @property {Number} accuracy
 */

/**
 * @typedef {Object} MovePerformance
 * @property {Number} damage
 * @property {Boolean} criticalHit
 * @property {Boolean} missed
 * @property {Boolean} stab
 */

/**
 * @typedef {Object} PokemonAttackMove
 * @property {String} name
 * @property {String} url
 */

/**
 * @typedef {Object} Namable
 * @property {String} name
 */

/**
 * @typedef {Object} StatCollection
 * @property {Number} base_stat
 * @property {Namable} stat
 */

/**
 * @typedef {Object} PokemonCharacterSprite
 * @property {String} front_default
 * @property {String} back_default
 */

/**
 * @typedef {Object} Type
 * @property {Number} slot
 * @property {Object} type
 * @property {String} type.name
 * @property {String} type.url
 */

/**
 * @typedef {Object} Pokemon
 * @property {String} name
 * @property {Array.<PokemonAttackMove>} moves
 * @property {Array.<StatCollection>} stats
 * @property {PokemonCharacterSprite} sprites
 * @property {Array.<Type>} types
 * @property {Number} level - Only used internally if set (setting currently unimplemented)
 */
