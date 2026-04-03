---
{
  "title": "SHOW CACHE HOTSPOT",
  "description": "このステートメントは、file cacheのホットスポット情報を表示するために使用されます。",
  "language": "ja"
}
---
## デスクリプション

このステートメントは、ファイルキャッシュのホットスポット情報を表示するために使用されます。

:::info Note

バージョン3.0.4以前では、`SHOW CACHE HOTSPOT`ステートメントを使用してキャッシュホットスポット情報統計を照会できました。バージョン3.0.4以降、キャッシュホットスポット情報統計に対する`SHOW CACHE HOTSPOT`ステートメントの使用はサポートされなくなりました。クエリには、システムtable`__internal_schema.cloud_cache_hotspot`に直接アクセスしてください。詳細な使用方法については、MANAGING FILE CACHEを参照してください。



## Syntax

```sql
   SHOW CACHE HOTSPOT '/[<compute_group_name>/<db.table_name>]';
```
## パラメータ

| パラメータ名	                  | デスクリプション                                                         |
|---------------------------|--------------------------------------------------------------|
| <compute_group_name>        | コンピュートグループの名前。                                               |
| <table_name>                | Tableの名前。                                                   |
## Examples

1. システム全体のキャッシュホットスポット情報を表示する：

```sql
SHOW CACHE HOTSPOT '/';
```
2. 特定のcompute group my_compute_groupのキャッシュホットスポット情報を表示する：

```sql
SHOW CACHE HOTSPOT '/my_compute_group/';
```
## 参考資料


- [WARMUP CACHE](../storage-management/WARM-UP.md)
- MANAGING FILE CACHE
