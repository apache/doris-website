---
{
    "title": "L1_DISTANCE",
    "language": "zh-CN"
}
---

## l1_distance

## 描述
## 语法

```sql
DOUBLE l1_distance(ARRAY<T> array1, ARRAY<T> array2)
```

计算L1空间中两点（向量值为坐标）之间的距离
如果输入array为NULL，或者array中任何元素为NULL，则返回NULL

### 注意事项
* 输入数组的子类型支持：TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE
* 输入数组array1和array2，元素数量需保持一致

## 举例

```
sql> SELECT l1_distance([1, 2], [2, 3]);
+---------------------------------------+
| l1_distance(ARRAY(1, 2), ARRAY(2, 3)) |
+---------------------------------------+
|                                     2 |
+---------------------------------------+
```

### keywords
	L1_DISTANCE,DISTANCE,L1,ARRAY
