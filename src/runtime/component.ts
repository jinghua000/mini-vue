import { VNode, ShapeFlags } from './vnode'
import { NOOP } from '../shared'

export interface ComponentInstance {
    uid: number,
    vnode: VNode,
    type: object,
    render: Function,
    subTree: VNode | null,
    update: Function | null,
    mounted: Function | null,
    isMounted: boolean,
}

let uid = 0
export function createComponent(vnode: VNode): ComponentInstance {
    const component = vnode.type as any

    const instance: ComponentInstance = {
        uid: uid++,
        vnode,
        type: component,
        render: component.render ? component.render : NOOP,
        subTree: null,
        update: null,
        mounted: component.mounted || null,
        isMounted: false,
    }

    return instance
}

export function renderComponentRoot(instance: ComponentInstance): VNode {
    const root = instance.render()
    const { shapeFlag } = root
    if (shapeFlag & ShapeFlags.COMPONENT || shapeFlag & ShapeFlags.ELEMENT) {
        Object.assign(root.props, instance.vnode.props || {})
    }

    return root
}