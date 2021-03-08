import { isObject } from '../shared'
import { trigger, track } from './effect'

function set(target: object, key: string, value: any, receiver: any) {
    const result = Reflect.set(target, key, value, receiver)
    trigger(target, key)
    return result
}

function get(target: object, key: string, receiver: any) {
    const result = Reflect.get(target, key, receiver)
    track(target, key)
    return result
}

const handlers = {
    set,
    get,
}

export function reactive<T extends object>(target: T): T {
    if (!isObject(target)) return

    return new Proxy<T>(target, handlers)
}