---
{
    "title": "BITMAP_AND_NOT,BITMAP_ANDNOT",
    "language": "zh-CN",
    "description": "将两个 BITMAP 进行与非操作并返回计算结果，其中入参第一个叫 基准 BITMAP，第二个叫 排除 BITMAP。"
}
---

## 描述

将两个 BITMAP 进行与非操作并返回计算结果，其中入参第一个叫 `基准 BITMAP`，第二个叫 `排除 BITMAP`。

## 别名

- BITMAP_ANDNOT

## 语法

```sql
BITMAP_AND_NOT(<bitmap1>, <bitmap2>)
```

## 参数

| 参数          | 说明               |
|-------------|------------------|
| `<bitmap1>` | 被求与非的`基准 BITMAP` |
| `<bitmap2>` | 被求与非的`排除 BITMAP` |

## 返回值

返回一个 BITMAP。
- 当参数存在NULL值时，返回 NULL

## 举例

```sql
select bitmap_count(bitmap_and_not(bitmap_from_string('1,2,3'),bitmap_from_string('3,4,5'))) cnt;
```

```text
+------+
| cnt  |
+------+
|    2 |
+------+
```

```sql
select bitmap_to_string(bitmap_and_not(bitmap_from_string('1,2,3'),bitmap_from_string('3,4,5'))) as cnt;
```

```text
+------+
| cnt  |
+------+
| 1,2  |
+------+
```

```sql
select bitmap_to_string(bitmap_and_not(bitmap_from_string('1,2,3'),bitmap_empty())) cnt;
```

```text
+-------+
| cnt   |
+-------+
| 1,2,3 |
+-------+
```

```sql
select bitmap_to_string(bitmap_and_not(bitmap_from_string('1,2,3'),NULL)) as res;
```

```text
+------+
| res  |
+------+
| NULL |
+------+
```
