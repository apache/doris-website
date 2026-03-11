---
{
  "title": "GROUP_CONCAT",
  "description": "GROUPCONCAT関数は、結果セット内の複数の結果行を文字列に連結します。",
  "language": "ja"
}
---
## デスクリプション

GROUP_CONCAT関数は、結果セット内の複数行の結果を文字列に連結します。

## Syntax

```sql
GROUP_CONCAT([DISTINCT] <str>[, <sep>] [ORDER BY { <col_name> | <expr>} [ASC | DESC]])
```
## パラメータ

| パラメータ | 説明 |
| ------------ | ---------------------- |
| `<str>`      | 必須。連結する値の式。 |
| `<sep>`      | オプション。文字列間の区切り文字。 |
| `<col_name>` | オプション。ソートに使用するカラム。   |
| `<expr>`     | オプション。ソートに使用する式。 |

## 戻り値

VARCHAR型の値を返します。
入力データにNULLが含まれている場合、NULLを返します。

## 例

```sql
-- setup
create table test(
    value varchar(10)
) distributed by hash(value) buckets 1
properties ("replication_num"="1");

insert into test values
    ("a"),
    ("b"),
    ("c"),
    ("c");
```
```sql
select GROUP_CONCAT(value) from test;
```
```text
+-----------------------+
| GROUP_CONCAT(`value`) |
+-----------------------+
| a, b, c, c            |
+-----------------------+
```
```sql
select GROUP_CONCAT(DISTINCT value) from test;
```
```text
+-----------------------+
| GROUP_CONCAT(`value`) |
+-----------------------+
| a, b, c               |
+-----------------------+
```
```sql
select GROUP_CONCAT(value ORDER BY value DESC) from test;
```
```text
+-----------------------+
| GROUP_CONCAT(`value`) |
+-----------------------+
| c, c, b, a            |
+-----------------------+
```
```sql
select GROUP_CONCAT(DISTINCT value ORDER BY value DESC) from test;
```
```text
+-----------------------+
| GROUP_CONCAT(`value`) |
+-----------------------+
| c, b, a               |
+-----------------------+
```
```sql
select GROUP_CONCAT(value, " ") from test;
```
```text
+----------------------------+
| GROUP_CONCAT(`value`, ' ') |
+----------------------------+
| a b c c                    |
+----------------------------+
```
```sql
select GROUP_CONCAT(value, NULL) from test;
```
```text
+----------------------------+
| GROUP_CONCAT(`value`, NULL)|
+----------------------------+
| NULL                       |
+----------------------------+
```
