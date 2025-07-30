---
{
    "title": "L2_DISTANCE",
    "language": "zh-CN"
}
---

## l2_distance

## 描述
## 语法

```sql
DOUBLE l2_distance(ARRAY<T> array1, ARRAY<T> array2)
```

计算欧几里得空间中两点（向量值为坐标）之间的距离
如果输入array为NULL，或者array中任何元素为NULL，则返回NULL

### 注意事项
* 输入数组的子类型支持：TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE
* 输入数组array1和array2，元素数量需保持一致

## 举例

```
sql> SELECT l2_distance([1, 2], [2, 3]);
+---------------------------------------+
| l2_distance(ARRAY(1, 2), ARRAY(2, 3)) |
+---------------------------------------+
|                    1.4142135623730951 |
+---------------------------------------+
```

### keywords
	L2_DISTANCE,DISTANCE,L2,ARRAY
