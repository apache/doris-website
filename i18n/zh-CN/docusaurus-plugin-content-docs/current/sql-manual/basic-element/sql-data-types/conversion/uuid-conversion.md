---
{
    "title": "转换为 UUID 类型",
    "language": "zh-CN",
    "description": "字符串及其他类型转换为 UUID 的规则，包括严格与非严格模式、合法文本格式和迁移说明。"
}
---

[UUID 类型](../uuid.md)以 16 字节存储 128 位标识符，文本输出为 36 字符的小写标准格式：`xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`。

使用 `CAST(<value> AS UUID)` 将值转换为 UUID。严格模式由 `enable_strict_cast` 控制，详见[类型转换概述](./overview.md)。

## FROM String

字符串来源类型包括 `CHAR`、`VARCHAR` 和 `STRING`。

### 严格模式

#### BNF 定义

```xml
<uuid> ::= <hex8> "-" <hex4> "-" <hex4> "-" <hex4> "-" <hex12>
         | <hex32>

<hex4> ::= <hexdigit> <hexdigit> <hexdigit> <hexdigit>
<hex8> ::= <hex4> <hex4>
<hex12> ::= <hex8> <hex4>
<hex32> ::= <hex8> <hex8> <hex8> <hex8>

<hexdigit> ::= "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"
             | "a" | "b" | "c" | "d" | "e" | "f"
             | "A" | "B" | "C" | "D" | "E" | "F"
```

#### 规则描述

1. 接受带连字符的 36 字符标准格式，分组长度为 `8-4-4-4-12`；也接受不带连字符的 32 位十六进制紧凑格式。
2. 十六进制字母可以为大写（`A–F`）或小写（`a–f`）。两种输入格式均输出为小写标准 UUID 文本。
3. 不接受首尾空白、花括号、错误长度、错误连字符位置或非十六进制字符。
4. 全零和全一 UUID 均有效。解析只检查文本格式，不限制 UUID 版本或变体。
5. 输入为 `NULL` 时返回 `NULL`。
6. 无效文本会报错，查询失败。

#### 例子

| 输入字符串 | 解析结果 | 说明 |
| --- | --- | --- |
| `"550e8400-e29b-41d4-a716-446655440000"` | 成功 | 带连字符的标准格式 |
| `"550E8400E29B41D4A716446655440000"` | 成功 | 大写十六进制的紧凑格式 |
| `"00000000-0000-0000-0000-000000000000"` | 成功 | 全零 UUID，与 NULL 不同 |
| `"ffffffff-ffff-ffff-ffff-ffffffffffff"` | 成功 | 全一 UUID，不校验版本或变体 |
| `""` | 报错 | 空字符串 |
| `" 550e8400-e29b-41d4-a716-446655440000 "` | 报错 | 首尾包含空白字符 |
| `"{550e8400-e29b-41d4-a716-446655440000}"` | 报错 | 不接受花括号 |
| `"550e8400-e29b-41d4-a716-44665544000"` | 报错 | 长度错误 |
| `"550e8400e-29b-41d4-a716-446655440000"` | 报错 | 连字符位置错误 |
| `"550e8400-e29b-41d4-a716-44665544000g"` | 报错 | 包含非十六进制字符 g |
| `NULL` | `NULL` | SQL NULL 保持为 NULL |

```sql
SET enable_strict_cast = true;
SELECT CAST('550E8400E29B41D4A716446655440000' AS UUID) AS parsed,
       CAST(CAST('550E8400E29B41D4A716446655440000' AS UUID) AS STRING) AS text_value,
       CAST(NULL AS UUID) AS null_value;
```

```text
+--------------------------------------+--------------------------------------+------------+
| parsed                               | text_value                           | null_value |
+--------------------------------------+--------------------------------------+------------+
| 550e8400-e29b-41d4-a716-446655440000 | 550e8400-e29b-41d4-a716-446655440000 | NULL       |
+--------------------------------------+--------------------------------------+------------+
```

### 非严格模式

#### BNF 定义

```xml
<uuid> ::= <hex8> "-" <hex4> "-" <hex4> "-" <hex4> "-" <hex12>
         | <hex32>

<hex4> ::= <hexdigit> <hexdigit> <hexdigit> <hexdigit>
<hex8> ::= <hex4> <hex4>
<hex12> ::= <hex8> <hex4>
<hex32> ::= <hex8> <hex8> <hex8> <hex8>

<hexdigit> ::= "0" | "1" | "2" | "3" | "4" | "5" | "6" | "7" | "8" | "9"
             | "a" | "b" | "c" | "d" | "e" | "f"
             | "A" | "B" | "C" | "D" | "E" | "F"
```

#### 规则描述

1. 接受带连字符的 36 字符标准格式，分组长度为 `8-4-4-4-12`；也接受不带连字符的 32 位十六进制紧凑格式。
2. 十六进制字母可以为大写（`A–F`）或小写（`a–f`）。两种输入格式均输出为小写标准 UUID 文本。
3. 不接受首尾空白、花括号、错误长度、错误连字符位置或非十六进制字符。
4. 全零和全一 UUID 均有效。解析只检查文本格式，不限制 UUID 版本或变体。
5. 输入为 `NULL` 时返回 `NULL`。
6. 无效文本返回 `NULL`，不报错。

