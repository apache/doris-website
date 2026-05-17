---
{
    "title": "BITMAP_FROM_STRING",
    "language": "zh-CN",
    "description": "将一个字符串转化为一个 BITMAP，字符串是由逗号分隔的一组 unsigned bigint 数字组成。(数字取值在:0 ~ 18446744073709551615) 比如\"0, 1, 2\"字符串会转化为一个 Bitmap，其中的第 0, 1, 2 位被设置。当输入字段不合法时，返回 NULL"
}
---

## 描述

将一个字符串转化为一个 BITMAP，字符串是由逗号分隔的一组 unsigned bigint 数字组成。(数字取值在:0 ~ 18446744073709551615)
比如"0, 1, 2"字符串会转化为一个 Bitmap，其中的第 0, 1, 2 位被设置。当输入字段不合法时，返回 NULL

## 语法

```sql
 BITMAP_FROM_STRING(<str>)
```

## 参数

| 参数      | 说明                                                |
|---------|---------------------------------------------------|
| `<str>` | 数组字符串，比如"0, 1, 2"字符串会转化为一个 Bitmap，其中的第 0, 1, 2 位被设置  |  

## 返回值

返回一个 BITMAP
- 当输入字段不合法时，结果返回 NULL

## 举例

```sql
select bitmap_to_string(bitmap_from_string("0, 1, 2")) bts;
```

```text
+-------+
| bts   |
+-------+
| 0,1,2 |
+-------+
```

```sql
select bitmap_to_string(bitmap_from_string("-1, 0, 1, 2")) bfs;
```

```text
+------+
| bfs  |
+------+
| NULL |
+------+
```

```sql
select bitmap_to_string(bitmap_from_string(NULL)) bfs;
```

```text
+------+
| bfs  |
+------+
| NULL |
+------+
```

```sql
select bitmap_to_string(bitmap_from_string("18446744073709551616, 1")) bfs;
```

```text
+------+
| bfs  |
+------+
| NULL |
+------+
```

```sql
select bitmap_to_string(bitmap_from_string("0, 1, 18446744073709551615")) bts;
```

```text
+--------------------------+
| bts                      |
+--------------------------+
| 0,1,18446744073709551615 |
+--------------------------+
```

