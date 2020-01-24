import each from 'jest-each';
import Utils from '../src/utils';

localStorage.setItem = jest.fn();

// given
describe('Utils', () => {
  // given
  describe('inArray', () => {
    // then
    each([
      [[], '', false],
      [[''], '', true],
      [['1'], 1, false],
      [[1], '1', false],
      [[1, 2, 3, 4, 5, 6, 7, 8, 9, 0], 9, true],
      ['30-31', '-', true]
    ]).test('should return desired value', (array, item, expected) => {
      expect(Utils.inArray(array, item)).toBe(expected);
    });
  });

  // given
  describe('forEachBreak', () => {
    // then
    each([
      [[], null, 0],
      [[0, 0, 0, 0], null, 4], // if we don't get a truthy result we iterate the whole length
      [[0, 0, 4, 6], 4, 3], // short circuits after the first truthy result
      [[null, null, 4, 6], 4, 3], // this is more like what we do in _lookup
      [{ 0: 0, 1: 0, 2: 4, 3: 6 }, 4, 3] // behaves like return Object.values(iterable).some(callback)
    ]).test('should return desired value and call the callback', (iterable, expected, timesCalledBack) => {
      const callback = jest.fn(
        (item: any): any => {
          return item;
        }
      );
      expect(Utils.forEachBreak(iterable, callback)).toBe(expected);
      expect(callback).toHaveBeenCalledTimes(timesCalledBack);
    });
  });
});
