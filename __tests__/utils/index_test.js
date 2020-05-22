/**
 * Test file for the types system
 *
 * @format
 * @flow strict-local
 */
import {
  calculateDamage,
  capitalCase,
  findStat,
  formatAttackMessage,
} from '../../src/utils';
const testPokemon: Pokemon = {
  name: 'Tester',
  moves: [
    {
      name: 'Fire',
      type: 'fire',
      power: 5,
      accuracy: 5,
    },
  ],
  stats: [
    {
      base_stat: 12,
      stat: {
        name: 'hp',
      },
    },
    {
      base_stat: 10,
      stat: {
        name: 'attack',
      },
    },
    {
      base_stat: 1,
      stat: {
        name: 'defense',
      },
    },
    {
      base_stat: 512,
      stat: {
        name: 'speed',
      },
    },
  ],
  types: [
    {
      type: {
        name: 'fire',
      },
    },
    {
      type: {
        name: 'normal',
      },
    },
    {
      type: {
        name: 'ice',
      },
    },
  ],
};

const testGhostPokemon: Pokemon = {
  name: 'Tester',
  moves: [
    {
      name: 'Fire',
      type: 'fire',
      power: 5,
      accuracy: 5,
    },
  ],
  stats: [
    {
      base_stat: 10,
      stat: {
        name: 'hp',
      },
    },
    {
      base_stat: 10,
      stat: {
        name: 'attack',
      },
    },
    {
      base_stat: 1,
      stat: {
        name: 'defense',
      },
    },
    {
      base_stat: 0,
      stat: {
        name: 'speed',
      },
    },
  ],
  types: [
    {
      type: {
        name: 'ghost',
      },
    },
    {
      type: {
        name: 'fairy',
      },
    },
  ],
};

describe('Capital Casing', () => {
  it('Should capitalize the text', () => {
    expect(capitalCase('test')).toBe('Test');
    expect(capitalCase('tEST')).toBe('Test');
    expect(capitalCase('longer test')).toBe('Longer test');
    expect(capitalCase('longer Test')).toBe('Longer test');
    expect(capitalCase('Longer Test')).toBe('Longer test');
    expect(capitalCase('Longer test')).toBe('Longer test');
    expect(capitalCase('')).toBe('');
  });
});

describe('Stat Finding', () => {
  it('Should correctly identify hp, attack, defense, and speed', () => {
    expect(findStat({}, '')).toBe(-2);
    expect(findStat(testPokemon, '')).toBe(-1);
    expect(findStat(testPokemon, 'hp')).toBe(12);
    expect(findStat(testPokemon, 'attack')).toBe(10);
    expect(findStat(testPokemon, 'defense')).toBe(1);
    expect(findStat(testPokemon, 'speed')).toBe(512);
  });
});

