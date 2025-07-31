---
{
    "title": "转换为 STRUCT 类型",
    "language": "zh-CN"
}
---

STRUCT 类型用于存储和处理结构化数据，可以包含不同类型的字段，每个字段都有一个名称和对应的值。STRUCT 可以嵌套其他复杂类型如 ARRAY、MAP 或其他 STRUCT。

## 转换为 STRUCT

### FROM String

#### 严格模式

##### BNF 定义

```xml
<struct>          ::= "{" <struct-content>? "}" | <empty-struct> 

<empty-struct> ::= "{}"

<struct-content>  ::=  <struct-field-value-content> | <struct-only-value-content>

<struct-field-value-content> ::=  <field-token> <map_key_delimiter> <value-token>
                     (<collection-delim> <field-token> <map_key_delimiter> <value-token>)*
                         
<struct-only-value-content> ::=  <value-token>(<collection-delim> <value-token>)*

<value-token>    ::= <whitespace>* "\"" <inner-sequence> "\"" <whitespace>*
                   | <whitespace>* "'" <inner-sequence> "'" <whitespace>*
                   | <whitespace>* <inner-sequence> <whitespace>*

<inner-sequence>    ::= .*
<collection-delim>  ::= "," 
<map_key_delimiter> ::= ":"
```

##### 规则描述

1. STRUCT 的文本表示必须以左花括号 `{` 开始，并以右花括号 `}` 结束。
2. 空 STRUCT 直接表示为 `{}`。
3. STRUCT 中的字段 - 值对（field-value pair）之间使用逗号 `,` 进行分隔。
4. 每个字段 - 值对由一个可选的字段名（field）、一个冒号 `:` 和一个值（value）组成，顺序为"字段名：值"或仅为"值"。
5. 字段 - 值对要么全部为"字段名：值"的格式，要么全部都为"值"的格式。
6. 字段名与值两边都可以选择性地用匹配的单引号 (`'`) 或双引号 (`"`) 包围，引号内的内容被视为一个整体。
7. 内部的元素的前后允许有空白字符。
8. 解析中匹配到 `<value-token>` 的部分，继续应用 value 类型的解析规则进行解析。如果有 `<field-token>`，需要和定义的 STRUCT 的 name 的个数、顺序相同。
9. 可以用 "null" 来表示一个 null 值的元素。

如果 STRUCT 的整体不满足要求，报错，例如：
1. 字段 - 值对个数不等于 STRUCT 定义的个数。
2. 字段 - 值的顺序不等于 STRUCT 定义的顺序。
3. 字段 - 值出现一些有字段名，一些没有的情况（要么全部都有，要么全部都没有）。

如果 STRUCT 中的某个值不满足对应类型，报错。

##### 例子

| 输入字符串 | 转换结果 | 说明 |
| --- | --- | --- |
| "{}" | {} | 合法的空 STRUCT |
| "  {}" | 报错 | 开头不是花括号，整体解析失败 |
| '{"a":1,"b":1}' | Cast to STRUCT\<a:int, b:int\>: {"a":1, "b":1} | 使用字段名的合法 STRUCT |
| '{a:1,"b":3.14}' | Cast to STRUCT\<a:int, b:double\>: {"a":1, "b":3.14} | 字段名可以用引号包括，也可以没有引号 |
| '{1,3.14}' | Cast to STRUCT\<a:int, b:double\>: {"a":1, "b":3.14} | 没有提供字段名，也可以解析 |
| '{a:1,3.1,c:100}' | 报错 | 有的有字段名，有的没有，报错 |
| '{a:1}' | Cast to STRUCT\<a:int, b:double\>: 报错 | 字段 - 值对不等于定义的个数，报错 |
| '{b:1,a:1}' | Cast to STRUCT\<a:int, b:double\>: 报错 | 顺序不对，报错 |
| '{"a":"abc","b":1}' | Cast to STRUCT\<a:int, b:int\>: 报错 | "abc" 无法转换成 int 类型 |
| '{null,1}' | Cast to STRUCT\<a:int, b:int\>: {"a":null, "b":1} | 包含 null 值的合法 STRUCT |
| '{"name":"张三","age":25}' | Cast to STRUCT\<name:string, age:int\>: {"name":"张三", "age":25} | 包含字符串的 STRUCT |
| '{{"x":1,"y":2},3}' | Cast to STRUCT\<point:struct<x:int,y:int>, z:int\>: {"point":{"x":1,"y":2}, "z":3} | 嵌套 STRUCT 结构 |

#### 非严格模式

##### BNF 定义

```xml
<struct>          ::= "{" <struct-content>? "}" | <empty-struct> 

<empty-struct> ::= "{}"

<struct-content>  ::=  <struct-field-value-content> | <struct-only-value-content>

<struct-field-value-content> ::=  <field-token> <map_key_delimiter> <value-token>
                     (<collection-delim> <field-token> <map_key_delimiter> <value-token>)*
                         
<struct-only-value-content> ::=  <value-token>(<collection-delim> <value-token>)*

<value-token>    ::= <whitespace>* "\"" <inner-sequence> "\"" <whitespace>*
                   | <whitespace>* "'" <inner-sequence> "'" <whitespace>*
                   | <whitespace>* <inner-sequence> <whitespace>*

<inner-sequence>    ::= .*
<collection-delim>  ::= "," 
<map_key_delimiter> ::= ":"
```

