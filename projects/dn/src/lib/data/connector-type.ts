const connectorType = Symbol();

/**
 * Base class of all types that connectors can belong to.
 *
 * Connections can only be made between sink and source connectors that have the same type.
 */
export class ConnectorType<T> {
  /**
   * Only required for proper type checking and thus never assigned.
   */
  [connectorType]: T;
}

/**
 * Extracts the type of the values transmitted by connectors belonging to the given ConnectorType.
 */
export type ConnectorTypeValue<T> = T extends ConnectorType<infer V> ? V : never;
