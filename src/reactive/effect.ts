type PropsSet = Set<EffectFunction>
type ObjectMap = Map<PropertyKey, PropsSet>

interface EffectOptions {
    schedule?: Function
}
interface EffectFunction {
    (): any
    id: number
    raw: Function
    options: EffectOptions
}

const targetMap: WeakMap<object, ObjectMap> = new WeakMap()
const effectStack: EffectFunction[] = []

export function effect(fn: Function, options: EffectOptions = {}) {
    const effected = createEffect(fn, options)

    effectStack.push(effected)
    effected()
    effectStack.pop()

    return effected
}

export function trigger(target: object, prop: PropertyKey) {
    if (!targetMap.has(target)) {
        return 
    }

    const depsMap = targetMap.get(target)
    const deps = depsMap.get(prop)
    
    deps && deps.forEach(fn => {
        if (fn.options && fn.options.schedule) {
            fn.options.schedule(fn)
        } else {
            fn()
        }
    })
}

export function track(target: object, prop: PropertyKey) {
    if (!effectStack.length) {
        return 
    }

    let depsMap: ObjectMap
    if (targetMap.has(target)) {
        depsMap = targetMap.get(target)
    } else {
        targetMap.set(target, (depsMap = new Map()))
    }

    let deps: PropsSet
    if (depsMap.has(prop)) {
        deps = depsMap.get(prop)
    } else {
        depsMap.set(prop, (deps = new Set()))
    }

    deps.add(effectStack[effectStack.length - 1])
}

let uid = 0
function createEffect(fn, options): EffectFunction {
    const effect = function () {
        return fn()    
    }

    effect.id = uid++
    effect.options = options
    effect.raw = fn

    return effect
}