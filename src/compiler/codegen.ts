import { 
    RootNode, 
    Node, 
    NodeTypes, 
    TextNode, 
    CallExpression, 
    ObjectExpression, 
    VNodeCall,
    SimpleExpressionNode,
    InterpolationNode
} from './ast'
import { isString, isArray } from '../shared'
import { CREATE_VNODE, CREATE_TEXT } from './helper'

interface CodegenContext {
    ast: RootNode,
    code: string,
    push: (code: string) => void,
    newline: () => void,
    indent: () => void,
}

const HELPERS = [
    CREATE_VNODE,
    CREATE_TEXT,
]

export function generate(ast: RootNode) {
    const context = createCodegenContext(ast)
    const { push, newline } = context
    getFunctionPreamble(context)

    push(`function (_ctx) {`)
    newline()
    push(`with (_ctx) {`)
    newline()

    push(`const { ${HELPERS.map(s => `${s}: _${s}`).join(', ')} } = _Vue`)
    newline()
    push(`return `)

    if (ast.codegenNode) {
        genNode(ast.codegenNode, context)
    } else {
        push(`null`)
    }
    
    newline()

    push('}')
    newline()
    push('}')

    return {
        ast,
        code: context.code,
    }
}

function getFunctionPreamble(context: CodegenContext) {
    const { push, newline } = context

    push(`console.log("start run")`)
    newline()
    push(`const _Vue = Vue`)
    newline()
    push(`return `)
}

function createCodegenContext(ast: RootNode): CodegenContext {
    const context: CodegenContext = {
        ast,
        code: '',
        push(code: string) {
            context.code += code
        },
        newline() {
            context.push(`\n`)
        },
        indent() {
            context.newline()
            context.push(`  `)
        },
    }

    return context
}

function genNode(node: Node, context: CodegenContext) {
    // if (isString(node)) {
    //     context.push(node as string)
    //     return 
    // }

    switch(node.type) {
        case NodeTypes.ELEMENT:    
        case NodeTypes.TEXT_CALL:
            genNode(node.codegenNode, context)
            break
        case NodeTypes.VNODE_CALL:
            genVNodeCall(node, context)
            break
        case NodeTypes.JS_OBJECT_EXPRESSION:
            genObjectExpression(node, context)
            break
        case NodeTypes.SIMPLE_EXPRESSION:
            genExpression(node, context)
            break
        case NodeTypes.JS_CALL_EXPRESSION:
            genCallExpression(node, context)
            break
        case NodeTypes.INTERPOLATION:
            genInterpolation(node, context)
            break    
        case NodeTypes.TEXT:
            genText(node, context)
            break
        default: 
            throw new Error(`Not supported node type "${node.type}"`)
    }
}

function genInterpolation(node: InterpolationNode, context: CodegenContext) {
    genNode(node.content, context)
}

function genExpression(node: SimpleExpressionNode, context: CodegenContext) {
    context.push(node.isStatic ? JSON.stringify(node.content) : node.content)
}

function genVNodeCall(node: VNodeCall, context: CodegenContext) {
    const { push } = context

    push(`_${CREATE_VNODE}(${JSON.stringify(node.tag)}, `)
    genNode(node.props, context)
    push(`, `)
    genNodeList(node.children, context)
    push(`)`)
}

function genObjectExpression(node: ObjectExpression, context: CodegenContext) {
    const { properties } = node
    const { push } = context
    if (!properties.length) {
        push('{}')
        return 
    }

    push('{ ')
    for (let i = 0; i < properties.length; i++) {
        const { key, value } = properties[i]
        push(key.content)
        push(`: `)

        genNode(value, context)
        if (i < properties.length - 1) {
            push(`, `)
        }
    }
    push(' }')
}

function genCallExpression(node: CallExpression, context: CodegenContext) {
    const { push } = context
    push('_' + node.callee + '(')
    genNodeList(node.arguments, context)
    push(')')
}

function genNodeList(nodes: Node[] | Node, context: CodegenContext) {
    if (isArray(nodes)) {
        genNodeListAsArray(nodes, context)
    } else {
        genNode(nodes, context)
    }
}

function genNodeListAsArray(nodes: Node[], context: CodegenContext) {
    const { push } = context
    push('[')
    for (let i = 0; i < nodes.length; i++) {

        genNodeList(nodes[i], context)

        if (i < nodes.length - 1) {
            push(', ')
        }
    }
    push(']')
}

function genText(node: TextNode, context: CodegenContext) {
    context.push(JSON.stringify(node.content))
}