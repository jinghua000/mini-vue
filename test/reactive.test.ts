import { reactive, effect } from '../src/reactive'

it('reactived object not self', () => {
    let dummy = {}
    let object = reactive(dummy)

    expect(dummy).not.toBe(object)
})

it('reactived object has same props', () => {
    let dummy = { count: 1 }
    let state = reactive(dummy)

    expect(state.count).toBe(1)
})

it('function inside effect should be tracked', () => {
    let dummy 
    let state = reactive({ count: 1 })

    effect(() => { dummy = state.count })
    state.count++

    expect(dummy).toBe(2)
})

it('new props of object can be tracked', () => {
    let dummy 
    let state: any = reactive({})

    effect(() => { dummy = state.count })
    state.count = 123

    expect(dummy).toBe(123)
})

it('symbol key can be tracked', () => {
    let sym = Symbol()
    let dummy 
    let state: any = reactive({})

    effect(() => { dummy = state[sym] })
    state[sym] = 123

    expect(dummy).toBe(123)
})

it('array index can be tracked', () => {
    let dummy
    let state = reactive([1])

    effect(() => { dummy = state[0] })
    state[0] = 123

    expect(dummy).toBe(123)
})

it('array methods can be tracked', () => {
    let dummy
    let state = reactive([])

    effect(() => { dummy = state[0] })
    state.push(123)

    expect(dummy).toBe(123)
})

it('schedule', () => {
    let dummy 
    let update

    let state: any = reactive({})
    let schedule = fn => update = fn

    effect(() => {
        dummy = state.foo
    }, {
        schedule
    })

    state.foo = 123
    expect(dummy).toBe(void 0)
    update()
    expect(dummy).toBe(123)
})