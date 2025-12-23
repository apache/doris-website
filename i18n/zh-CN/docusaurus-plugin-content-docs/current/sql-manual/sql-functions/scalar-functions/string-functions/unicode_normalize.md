---
{
    "title": "UNICODE_NORMALIZE",
    "language": "zh-CN",
    "description": "对输入字符串进行 Unicode 标准化（归一化）。"
}
---

## 描述

对输入字符串进行 [Unicode 标准化（归一化）](https://unicode-org.github.io/icu/userguide/transforms/normalization/)。

Unicode 标准化是将等价的 Unicode 字符序列转换为统一形式的过程。例如，字符 "é" 可以用单个码点（U+00E9）表示，也可以用 "e" + 组合重音符号（U+0065 + U+0301）两个码点表示。标准化确保这些等价的表示形式能被统一处理。

## 语法

```sql
UNICODE_NORMALIZE(<str>, <mode>)
```

## 参数

| 参数 | 说明 |
|------|------|
| `<str>` | 需要进行标准化的输入字符串。类型：VARCHAR |
| `<mode>` | 标准化模式，必须是常量字符串（不区分大小写）。支持的模式：<br/>- `NFC`: 标准分解后进行标准组合（Canonical Decomposition, followed by Canonical Composition）<br/>- `NFD`: 标准分解（Canonical Decomposition）<br/>- `NFKC`: 兼容分解后进行标准组合（Compatibility Decomposition, followed by Canonical Composition）<br/>- `NFKD`: 兼容分解（Compatibility Decomposition）<br/>- `NFKC_CF`: NFKC 后进行大小写折叠（Case Folding） |

## 返回值

返回 VARCHAR 类型，表示输入字符串标准化后的结果。

## 示例

1. NFC 与 NFD 的区别（组合字符 vs 分解字符）

```sql
-- 'Café' 中 é 可能是组合形式，NFD 会将其分解为 e + 组合重音符
SELECT length(unicode_normalize('Café', 'NFC')) AS nfc_len, length(unicode_normalize('Café', 'NFD')) AS nfd_len;
```

```text
+---------+---------+
| nfc_len | nfd_len |
+---------+---------+
|       4 |       5 |
+---------+---------+
```

2. NFKC_CF 进行大小写折叠

```sql
SELECT unicode_normalize('ABC 123', 'nfkc_cf') AS result;
```

```text
+---------+
| result  |
+---------+
| abc 123 |
+---------+
```

3. NFKC 处理全角字符（兼容分解）

```sql
-- 全角数字 '１２３' 会被转换为半角 '123'
SELECT unicode_normalize('１２３ＡＢＣ', 'NFKC') AS result;
```

```text
+--------+
| result |
+--------+
| 123ABC |
+--------+
```

4. NFKD 处理特殊符号（兼容分解）

```sql
-- ℃ (摄氏度符号) 会被分解为 °C
SELECT unicode_normalize('25℃', 'NFKD') AS result;
```

```text
+--------+
| result |
+--------+
| 25°C   |
+--------+
```

5. 处理带圈数字

```sql
-- ① ② ③ 等带圈数字会被转换为普通数字
SELECT unicode_normalize('①②③', 'NFKC') AS result;
```

```text
+--------+
| result |
+--------+
| 123    |
+--------+
```

6. 比较不同模式对同一字符串的处理

```sql
SELECT 
    unicode_normalize('ﬁ', 'NFC') AS nfc_result,
    unicode_normalize('ﬁ', 'NFKC') AS nfkc_result;
```

```text
+------------+-------------+
| nfc_result | nfkc_result |
+------------+-------------+
| ﬁ          | fi          |
+------------+-------------+
```

7. 字符串相等性比较场景

```sql
-- 使用标准化来比较视觉上相同但编码不同的字符串
SELECT unicode_normalize('café', 'NFC') = unicode_normalize('café', 'NFC') AS is_equal;
```

```text
+----------+
| is_equal |
+----------+
|        1 |
+----------+
```
