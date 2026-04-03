---
{
  "title": "BITMAP_EMPTY",
  "language": "ja",
  "description": "空のBITMAPを構築します。主にinsertまたはstream load時のデフォルト値の埋め込みに使用されます。例："
}
---
## 説明

空のBITMAPを構築します。主にinsertやstream load時のデフォルト値の埋め込みに使用されます。例：

```
cat data | curl --location-trusted -u user:passwd -T - -H "columns: dt,page,v1,v2=bitmap_empty()"   http://127.0.0.1:8040/api/test_database/test_table/_stream_load
```
## 構文

```sql
BITMAP_EMPTY()
```
## 戻り値

要素を持たない空の配列を返します

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
