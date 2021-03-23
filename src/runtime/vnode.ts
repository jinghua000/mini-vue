import { isArray, isObject, isString } from '../shared'

export enum ShapeFlags {
    ELEMENT = 1,
    COMPONENT = 1 << 1,
    TEXT_CHILDREN = 1 << 2,
    ARRAY_CHILDREN = 1 << 3,
}

interface CustomElementProps {
    vnode?: VNode
}
export interface VNode {
    _isVNode: true,
    type: object | string | typeof TEXT,
    shapeFlag: ShapeFlags,
    el: (HTMLElement | Text | null) & CustomElementProps
    key: keyof any | null
    props: object
    children: any
}

export const TEXT = Symbol('text')

export function h(
    type: VNode['type'], 
    props: VNode['props'] = null, 
    children: VNode['children'] = null
): VNode {
    const shapeFlag = isString(type)
        ? ShapeFlags.ELEMENT
        : isObject(type)
            ? ShapeFlags.COMPONENT
            : 0

    const vnode: VNode = {
        _isVNode: true,
        el: null,
        type,
        shapeFlag,
        props,
        children: null,
        key: props && normalizeKey(props),
    }

    normalizeChildren(vnode, children)

    return vnode
}

function normalizeKey({ key }: any): VNode['key'] {
    return key == null ? null : key 
}

export function normalizeVnode(vnode: any) {
    if (isObject(vnode)) {
        return vnode
    } else {
        return createTextVNode(vnode)
    }
}

function normalizeChildren(vnode: VNode, children: any) {
    let shapeFlag = 0
    if (children == null) {
        children = null 
    } else if (isArray(children)) {
        shapeFlag = ShapeFlags.ARRAY_CHILDREN
    } else if (isObject(children)) {
        children = [children]
        shapeFlag = ShapeFlags.ARRAY_CHILDREN
    } else {
        children = String(children)
        shapeFlag = ShapeFlags.TEXT_CHILDREN
    } 

    vnode.children = children
    vnode.shapeFlag |= shapeFlag
}

function createTextVNode(text: any): VNode {
    return h(TEXT, null, text)
}

export function isSameVNode(n1: VNode, n2: VNode) {
    return n1.type === n2.type && n1.key === n2.key
}