describe('Damage Calculation', () => {
  describe('No Advantage', () => {
    it('Miss', () => {
      expect(
        calculateDamage({accuracy: 0}, testGhostPokemon, testGhostPokemon),
      ).toStrictEqual({
        damage: 0,
        missed: true,
        criticalHit: false,
        stab: false,
      });
    });
    it('STAB (Same-type attack bonus), but with no damage', () => {
      expect(
        calculateDamage(
          {accuracy: 1000, type: 'ghost', power: 0},
          testGhostPokemon,
          testPokemon,
        ),
      ).toStrictEqual({
        damage: 0,
        missed: false,
        criticalHit: false,
        stab: true,
      });
    });
    it('No damage and all special attack types fail', () => {
      expect(
        calculateDamage(
          {accuracy: 1000, type: 'normal', power: 0},
          testGhostPokemon,
          testGhostPokemon,
        ),
      ).toStrictEqual({
        damage: 0,
        missed: false,
        criticalHit: false,
        stab: false,
      });
    });
    it('No damage, but critical hit landed', () => {
      expect(
        calculateDamage(
          {accuracy: 1000, type: 'fighting', power: 10},
          testPokemon,
          testGhostPokemon,
        ),
      ).toStrictEqual({
        damage: 0,
        missed: false,
        criticalHit: true,
        stab: false,
      });
    });
    it('Normal attack', () => {
      expect(
        calculateDamage(
          {accuracy: 1000, type: 'electric', power: 10},
          testGhostPokemon,
          testPokemon,
        ),
      ).toStrictEqual({
        damage: 6,
        missed: false,
        criticalHit: false,
        stab: false,
      });
    });
    it('Critical hit attack', () => {
      expect(
        calculateDamage(
          {accuracy: 1000, type: 'water', power: 10},
          testPokemon,
          testGhostPokemon,
        ),
      ).toStrictEqual({
        damage: 9,
        missed: false,
        criticalHit: true,
        stab: false,
      });
    });
    it('STAB attack', () => {
      expect(
        calculateDamage(
          {accuracy: 1000, type: 'fairy', power: 10},
          testGhostPokemon,
          testGhostPokemon,
        ),
      ).toStrictEqual({
        damage: 9,
        missed: false,
        criticalHit: false,
        stab: true,
      });
    });
    it('Crit and STAB attack', () => {
      expect(
        calculateDamage(
          {accuracy: 1000, type: 'fire', power: 10},
          testPokemon,
          testGhostPokemon,
        ),
      ).toStrictEqual({
        damage: 13.5,
        missed: false,
        criticalHit: true,
        stab: true,
      });
    });
  });
  describe('Attacs with advantage', () => {
    it('Normal attack with advantage', () => {
      expect(
        calculateDamage(
          {accuracy: 1000, type: 'water', power: 10},
          testGhostPokemon,
          testPokemon,
        ),
      ).toStrictEqual({
        damage: 12,
        missed: false,
        criticalHit: false,
        stab: false,
      });
    });
    it('Crit attack with advantage', () => {
      expect(
        calculateDamage(
          {accuracy: 1000, type: 'ghost', power: 10},
          testPokemon,
          testGhostPokemon,
        ),
      ).toStrictEqual({
        damage: 18,
        missed: false,
        criticalHit: true,
        stab: false,
      });
    });
    it('STAB attack with advantage', () => {
      expect(
        calculateDamage(
          {accuracy: 1000, type: 'ghost', power: 10},
          testGhostPokemon,
          testGhostPokemon,
        ),
      ).toStrictEqual({
        damage: 18,
        missed: false,
        criticalHit: false,
        stab: true,
      });
    });
    it('STAB and crit attack with advantage', () => {
      expect(
        calculateDamage(
          {accuracy: 1000, type: 'fire', power: 10},
          testPokemon,
          {
            types: [{type: {name: 'ice'}}],
          },
        ),
      ).toStrictEqual({
        damage: 27,
        missed: false,
        criticalHit: true,
        stab: true,
      });
    });
  });
});

describe('Capitalize Strings', () => {
  describe('From calculateDamage()', () => {
    expect(
      formatAttackMessage(
        'Pikachu',
        'Lightning',
        calculateDamage(
          {accuracy: 1000, type: 'fire', power: 10},
          testPokemon,
          {
            types: [{type: {name: 'ice'}}],
          },
        ),
      ),
    ).toBe('Pikachu used Lightning and hit critically for 27 damage');
  });
  describe('Manual MovePerformance entries', () => {
    it('Miss', () => {
      expect(
        formatAttackMessage('Charmander', '', {
          damage: 0,
          missed: true,
          criticalHit: false,
          stab: false,
        }),
      ).toBe('Charmander missed');
      expect(
        formatAttackMessage('Squirtle', '', {
          damage: 0,
          missed: true,
          criticalHit: false,
          stab: false,
        }),
      ).toBe('Squirtle missed');
    });
    it('Normal attack', () => {
      expect(
        formatAttackMessage('squirtle', 'water gun', {
          damage: 10,
          missed: false,
          criticalHit: false,
          stab: false,
        }),
      ).toBe('Squirtle used water gun and hit for 10 damage');
      expect(
        formatAttackMessage('Mewtwo', 'Psycho cut', {
          damage: 17,
          missed: false,
          criticalHit: false,
          stab: true,
        }),
      ).toBe('Mewtwo used Psycho cut and hit for 17 damage');
    });
    it('Critcal hit attack', () => {
      expect(
        formatAttackMessage('eevee', 'bite', {
          damage: 5,
          missed: false,
          criticalHit: false,
          stab: false,
        }),
      ).toBe('Eevee used bite and hit for 5 damage');
      expect(
        formatAttackMessage('Vaporeon', 'Whirlpool', {
          damage: 16,
          missed: false,
          criticalHit: false,
          stab: true,
        }),
      ).toBe('Vaporeon used Whirlpool and hit for 16 damage');
    });
  });
});
