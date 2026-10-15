---
{
    "title": "catalog_meta_cache_statistics",
    "language": "ja",
    "description": "FE ノードにおける External Catalog のメタデータキャッシュの設定、動作状況、メモリ制御の統計情報を確認します。"
}
---

## 概要

`catalog_meta_cache_statistics` は、現在のユーザーが参照できる FE、External Catalog、メタデータキャッシュエンジン、キャッシュエントリの組み合わせごとに一行を表示します。キャッシュの設定と Caffeine の動作状況に加え、Doris 4.1.4 で導入された保持メモリの上限、推定使用量、キャッシュ登録の拒否回数を示します。

## データベース

`information_schema`

## テーブル情報

| カラム | 型 | 説明 |
|---|---|---|
| `FE_HOST` | STRING | この行の情報を報告する FE ノード。 |
| `CATALOG_NAME` | STRING | External Catalog の名前。 |
| `ENGINE_NAME` | STRING | `hive`、`iceberg`、`paimon` などのメタデータキャッシュエンジン。 |
| `ENTRY_NAME` | STRING | エンジン内のキャッシュエントリ。 |
| `EFFECTIVE_ENABLED` | BOOLEAN | 有効化設定、TTL、容量、重みの設定を評価した結果、このエントリが現在有効かどうか。 |
| `CONFIG_ENABLED` | BOOLEAN | 設定された `enable` の値。 |
| `AUTO_REFRESH` | BOOLEAN | 管理された自動更新が有効かどうか。 |
| `TTL_SECOND` | BIGINT | 有効期限（秒）。`-1` は期限なし、`0` はエントリの無効化を意味します。 |
| `CAPACITY` | BIGINT | 設定された件数の容量。`max-weight` を使用する場合、同時に保持できる件数の上限ではありませんが、`0` は引き続きエントリを無効化します。 |
| `ESTIMATED_SIZE` | BIGINT | キャッシュされたマッピングの概数。 |
| `REQUEST_COUNT` | BIGINT | キャッシュ参照リクエストの総数。 |
| `HIT_COUNT` | BIGINT | キャッシュヒット数。 |
| `MISS_COUNT` | BIGINT | キャッシュミス数。 |
| `HIT_RATE` | DOUBLE | `0.0` から `1.0` までのキャッシュヒット率。 |
| `LOAD_SUCCESS_COUNT` | BIGINT | キャッシュの読み込みに成功した回数。 |
| `LOAD_FAILURE_COUNT` | BIGINT | キャッシュの読み込みに失敗した回数。 |
| `TOTAL_LOAD_TIME_MS` | BIGINT | キャッシュの読み込みにかかった合計時間（ミリ秒）。 |
| `AVG_LOAD_PENALTY_MS` | DOUBLE | キャッシュの読み込みにかかった平均時間（ミリ秒）。 |
| `EVICTION_COUNT` | BIGINT | Caffeine による削除と、ローカルのメモリ予算に基づく明示的な削除の回数。 |
| `EVICTION_RATE` | DOUBLE | `EVICTION_COUNT` と `REQUEST_COUNT` の比率。リクエストがない場合は `0`。 |
| `INVALIDATE_COUNT` | BIGINT | 明示的な無効化の回数。 |
| `LAST_LOAD_SUCCESS_TIME` | STRING | 最後に読み込みが成功した時刻。 |
| `LAST_LOAD_FAILURE_TIME` | STRING | 最後に読み込みが失敗した時刻。 |
| `LAST_ERROR` | STRING | 最後に発生した読み込みエラー。記録がない場合は空。 |
| `MAX_WEIGHT` | BIGINT | エントリに適用されるメモリ上限（バイト）。 |
| `ESTIMATED_WEIGHT` | BIGINT | このエントリに現在予約されている推定メモリ量（バイト）。 |
| `WEIGHT_REJECT_COUNT` | BIGINT | 推定値が不完全、または重みの予算が不足しているためにキャッシュへの登録が拒否された累計回数。 |
| `LAST_WEIGHT_REJECT_REASON` | STRING | 重みに基づくキャッシュ登録が最後に拒否された理由。 |

適用可能な FE、Catalog、エントリのメモリ上限がないエントリでは、`MAX_WEIGHT` は `-1`、`ESTIMATED_WEIGHT` は `0` です。

重みに関するカラムには、次の二種類の時間的な意味があります。

- `ESTIMATED_WEIGHT` はゲージ値です。クエリ実行時点の予約量を示します。
- `WEIGHT_REJECT_COUNT` とその他のカウント系カラムは、現在のキャッシュインスタンスについての累計値です。Catalog のプロパティ変更後にキャッシュグループが再構築された場合、または FE が再起動した場合は、ゼロから再集計されます。

このテーブルは過去のサンプル値を保持しません。推移を確認する必要がある場合は、定期的にサンプリングしてください。

## 使用例

Catalog ごとに、メモリ制御の対象となるエントリの予約量を集計します。通常、FE のメモリを調査する際に最初に実行するクエリです。

```sql
SELECT fe_host, catalog_name,
       SUM(estimated_weight) AS estimated_weight,
       SUM(weight_reject_count) AS weight_reject_count
FROM information_schema.catalog_meta_cache_statistics
WHERE max_weight >= 0
GROUP BY fe_host, catalog_name
ORDER BY estimated_weight DESC;
```

メモリ制御の対象となるエントリと、直近のキャッシュ登録結果を確認します。

```sql
SELECT fe_host, catalog_name, engine_name, entry_name,
       max_weight, estimated_weight,
       weight_reject_count, last_weight_reject_reason
FROM information_schema.catalog_meta_cache_statistics
WHERE max_weight >= 0
ORDER BY fe_host, catalog_name, engine_name, entry_name;
```

一つの Catalog について、キャッシュの有効性と読み込み失敗を確認します。
一つの Catalog について、キャッシュの有効性と読み込み失敗を確認します。

```sql
SELECT engine_name, entry_name, effective_enabled,
       estimated_size, request_count, hit_rate,
       load_failure_count, last_error
FROM information_schema.catalog_meta_cache_statistics
WHERE catalog_name = 'iceberg_ctl'
ORDER BY engine_name, entry_name;
```
