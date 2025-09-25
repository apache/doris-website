---
{
    "title": "FROM_HEX",
    "language": "zh-CN"
}
---

## 描述
将输入的二进制数据转换成使用十六进制编码转换后的字符串

## 别名

FROM_BINARY

## 语法

```sql
FROM_HEX ( <varbinary> )
```

## 参数

| 参数    | 说明           |
|-------|--------------|
| `<varbinary>` | 待转换的二进制数据 |

## 返回值

将输入的二进制数据使用十六进制编码转换成字符串。

## 举例

```sql
SELECT FROM_HEX(NULL);
```

```text
+----------------+
| FROM_HEX(NULL) |
+----------------+
| NULL           |
+----------------+
```

```sql
SELECT FROM_HEX(X'AB');
```

```text
+-----------------+
| FROM_HEX(X'AB') |
+-----------------+
| AB              |
+-----------------+
```

```sql
select *, from_binary(varbinary_c) from mysql_all_type_test.test_varbinary_db.test_varbinary
```

```text
+------+----------------------------+--------------------------+
| id   | varbinary_c                | from_binary(varbinary_c) |
+------+----------------------------+--------------------------+
|    1 | 0x48656C6C6F20576F726C64   | 48656C6C6F20576F726C64   |
|    2 | 0x48656C6C6F20576F726C6421 | 48656C6C6F20576F726C6421 |
|    3 | 0x48656C6C6F20576F726C6421 | 48656C6C6F20576F726C6421 |
|    4 | NULL                       | NULL                     |
|    5 | 0xAB                       | AB                       |
+------+----------------------------+--------------------------+
```