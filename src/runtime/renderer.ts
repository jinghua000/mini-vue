import { VNode, ShapeFlags, normalizeVnode, TEXT } from './vnode'

interface CustomElementProps {
    vnode?: VNode
}

type HostNode = VNode['el'] & CustomElementProps

export function render(vnode: VNode | null, container: HostNode) {
    const oldVNode = container.vnode

    if (!oldVNode) {
        mount(vnode, container)
    } else {
        if (vnode) {
            patch(oldVNode, vnode, container)
        } else {
            unmount(oldVNode, container)
        }
    }

    container.vnode = vnode
}

function mount(vnode: VNode, container: HostNode) {
    const { type, shapeFlag } = vnode

    switch (type) {
        case TEXT:
            mountText(vnode, container)
            break
        default:
            if (shapeFlag & ShapeFlags.ELEMENT) {
                mountElement(vnode, container)
            }
    }
}

function mountChildren(children: any[], container: HostNode, start = 0) {
    for (let i = start; i < children.length; i++) {
        const child = children[i] = normalizeVnode(children[i])
        mount(child, container)
    }
}

function unmount(vnode: VNode, container: HostNode) {
    container.removeChild(vnode.el)
}

function unmountChildren(children: VNode[], container: HostNode, start = 0) {
    for (let i = start; i < children.length; i++) {
        unmount(children[i], container)
    }
}

function mountElement(vnode: VNode, container: HostNode) {
    const el = document.createElement(vnode.type as string)
    vnode.el = el

    const { shapeFlag, children, props } = vnode

    if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        mountChildren(children, el)
    } else if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
        setElementText(children, el)
    }

    if (props) {
        patchProps(null, props, el)
    }
    
    container.appendChild(el)
}

function mountText(vnode: VNode, container: HostNode) {
    const el = document.createTextNode(vnode.children)
    vnode.el = el

    container.appendChild(el)
}

function patch(n1: VNode, n2: VNode, container: HostNode) {
    const type1 = n1.type
    const type2 = n2.type
    const shapeFlag = n2.shapeFlag

    if (type1 !== type2) {
        replaceVNode(n1, n2, container)
        return 
    }

    switch (type2) {
        case TEXT:
            patchText(n1, n2)
            break
        default:
            if (shapeFlag & ShapeFlags.ELEMENT) {
                patchElement(n1, n2, container)
            }
    }
}

function patchElement(n1: VNode, n2: VNode, container: HostNode) {
    if (n1.type !== n2.type) {
        replaceVNode(n1, n2, container)
        return 
    }

    const el = n2.el = n1.el as HTMLElement

    patchProps(n1.props, n2.props, el)
    patchChildren(el, n1, n2)
}

function patchChildren(
    el: HostNode, 
    node1: VNode,
    node2: VNode,
) {
    const shapeFlag1 = node1.shapeFlag
    const shapeFlag2 = node2.shapeFlag
    const c1 = node1.children
    const c2 = node2.children

    // vnode could have text children, array children or no children
    if (shapeFlag2 & ShapeFlags.TEXT_CHILDREN) {
        if (shapeFlag1 & ShapeFlags.TEXT_CHILDREN) {
            if (c1 !== c2) {
                setElementText(c2, el)
            }
        } else if (shapeFlag1 & ShapeFlags.ARRAY_CHILDREN) {
            unmountChildren(c1, el)
            setElementText(c2, el)
        } else {
            setElementText(c2, el)
        }
    } else if (shapeFlag2 & ShapeFlags.ARRAY_CHILDREN) {
        if (shapeFlag1 & ShapeFlags.TEXT_CHILDREN) {
            setElementText('', el)
            mountChildren(c2, el)
        } else if (shapeFlag1 & ShapeFlags.ARRAY_CHILDREN) {
            // method1 - force replace
            // unmountChildren(c1, el)
            // mountChildren(c2, el)

            // method2 - unkeyed diff
            patchUnkeyedChildren(c1, c2, el)
        } else {
            mountChildren(c2, el)
        }
    } else {
        if (shapeFlag1 & ShapeFlags.TEXT_CHILDREN) {
            setElementText('', el)
        } else if (shapeFlag1 & ShapeFlags.ARRAY_CHILDREN) {
            unmountChildren(c1, el)
        }
        // or prev vnode and new vnode both have no children
    }
}

function patchUnkeyedChildren(c1: any, c2: any, el: HostNode) {
    c1 = c1 || []
    c2 = c2 || []

    const length1 = c1.length
    const length2 = c2.length
    const commonLength = Math.min(length1, length2)

    for (let i = 0; i < commonLength; i++) {
        const child = c2[i] = normalizeVnode(c2[i])
        patch(c1[i], child, el)
    }

    if (length1 > commonLength) {
        unmountChildren(c1, el, commonLength)
    } else {
        mountChildren(c2, el, commonLength)
    }
}

function patchProps(props1: object, props2: object, el: HTMLElement) {
    props1 ||= {}
    props2 ||= {}

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

    // TODO delete props
}

function patchText(n1: VNode, n2: VNode) {
    const el = n2.el = n1.el
    const c2 = n2.children
    if (c2 !== n1.children) {
        el.nodeValue = c2
    }
}

function replaceVNode(n1: VNode, n2: VNode, container: HostNode) {
    unmount(n1, container)
    mount(n2, container)
}

function setElementText(text: string, container: HostNode) {
    container.textContent = text
}