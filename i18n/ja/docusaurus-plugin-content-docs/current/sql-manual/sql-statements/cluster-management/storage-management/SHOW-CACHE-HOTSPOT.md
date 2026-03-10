---
{
  "title": "CACHE HOTSPOTを表示",
  "language": "ja",
  "description": "このステートメントは、ファイルcacheのhotspot情報を表示するために使用されます。"
}
---
## 説明

このステートメントは、ファイルキャッシュのホットスポット情報を表示するために使用されます。

:::info Note

バージョン3.0.4より前では、`SHOW CACHE HOTSPOT`ステートメントを使用してキャッシュホットスポット情報の統計を照会することができました。バージョン3.0.4以降、キャッシュホットスポット情報統計に対する`SHOW CACHE HOTSPOT`ステートメントの使用はサポートされなくなりました。クエリには直接システムテーブル`__internal_schema.cloud_cache_hotspot`にアクセスしてください。詳細な使用方法については、[MANAGING FILE CACHE](../../../../compute-storage-decoupled/file-cache/file-cache)を参照してください。



## 構文

```sql
   SHOW CACHE HOTSPOT '/[<compute_group_name>/<table_name>]';
```
## パラメータ


| パラメータ名	                  | 説明                                                         |
|---------------------------|--------------------------------------------------------------|
| <compute_group_name>        | compute groupの名前。                                               |
| <table_name>                | テーブルの名前。                                                   |
## 例

1. システム全体のキャッシュホットスポット情報を表示する：

```sql
SHOW CACHE HOTSPOT '/';
```
2. 特定のcompute group my_compute_groupのキャッシュホットスポット情報を表示する:

```sql
SHOW CACHE HOTSPOT '/my_compute_group/';
```
## 参考資料

- [WARMUP CACHE](../../../../sql-manual/sql-statements/cluster-management/storage-management/WARM-UP)
- [MANAGING FILE CACHE](../../../../compute-storage-decoupled/file-cache/file-cache)
