---
{
    "title": "REGEXP_POSITION",
    "language": "zh-CN",
    "description": "返回字符串中正则表达式匹配的位置。"
}
---

<!--
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at
  http://www.apache.org/licenses/LICENSE-2.0
Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

## 描述

返回字符串中第 N 次非重叠正则匹配或指定捕获组的字节位置。任一参数为 `NULL` 时，该行返回 `NULL`。

## 语法

```sql
regexp_position(<haystack>, <pattern>
    [, <position>[, <occurrence>[, <return_option>[, <flags>[, <subexpression>]]]]])
```

支持 2～7 个位置参数。`haystack` 和 `pattern` 为必填参数。可选参数必须依次填写：`position`、`occurrence`、`return_option`、`flags`、`subexpression`。例如，指定 `flags` 时，必须同时提供前面的 `position`、`occurrence` 和 `return_option`。方括号表示可选参数，不是 SQL 调用的一部分。

公开名称为 `regexp_position`、`regexp_instr`、`regexpPosition` 和 `regexpInstr`。函数名不区分大小写，四个名称均解析为 `regexp_position`。

## 参数

| 参数 | 描述 |
| --- | --- |
| `<haystack>` | 必填，`STRING` 或 `VARCHAR`，待搜索的字节串，可以逐行变化。 |
| `<pattern>` | 必填，`STRING` 或 `VARCHAR` 常量表达式，遵循 RE2 语法，最多 1024 个捕获组。 |
| `<position>` | 可选，`TINYINT`、`SMALLINT`、`INT` 或 `BIGINT`，默认 `1`，从 1 开始的搜索起始字节位置，必须大于等于 1。 |
| `<occurrence>` | 可选，与 `position` 接受相同的整数类型，默认 `1`，从起点开始的第 N 次完整、非重叠匹配，必须大于等于 1。 |
| `<return_option>` | 可选，与 `position` 接受相同的整数类型，默认 `0`。`0` 返回所选对象起点，`1` 返回其末尾后一位。 |
| `<flags>` | 可选，`STRING` 或 `VARCHAR` 常量表达式，默认 `''`（空字符串），仅接受小写 `i`、`c`、`m`、`n`、`s`。 |
| `<subexpression>` | 可选，与 `position` 接受相同的整数类型，默认 `0`，表示完整匹配；正数按左括号顺序选择捕获组，不得超过捕获组数。 |

任一参数均允许 `NULL`。

## 返回值

返回 `BIGINT`，表示从 1 开始的字节位置。未命中指定匹配，或所选捕获组未参与匹配或匹配内容为空时返回 `0`。任一参数可为 NULL 时，返回类型为 `Nullable(BIGINT)`；任一参数实际为 `NULL` 的行返回 `NULL`。

## 示例

```sql
SELECT regexp_position('äbc', 'b') AS byte_position;
```

```text
+---------------+
| byte_position |
+---------------+
|             3 |
+---------------+
```

```sql
SELECT regexp_position('foo123bar456', '([a-z]+)([0-9]+)',
                       1, 2, 0, '', 2) AS group_position;
```

```text
+----------------+
| group_position |
+----------------+
|             10 |
+----------------+
```

```sql
SELECT regexp_position(NULL, 'a') AS null_result;
```

```text
+-------------+
| null_result |
+-------------+
|        NULL |
+-------------+
```

## 字节位置

`position` 是从 1 开始（1-based）的搜索起始字节位置，`1` 表示第一个字节。返回的匹配位置也从 `haystack` 开头按字节计数，而非按 Unicode 字符计数。`return_option = 0` 返回所选匹配或捕获组的起始字节位置；`return_option = 1` 返回其末尾后一个字节的位置。

搜索起点不要求位于 UTF-8 字符边界。允许从多字节字符内部开始搜索，不会将起点取整到字符边界或转换为字符索引；正则表达式从该字节偏移开始搜索原字符串。

```sql
SELECT regexp_position('äbc', 'b');
```

```text
3
```

```sql
SELECT regexp_position('äbc', 'b', 1, 1, 1);
```

```text
4
```

```sql
SELECT regexp_position('äbc', '.', 2);
```

```text
3
```

```sql
SELECT regexp_position('😀a', '.', 3);
```

```text
5
```

## 返回 0 与 NULL

对于合法且非 NULL 的参数，未命中指定匹配时返回 `0`，包括 `occurrence` 超过匹配次数，或 `position` 超过字符串末尾位置（`length(haystack) + 1`）的情况。`subexpression` 选中的合法捕获组未参与指定匹配时也返回 `0`。捕获组已参与匹配但匹配内容为空字符串时也返回 `0`，与 `return_option` 的取值无关。

任一已提供参数为 `NULL` 时，该行返回 `NULL`，而非 `0`。在实参表达式已求值后，函数会跳过该 NULL 行中其他参数的函数内部校验；这不抑制实参表达式自身求值或类型转换产生的错误。对于非 NULL 行，即使搜索最终会返回 `0`，非法参数或非法正则表达式仍会报错。

```sql
SELECT regexp_position('abc', 'z');
```

