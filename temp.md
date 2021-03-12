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
a b [c d x] f g
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