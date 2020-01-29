import each from 'jest-each';
import { cardTree, brandMapping } from '../lib/cardtype';
import { iinLookup, IinLookup } from '../lib/iinlookup';
import { BrandDetailsType } from '../lib/types';

const nullType: BrandDetailsType = { type: null };

each([
  [
    {},
    {
      default: null,
      minMatch: 0,
      maxMatch: 6,
      supported: ['AMEX', 'ASTROPAYCARD', 'DINERS', 'DISCOVER', 'JCB', 'MAESTRO', 'MASTERCARD', 'PIBA', 'VISA']
    }
  ],
  [{ supported: ['DELTA'] }, 'unsupported cardTree DELTA'],
  [
    { minMatch: 3, maxMatch: 20, supported: ['VISA'] },
    { default: null, minMatch: 3, maxMatch: 20, supported: ['VISA'] }
  ],
  [
    { defaultCardType: 'AMEX', supported: ['AMEX', 'MASTERCARD'] },
    { default: brandMapping['4'], supported: ['AMEX', 'MASTERCARD'] }
  ],
  [{ defaultCardType: 'AMEX', supported: ['VISA', 'MASTERCARD'] }, { default: null, supported: ['VISA', 'MASTERCARD'] }]
]).test(
  'IinLookup.constructor', // Check different options get set on config correctly
  (testConfig, expected) => {
    if (expected instanceof Object) {
      const lookup = new IinLookup(testConfig);
      expect(lookup).toMatchObject(expected); // WARNING: toMatchObject only tests the keys in the expected are a subset of the actual - to test against {} we MUST use toEqual
    } else {
      expect(() => {
        new IinLookup(testConfig);
      }).toThrow(expected);
    }
  }
);

test('IinLookup.getAllBrands', () => {
  const lookup = new IinLookup();
  // @ts-ignore
  expect(lookup.getAllBrands()).toEqual([
    'AMEX',
    'ASTROPAYCARD',
    'DINERS',
    'DISCOVER',
    'JCB',
    'MAESTRO',
    'MASTERCARD',
    'PIBA',
    'VISA'
  ]);
});

each([
  ['VISA', true],
  ['DELTA', false], // Because we treat DELTA as VISA brand
  ['VISADEBIT', false], // Not supported (it"s known as delta)
  ['\u2219', false], // utf-8
  ['MASTERCARD', true],
  [{ type: 'MASTERCARD' }, true], // we can pass the whole cardTree object too
  ['', false],
  [undefined, false],
  [null, false],
  [{}, false]
]).test('IinLookup.isSupported', (cardTree, expected) => {
  const lookup = new IinLookup();
  // @ts-ignore
  expect(lookup.isSupported(cardTree)).toBe(expected);
});

each([
  ['VISA', { type: 'VISA', length: [13, 16, 19] }],
  ['MASTERCARD', { type: 'MASTERCARD', length: [16] }],
  ['AMEX', { type: 'AMEX', length: [15] }]
]).test('IinLookup.getCard', (type, expected) => {
  const lookup = new IinLookup();
  // @ts-ignore
  expect(lookup.getCard(type)).toMatchObject(expected); // WARNING: toMatchObject only tests the keys in the expected are a subset of the actual - to test against {} we MUST use toEqual
  // @ts-ignore
  expect(Object.keys(lookup.getCard(type)).sort()).toEqual(['cvcLength', 'format', 'length', 'luhn', 'type']);
});

each([
  ['1801', '180', true],
  ['1901', '180', false],
  ['18', '180', false],
  ['3088', '3088-3094', true],
  ['3090', '3088-3094', true],
  ['3096', '3088-3094', false]
]).test('IinLookup.matchKey', (number, key, expected) => {
  const lookup = new IinLookup();
  // @ts-ignore
  expect(iinLookup.matchKey(number, key)).toBe(expected);
});

each([
  [{}, '', '2', brandMapping['2']],
  [{}, '', null, nullType],
  [{ supported: ['AMEX'] }, '', '2', nullType],
  [{ defaultCardType: 'MASTERCARD' }, '', null, brandMapping['2']],
  [{ defaultCardType: 'AMEX', minMatch: 3 }, '34', '1', brandMapping['4']],
  [{ defaultCardType: 'AMEX', supported: ['AMEX'] }, '', '1', brandMapping['4']],
  [{ defaultCardType: 'MASTERCARD', maxMatch: 3 }, '3456', null, nullType]
]).test('IinLookup._lookup_withDefaults', (config, number, lookupResult, expected) => {
  const lookup = new IinLookup(config);
  // @ts-ignore
  lookup._lookup = jest.fn();
  // @ts-ignore
  (<jest.Mock>lookup._lookup).mockReturnValue(lookupResult);
  expect(lookup.lookup(number)).toEqual(expected);
});

test('IinLookup._lookup_allMappings', () => {
  const lookup = new IinLookup();
  const mappings = Object.assign({ 198: nullType, null: nullType }, brandMapping);
  for (let result in mappings) {
    // @ts-ignore
    lookup._lookup = jest.fn();
    // @ts-ignore
    (<jest.Mock>lookup._lookup).mockReturnValue(result);
    expect(lookup.lookup('01234')).toEqual(mappings[result]);
    // @ts-ignore
    expect(lookup._lookup).toHaveBeenCalledTimes(1);
    // @ts-ignore
    expect(lookup._lookup).toHaveBeenCalledWith('01234', cardTree);
  }
});

each([
  ['notfound', {}, null, 1],
  ['notfound', { D: 7 }, 7, 1],
  ['180', { '1': { '18': { '1801': 1 } } }, null, 3],
  ['1801', { '1': { '18': { '1801': 1 } } }, 1, 4],
  ['1802', { '1': { '18': { '1801': 1 } } }, null, 3],
  ['3095', { D: 9, '308-309': { '3088-3094': 2 } }, 9, 2],
  ['3088', { '308-309': { '3088-3094': 2 } }, 2, 3],
  ['52', { D: 3, '51-55': 2, '52': 1 }, 1, 2],
  ['523', { '51-55': { D: 2 }, '52': { '522': 1 } }, 2, 3],
  [
    '60110',
    {
      '5-6': { '56-69': 7 },
      '6': {
        '64-65': { '644-659': 8 },
        '60': {
          '6011': {
            '60110': 8,
            '60112-60114': 8,
            '60118-60119': { '601186-601199': 8 },
            '60117': { '601177-601179': 8, '601174': 8 }
          },
          '6012': { '601281': 6 }
        },
        '62': {
          '622': { '622126-622925': 8 },
          '628': { '6282-6288': 8 },
          '624-626': 8
        },
        '63': {
          '630': {
            '63048': { '630487': 9, '630485': 9 },
            '63049': { '630493-630494': 9, '630498': 9 }
          }
        },
        '64': { '644-649': 8 },
        '65': 8,
        '67': { '675': { '6759': { D: 7 } } }
      }
    },
    8,
    5
  ]
]).test('IinLookup._lookup', (number, tree, expected, depth) => {
  const lookup = new IinLookup();
  // @ts-ignore
  lookup._lookup = jest.fn(lookup._lookup); // mock the function as itself (so that we can spy how deep it has recursed)
  // @ts-ignore
  expect(lookup._lookup(number, tree)).toBe(expected);
  // @ts-ignore
  expect(lookup._lookup).toHaveBeenCalledTimes(depth);
});
