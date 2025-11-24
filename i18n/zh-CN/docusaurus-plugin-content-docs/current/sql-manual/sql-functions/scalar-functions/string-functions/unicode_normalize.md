---
{
    "title": "UNICODE_NORMALIZE",
    "language": "zh-CN"
}
---

## 描述

Unicode 标准化（归一化）。根据指定模式对输入字符串进行标准化。

## 语法

```sql
VARCHAR UNICODE_NORMALIZE(VARCHAR str, VARCHAR mode)
```

## 参数

- `str`: 需要进行标准化的输入字符串。类型：`VARCHAR`
- `mode`: 标准化模式。必须是常量字符串。支持的模式（不区分大小写）包括：
    - `NFC`: 标准分解，然后标准组合。
    - `NFD`: 标准分解。
    - `NFKC`: 兼容分解，然后标准组合。
    - `NFKD`: 兼容分解。
    - `NFKC_CF`: NFKC 后进行大小写折叠（Case Folding）。

## 返回值

返回输入字符串标准化后的 `VARCHAR` 字符串。

## 示例

```sql
SELECT unicode_normalize('Café', 'NFD');
```
```
Café
```

```sql
SELECT unicode_normalize('ABC 123', 'nfkc_cf');
```
```
abc 123
```

## 关键词

UNICODE_NORMALIZE, STRING, UNICODE
