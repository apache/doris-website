---
{
    "title": "catalog_meta_cache_statistics",
    "language": "ja",
    "description": "FE ノード上の External Catalog メタデータキャッシュについて、設定、動作状況、メモリ制御の統計を確認します。"
}
---

## 概要

`catalog_meta_cache_statistics` は、現在のユーザーに表示可能な FE、External Catalog、メタデータキャッシュエンジン、キャッシュエントリの組み合わせごとに一行を表示します。キャッシュ設定と Caffeine の動作統計に加え、Doris 4.1.4 で導入された保持メモリの上限、推定使用量、エビクションされた重み、キャッシュへの登録拒否に関する情報を含みます。

## データベース

`information_schema`

## テーブル情報

| カラム | 型 | 説明 |
|---|---|---|
| `FE_HOST` | STRING | この行を報告する FE ノード。 |
| `CATALOG_NAME` | STRING | External Catalog の名前。 |
| `ENGINE_NAME` | STRING | `hive`、`iceberg`、`paimon` などのメタデータキャッシュエンジン。 |
| `ENTRY_NAME` | STRING | エンジン内のキャッシュエントリ。 |
| `EFFECTIVE_ENABLED` | BOOLEAN | 有効化設定、TTL、容量、重みの設定を評価した結果、このエントリが現在有効かどうか。 |
| `CONFIG_ENABLED` | BOOLEAN | 設定された `enable` の値。 |
| `AUTO_REFRESH` | BOOLEAN | 管理された自動更新が有効かどうか。 |
| `TTL_SECOND` | BIGINT | 有効期限までの秒数。`-1` は期限なしを意味し、`0` はエントリを無効にします。 |
| `CAPACITY` | BIGINT | 設定された件数ベースの容量。`max-weight` を使用する場合、同時に保持できる件数の上限にはなりませんが、`0` はエントリを無効にします。 |
| `ESTIMATED_SIZE` | BIGINT | キャッシュされたマッピングのおおよその件数。 |
| `REQUEST_COUNT` | BIGINT | キャッシュ検索リクエストの総数。 |
| `HIT_COUNT` | BIGINT | キャッシュヒットの件数。 |
| `MISS_COUNT` | BIGINT | キャッシュミスの件数。 |
| `HIT_RATE` | DOUBLE | `0.0` から `1.0` までのキャッシュヒット率。 |
| `LOAD_SUCCESS_COUNT` | BIGINT | キャッシュへの読み込みに成功した件数。 |
| `LOAD_FAILURE_COUNT` | BIGINT | キャッシュへの読み込みに失敗した件数。 |
| `TOTAL_LOAD_TIME_MS` | BIGINT | キャッシュへの読み込みにかかった合計時間（ミリ秒）。 |
| `AVG_LOAD_PENALTY_MS` | DOUBLE | キャッシュへの読み込みにかかった平均時間（ミリ秒）。 |
| `EVICTION_COUNT` | BIGINT | Caffeine および明示的なローカル予算によるエビクションの件数。 |
| `INVALIDATE_COUNT` | BIGINT | 明示的な無効化の件数。 |
| `LAST_LOAD_SUCCESS_TIME` | STRING | 直近で読み込みに成功した時刻。 |
| `LAST_LOAD_FAILURE_TIME` | STRING | 直近で読み込みに失敗した時刻。 |
| `LAST_ERROR` | STRING | 直近の読み込みエラー。記録がない場合は空です。 |
| `WEIGHT_BOUNDED` | BOOLEAN | このエントリが、適用される FE、Catalog、またはエントリのメモリ上限によって制御されるかどうか。 |
| `MAX_WEIGHT` | BIGINT | このエントリに適用されるメモリ上限（バイト）。 |
| `ESTIMATED_WEIGHT` | BIGINT | このエントリに対して現在予約されている推定メモリ量（バイト）。 |
| `EVICTION_WEIGHT` | BIGINT | 自動エビクションおよびローカル予算によるエビクションで解放された推定バイト数の累計。 |
| `WEIGHT_REJECT_COUNT` | BIGINT | 推定が不完全であるか、重みの予算が不足しているため、キャッシュへの登録が拒否された累計件数。 |
| `CATALOG_MAX_WEIGHT` | BIGINT | Catalog のメモリ上限（バイト）。 |
| `CATALOG_ESTIMATED_WEIGHT` | BIGINT | この Catalog の管理対象エントリ全体に対して現在予約されている推定メモリ量。 |
| `GLOBAL_MAX_WEIGHT` | BIGINT | FE 全体の外部メタデータキャッシュのメモリ上限（バイト）。 |
| `GLOBAL_ESTIMATED_WEIGHT` | BIGINT | FE 上の管理対象外部メタデータキャッシュ全体に対して現在予約されている推定メモリ量。 |
| `LAST_WEIGHT_REJECT_REASON` | STRING | 直近で重みに基づくキャッシュへの登録が拒否された理由。 |

件数で制限されるエントリ、または親の上限が設定されていない場合、重みに関する数値カラムは、値が適用されないときに `-1` を使用します。

重みに関するカラムには、次の二種類の時間的な意味があります。

- `ESTIMATED_WEIGHT` はゲージ値です。クエリ実行時の予約量を示します。
- `WEIGHT_REJECT_COUNT` およびその他の件数を表すカラムは、現在のキャッシュインスタンスにおける累計値です。Catalog のプロパティ変更または FE の再起動後にキャッシュグループが再構築されると、ゼロから再び計測されます。

このテーブルには過去のサンプルは保持されません。推移を確認する必要がある場合は、定期的にサンプリングしてください。

## 使用例

Catalog ごとに、メモリ制御対象エントリの予約量を集計します。通常、FE のメモリを調査するときに最初に実行するクエリです。

```sql
SELECT fe_host, catalog_name,
       SUM(estimated_weight) AS estimated_weight,
       SUM(weight_reject_count) AS weight_reject_count
FROM information_schema.catalog_meta_cache_statistics
WHERE max_weight >= 0
GROUP BY fe_host, catalog_name
ORDER BY estimated_weight DESC;
```

メモリ制御対象エントリと、直近のキャッシュへの登録結果を確認します。

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
