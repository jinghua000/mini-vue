type PropsSet = Set<Function>
type ObjectMap = Map<string, PropsSet>

const targetMap: WeakMap<object, ObjectMap> = new WeakMap()
const effectStack: Function[] = []

export function effect(fn: Function) {
    effectStack.push(fn)
    fn()
    effectStack.pop()
}

export function trigger(target: object, prop: string) {
    if (!targetMap.has(target)) {
        return 
    }

    const depsMap = targetMap.get(target)
    const deps = depsMap.get(prop)
    
    deps && deps.forEach(fn => fn())
}

export function track(target: object, prop: string) {
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
