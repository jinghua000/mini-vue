import { h, ShapeFlags } from '../src/runtime'

it('string should considered as element', () => {
    const vnode = h('div')
    expect(vnode.shapeFlag).toBe(ShapeFlags.ELEMENT)
    expect(vnode.type).toBe('div')
    expect(vnode._isVNode).toBe(true)
    expect(vnode.props).toBe(null)
})

it('object should considered as component', () => {
    const component = {}
    const vnode = h(component)

    expect(vnode.shapeFlag).toBe(ShapeFlags.COMPONENT)
    expect(vnode.type).toBe(component)
})


