import { h, VNodeTypes } from '../src/runtime'

it('string should considered as element', () => {
    const vnode = h('div')

    expect(vnode.type).toBe(VNodeTypes.ELEMENT)
    expect(vnode.tag).toBe('div')
    expect(vnode._isVNode).toBe(true)
    expect(vnode.props).toBe(null)
})

it('object should considered as component', () => {
    const component = {}
    const vnode = h(component)

    expect(vnode.type).toBe(VNodeTypes.COMPONENT)
    expect(vnode.tag).toBe(component)
})

it('invalid types should throw an error', () => {
    expect(() => h(123)).toThrow(TypeError)
})


