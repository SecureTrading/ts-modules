import { brandMapping, cardTree } from './cardtype';
import { Brand, BrandDetailsType, CardTreeNode } from './types';
import Utils from './utils';

export interface IBinLookupConfigType {
  defaultCardType?: string;
  minMatch?: number;
  maxMatch?: number;
  supported?: string[];
}

class IinLookup {
  public static DEFAULT_MIN_MATCH = 0;
  public static DEFAULT_MAX_MATCH = 6;
  private minMatch: number;
  private maxMatch: number;
  private supported: string[];
  private default: BrandDetailsType;

  constructor(config?: IBinLookupConfigType) {
    config = config || {};
    this.minMatch = 'minMatch' in config ? config.minMatch : IinLookup.DEFAULT_MIN_MATCH;
    this.maxMatch = 'maxMatch' in config ? config.maxMatch : IinLookup.DEFAULT_MAX_MATCH;

    this.supported = this.getAllBrands();
    if ('supported' in config) {
      const { supported } = config;
      // tslint:disable-next-line:forin
      for (const i in supported) {
        const type = supported[i];
        if (!this.isSupported(type)) {
          throw Error(`unsupported cardTree ${type}`);
        }
      }
      this.supported = supported;
    }

    this.default = 'defaultCardType' in config ? this.getCard(config.defaultCardType) : null;
  }

  /**
   * Lookup the type of a card
   * @param number Card number to lookup
   * @return BrandDetails for the brand identified
   */
  public lookup(number: string): BrandDetailsType {
    let result: BrandDetailsType = { type: null };
    if (number.length >= this.minMatch) {
      const tmp = brandMapping[this._lookup(number, cardTree)];
      if (this.isSupported(tmp)) {
        result = tmp;
      }
    }
    if (!result.type && this.default && number.length <= this.maxMatch) {
      result = this.default;
    }
    return result;
  }

  /**
   * ForEachBreak helper function that only runs over supported brands
   * @param callback Callback to run over the supported brands
   * @return first truthy result of the callback or null
   */
  private forEachBreakBrands<returnType>(callback: (card: BrandDetailsType) => returnType): returnType {
    return Utils.forEachBreak(Object.values(brandMapping), (card: BrandDetailsType) => {
      if (this.isSupported(card)) {
        return callback(card);
      }
    });
  }

  /**
   * All text brand names the wywtem knows about
   * @return array of all text brand names
   */
  private getAllBrands(): string[] {
    return Object.values(brandMapping)
      .map(brand => brand.type)
      .sort();
  }

  /**
   * Test if a brand is supported with the current configuration
   * @param brand the brand to lookup
   * @return Whether this brand is supported
   */
  private isSupported(brand: string | BrandDetailsType): boolean {
    if (brand instanceof Object) {
      brand = brand.type;
    }
    return Utils.inArray(this.supported, brand);
  }

  /**
   * Look up a brand given it's text name (rather than the internal ID)
   * @param type The name of the brand to get the details for
   * @return The details about the named brand
   */
  private getCard(type: string): BrandDetailsType {
    return this.forEachBreakBrands(card => {
      if (card.type === type) {
        return card;
      }
    });
  }

  /**
   * Tree key searching function
   * @param number Card number to check against this key
   * @param key Search key to test against
   * @return whether the card number matches this key
   */
  private matchKey(number: string, key: string): boolean {
    const n1 = number.substring(0, key.length);
    let result = n1 === key;
    if (!result && Utils.inArray(key, '-')) {
      const keys = key.split('-');
      const n2 = parseInt(number.substring(0, keys[1].length), 10);
      if (parseInt(keys[0], 10) <= n2 && n2 <= parseInt(keys[1], 10)) {
        result = true;
      }
    }
    return result;
  }

  /**
   * Recursive lookup helper function
   * @param number Card number to lookup
   * @param tree Recursively searched tree branch
   * @return The succesfully found brand for this card number or null
   */
  private _lookup(number: string, tree: CardTreeNode): Brand {
    if (!(tree instanceof Object)) {
      return tree;
    }
    const found: string[] = Object.keys(tree)
      .filter(key => this.matchKey(number, key))
      .sort((a, b) => a.length - b.length);
    return (
      Utils.forEachBreak(
        found,
        (key: string): Brand => {
          return this._lookup(number, tree[key]);
        }
      ) ||
      tree.D ||
      null
    );
  }
}
const iinLookup = new IinLookup();
export { iinLookup, IinLookup };
