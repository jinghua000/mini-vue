import { VNode, ShapeFlags, normalizeVnode, TEXT, isSameVNode } from './vnode'
type HostNode = VNode['el']

export function render(vnode: VNode | null, container: HostNode) {
    const oldVNode = container.vnode

    if (!oldVNode) {
        mount(vnode, container, null)
    } else {
        if (vnode) {
            patch(oldVNode, vnode, container)
        } else {
            unmount(oldVNode, container)
        }
    }

    container.vnode = vnode
}

function mount(vnode: VNode, container: HostNode, ref: HostNode) {
    const { type, shapeFlag } = vnode
    ref = ref != null ? ref : null

    switch (type) {
        case TEXT:
            mountText(vnode, container, ref)
            break
        default:
            if (shapeFlag & ShapeFlags.ELEMENT) {
                mountElement(vnode, container, ref)
            }
    }
}

function move(vnode: VNode, container: HostNode, ref: HostNode) {
    const { type, shapeFlag } = vnode
    ref = ref != null ? ref : null

    switch (type) {
        case TEXT:
            container.insertBefore(vnode.el, ref)
            break
        default:
            if (shapeFlag & ShapeFlags.ELEMENT) {
                container.insertBefore(vnode.el, ref)
            }
    }
}

function mountChildren(children: any[], container: HostNode, start = 0) {
    for (let i = start; i < children.length; i++) {
        const child = children[i] = normalizeVnode(children[i])
        mount(child, container, null)
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

function mountElement(vnode: VNode, container: HostNode, ref: HostNode) {
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
    
    container.insertBefore(el, ref)
}

function mountText(vnode: VNode, container: HostNode, ref: HostNode) {
    const el = document.createTextNode(vnode.children)
    vnode.el = el

    container.insertBefore(el, ref)
}

function patch(n1: VNode, n2: VNode, container: HostNode) {
    const type2 = n2.type
    const shapeFlag = n2.shapeFlag

    if (!isSameVNode(n1, n2)) {
        replaceVNode(n1, n2, container)
        return 
    }

    switch (type2) {
        case TEXT:
            patchText(n1, n2)
            break
        default:
            if (shapeFlag & ShapeFlags.ELEMENT) {
                patchElement(n1, n2)
            }
    }
}

function patchElement(n1: VNode, n2: VNode) {
    const el = n2.el = n1.el as HTMLElement

    patchProps(n1.props, n2.props, el)
    patchChildren(n1, n2, el)
}

function patchChildren(
    node1: VNode,
    node2: VNode,
    el: HostNode, 
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
            // patchUnkeyedChildren(c1, c2, el)

            // method3 - keyed diff
            patchKeyedChildren(c1, c2, el)
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

function patchKeyedChildren(c1: any, c2: any, el: HostNode) {
    c1 = c1 || []
    c2 = c2 || []

    // step1. patch common prefix
    // (a b) c
    // (a b) d e
    let i = 0
    let length1 = c1.length
    let length2 = c2.length
    let e1 = length1 - 1
    let e2 = length2 - 1

    while(i <= e1 && i <= e2) {
        const n1 = c1[i]
        const n2 = c2[i] = normalizeVnode(c2[i])
        if (!isSameVNode(n1, n2)) {
            break
        } else {
            patch(n1, n2, el)
        }

        i++
    }

    // step2. patch common suffix
    // a (b c)
    // d e (b c)
    while (i <= e1 && i <= e2) {
        const n1 = c1[e1]
        const n2 = c2[e2] = normalizeVnode(c2[e2])
        if (!isSameVNode(n1, n2)) {
            break
        } else {
            patch(n1, n2, el)
        }

        e1--
        e2--
    }

    // step3. mount extra new children
    // (a b)
    // (a b) c d
    // i = 2, e1 = 1, e2 = 3
    // (a b)
    // c d (a b)
    // i = 0; e1 = -1, e2 = 1
    if (i > e1) {
        if (i <= e2) {
            const ref = e2 + 1 < length2 ? c2[e2 + 1].el : null
            while (i <= e2) {
                mount(
                    c2[i] = normalizeVnode(c2[i]),
                    el,
                    ref
                )
    
                i++
            }
        }
        
    }

    // step4. unmount extra old children
    // (a b) c d
    // (a b)
    // i = 2, e1 = 3, e2 = 1
    // c d (a b)
    // (a b)
    // i = 0; e1 = 1, e2 = -1
    else if (i > e2) {
        while(i <= e1) {
            unmount(c1[i], el)
            i++
        }
    }

    // step5. patch middle unknown children
    // (a b) e f g (c d)
    // (a b) f e g h (c d)
    // i = 2, e1 = 4, e2 = 5
    else {
        // step5.1 generate key to new index map
        // {
        //   f: 3,
        //   e: 4,
        //   g: 5,
        //   h: 6,
        // }
        const s = i
        const keyToNewIndexMap = new Map()
        while (i <= e2) {
            c2[i] = normalizeVnode(c2[i])
            if (c2[i].key != null) {
                keyToNewIndexMap.set(c2[i].key, i)
            }

            i++
        }

        // step5.2 traverse old children, try patch if exist, or unmount corresponding child.
        const toBePatched = e2 - s + 1
        const newKeyToOldIndexArray = Array(toBePatched).fill(-1)
        // this array will be like this [3, 2, 4, -1]

        for (i = s; i <= e1; i++) {
            const n1 = c1[i]
            if (keyToNewIndexMap.has(n1.key)) {
                const newIndex = keyToNewIndexMap.get(n1.key)
                newKeyToOldIndexArray[newIndex - s] = i

                patch(n1, c2[newIndex], el)
            } else {
                unmount(n1, el)
            }
        }

        // step5.3 get the longest increasing subsequence
        // here is [2, 4] index sequence is [1, 2]
        const indexSequence = getSequence(newKeyToOldIndexArray)
        let j = indexSequence.length - 1
        // traverse `newKeyToOldIndexArray` from right-to-left
        for (let i = toBePatched - 1; i >= 0; i--) {
            const newIndex = i + s
            const n2 = c2[newIndex]
            const ref = newIndex + 1 < length2 ? c2[newIndex + 1].el : null

            // old child is not exist
            if (newKeyToOldIndexArray[i] === -1) {
                mount(n2, el, ref)
            } else {
                // if matched with the longest increasing subsequence means that this child not need move.
                if (j >= 0 && indexSequence[j] === i) {
                    j--
                } else {
                    move(n2, el, ref)
                }
            }
        }
    }
}

function patchProps(props1: object, props2: object, el: HTMLElement) {
    props1 = props1 || {}
    props2 = props2 || {}

    for (const key in props2) {
        hostPatchProps(el, key, props1, props2)
    }

    for (const key in props1) {
        if (!(key in props2)) {
            hostPatchProps(el, key, props1, props2)
        }
    }
}

function hostPatchProps(el: HTMLElement, key: string, props1: object, props2: object) {
    const value = props2[key]
    const oldValue = props1[key]
    
    switch (key) {
        case 'style':
            if (value) {
                for (const k in value) {
                    el.style[k] = value[k]
                }
            }

            if (oldValue) {
                if (value) {
                    for (const k in oldValue) {
                        if (!value.hasOwnProperty(k)) {
                            el.style[k] = ''
                        }
                    }
                } else {
                    el.removeAttribute(key)
                }
            }
            
            break
        default:
            if (key.startsWith('on')) {
                if (oldValue) {
                    el.removeEventListener(key.slice(2), oldValue)
                }

                if (value) {
                    el.addEventListener(key.slice(2), value)
                }
            } else {
                if (value) {
                    el.setAttribute(key, value)
                } else {
                    el.removeAttribute(key)
                }
            }
    }
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
    mount(n2, container, null)
}

function setElementText(text: string, container: HostNode) {
    container.textContent = text
}

function getSequence(arr: number[]): number[] {
    const p = arr.slice()
    const result = [0]
    let i, j, u, v, c
    const len = arr.length
    for (i = 0; i < len; i++) {
        const arrI = arr[i]
        if (arrI !== 0) {
            j = result[result.length - 1]
            if (arr[j] < arrI) {
                p[i] = j
                result.push(i)
                continue
            }
            u = 0
            v = result.length - 1
            while (u < v) {
                c = ((u + v) / 2) | 0
                if (arr[result[c]] < arrI) {
                    u = c + 1
                } else {
                    v = c
                }
            }
            if (arrI < arr[result[u]]) {
                if (u > 0) {
                    p[i] = result[u - 1]
                }
                result[u] = i
            }
        }
    }
    u = result.length
    v = result[u - 1]
    while (u-- > 0) {
        result[u] = v
        v = p[v]
    }
    return result
}