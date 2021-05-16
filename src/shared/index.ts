export const isObject = (target: any): boolean => target !== null && typeof target === 'object'
export const isString = (target: any): boolean => typeof target === 'string'
export const isFunction = (target: any): boolean => typeof target === 'function'
export const isArray = Array.isArray
export const NOOP = () => {}