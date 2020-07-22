/**
 * Extends the ReadonlyMap interface by readonly iterator methods.
 */
export interface ExtReadonlyMap<K, V> extends ReadonlyMap<K, Readonly<V>> {
  entries(): IterableIterator<[K, Readonly<V>]>;
  keys(): IterableIterator<K>;
  values(): IterableIterator<Readonly<V>>;
}
