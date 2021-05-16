## h

args: 
- name: string
- props: object
- children: string | array | object

## createVnode

- type
- tag: string | object
- ...

## vnode

tag: 'div'
type: VNodeTypes

## diff

1. 新旧数组从头开始判断，如果是相同类型则patch

```
(a b) c
(a b) d e
```

2. 新旧数组从尾部开始判断，乳沟是相同类型则patch

```
a (b c)
d e (b c)
```

3. 如果旧数组patch完了则剩余的新数组mount

```
(a b)
(a b) c

or

(b c)
a (b c)
```

4. 如果新数组patch完了则剩余的旧数组unmount

```
(a b) c
(a b)

or 

a (b c)
(b c)
```

5. 判断中间不同部分

```
a b [c d h] f g
a b [e d c h] f g
```

### 中间diff

1. 设置新数组的key与index，如图上

```js
{
    e: 2,
    d: 3,
    c: 4,
    h: 5,
}
```

2. 遍历旧的数组，尝试每个进行diff
   
记录一个数组表示diff的位置, 旧index+1，用0来标识没有对应元素 [0,0,0,0] - newIndexToOldIndexMap

```
a b [c d h] f g
a b [e d c h] f g
```

for (c d x) 

c:
oldIndex = 2
newIndex = 4

i = 2

- 如果不存在 newIndex unmount, 相当于旧节点在新节点找不到
- 如果存在设置位置
  - [0,0,3,0] 表示c对应旧node的第 3 - 1 个位置，也就是旧node的第二个
  - 再进行patch newArray[4] vs oldArray[2]

记录遍历所有旧节点得到的最大的新偏移index
以上例子为 h: 5
最后结果 [0,4,3,5]

3. 获得最长递增子串，以上例子为[0,3,5],下标为[0,2,3]

一共需要patch的元素个数为4个（新数组的元素个数）
然后遍历newIndexToOldIndexMap数组

如果是0则直接mount，相当于之前没有这个元素

```
a b [c d h] f g
a b [e d c h] f g
```

i = 3
j = 2 
[0,2,3]

i === arr[j] // => 3 不移动

```
a b [c d h] f g
a b [e d c h] f g
```

i = 2
j = 1
[0,2,3]

## compiler-ast

假设下面这个template

```html
<div id="title">
  hello
  <span>world</span>
</div>
```

1. 如果开头是`<`则匹配标签

上述例子匹配到`<div`，得到标签`div`

2. 匹配完标签后，截取原本字符串，再去掉空格

```
id="title">
  hello
  <span>world</span>
</div>
```

3. 再匹配到`=`号为止的所有内容

以上内容匹配到`id=`，获取到属性id，在截取去空格

此时内容为

```
"title">
  hello
  <span>world</span>
</div>
```

4. 匹配两个`"`中间的内容，匹配到再截取再去空格

匹配到`"title"`

内容为

```
>
  hello
  <span>world</span>
</div>
```

5. 不断重复3，4两步，直到遇到`>`

<!-- 此时匹配到了标签开始部分，将这个对象放入一个栈中，栈内内容为

`[div]` -->

截取掉`>`然后进行下一步

此时内容为

```
  hello
  <span>world</span>
</div>
```
  
6. 默认情况下匹配文字

这一步比较简单，然后匹配到除了`<`的内容，然后去除前后空格当做真实内容，然后截取字符串

此时内容为

```
  <span>world</span>
</div>
```

7. 然后不断重复上面的步骤直到以下内容

```
  </span>
</div>
```

匹配到了`</`，认为这个是结束标签，这里其实相当简单，直接把匹配到`>`为止的内容截取掉即可。

8. 什么已经完成了？

## compiler-traverse

```json
{
  "type": 0,
  "children": [
    {
      "type": 1,
      "props": [
        {
          "type": 3,
          "name": "id",
          "value": {
            "type": 2,
            "content": "title"
          }
        }
      ],
      "tag": "div",
      "children": [
        {
          "type": 2,
          "content": "\n    hello\n    "
        },
        {
          "type": 1,
          "props": [],
          "tag": "span",
          "children": [
            {
              "type": 2,
              "content": "world"
            }
          ]
        }
      ]
    }
  ]
}
```

以上是刚刚得到的ast，遍历所有node以及children，直到最后一层。

然后设置`codegenNode`属性，按照以下规则

1. 如果元素只有text，则给元素设置codegen但是text没有
2. 如果元素有多个child，则对所有text类型的children设置createTextNode帮助函数

再把root元素的codegen设置为第一个child的codegen，并创建一个block

这样之后得到了拥有codegenNode属性的ast，为之后的generate做准备

转换的结构类似以下：

```json
{
  "codegenNode": {
    "type": "VNODE_CALL",
    "tag": "div",
    "props": {
      "type": "JS_OBJECT_EXPRESSION",
      "properties": [],
    },
    "children": [
      {
        "type": "TEXT_CALL",
        "codegenNode": {
          "arguments": [
            {
              "type": 2,
              "content": "\n    hello\n    "
            }
          ],
          "callee": "Symbol(createTextVNode)",
          "type": "JS_CALL_EXPRESSION",
        },
      },
      {
        "codegenNode": {
          "type": "VNODE_CALL",
          "children": {},
          "tag": "span",
        },
      },
    ]
  }
}
```

## compiler-generate

最终需要的结果

```js
const _Vue = Vue

return function (_ctx) {
  with(_ctx) {
    
  }
}
```