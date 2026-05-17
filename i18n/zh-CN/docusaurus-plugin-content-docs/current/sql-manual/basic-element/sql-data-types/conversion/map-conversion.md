---
{
    "title": "转换为 MAP 类型",
    "language": "zh-CN",
    "description": "MAP 类型用于存储和处理键值对数据，可以包含各种基本类型的键和值，内部也可以嵌套其他复杂类型。"
}
---

MAP 类型用于存储和处理键值对数据，可以包含各种基本类型的键和值，内部也可以嵌套其他复杂类型。

## 转换为 MAP

### FROM String

:::caution 行为变更
在 4.0 版本之前，一些不满足 MAP 格式的字符串可能会被正常转换 (例如'{1:1,2}')
从 4.0 版本开始，不满足 MAP 格式的字符串在严格模式下会报错，在非严格模式下会返回 NULL。
:::

#### 严格模式

##### BNF 定义

```xml
<map>          ::= "{" <map-content>? "}" | <empty-map> 

<empty-map>    ::= "{}"

<map-content>  ::=  <key-token> <map_key_delimiter> <value-token>
                     (<collection-delim> <key-token> <map_key_delimiter> <value-token>)*

<key-token>    ::= <whitespace>* "\"" <inner-sequence> "\"" <whitespace>*
                   | <whitespace>* "'" <inner-sequence> "'" <whitespace>*
                   | <whitespace>* <inner-sequence> <whitespace>*
<value-token>  ::= <key-token>

<inner-sequence>    ::= .*
<collection-delim>  ::= "," 
<map_key_delimiter> ::= ":"
```

##### 规则描述

1. MAP 的文本表示必须以左花括号 `{` 开始，并以右花括号 `}` 结束。
2. 空 MAP 直接表示为 `{}`。
3. MAP 中的各个键值对之间使用逗号 `,` 进行分隔。
4. 每个键值对由一个键（key）、一个冒号 `:` 和一个值（value）组成，顺序为"键：值"。
5. 键和值两边都可以选择性地用匹配的单引号 (`'`) 或双引号 (`"`) 包围。引号内的内容被视为一个整体。
6. 内部的元素的前后允许有空白字符。
7. 解析中匹配到 `<key-token>` 的部分，继续应用 K 类型的解析规则进行解析；匹配到 `<value-token>` 的部分，继续应用 V 类型的解析规则进行解析；这部分应用的 BNF 规则与解析逻辑，仍认为是当前 MAP<K, V> 的 BNF 与解析逻辑的一部分，对应错误处理和结果传递至当前 MAP<K, V> 的行为与结果。
8. 可以用 "null" 来表示一个 null 值的元素。

如果不满足 MAP 的格式或键值对中 key/value 存在不满足对应类型的格式，则报错。

##### 例子

| 输入字符串 | 转换结果 | 说明 |
| --- | --- | --- |
| "{}" | {} | 合法的空 MAP |
| "  {}" | 报错 | 开头不是花括号，整体解析失败 |
| '{123:456}' | Cast to MAP\<int,int\>: {123:456} | 合法的 MAP |
| '{123:null}' | Cast to MAP\<int,int\>: {123:null} | 合法的 MAP，包含 null 值 |
| '{   123   :   456    }' | Cast to MAP\<int,int\>: {123:456} | 合法的 MAP，含空白字符 |
| '{"123":"456"}' | Cast to MAP\<int,int\>: {123:456} | 合法的 MAP，使用引号 |
| '{   "123":"abc"  }' | 报错 | "abc" 无法转换成 int 类型 |
| '{ 1:2 ,34, 5:6}' | 报错 | 不满足 MAP 的格式 |

#### 非严格模式

##### BNF 定义

