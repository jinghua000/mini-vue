import { isArray, isObject, isString } from '../shared'

export enum VNodeTypes {
    ELEMENT = 1,
    COMPONENT = 1 << 1,
    TEXT = 1 << 2,
    TEXT_CHILDREN = 1 << 3,
    ARRAY_CHILDREN = 1 << 4,
}

export interface VNode {
    _isVNode: true,
    tag: any,
    type: VNodeTypes,
    el: HTMLElement | Text | null
    props: object
    children: any
}

export function h(name: any, props: object = null, children: any = null): VNode {
    const type = isString(name)
        ? VNodeTypes.ELEMENT
        : isObject(name)
            ? VNodeTypes.COMPONENT
            : null

    if (type == null) {
        throw new TypeError('wrong vnode type')
    }

    const vnode: VNode = {
        _isVNode: true,
        el: null,
        tag: name,
        type,
        props,
        children: null,
    }

    normalizeChildren(vnode, children)

    return vnode
}

export function normalizeVnode(vnode: any) {
    if (isObject(vnode)) {
        return vnode
    } else {
        return createTextVNode(vnode)
    }
}

function normalizeChildren(vnode: VNode, children: any) {
    let type = 0
    if (children == null) {
        children = null 
    } else if (isArray(children)) {
        type = VNodeTypes.ARRAY_CHILDREN
    } else if (isObject(children)) {
        children = [children]
        type = VNodeTypes.ARRAY_CHILDREN
    } else {
        children = String(children)
        type = VNodeTypes.TEXT_CHILDREN
    } 

    vnode.children = children
    vnode.type |= type
}

function createTextVNode(text: any): VNode {
    return {
        _isVNode: true,
        el: null,
        tag: null,
        type: VNodeTypes.TEXT,
        props: null,
        children: String(text)
    }
}