---
{
    "title": "CONVERT_TO",
    "language": "en",
    "description": "Converts the character encoding of a column to a specified target character set."
}
---

## Description

Converts the character encoding of a column to a specified target character set. This function is typically used in the ORDER BY clause to ensure that columns containing Chinese characters are sorted according to their pinyin order. Currently, only conversion to `'gbk'` is supported.

## Syntax

```sql
CONVERT_TO(<column>, <character>)
```

## Parameters

| Parameters      | Description                                                                 |
|----------------|-----------------------------------------------------------------------------|
| `<column>`     | The VARCHAR column whose encoding is to be converted.                       |
| `<character>`  | The target character set. Currently, only `'gbk'` is supported.             |

## Return Value

Returns a VARCHAR value with the converted encoding, allowing proper pinyin-based ordering when used in the ORDER BY clause.

## Examples

```sql
SELECT * FROM class_test ORDER BY class_name;
```

```text
+----------+------------+-------------+
| class_id | class_name | student_ids |
+----------+------------+-------------+
|        6 | asd        | [6]         |
|        7 | qwe        | [7]         |
|        8 | z          | [8]         |
|        2 | 哈         | [2]         |
|        3 | 哦         | [3]         |
|        1 | 啊         | [1]         |
|        4 | 张         | [4]         |
|        5 | 我         | [5]         |
+----------+------------+-------------+
```

```sql
SELECT * FROM class_test ORDER BY CONVERT_TO(class_name, 'gbk');
```

```text
+----------+------------+-------------+
| class_id | class_name | student_ids |
+----------+------------+-------------+
|        6 | asd        | [6]         |
|        7 | qwe        | [7]         |
|        8 | z          | [8]         |
|        1 | 啊         | [1]         |
|        2 | 哈         | [2]         |
|        3 | 哦         | [3]         |
|        5 | 我         | [5]         |
|        4 | 张         | [4]         |
+----------+------------+-------------+
```