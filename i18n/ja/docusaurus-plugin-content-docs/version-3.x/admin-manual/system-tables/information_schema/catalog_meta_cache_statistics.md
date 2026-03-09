---
{
  "title": "catalog_meta_cache_statistics",
  "language": "ja",
  "description": "現在接続されているFEのExternal Catalogのメタデータキャッシュ情報を表示します。"
}
---
## 概要

現在接続されているFEのExternal Catalogのメタデータキャッシュ情報を表示します。

## Database

`information_schema`

## テーブル情報

| Column Name  | Type | Description             |
| ------------ | ---- | ----------------------- |
| CATALOG_NAME | text | Catalogの名前 |
| CACHE_NAME   | text | キャッシュの名前   |
| METRIC_NAME  | text | メトリックの名前  |
| METRIC_VALUE | text | メトリックの値 |

## 使用例

```text
+----------------------+-----------------------------+----------------------+---------------------+
| CATALOG_NAME         | CACHE_NAME                  | METRIC_NAME          | METRIC_VALUE        |
+----------------------+-----------------------------+----------------------+---------------------+
| hive_iceberg_minio   | iceberg_table_cache         | eviction_count       | 0                   |
| hive_iceberg_minio   | iceberg_table_cache         | hit_ratio            | 0.8235294117647058  |
| hive_iceberg_minio   | iceberg_table_cache         | average_load_penalty | 5.480102048333334E8 |
| hive_iceberg_minio   | iceberg_table_cache         | estimated_size       | 6                   |
| hive_iceberg_minio   | iceberg_table_cache         | hit_count            | 28                  |
| hive_iceberg_minio   | iceberg_table_cache         | read_count           | 34                  |
| hive_iceberg_minio   | iceberg_snapshot_list_cache | eviction_count       | 0                   |
| hive_iceberg_minio   | iceberg_snapshot_list_cache | hit_ratio            | 1.0                 |
| hive_iceberg_minio   | iceberg_snapshot_list_cache | average_load_penalty | 0.0                 |
| hive_iceberg_minio   | iceberg_snapshot_list_cache | estimated_size       | 0                   |
| hive_iceberg_minio   | iceberg_snapshot_list_cache | hit_count            | 0                   |
| hive_iceberg_minio   | iceberg_snapshot_list_cache | read_count           | 0                   |
| hive_iceberg_minio   | iceberg_snapshot_cache      | eviction_count       | 0                   |
| hive_iceberg_minio   | iceberg_snapshot_cache      | hit_ratio            | 0.45454545454545453 |
| hive_iceberg_minio   | iceberg_snapshot_cache      | average_load_penalty | 5.604907246666666E8 |
| hive_iceberg_minio   | iceberg_snapshot_cache      | estimated_size       | 6                   |
| hive_iceberg_minio   | iceberg_snapshot_cache      | hit_count            | 5                   |
| hive_iceberg_minio   | iceberg_snapshot_cache      | read_count           | 11                  |
```
METRIC_NAME列には、以下のCaffeineキャッシュパフォーマンスメトリクスが含まれています：
- eviction_count: キャッシュから削除されたエントリの数
- hit_ratio: ヒットしたキャッシュリクエストの比率（0.0から1.0の範囲）
- average_load_penalty: 新しい値の読み込みにかかった平均時間（ナノ秒）
- estimated_size: キャッシュ内のエントリのおおよその数
- hit_count: キャッシュ検索メソッドがキャッシュされた値を返した回数
- read_count: キャッシュ検索メソッドが呼び出された総回数
