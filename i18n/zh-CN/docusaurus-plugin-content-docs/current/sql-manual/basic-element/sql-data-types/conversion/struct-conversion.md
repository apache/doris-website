---
{
    "title": "转换为 STRUCT 类型",
    "language": "zh-CN",
    "description": "STRUCT 类型用于存储和处理结构化数据，可以包含不同类型的字段，每个字段都有一个名称和对应的值。STRUCT 可以嵌套其他复杂类型如 ARRAY、MAP 或其他 STRUCT。"
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
8. 解析中匹配到 `<value-token>` 的部分，继续应用 value 类型的解析规则进行解析。`<field-token>` 的处理方式取决于是否提供了字段名：
   - **提供字段名时：** 字段按**名称**匹配，且大小写不敏感。输入字段的顺序**不需要**与 STRUCT 定义的顺序一致。STRUCT 中定义但输入未提供的字段会被填充为 NULL。在严格模式下，如果输入的字段名在 STRUCT 中不存在，则报错。
   - **不提供字段名时：** 字段按位置匹配，且值的个数**必须**与 STRUCT 定义的字段个数完全相等。
9. 可以用 "null" 来表示一个 null 值的元素。

如果 STRUCT 的整体不满足要求，报错，例如：
1. 不提供字段名时，值的个数不等于 STRUCT 定义的字段个数。
2. 提供字段名时，输入包含 STRUCT 中不存在的字段名。
3. 字段 - 值出现一些有字段名，一些没有的情况（要么全部都有，要么全部都没有）。

如果 STRUCT 中的某个值不满足对应类型，报错。

##### 例子

| 输入字符串 | 转换结果 | 说明 |
| --- | --- | --- |
| "{}" | {} | 合法的空 STRUCT |
| "  {}" | 报错 | 开头不是花括号，整体解析失败 |
| '{"a":1,"b":1}' | Cast to STRUCT\<a:int, b:int\>: {"a":1, "b":1} | 使用字段名的合法 STRUCT |
| '{a:1,"b":3.14}' | Cast to STRUCT\<a:int, b:double\>: {"a":1, "b":3.14} | 字段名可以用引号包括，也可以没有引号 |
| '{1,3.14}' | Cast to STRUCT\<a:int, b:double\>: {"a":1, "b":3.14} | 没有提供字段名，按位置匹配解析 |
| '{b:3.14,a:1}' | Cast to STRUCT\<a:int, b:double\>: {"a":1, "b":3.14} | 提供字段名时按名称匹配，输入顺序可以与定义顺序不同 |
| '{A:1,B:3.14}' | Cast to STRUCT\<a:int, b:double\>: {"a":1, "b":3.14} | 字段名匹配大小写不敏感 |
| '{a:1}' | Cast to STRUCT\<a:int, b:double\>: {"a":1, "b":null} | 输入缺少字段 b，填充为 NULL |
| '{a:1,c:100}' | Cast to STRUCT\<a:int, b:double\>: 报错 | 字段名 c 在 STRUCT 中不存在，严格模式下报错 |
| '{a:1,3.1,c:100}' | 报错 | 有的有字段名，有的没有，报错 |
| '{1,3.14,100}' | Cast to STRUCT\<a:int, b:double\>: 报错 | 不提供字段名时，输入个数与定义的字段个数不匹配 |
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
8. 解析中匹配到 `<value-token>` 的部分，继续应用 value 类型的解析规则进行解析。`<field-token>` 的处理方式取决于是否提供了字段名：
   - **提供字段名时：** 字段按**名称**匹配，且大小写不敏感。输入字段的顺序**不需要**与 STRUCT 定义的顺序一致。STRUCT 中定义但输入未提供的字段会被填充为 NULL。如果输入的字段名在 STRUCT 中不存在，则忽略该字段。
   - **不提供字段名时：** 字段按位置匹配，且值的个数**必须**与 STRUCT 定义的字段个数完全相等。
9. 可以用 "null" 来表示一个 null 值的元素。

如果 STRUCT 的整体不满足要求，返回 NULL，例如：
1. 不提供字段名时，值的个数不等于 STRUCT 定义的字段个数。
2. 字段 - 值出现一些有字段名，一些没有的情况（要么全部都有，要么全部都没有）。

如果 STRUCT 中的某个值不满足对应类型，对应位置为 null。

##### 例子

| 输入字符串 | 转换结果 | 说明 |
| --- | --- | --- |
| "{}" | {} | 合法的空 STRUCT |
| "  {}" | NULL | 开头不是花括号，整体解析失败 |
| '{"a":1,"b":1}' | Cast to STRUCT\<a:int, b:int\>: {"a":1, "b":1} | 使用字段名的合法 STRUCT |
| '{a:1,"b":3.14}' | Cast to STRUCT\<a:int, b:double\>: {"a":1, "b":3.14} | 字段名可以用引号包括，也可以没有引号 |
| '{1,3.14}' | Cast to STRUCT\<a:int, b:double\>: {"a":1, "b":3.14} | 没有提供字段名，按位置匹配解析 |
| '{b:3.14,a:1}' | Cast to STRUCT\<a:int, b:double\>: {"a":1, "b":3.14} | 提供字段名时按名称匹配，输入顺序可以与定义顺序不同 |
| '{A:1,B:3.14}' | Cast to STRUCT\<a:int, b:double\>: {"a":1, "b":3.14} | 字段名匹配大小写不敏感 |
| '{a:1}' | Cast to STRUCT\<a:int, b:double\>: {"a":1, "b":null} | 输入缺少字段 b，填充为 NULL |
| '{a:1,c:100}' | Cast to STRUCT\<a:int, b:double\>: {"a":1, "b":null} | 未知字段 c 被忽略，缺少的字段 b 填充为 NULL |
| '{a:1,3.1,c:100}' | NULL | 有的有字段名，有的没有，返回 NULL |
| '{1,3.14,100}' | Cast to STRUCT\<a:int, b:double\>: NULL | 不提供字段名时，输入个数与定义的字段个数不匹配 |
| '{"a":"abc","b":1}' | Cast to STRUCT\<a:int, b:int\>: {"a":null, "b":1} | "abc" 无法转换成 int 类型，对应位置为 null |
| '{null,1}' | Cast to STRUCT\<a:int, b:int\>: {"a":null, "b":1} | 包含 null 值的合法 STRUCT |
| '{"name":"张三","age":"二十五"}' | Cast to STRUCT\<name:string, age:int\>: {"name":"张三", "age":null} | "二十五" 无法转换为 int 类型，对应位置为 null |
| '{{"x":"一","y":2},3}' | Cast to STRUCT\<point:struct<x:int,y:int>, z:int\>: {"point":{"x":null,"y":2}, "z":3} | 嵌套 STRUCT 中的元素转换失败，对应位置为 null |

### FROM STRUCT\<Other Type\>

当源数据为 STRUCT 类型，目标也为 STRUCT 类型时，需要满足以下条件：

1. 源 STRUCT 和目标 STRUCT 必须具有相同数量的元素（字段）
2. 源 STRUCT 中的每个元素将按顺序转换为目标 STRUCT 对应位置的元素类型

如果不满足上述条件，例如元素数量不匹配，将无法进行转换。

#### 严格模式

##### 规则描述

STRUC 中的每一个元素都会执行对应的严格模式的 CAST

##### 例子

```sql
-- 创建一个简单的 STRUCT 类型变量
mysql> SELECT named_struct('a', 123, 'b', 'abc') AS original_struct;
+----------------------+
| original_struct      |
+----------------------+
| {"a":123, "b":"abc"} |
+----------------------+
-- 结果：{"a":123,"b":"abc"} 类型为：struct<a:tinyint,b:varchar(3)>

-- 普通的 CAST
mysql> SELECT CAST(named_struct('a', 123, 'b', 'abc') AS STRUCT<c:bigint, d:string>) AS renamed_struct;
+----------------------+
| renamed_struct       |
+----------------------+
| {"c":123, "d":"abc"} |
+----------------------+

-- 字段个数没有匹配
mysql> SELECT CAST(named_struct('a', 123, 'b', 'abc') AS STRUCT<c:bigint, d:string,e:char>) AS renamed_struct;
ERROR 1105 (HY000): errCode = 2, detailMessage = can not cast from ...

mysql> SELECT CAST(named_struct('a', 123, 'b', 'abc') AS STRUCT<c:bigint>) AS renamed_struct;
ERROR 1105 (HY000): errCode = 2, detailMessage = can not cast from ...

-- STRUCT 中的元素不存在对应的 CAST
mysql> SELECT CAST(named_struct('a', 123, 'b', 'abc') AS STRUCT<b:Array<int>, a:int>) AS renamed_struct;
ERROR 1105 (HY000): errCode = 2, detailMessage = can not cast from ...


-- CAST 按照定义的顺序，而不是字段的名字
mysql> SELECT CAST(named_struct('a', 123, 'b', 'abc') AS STRUCT<b:string, a:int>) AS renamed_struct;
+------------------------+
| renamed_struct         |
+------------------------+
| {"b":"123", "a":"abc"} |
+------------------------+

-- STRUCT 中的元素 CAST 失败，整个 CAST 报错
mysql> SELECT CAST(named_struct('a', 123, 'b', 'abc') AS STRUCT<b:string, a:int>) AS renamed_struct;
ERROR 1105 (HY000): errCode = 2, detailMessage = (127.0.0.1)[INVALID_ARGUMENT]parse number fail, string: 'abc'
```

#### 非严格模式

##### 规则描述

STRUC 中的每一个元素都会执行对应的非严格模式的 CAST

##### 例子


```sql
-- 创建一个简单的 STRUCT 类型变量
mysql> SELECT named_struct('a', 123, 'b', 'abc') AS original_struct;
+----------------------+
| original_struct      |
+----------------------+
| {"a":123, "b":"abc"} |
+----------------------+
-- 结果：{"a":123,"b":"abc"} 类型为：struct<a:tinyint,b:varchar(3)>

-- 普通的 CAST
mysql> SELECT CAST(named_struct('a', 123, 'b', 'abc') AS STRUCT<c:bigint, d:string>) AS renamed_struct;
+----------------------+
| renamed_struct       |
+----------------------+
| {"c":123, "d":"abc"} |
+----------------------+


-- 字段个数没有匹配
mysql> SELECT CAST(named_struct('a', 123, 'b', 'abc') AS STRUCT<c:bigint, d:string,e:char>) AS renamed_struct;
ERROR 1105 (HY000): errCode = 2, detailMessage = can not cast from ...

mysql> SELECT CAST(named_struct('a', 123, 'b', 'abc') AS STRUCT<c:bigint>) AS renamed_struct;
ERROR 1105 (HY000): errCode = 2, detailMessage = can not cast from ...

-- STRUCT 中的元素不存在对应的 CAST
mysql> SELECT CAST(named_struct('a', 123, 'b', 'abc') AS STRUCT<b:Array<int>, a:int>) AS renamed_struct;
ERROR 1105 (HY000): errCode = 2, detailMessage = can not cast from ...


-- CAST 按照定义的顺序，而不是字段的名字
mysql> SELECT CAST(named_struct('a', 123, 'b', 'abc') AS STRUCT<b:string, a:int>) AS renamed_struct;
+------------------------+
| renamed_struct         |
+------------------------+
| {"b":"123", "a":"abc"} |
+------------------------+

-- CAST 按照定义的顺序，而不是字段的名字
mysql> SELECT CAST(named_struct('a', 123, 'b', 'abc') AS STRUCT<b:string, a:int>) AS renamed_struct;
+------------------------+
| renamed_struct         |
+------------------------+
| {"b":"123", "a":"abc"} |
+------------------------+

-- STRUCT 中的元素 CAST 失败，对应元素设置为 null
mysql> SELECT CAST(named_struct('a', 123, 'b', 'abc') AS STRUCT<b:string, a:int>) AS renamed_struct;
+-----------------------+
| renamed_struct        |
+-----------------------+
| {"b":"123", "a":null} |
+-----------------------+
```