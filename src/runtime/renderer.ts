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

function patch(n1: VNode, n2: VNode, container: HostNode) {
    const { type: oldType } = n1
    const { type } = n2

    if (type !== oldType) {
        replaceVNode(n1, n2, container)
    } else if (type & VNodeTypes.ELEMENT) {
        patchElement(n1, n2, container)
    } else if (type & VNodeTypes.TEXT) {
        patchText(n1, n2, container)
    }
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
        const child = children[i] = normalizeVnode(children[i])
        mount(child, container)
    }
}

function patchElement(n1: VNode, n2: VNode, container: HostNode) {
    if (n2.tag !== n1.tag) {
        replaceVNode(n1, n2, container)
        return 
    }

    n2.el = n1.el
    patchProps(n1, n2)
    patchChildren(n1, n2)
}

function patchChildren(n1: VNode, n2: VNode) {
    const prevType = n1.type
    const prevChildren = n1.children
    const { type, el } = n2

    if (type & VNodeTypes.TEXT_CHILDREN) {

    } else if (type & VNodeTypes.ARRAY_CHILDREN) {

    } else {
        for (let i = 0; i < prevChildren.length; i++) {
            el.removeChild(prevChildren[i])
        }
    }
}

function patchProps(n1: VNode, n2: VNode) {
    const props1 = n1.props
    const props2 = n2.props
    const el = n2.el as HostNode
    for (const key in props2) {

        const value = props2[key]
        const oldValue = props1[key]

        switch (key) {
            case 'style':
                for (const k in value) {
                    el.style[k] = value[k]
                }

                if (oldValue) {
                    for (const k in oldValue) {
                        if (!value.hasOwnProperty(k)) {
                            el.style[k] = ''
                        }
                    }
                }
                
                break
            default:
                if (key.startsWith('on')) {
                    if (oldValue) {
                        el.removeEventListener(key.slice(2), value)
                    }

                    if (value) {
                        el.addEventListener(key.slice(2), value)
                    }
                } else {
                    el.setAttribute(key, value)
                }
        }
            
    }
}

function patchText(n1: VNode, n2: VNode, container: HostNode) {
    const el = n2.el = n1.el
    if (n2.children !== n1.children) {
        el.nodeValue = n2.children
    }
}

function replaceVNode(n1: VNode, n2: VNode, container: HostNode) {
    container.removeChild(n1.el)
    mount(n2, container)
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