```text
0
```

```sql
SELECT regexp_position('b', '(a)?b', 1, 1, 0, '', 1);
```

```text
0
```

```sql
SELECT regexp_position('a', 'a()', 1, 1, 0, '', 1);
```

```text
0
```

```sql
SELECT regexp_position(NULL, 'a');
```

```text
NULL
```

```sql
SELECT regexp_position('abc', 'a', NULL);
```

```text
NULL
```

## Flags

`flags` 默认为 `''`。默认区分大小写，`.` 不匹配换行符，`^` 和 `$` 仅匹配完整输入的边界。

| flag | 作用 |
| --- | --- |
| `i` | 开启不区分大小写的匹配。 |
| `c` | 开启区分大小写的匹配。 |
| `m` | 启用多行锚点：`^` 和 `$` 也匹配行首、行尾，不改变 `.` 的行为。 |
| `n` | 与 `m` 同义：启用多行锚点，不改变 `.` 的行为。 |
| `s` | 允许 `.` 匹配换行符，不改变 `^` 或 `$` 的行为。 |

Flags 从左到右处理。`i` 和 `c` 同时出现时，以最后一个为准：`ic` 区分大小写，`ci` 不区分大小写。非空 `flags` 先于 `pattern` 中的行内修饰符生效，模式中后续的行内修饰符可以覆盖这些设置；空 `flags` 不添加修饰符前缀。

```sql
SELECT regexp_position('ABC', 'abc', 1, 1, 0, 'ic');
```

```text
0
```

```sql
SELECT regexp_position('ABC', 'abc', 1, 1, 0, 'ci');
```

```text
1
```

## 类型、常量性与错误

`haystack`、`pattern` 和 `flags` 只接受 `STRING`、`VARCHAR` 或 `NULL`。四个数字参数（`position`、`occurrence`、`return_option`、`subexpression`）只接受 `TINYINT`、`SMALLINT`、`INT`、`BIGINT` 或 `NULL`。其他类型，包括 `CHAR`、`LARGEINT`、浮点、`DECIMAL` 和布尔值，均需显式 `CAST` 为允许的类型；数字字符串不能隐式转换为数字参数。

`pattern` 和 `flags` 必须为常量表达式，允许 `concat('a', 'b')` 等确定性的可折叠表达式，不接受列或非确定性表达式。`haystack` 和数字参数可以逐行变化。参数个数错误、原始参数类型不受支持、`pattern` 或 `flags` 不是常量，均在隐式类型转换前产生分析期错误，即使其他参数为 `NULL` 也一样。实参表达式求值或显式类型转换自身的错误沿用 Doris 现有规则。

实参表达式求值后，任一参数为 `NULL` 的行返回 `NULL`，不校验该行其他参数值。首次遇到七个参数均非 NULL 的行时，函数先校验 `flags`、编译 `pattern`，再校验数字值；后续行复用编译结果。空数据块以及不存在全非 NULL 行的数据块，不触发 flag 校验或模式编译。

对于七个参数均非 NULL 的行，以下条件产生执行期错误并使查询失败：

- `flags` 包含小写 `i`、`c`、`m`、`n`、`s` 之外的值，包括大写 flag。
- `pattern` 无法通过 RE2 编译，或捕获组超过 1024 个。
- `position < 1` 或 `occurrence < 1`。
- `return_option` 不是 `0` 或 `1`。
- `subexpression` 为负数或大于捕获组数；`0` 选择完整匹配，正数按左括号顺序选择捕获组。

函数仅使用 RE2，不使用 `enable_extended_regex` 控制的 Boost 回退。模式遵循 RE2 的语法限制，包括不支持反向引用、环视以及计数量词的次数限制。仅当 UTF-8 编译失败且错误为 RE2 `ErrorBadUTF8` 时，才以相同选项改用 Latin-1 重试；其他编译失败或重试失败均报错。

Flag 错误优先于模式编译错误，模式编译错误优先于数字校验。数字参数按 `position`、`occurrence`、`return_option`、`subexpression` 的顺序校验，之后才会因搜索起点越界或未命中返回 `0`。执行期错误指出参数及非法值或正则原因，不会将非法输入转换为未命中结果。

## 与 PostgreSQL 的差异

PostgreSQL 的正则位置函数按字符计数。Doris `regexp_position` 的搜索起点和返回位置均按字节计数，因此多字节输入可能得到不同的位置。例如，Doris 中 `regexp_position('äbc', 'b')` 返回 `3`，而对应的 PostgreSQL `regexp_instr('äbc', 'b')` 返回字符位置 `2`。

Doris 使用 RE2 匹配语义，不承诺 PostgreSQL 的 POSIX 最长匹配语义。同一模式存在多个可能匹配时，可能选择不同的匹配：例如，对 `'ab'` 匹配 `a|ab` 时，按 RE2 默认的分支顺序选择 `a`，而 POSIX 最长匹配语义选择 `ab`。迁移 PostgreSQL 查询时，即使使用 `regexp_instr` 别名，也应检查位置计数和模式行为。
