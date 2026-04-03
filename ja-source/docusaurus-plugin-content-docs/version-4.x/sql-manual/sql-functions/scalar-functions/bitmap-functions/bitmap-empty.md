---
{
  "title": "BITMAP_EMPTY",
  "description": "空のBITMAPを構築します。主にinsertやstream loadの際にデフォルト値を埋めるために使用されます。例：",
  "language": "ja"
}
---
## 説明

空のBITMAPを構築します。主にinsertまたはstream load中にデフォルト値を埋めるために使用されます。例：

```
cat data | curl --location-trusted -u user:passwd -T - -H "columns: dt,page,v1,v2=bitmap_empty()"   http://127.0.0.1:8040/api/test_database/test_table/_stream_load
```
## 構文

```sql
BITMAP_EMPTY()
```
## Return Value

要素のない空の配列を返します

## Examples

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
