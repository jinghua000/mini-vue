import { VNode, VNodeTypes, normalizeVnode } from './vnode'
import { assign } from '../shared'

interface CustomElementProps {
    vnode?: VNode
}

type HostNode = HTMLElement & CustomElementProps

export function render(vnode: VNode | null, container: HostNode) {
    const oldVNode = container.vnode

    if (!oldVNode) {
        mount(vnode, container)
    } else {
        if (vnode) {
            patch(oldVNode, vnode, container)
        } else {
            container.removeChild(oldVNode.el)
        }
    }

    container.vnode = vnode
}

function mount(vnode: VNode, container: HostNode) {
    const { type } = vnode
    
    if (type & VNodeTypes.ELEMENT) {
        mountElement(vnode, container)
    } else if (type & VNodeTypes.TEXT) {
        mountText(vnode, container)
    }
}

function patch(oldVNode: VNode, vnode: VNode, container: HostNode) {

}

function mountElement(vnode: VNode, container: HostNode) {
    const el = document.createElement(vnode.tag)
    vnode.el = el

    const { type, children, props } = vnode

    if (type & VNodeTypes.ARRAY_CHILDREN) {
        mountChildren(children, el)
    } else if (type & VNodeTypes.TEXT_CHILDREN) {
        insertText(children, el)
    }

    if (props) {
        for (const key in props) {
            setProps(el, key, props[key])
        }
    }
    
    container.appendChild(el)
}

function mountText(vnode: VNode, container: HostNode) {
    const el = document.createTextNode(vnode.children)
    vnode.el = el
    container.appendChild(el)
}

function mountChildren(children: any[], container: HostNode) {
    for (let i = 0; i < children.length; i++) {
        const child = normalizeVnode(children[i])
        mount(child, container)
    }
}

function insertText(text: string, container: HostNode) {
    container.textContent = text
}

function setProps(node: HostNode, key: string, value: any) {
    switch(key) {
        case 'style':
            assign(node.style, value)
            break
        default:
            if (key.startsWith('on')) {
                node.addEventListener(key.slice(2), value)
            } else {
                node.setAttribute(key, value)
            }
    }
}