#### 例子

| 输入字符串 | 解析结果 | 说明 |
| --- | --- | --- |
| `"550e8400-e29b-41d4-a716-446655440000"` | 成功 | 带连字符的标准格式 |
| `"550E8400E29B41D4A716446655440000"` | 成功 | 大写十六进制的紧凑格式 |
| `"00000000-0000-0000-0000-000000000000"` | 成功 | 全零 UUID，与 NULL 不同 |
| `"ffffffff-ffff-ffff-ffff-ffffffffffff"` | 成功 | 全一 UUID，不校验版本或变体 |
| `""` | `NULL` | 空字符串 |
| `" 550e8400-e29b-41d4-a716-446655440000 "` | `NULL` | 首尾包含空白字符 |
| `"{550e8400-e29b-41d4-a716-446655440000}"` | `NULL` | 不接受花括号 |
| `"550e8400-e29b-41d4-a716-44665544000"` | `NULL` | 长度错误 |
| `"550e8400e-29b-41d4-a716-446655440000"` | `NULL` | 连字符位置错误 |
| `"550e8400-e29b-41d4-a716-44665544000g"` | `NULL` | 包含非十六进制字符 g |
| `NULL` | `NULL` | SQL NULL 保持为 NULL |

```sql
SET enable_strict_cast = false;
SELECT CAST('bad' AS UUID) AS invalid_cast,
       TRY_CAST('{550e8400-e29b-41d4-a716-446655440000}' AS UUID) AS braces;
```

```text
+--------------+--------+
| invalid_cast | braces |
+--------------+--------+
| NULL         | NULL   |
+--------------+--------+
```

## FROM UUID

UUID 转换为 UUID 时，值及 `NULL` 均保持不变。严格模式与非严格模式的行为一致。

## FROM VARIANT

支持将 VARIANT 转换为 UUID，但 VARIANT 内必须包含可转换的标量。具体转换行为取决于该标量值和严格模式设置。

## FROM 其他类型

严格模式与非严格模式均不支持将数值、日期时间、IP、VARBINARY 或 JSON 类型直接通过标量 CAST 转换为 UUID。`TRY_CAST` 不会使不支持的转换变得合法。

## 容错转换

`TRY_CAST(<string> AS UUID)` 在两种模式下均对无效文本或 `NULL` 输入返回 `NULL`。例如，开启严格模式后，无效文本仍返回 `NULL`：

```sql
SET enable_strict_cast = true;
SELECT TRY_CAST('bad' AS UUID) AS invalid_try_cast;
```

```text
+------------------+
| invalid_try_cast |
+------------------+
| NULL             |
+------------------+
```

此时执行 `SELECT CAST('bad' AS UUID);` 将报错，查询失败。

使用 [TO_UUID_OR_NULL](../../../sql-functions/scalar-functions/uuid-functions/to-uuid-or-null.md)、[TO_UUID_OR_ZERO](../../../sql-functions/scalar-functions/uuid-functions/to-uuid-or-zero.md) 或 [TO_UUID_OR_DEFAULT](../../../sql-functions/scalar-functions/uuid-functions/to-uuid-or-default.md) 可显式选择解析失败行为，不受 `enable_strict_cast` 影响。注意：`TO_UUID_OR_ZERO(NULL)` 返回 NULL，而 `TO_UUID_OR_DEFAULT(NULL)` 返回全零 UUID。

## 相关转换与迁移

UUID 转换为 `CHAR`、`VARCHAR` 或 `STRING` 时，两种模式下均输出小写标准文本，并保留 `NULL`，详见[转换为 STRING](./cast-to-string.md#uuid)。UUID 也可转换为 VARIANT。不支持将 UUID 直接 CAST 为数值、日期时间、IP、VARBINARY 或 JSON 类型。

字符串与 UUID 在比较或推导公共类型时会转换为 UUID，字符串解析遵循上述规则。建议显式 CAST 以清楚表达意图。

对于旧的 `INT_TO_UUID` 编码，先转换为字符串再 CAST：`CAST(INT_TO_UUID(encoded_value) AS UUID)`。UUID 与 LARGEINT 之间不存在直接 CAST，也不提供 `toUInt128`。对于按标准大端顺序存储的 16 字节 VARBINARY，先使用 `HEX`，再 `CAST(HEX(binary_value) AS UUID)`；不要将任意 16 字节字符串当作标准 UUID 文本解析。

复杂类型中的字符串元素可递归转换为 UUID，例如 `CAST(ARRAY('550e8400-e29b-41d4-a716-446655440000') AS ARRAY<UUID>)`。从 JSON 读取 UUID 文本时，先提取为字符串再转换；直接的 JSON 与 UUID 标量 CAST 不受支持。Schema Change 不支持直接将已有字符串列改为 UUID，应在新列或新表中使用转换表达式写入，并在迁移前检查失败的值。
