---
{
    "title": "GROUP_CONCAT",
    "language": "ja",
    "description": "GROUP_CONCAT 関数は、結果セットの複数行の値を連結して文字列にします。"
}
---

## 説明

GROUP_CONCAT 関数は、結果セットの複数行の値を連結して文字列にします。

## 構文

```sql
GROUP_CONCAT([DISTINCT] <str>[, <sep>] [ORDER BY { <col_name> | <expr>} [ASC | DESC]])
```

## パラメータ

| パラメータ | 説明 |
| ------------ | ---------------------- |
| `<str>`      | 必須。連結する値を表す式。 |
| `<sep>`      | 省略可能。文字列間の区切り文字。 |
| `<col_name>` | 省略可能。ソートに使用する列。 |
| `<expr>`     | 省略可能。ソートに使用する式。 |

## 戻り値

VARCHAR 型の値を返します。
入力データに NULL が含まれる場合は、NULL を返します。

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
