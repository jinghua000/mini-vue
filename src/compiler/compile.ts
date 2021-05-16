import { baseParse } from './parse'
import { transform } from './transform'
import { generate } from './codegen'

export function baseCompile(template: string) {
    const ast = baseParse(template)

    transform(ast)
    return generate(ast)
}