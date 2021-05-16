import { AttributeNode, TextNode, ElementNode, RootNode, NodeTypes, InterpolationNode } from './ast'

interface ParseContext {
    source: string
}

enum TagType {
    START,
    END
}

const DELIMITERS = ['{{', '}}']
const NATIVE_TAG = new Set(['div', 'span', 'br'])
function isNativeTag(tag: string): boolean {
    return NATIVE_TAG.has(tag)
}

function getParseContext(content: string): ParseContext {
    return {
        source: content,
    }
}

export function baseParse(template: string): RootNode {
    const context = getParseContext(template.trim())
    return {
        type: NodeTypes.ROOT,
        children: parseChildren(context, []),
        codegenNode: null,
    }
}

function isEnd(context: ParseContext, ancestors: ElementNode[]) {
    const s = context.source
    const parent = ancestors[ancestors.length - 1]

    if (startsWith(s, '</')) {
        if (parent && s.slice(2, s.indexOf('>')) === parent.tag) {
            return true
        }
        
        throw new Error('End Tag ERROR')
    }

    return !s
}

function parseChildren(context: ParseContext, ancestors: ElementNode[]) {
    const nodes = []

    while (!isEnd(context, ancestors)) {
        const s = context.source
        let node = undefined

        if (s.startsWith(DELIMITERS[0])) {
            node = parseInterpolation(context)
        } else if (s[0] === '<') {
            if (/[a-z]/i.test(s[1])) {
                node = parseElement(context, ancestors)
            }
        }
        
        if (!node) {
            node = parseText(context)
        }

        nodes.push(node)
    }

    let removedWhiteSpaces = false
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i]

        if (node.type === NodeTypes.TEXT && !node.content.trim()) {
            nodes[i] = null
            removedWhiteSpaces = true
        }
    }

    return removedWhiteSpaces ? nodes.filter(Boolean) : nodes
}

function parseInterpolation(context: ParseContext): InterpolationNode {
    const eIndex = context.source.indexOf(DELIMITERS[1])
    if (eIndex < 0) {
        throw Error('delimiter syntax error')
    }

    const openLength = DELIMITERS[0].length
    advanceBy(context, openLength)
    const rawContent = context.source.slice(0, eIndex - openLength)
    advanceBy(context, rawContent.length + DELIMITERS[1].length)

    return {
        type: NodeTypes.INTERPOLATION,
        content: {
            type: NodeTypes.SIMPLE_EXPRESSION,
            content: rawContent,
            isStatic: false,
        }
    }
}

function parseElement(context: ParseContext, ancestors: ElementNode[]): ElementNode | undefined {
    const element = parseTag(context, TagType.START)

    ancestors.push(element)
    const children = parseChildren(context, ancestors)
    element.children = children
    ancestors.pop()

    parseTag(context, TagType.END)

    return element
}

function parseText(context: ParseContext): TextNode {
    const endTokens = ['<', DELIMITERS[0]]
    let endIndex = context.source.length

    for (let i = 0; i < endTokens.length; i++) {
        const index = context.source.indexOf(endTokens[i])
        if (index !== -1 && endIndex > index) {
            endIndex = index
        }
    }

    const content = context.source.slice(0, endIndex)
    advanceBy(context, endIndex)

    return {
        type: NodeTypes.TEXT,
        content,
    }
}

function parseTag(context: ParseContext, type: TagType): ElementNode {
    const matched = /^<\/?([a-z]*)/.exec(context.source)
    const tag = matched[1]

    advanceBy(context, matched[0].length)
    advanceSpaces(context)

    const props = parseAttributes(context)

    let isSelfClosing = startsWith(context.source, '/>')
    advanceBy(context, isSelfClosing ? 2 : 1)

    return {
        type: NodeTypes.ELEMENT,
        props,
        tag,
        children: [],
        codegenNode: null,
    }
}

function parseAttributes(context: ParseContext) {
    const props = []

    while (
        context.source.length > 0 
        && !startsWith(context.source, '>')
    ) {
        const attr = parseAttribute(context)
        props.push(attr)
        advanceSpaces(context)
    }

    return props
}

function parseAttribute(context: ParseContext): AttributeNode {
    const match = /^[^\s=]*/.exec(context.source)
    const name = match[0]

    advanceBy(context, name.length)

    if (!startsWith(context.source, '=')) {
        throw new Error('Template `Attribute` ERROR')
    }

    advanceBy(context, 1)

    if (!startsWith(context.source, '"')) {
        throw new Error('CAN NOT FIND START `"`')
    }

    advanceBy(context, 1)

    const endIndex = context.source.indexOf('"')

    if (endIndex === -1) {
        throw new Error('CAN NOT FIND END `"`')
    }

    const content = context.source.slice(0, endIndex)
    advanceBy(context, endIndex + 1)

    return {
        type: NodeTypes.ARRTIBUTE,
        name,
        value: {
            type: NodeTypes.TEXT,
            content,
        },
    }
}

function advanceBy(context: ParseContext, length: number) {
    context.source = context.source.slice(length)
}

function advanceSpaces(context: ParseContext) {
    const matched = /^\s+/.exec(context.source)
    if (matched) {
        advanceBy(context, matched[0].length)
    }
}

function startsWith(str: string, prefix: string) {
    return str.startsWith(prefix)
}