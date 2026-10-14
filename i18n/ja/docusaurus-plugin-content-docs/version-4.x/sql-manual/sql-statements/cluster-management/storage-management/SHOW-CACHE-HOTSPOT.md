---
{
    "title": "SHOW CACHE HOTSPOT",
    "language": "ja",
    "description": "このステートメントは、ファイルキャッシュのホットスポット情報を表示するために使用します。"
}
---

## 説明

このステートメントは、ファイルキャッシュのホットスポット情報を表示するために使用します。

:::info 注意

バージョン 3.0.4 より前は、`SHOW CACHE HOTSPOT` ステートメントを使用してキャッシュのホットスポット統計を照会できました。バージョン 3.0.4 以降は、`SHOW CACHE HOTSPOT` ステートメントによるキャッシュのホットスポット統計の照会はサポートされていません。照会にはシステムテーブル `__internal_schema.cloud_cache_hotspot` に直接アクセスしてください。詳しい使用方法は、[ファイルキャッシュの管理](../../../../compute-storage-decoupled/file-cache/file-cache)を参照してください。

:::

## 構文

```sql
   SHOW CACHE HOTSPOT '/[<compute_group_name>/<table_name>]';
```

## パラメータ

| パラメータ名 | 説明 |
|-------------|------|
| <compute_group_name> | コンピュートグループの名前。 |
| <table_name> | テーブルの名前。 |

## 例

1. システム全体のキャッシュのホットスポット情報を表示します。

```sql
SHOW CACHE HOTSPOT '/';
```

2. 特定のコンピュートグループ my_compute_group のキャッシュのホットスポット情報を表示します。

```sql
SHOW CACHE HOTSPOT '/my_compute_group/';
```

## 参考

- [キャッシュのウォームアップ](../../../../sql-manual/sql-statements/cluster-management/storage-management/WARM-UP)
- [ファイルキャッシュの管理](../../../../compute-storage-decoupled/file-cache/file-cache)