##### 规则描述

1. STRUCT 的文本表示必须以左花括号 `{` 开始，并以右花括号 `}` 结束。
2. 空 STRUCT 直接表示为 `{}`。
3. STRUCT 中的字段 - 值对（field-value pair）之间使用逗号 `,` 进行分隔。
4. 每个字段 - 值对由一个可选的字段名（field）、一个冒号 `:` 和一个值（value）组成，顺序为"字段名：值"或仅为"值"。
5. 字段 - 值对要么全部为"字段名：值"的格式，要么全部都为"值"的格式。
6. 字段名与值两边都可以选择性地用匹配的单引号 (`'`) 或双引号 (`"`) 包围，引号内的内容被视为一个整体。
7. 内部的元素的前后允许有空白字符。
8. 解析中匹配到 `<value-token>` 的部分，继续应用 value 类型的解析规则进行解析。如果有 `<field-token>`，需要和定义的 STRUCT 的 name 的个数、顺序相同。
9. 可以用 "null" 来表示一个 null 值的元素。

如果 STRUCT 的整体不满足要求，返回 NULL，例如：
1. 字段 - 值对个数不等于 STRUCT 定义的个数。
2. 字段 - 值的顺序不等于 STRUCT 定义的顺序。
3. 字段 - 值出现一些有字段名，一些没有的情况（要么全部都有，要么全部都没有）。

如果 STRUCT 中的某个值不满足对应类型，对应位置为 null。

##### 例子

| 输入字符串 | 转换结果 | 说明 |
| --- | --- | --- |
| "{}" | {} | 合法的空 STRUCT |
| "  {}" | NULL | 开头不是花括号，整体解析失败 |
| '{"a":1,"b":1}' | Cast to STRUCT\<a:int, b:int\>: {"a":1, "b":1} | 使用字段名的合法 STRUCT |
| '{a:1,"b":3.14}' | Cast to STRUCT\<a:int, b:double\>: {"a":1, "b":3.14} | 字段名可以用引号包括，也可以没有引号 |
| '{1,3.14}' | Cast to STRUCT\<a:int, b:double\>: {"a":1, "b":3.14} | 没有提供字段名，也可以解析 |
| '{a:1,3.1,c:100}' | NULL | 有的有字段名，有的没有，返回 NULL |
| '{a:1}' | Cast to STRUCT\<a:int, b:double\>: NULL | 字段 - 值对不等于定义的个数，返回 NULL |
| '{b:1,a:1}' | Cast to STRUCT\<a:int, b:double\>: NULL | 顺序不对，返回 NULL |
| '{"a":"abc","b":1}' | Cast to STRUCT\<a:int, b:int\>: {"a":null, "b":1} | "abc" 无法转换成 int 类型，对应位置为 null |
| '{null,1}' | Cast to STRUCT\<a:int, b:int\>: {"a":null, "b":1} | 包含 null 值的合法 STRUCT |
| '{"name":"张三","age":"二十五"}' | Cast to STRUCT\<name:string, age:int\>: {"name":"张三", "age":null} | "二十五" 无法转换为 int 类型，对应位置为 null |
| '{{"x":"一","y":2},3}' | Cast to STRUCT\<point:struct<x:int,y:int>, z:int\>: {"point":{"x":null,"y":2}, "z":3} | 嵌套 STRUCT 中的元素转换失败，对应位置为 null |

### FROM STRUCT\<Other Type\>

#### 严格模式

##### 规则描述

对于 STRUCT 中的每一个元素，执行一次 Cast from Other Type To Type。此时 Cast 也是严格模式的 Cast。

##### 例子

| 输入 STRUCT | 转换结果 | 说明 |
| --- | --- | --- |
| {"a":"123","b":"456"} | Cast to STRUCT\<a:int, b:int\>: {"a":123, "b":456} | "123" 和 "456" 可以转换成 Int |
| {"a":"abc","b":"123"} | 报错 | "abc" 不可以转换成 Int |
| {"a":null,"b":"123"} | Cast to STRUCT\<a:int, b:int\>: {"a":null, "b":123} | null 的 Cast 结果还是 null |
| {"name":"李四","scores":[90,85,92]} | Cast to STRUCT\<name:string, scores:array<int>\>: {"name":"李四", "scores":[90,85,92]} | 包含数组的 STRUCT 转换 |

#### 非严格模式

##### 规则描述

对于 STRUCT 中的每一个元素，执行一次 Cast from Other Type To Type。此时 Cast 也是非严格模式的 Cast。

##### 例子

| 输入 STRUCT | 转换结果 | 说明 |
| --- | --- | --- |
| {"a":"123","b":"456"} | Cast to STRUCT\<a:int, b:int\>: {"a":123, "b":456} | "123" 和 "456" 可以转换成 Int |
| {"a":"abc","b":"123"} | Cast to STRUCT\<a:int, b:int\>: {"a":null, "b":123} | "abc" 不可以转换成 Int，转换为 null |
| {"a":null,"b":"123"} | Cast to STRUCT\<a:int, b:int\>: {"a":null, "b":123} | null 的 Cast 结果还是 null |
| {"name":"李四","scores":["九十",85,"九十二"]} | Cast to STRUCT\<name:string, scores:array<int>\>: {"name":"李四", "scores":[null,85,null]} | 数组中不能转换为 int 的元素变为 null |
