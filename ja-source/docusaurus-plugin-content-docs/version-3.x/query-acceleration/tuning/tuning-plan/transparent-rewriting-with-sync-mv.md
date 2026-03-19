---
{
  "title": "Sync-Materialized Viewを使用した透過的な書き換え",
  "description": "Sync-Materialized Viewは、事前に定義されたSELECT文に従ってデータを事前計算し、格納する特別な種類のtableです。",
  "language": "ja"
}
---
## 概要

[Sync-Materialized View](../../materialized-view/sync-materialized-view.md)は、事前定義されたSELECT文に従ってデータを事前計算し格納する特別な種類のtableです。その主な目的は、任意の次元から生の詳細データを分析するユーザーのニーズを満たし、固定次元での迅速な分析とクエリを可能にすることです。

同期マテリアライズドビューの適用シナリオは以下の通りです：

1. 分析要件が詳細データクエリと固定次元クエリの両方をカバーする場合。
2. クエリがtable内の*少数*の列または行のみを含む場合。
3. クエリが長時間の集約操作など、時間のかかる処理操作を含む場合。
4. クエリが異なるプレフィックスインデックスとマッチする必要がある場合。

同じサブクエリの結果を頻繁かつ繰り返し使用するクエリに対して、同期マテリアライズドビューはパフォーマンスを大幅に改善できます。Dorisは、ベースtableとマテリアライズドビューtable間のデータ整合性を保証するため、追加の手動メンテナンスコストを必要とせずにマテリアライズドビューのデータを自動的に維持します。クエリ実行時、システムは最適なマテリアライズドビューを自動的にマッチングし、そこから直接データを読み取ります。

:::tip 注意事項
- Doris 2.0*以降*のバージョンでは、マテリアライズドビューにはいくつかの拡張機能があります。正式な本番環境でマテリアライズドビューを使用する前に、テスト環境で期待するクエリが作成したいマテリアライズドビューにヒットできることをユーザーが確認することを推奨します。
- 同一table上に類似した形式の複数のマテリアライズドビューを作成することは推奨されません。これは複数のマテリアライズドビュー間の競合を引き起こし、クエリヒットの失敗を招く可能性があります。
  :::

## ケース

以下では、同期マテリアライズドビューを使用してクエリを高速化するプロセスを具体的な例で説明します：

`sales_records`という名前の詳細な売上記録tableがあるとします。このtableは、取引ID、営業担当者ID、販売店舗ID、売上日、取引金額など、各取引の様々な情報を詳細に記録しています。現在、異なる店舗の売上高に対する分析とクエリを頻繁に実行する必要があります。

これらのクエリのパフォーマンスを最適化するために、`store_amt`という名前のマテリアライズドビューを作成できます。このビューは販売店舗でグループ化し、同じ店舗の売上金額を合計します。具体的な手順は以下の通りです：

### Sync-Materialized Viewの作成

まず、以下のSQL文を使用してマテリアライズドビュー`store_amt`を作成します：

```sql
CREATE MATERIALIZED VIEW store_amt AS 
SELECT store_id, SUM(sale_amt) 
FROM sales_records
GROUP BY store_id;
```
作成タスクを送信した後、DorisはこのSynchronous Materialized Viewをバックグラウンドで非同期的に構築します。以下のコマンドを使用してMaterialized Viewの作成進捗を確認できます：

```sql
SHOW ALTER TABLE MATERIALIZED VIEW FROM db_name;
```
`State`フィールドが`FINISHED`になった場合、`store_amt`マテリアライズドビューが正常に作成されたことを意味します。

### Transparent Rewriting

マテリアライズドビューが作成された後、異なる店舗の売上高をクエリする際、Dorisは自動的に`store_amt`マテリアライズドビューをマッチングし、そこから事前集計されたデータを直接読み取るため、クエリ効率が大幅に向上します。クエリステートメントは以下の通りです：

```sql
SELECT store_id, SUM(sale_amt) FROM sales_records GROUP BY store_id;
```
また、`EXPLAIN`コマンドを使用して、クエリがマテリアライズドビューに正常にヒットしたかどうかを確認することもできます：

```sql
EXPLAIN SELECT store_id, SUM(sale_amt) FROM sales_records GROUP BY store_id;
```
実行プランの最後に、以下のような表示がされた場合、クエリが`store_amt`マテリアライズドビューに正常にヒットしたことを意味します：

```sql
TABLE: default_cluster:test.sales_records(store_amt), PREAGGREGATION: ON
```
上記の手順により、同期materialized viewを使用してクエリパフォーマンスを最適化し、データ分析の効率を向上させることができます。

## まとめ

同期materialized viewを作成することで、関連する集約分析のクエリ速度を大幅に向上させることができます。単一Tableのmaterialized viewは、統計分析を迅速に実行できるだけでなく、詳細データのクエリニーズも柔軟にサポートし、これはDorisにおいて非常に強力な機能です。
