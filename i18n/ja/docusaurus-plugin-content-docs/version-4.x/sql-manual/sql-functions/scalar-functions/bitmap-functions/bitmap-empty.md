---
{
    "title": "BITMAP_EMPTY",
    "language": "ja",
    "description": "空の BITMAP を作成します。主に INSERT または Stream Load 時にデフォルト値を埋めるために使用します。例:"
}
---

## 説明

空の BITMAP を作成します。主に INSERT または Stream Load 時にデフォルト値を埋めるために使用します。例:

```
cat data | curl --location-trusted -u user:passwd -T - -H "columns: dt,page,v1,v2=bitmap_empty()"   http://127.0.0.1:8040/api/test_database/test_table/_stream_load
```

## 構文

```sql
BITMAP_EMPTY()
```

## 戻り値

要素を含まない空の配列を返します

## 例

```sql
select bitmap_to_string(bitmap_empty());
```

```text
+----------------------------------+
| bitmap_to_string(bitmap_empty()) |
+----------------------------------+
|                                  |
+----------------------------------+
```

```sql
select bitmap_count(bitmap_empty());
```

```text
+------------------------------+
| bitmap_count(bitmap_empty()) |
+------------------------------+
|                            0 |
+------------------------------+
```
