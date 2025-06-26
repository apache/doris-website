---
{
    "title": "BITMAP_HASH64",
    "language": "zh-CN"
}
---

## bitmap_hash64
## 描述
## 语法

`BITMAP BITMAP_HASH64(expr)`

对任意类型的输入计算64位的哈希值，返回包含该哈希值的bitmap。主要用于stream load任务将非整型字段导入Doris表的bitmap字段。例如

```
cat data | curl --location-trusted -u user:passwd -T - -H "columns: dt,page,device_id, device_id=bitmap_hash64(device_id)"   http://host:8410/api/test/testDb/_stream_load
```

## 举例

```
mysql> select bitmap_to_string(bitmap_hash64('hello'));
+------------------------------------------+
| bitmap_to_string(bitmap_hash64('hello')) |
+------------------------------------------+
| 15231136565543391023                     |
+------------------------------------------+
```

### keywords

    BITMAP_HASH,BITMAP
