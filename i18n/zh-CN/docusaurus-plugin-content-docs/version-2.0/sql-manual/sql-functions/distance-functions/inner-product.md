---
{
    "title": "INNER_PRODUCT",
    "language": "zh-CN"
}
---

## inner_product

## 描述
## 语法

```sql
DOUBLE inner_product(ARRAY<T> array1, ARRAY<T> array2)
```

计算两个大小相同的向量的标量积
如果输入array为NULL，或者array中任何元素为NULL，则返回NULL

### 注意事项
* 输入数组的子类型支持：TINYINT、SMALLINT、INT、BIGINT、LARGEINT、FLOAT、DOUBLE
* 输入数组array1和array2，元素数量需保持一致

## 举例

```
sql> SELECT inner_product([1, 2], [2, 3]);
+-----------------------------------------+
| inner_product(ARRAY(1, 2), ARRAY(2, 3)) |
+-----------------------------------------+
|                                       8 |
+-----------------------------------------+
```

### keywords
	INNER_PRODUCT,DISTANCE,ARRAY
