---
{
  "title": "GROUP_CONCAT",
  "language": "ja",
  "description": "GROUPCONCAT関数は、結果セット内の複数の結果行を文字列に連結します。"
}
---
## 説明

GROUP_CONCAT関数は、結果セット内の複数行の結果を文字列に連結します。

## 構文

```sql
GROUP_CONCAT([DISTINCT] <str>[, <sep>] [ORDER BY { <col_name> | <expr>} [ASC | DESC]])
```
## パラメータ

| パラメータ | 説明 |
| ------------ | ---------------------- |
| `<str>`      | 必須。連結する値の式。 |
| `<sep>`      | オプション。文字列間のセパレータ。 |
| `<col_name>` | オプション。ソートに使用するカラム。   |
| `<expr>`     | オプション。ソートに使用する式。 |

## 戻り値

VARCHAR型の値を返します。

## 例

```sql
select value from test;
```
```text
+-------+
| value |
+-------+
| a     |
| b     |
| c     |
| c     |
+-------+
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
