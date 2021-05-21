import { VNode, ShapeFlags } from './vnode'
import { isFunction, isObject, NOOP } from '../shared'
import { reactive } from '../reactive/reactive'
import { baseCompile as compile } from '../compiler/compile'

export interface ComponentInstance {
    uid: number,
    type: any,
    render: Function,
    subTree: VNode | null,
    update: Function | null,
    mounted: Function | null,
    isMounted: boolean,
    $data: object,
    $props: object,
    template: string | null
}

let uid = 0
export function createComponent(vnode: VNode): ComponentInstance {
    const component = vnode.type as any

    const instance: ComponentInstance = {
        uid: uid++,
        type: component,
        render: component.render ? component.render : NOOP,
        subTree: null,
        update: null,
        template: component.template || null,
        mounted: component.mounted || null,
        isMounted: false,
        $data: null,
        $props: vnode.props,
    }

    return instance
}

export function renderComponentRoot(instance: ComponentInstance): VNode {
    const root = instance.render(instance)
    if (!root) {
        throw new Error(`Component's render function has not return anything!`)
    }

    const { shapeFlag } = root
    if (shapeFlag & ShapeFlags.COMPONENT || shapeFlag & ShapeFlags.ELEMENT) {
        Object.assign(root.props, instance.$props || {})
    }

    return root
}

export function setupComponent(instance: ComponentInstance) {
    const {
        data,
        methods
    } = instance.type

    if (instance.template && instance.render === NOOP) {
        const result = compile(instance.template)
        console.log('ast:')
        console.log(result.ast)
        console.log('code:')
        console.log(result.code)
        instance.render = new Function(result.code)()
    }

    if (isFunction(data)) {
        instance.$data = reactive(data())
    }

    if (isObject(methods)) {
        for (let k in methods) {
            if (!instance.hasOwnProperty(k)) {
                instance[k] = methods[k].bind(instance)
            }
        }
    }
}