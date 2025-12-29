---
{
    "title": "转换为 ARRAY 类型",
    "language": "zh-CN",
    "description": "ARRAY 类型用于存储和处理数组数据，可以包含各种基本类型的元素，如整型、字符串等，内部也可以嵌套其他复杂类型。"
}
---

ARRAY 类型用于存储和处理数组数据，可以包含各种基本类型的元素，如整型、字符串等，内部也可以嵌套其他复杂类型。

## 转换为 ARRAY

### FROM String

:::caution 行为变更
在 4.0 版本之前对于分隔符之间为空字符串的情况会解析失败，例如"[,,]"会返回 NULL。
从 4.0 版本开始，"[,,]"在非严格模式下会返回[null, null, null]，在严格模式下会报错。
:::


#### 严格模式

##### BNF 定义

```xml
<array>          ::= "[" <array-content>? "]" | <empty-array> 

<empty-array> ::= "[]"

<array-content>  ::=  <data-token>(<collection-delim> <data-token>)*

<data-token>    ::= <whitespace>* "\"" <inner-sequence> "\"" <whitespace>*
                   | <whitespace>* "'" <inner-sequence> "'" <whitespace>*
                   | <whitespace>* <inner-sequence> <whitespace>*

<inner-sequence>    ::= .*

<collection-delim>  ::= "," 
```

##### 规则描述

1. 数组的文本表示必须以左方括号 `[` 开始，并以右方括号 `]` 结束。
2. 空数组直接表示为 `[]`。
3. 数组中的各个元素之间使用逗号进行分隔。
4. 数组内部的元素的前后允许有空白字符。
5. 数组内元素两边可以用单引号 (`'`) 和双引号 (`"`) 配对包围。
6. 元素可以用 "null" 来表示一个 null 值。
7. 解析中匹配到 `<data-token>` 的部分，继续应用目标类型 T 的解析规则进行解析。

如果不满足上述规则，或元素内部不满足对应类型的要求，则报错。

##### 例子

| 输入字符串 | 转换结果 | 说明 |
| --- | --- | --- |
| '[]' | [] | 合法的空数组 |
| '  []' | 报错 | 数组开头不是方括号，整体解析失败 |
| '[ ]' | 报错 | 数组有一个元素，一串空字符，空字符解析 int 失败 |
| "[     123,       123]" | Cast to Array\<int\>: [123, 123] | 合法的数组 |
| '[  "  123  "   ,    "456   "]' | Cast to Array\<int\>: [123, 456] | 合法的数组 |
| '[    123     ,    "456"   ]' | Cast to Array\<int\>: [123, 456] | 合法的数组 |
| '[ [] ]' | Cast to Array\<Array\<int\>\>: [[]] | 第一个数组的内部元素为 ' [] '，trim 后会是一个合法的数组 |
| '[ null ,123]' | Cast to Array\<int\>: [null, 123] | 包含 null 的合法数组 |
| '[ "null" ,123]' | 报错 | 字符串 "null" 不能转换为 int 类型 |

#### 非严格模式

##### BNF 定义

```xml
<array>          ::= "[" <array-content>? "]" | <empty-array> 

<empty-array> ::= "[]"

<array-content>  ::=  <data-token>(<collection-delim> <data-token>)*

<data-token>    ::= <whitespace>* "\"" <inner-sequence> "\"" <whitespace>*
                   | <whitespace>* "'" <inner-sequence> "'" <whitespace>*
                   | <whitespace>* <inner-sequence> <whitespace>*

<inner-sequence>    ::= .*

<collection-delim>  ::= "," 
```

##### 规则描述

1. 数组的文本表示必须以左方括号 `[` 开始，并以右方括号 `]` 结束。
2. 空数组直接表示为 `[]`。
3. 数组中的各个元素之间使用逗号进行分隔。
4. 数组内部的元素的前后允许有空白字符。
5. 数组内元素两边可以用单引号 (`'`) 和双引号 (`"`) 配对包围。
6. 元素可以用 "null" 来表示一个 null 值。
7. 解析中匹配到 `<data-token>` 的部分，继续应用目标类型 T 的解析规则进行解析。

如果数组格式不满足上面的 BNF 格式，返回一个 NULL。
如果元素内部不满足对应类型的要求，对应的元素的位置为 null。

##### 例子

| 输入字符串 | 转换结果 | 说明 |
| --- | --- | --- |
| '[]' | [] | 合法的空数组 |
| '  []' | NULL | 数组开头不是方括号，整体解析失败 |
| '[ ]' | [null] | 数组有一个元素，一串空字符，空字符解析 int 失败 |
| "[     123,       123]" | Cast to Array\<int\>: [123, 123] | 合法的数组 |
| '[  "  123  "   ,    "456   "]' | Cast to Array\<int\>: [123, 456] | 合法的数组 |
| '[    123     ,    "456"   ]' | Cast to Array\<int\>: [123, 456] | 合法的数组 |
| '[ [] ]' | Cast to Array\<Array\<int\>\>: [[]] | 第一个数组的内部元素为 ' [] '，trim 后会是一个合法的数组 |
| '[ null ,123]' | Cast to Array\<int\>: [null, 123] | 包含 null 的合法数组 |
| '[ "null" ,123]' | Cast to Array\<int\>: [null, 123] | 字符串 "null" 无法转为 int 类型，转换为 null |

### FROM Array\<Other Type\>

#### 严格模式

##### 规则描述

对于 Array 中的每一个元素，执行一次 Cast from Other Type To Type。此时 Cast 也是严格模式的 Cast。

##### 例子

| 输入数组 | 转换结果 | 说明 |
| --- | --- | --- |
| ["123", "456"] | Cast to Array\<int\>: [123, 456] | "123" 和 "456" 可以转换成 Int |
| ["abc", "123"] | 报错 | "abc" 不可以转换成 Int |
| [null, "123"] | Cast to Array\<int\>: [null, 123] | null 的 Cast 结果还是 null |

#### 非严格模式

##### 规则描述

对于 Array 中的每一个元素，执行一次 Cast from Other Type To Type。此时 Cast 也是非严格模式的 Cast。

##### 例子

| 输入数组 | 转换结果 | 说明 |
| --- | --- | --- |
| ["123", "456"] | Cast to Array\<int\>: [123, 456] | "123" 和 "456" 可以转换成 Int |
| ["abc", "123"] | Cast to Array\<int\>: [null, 123] | "abc" 不可以转换成 Int，转换为 null |
| [null, "123"] | Cast to Array\<int\>: [null, 123] | null 的 Cast 结果还是 null |
