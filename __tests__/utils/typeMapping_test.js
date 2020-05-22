/**
 * Test file for the types system
 *
 * @format
 * @flow strict-local
 */
import {attackAdvantage} from '../../src/utils';

describe('Types', () => {
  describe('stacked positive advantages', () => {
    it('should be 4', () => {
      expect(
        attackAdvantage({type: 'water'}, [
          {type: {name: 'fire'}},
          {type: {name: 'ground'}},
        ]),
      ).toBe(4);
      expect(
        attackAdvantage({type: 'fire'}, [
          {type: {name: 'grass'}},
          {type: {name: 'ice'}},
        ]),
      ).toBe(4);
    });
  });
  describe('single positive advantage', () => {
    it('should be 2', () => {
      expect(
        attackAdvantage({type: 'water'}, [
          {type: {name: 'fire'}},
          {type: {name: 'electric'}},
        ]),
      ).toBe(2);
      expect(
        attackAdvantage({type: 'fire'}, [
          {type: {name: 'grass'}},
          {type: {name: 'normal'}},
        ]),
      ).toBe(2);
    });
  });
  describe('no effects', () => {
    it('should be 1', () => {
      expect(
        attackAdvantage({type: 'normal'}, [
          {type: {name: 'fire'}},
          {type: {name: 'ground'}},
        ]),
      ).toBe(1);
      expect(
        attackAdvantage({type: 'normal'}, [
          {type: {name: 'unknown_type'}},
          {type: {name: 'ground'}},
        ]),
      ).toBe(1);
      expect(
        attackAdvantage({type: 'normal'}, [
          {type: {name: 'fire'}},
          {type: {name: 'unknown_type'}},
        ]),
      ).toBe(1);
    });
  });
  describe('cancelling effects', () => {
    it('should be 0', () => {
      expect(
        attackAdvantage({type: 'normal'}, [
          {type: {name: 'ghost'}},
          {type: {name: 'ground'}},
        ]),
      ).toBe(0);
    });
  });
  describe('disadvantage', () => {
    it('should be 0.5', () => {
      expect(
        attackAdvantage({type: 'water'}, [
          {type: {name: 'water'}},
          {type: {name: 'normal'}},
        ]),
      ).toBe(0.5);
    });
  });
  describe('stacked disadvantages', () => {
    it('should be 0.25', () => {
      expect(
        attackAdvantage({type: 'water'}, [
          {type: {name: 'water'}},
          {type: {name: 'grass'}},
        ]),
      ).toBe(0.25);
    });
  });
});
