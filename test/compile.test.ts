import { baseParse } from '../src/compiler/parse'
import { transform }  from '../src/compiler/transform'
import { generate } from '../src/compiler/codegen'

it('demo', () => {
    const ast = baseParse(`
<div id="title">
    {{ foo }}
    <span>world</span>
</div>
`.trim())

    debugger
    transform(ast)
    
    const result = generate(ast)
    console.log(result.code)
})