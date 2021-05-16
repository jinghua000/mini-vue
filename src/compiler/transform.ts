import { NodeTypes, TextNode, RootNode, Node, ParentType, ElementNode, ObjectExpression } from './ast'
import { CREATE_TEXT } from './helper'

interface TransformContext {
    parent: Node | null
    currentNode: Node
}

function transformElement(node: Node, context: TransformContext) {
    if (node.type !== NodeTypes.ELEMENT) return 

    let children 
    if (node.children.length === 1) {
        const child = node.children[0] as Node

        if (child.type === NodeTypes.TEXT) {
            children = child
        }
    } else {
        children = node.children
    }

    node.codegenNode = {
        type: NodeTypes.VNODE_CALL,
        tag: node.tag,
        props: buildProps(node.props),
        children,
    }
}

function buildProps(props): ObjectExpression {
    const properties = []

    for (let i = 0; i < props.length; i++) {
        const prop = props[i]
        const obj = {
            key: {
                type: NodeTypes.SIMPLE_EXPRESSION,
                content: prop.name,
                isStatic: true,
            },
            value: {
                type: NodeTypes.SIMPLE_EXPRESSION,
                content: prop.value.content,
                isStatic: true,
            },
        }

        properties.push(obj)
    }

    return {
        type: NodeTypes.JS_OBJECT_EXPRESSION,
        properties,
    }
}

function transformText(node: Node, context: TransformContext) {
    if (node.type !== NodeTypes.ELEMENT) return 

    const children = node.children
    if (children.length < 2) return 

    for (let i = 0; i < children.length; i++) {
        const child = children[i] as TextNode
        if (isText(child)) {
            children[i] = {
                type: NodeTypes.TEXT_CALL,
                content: child,
                codegenNode: {
                    type: NodeTypes.JS_CALL_EXPRESSION,
                    arguments: child,
                    callee: CREATE_TEXT,
                },
            }
        }
    }
}

const nodeTransforms = [
    transformElement,
    transformText
]

export function transform(root: RootNode) {
    const context = createTransformContext(root)
    traverseNode(root, context)

    if (root.children.length === 1) {
        root.codegenNode = (root.children[0] as ElementNode).codegenNode
    }
}

function createTransformContext(root: RootNode): TransformContext {
    return {
        parent: null,
        currentNode: root,
    }
}

function traverseNode(node: Node, context: TransformContext) {
    switch(node.type) {
        case NodeTypes.ELEMENT:
        case NodeTypes.ROOT:
            traverseChildren(node, context)
            break
    }   

    context.currentNode = node
    for (let i = 0; i < nodeTransforms.length; i++) {
        nodeTransforms[i](node, context)
    }
}

function traverseChildren(node: ParentType, context: TransformContext) {
    const children = node.children
    for (let i = 0; i < children.length; i++) {
        traverseNode(children[i], context)
    }
}

function isText(node: Node) {
    return node.type === NodeTypes.TEXT
}