```xml
<map>          ::= "{" <map-content>? "}" | <empty-map> 

<empty-map>    ::= "{}"

<map-content>  ::=  <key-token> <map_key_delimiter> <value-token>
                     (<collection-delim> <key-token> <map_key_delimiter> <value-token>)*

<key-token>    ::= <whitespace>* "\"" <inner-sequence> "\"" <whitespace>*
                   | <whitespace>* "'" <inner-sequence> "'" <whitespace>*
                   | <whitespace>* <inner-sequence> <whitespace>*
<value-token>  ::= <key-token>

<inner-sequence>    ::= .*
<collection-delim>  ::= "," 
<map_key_delimiter> ::= ":"
```

##### 规则描述

1. MAP 的文本表示必须以左花括号 `{` 开始，并以右花括号 `}` 结束。
2. 空 MAP 直接表示为 `{}`。
3. MAP 中的各个键值对之间使用逗号 `,` 进行分隔。
4. 每个键值对由一个键（key）、一个冒号 `:` 和一个值（value）组成，顺序为"键：值"。
5. 键和值两边都可以选择性地用匹配的单引号 (`'`) 或双引号 (`"`) 包围。引号内的内容被视为一个整体。
6. 内部的元素的前后允许有空白字符。
7. 解析中匹配到 `<key-token>` 的部分，继续应用 K 类型的解析规则进行解析；匹配到 `<value-token>` 的部分，继续应用 V 类型的解析规则进行解析；这部分应用的 BNF 规则与解析逻辑，仍认为是当前 MAP<K, V> 的 BNF 与解析逻辑的一部分，对应错误处理和结果传递至当前 MAP<K, V> 的行为与结果。
8. 可以用 "null" 来表示一个 null 值的元素。

如果 MAP 的格式不满足上面的 BNF 格式，返回一个 NULL。
如果键值对中，key/value 存在不满足对应类型的格式，对应的位置为 null。

##### 例子

| 输入字符串 | 转换结果 | 说明 |
| --- | --- | --- |
| "{}" | {} | 合法的空 MAP |
| "  {}" | NULL | 开头不是花括号，整体解析失败 |
| '{123:456}' | Cast to MAP\<int,int\>: {123:456} | 合法的 MAP |
| '{123:null}' | Cast to MAP\<int,int\>: {123:null} | 合法的 MAP，包含 null 值 |
| '{   123   :   456    }' | Cast to MAP\<int,int\>: {123:456} | 合法的 MAP，含空白字符 |
| '{"123":"456"}' | Cast to MAP\<int,int\>: {123:456} | 合法的 MAP，使用引号 |
| '{   "123":"abc"  }' | Cast to MAP\<int,int\>: {123:null} | "abc" 无法转换成 int 类型，转换为 null |
| '{ 1:2 ,34, 5:6}' | NULL | 不满足 MAP 的格式 |

### FROM MAP\<Other Type\>

#### 严格模式

##### 规则描述

对于 MAP 中的每一个元素，执行一次 Cast from Other Type To Type。此时 Cast 也是严格模式的 Cast。

##### 例子

| 输入 MAP | 转换结果 | 说明 |
| --- | --- | --- |
| {"123":"456"} | Cast to MAP\<int,int\>: {123:456} | "123" 和 "456" 可以转换成 Int |
| {"abc":"123"} | 报错 | "abc" 不可以转换成 Int |
| {"123":null} | Cast to MAP\<int,int\>: {123:null} | null 的 Cast 结果还是 null |

#### 非严格模式

##### 规则描述

对于 MAP 中的每一个元素，执行一次 Cast from Other Type To Type。此时 Cast 也是非严格模式的 Cast。

##### 例子

| 输入 MAP | 转换结果 | 说明 |
| --- | --- | --- |
| {"123":"456"} | Cast to MAP\<int,int\>: {123:456} | "123" 和 "456" 可以转换成 Int |
| {"abc":"123"} | Cast to MAP\<int,int\>: {null:123} | "abc" 不可以转换成 Int，转换为 null |
| {"123":null} | Cast to MAP\<int,int\>: {123:null} | null 的 Cast 结果还是 null |
