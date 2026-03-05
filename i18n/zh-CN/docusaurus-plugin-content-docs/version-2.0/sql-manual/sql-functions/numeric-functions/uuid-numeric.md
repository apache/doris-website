---
{
    "title": "UUID_NUMERIC",
    "language": "zh-CN"
}
---

## uuid_numeric
## 描述
## 语法

`LARGEINT uuid_numeric()`

返回一个 `LARGEINT` 类型的 `uuid`。注意 `LARGEINT` 是一个 Int128，所以 `uuid_numeric()` 可能会得到负值。

## 举例

```

mysql> select uuid_numeric();
+----------------------------------------+
| uuid_numeric()                         |
+----------------------------------------+
| 82218484683747862468445277894131281464 |
+----------------------------------------+
```

### keywords
    
    UUID UUID-NUMERIC 
