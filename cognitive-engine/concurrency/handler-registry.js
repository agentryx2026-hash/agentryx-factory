/**
 * Handler registry — kind → handler function mapping.
 * Real handlers register at startup; tests register stubs.
 *
 * Same dependency-injection pattern used by Phase 9-A (fixRouter) and Phase 13-A (nodeStubs).
 */

export function createHandlerRegistry() {
  const handlers = new Map();
  return {
    register(kind, handler) {
      if (!kind) throw new Error("register: kind required");
      if (typeof handler !== "function") throw new Error("register: handler must be a function");
      handlers.set(kind, handler);
    },
    get(kind) {
      return handlers.get(kind) || null;
    },
    has(kind) {
      return handlers.has(kind);
    },
    list() {
      return [...handlers.keys()];
    },
    clear() {
      handlers.clear();
    },
  };
}
