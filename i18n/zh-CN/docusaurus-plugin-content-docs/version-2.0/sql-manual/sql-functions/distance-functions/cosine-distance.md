---
{
    "title": "COSINE_DISTANCE",
    "language": "zh-CN"
}
---

## cosine_distance

## 描述
## 语法

```sql
DOUBLE cosine_distance(ARRAY<T> array1, ARRAY<T> array2)
```

计算两个向量（向量值为坐标）之间的余弦距离
如果输入array为NULL，或者array中任何元素为NULL，则返回NULL

### 注意事项
* 输入数组的子类型支持：TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE
* 输入数组array1和array2，元素数量需保持一致

## 举例

```
sql> SELECT cosine_distance([1, 2], [2, 3]);
+-------------------------------------------+
| cosine_distance(ARRAY(1, 2), ARRAY(2, 3)) |
+-------------------------------------------+
|                     0.0077221232863322609 |
+-------------------------------------------+
```

### keywords
	COSINE_DISTANCE,DISTANCE,COSINE,ARRAY
