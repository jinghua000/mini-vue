export enum NodeTypes {
    ROOT,
    ELEMENT,
    TEXT,
    SIMPLE_EXPRESSION,
    INTERPOLATION,
    ARRTIBUTE,
    // codegenNode
    VNODE_CALL,
    TEXT_CALL,
    JS_CALL_EXPRESSION,
    JS_OBJECT_EXPRESSION,
}

export type ParentType = RootNode | ElementNode

export type Node = 
    RootNode 
    | ElementNode
    | AttributeNode
    | TextNode
    | TextCallNode
    | CallExpression
    | ObjectExpression
    | VNodeCall
    | SimpleExpressionNode
    | InterpolationNode

export interface RootNode {
    type: NodeTypes.ROOT,
    children: Node[],
    helpers?: [],
    codegenNode: any,
}

export interface ElementNode {
    type: NodeTypes.ELEMENT,
    children: Node[],
    props: AttributeNode[],
    codegenNode: any,
    tag: string,
}

export interface AttributeNode {
    type: NodeTypes.ARRTIBUTE,
    value: TextNode,
    name: string,
}

export interface TextNode {
    type: NodeTypes.TEXT,
    content: string
}

export interface VNodeCall {
    type: NodeTypes.VNODE_CALL,
    tag: string,
    props: any,
    children: Node | Node[]
}

export interface TextCallNode {
    type: NodeTypes.TEXT_CALL,
    content: TextNode,
    codegenNode: CallExpression
}

export interface CallExpression {
    type: NodeTypes.JS_CALL_EXPRESSION
    callee: string
    arguments: Node[] | Node
}

export interface ObjectExpression {
    type: NodeTypes.JS_OBJECT_EXPRESSION
    properties: any[]
}

export interface SimpleExpressionNode {
    type: NodeTypes.SIMPLE_EXPRESSION
    isStatic: boolean
    content: any
}

export interface InterpolationNode {
    type: NodeTypes.INTERPOLATION
    content: SimpleExpressionNode
  }