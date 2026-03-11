---
{
  "title": "重複キーテーブル",
  "language": "ja",
  "description": "DorisのDuplicate Key tableは、デフォルトのテーブルタイプであり、個別の生データレコードを格納するように設計されています。"
}
---
Dorisの**Duplicate Key table**はデフォルトのテーブルタイプであり、個別の生データレコードを格納するために設計されています。テーブル作成時に指定される`Duplicate Key`は、ソートと格納のための列を決定し、一般的なクエリを最適化します。ソートキーとして3列以下を選択することが推奨されます。より具体的な選択ガイドラインについては、[Sort Key](../index/prefix-index)を参照してください。Duplicate Key tableには以下の特徴があります：

* **生データの保持**: Duplicate Key tableは全ての元データを保持し、生データの格納とクエリに最適です。データ損失を避けるため、詳細なデータ分析が必要なユースケースに推奨されます。

* **重複排除や集計なし**: AggregateテーブルやPrimary Keyテーブルとは異なり、Duplicate Key tableは重複排除や集計を行わず、同一のレコードを完全に保持します。

* **柔軟なデータクエリ**: Duplicate Key tableは全ての元データを保持するため、メタデータ監査やきめ細かい分析のために、あらゆる次元での詳細な抽出と集計が可能です。

## ユースケース

Duplicate Key tableでは、データは一般的に追加のみされ、古いデータは更新されません。Duplicate Key tableは完全な生データが必要なシナリオに最適です：

* **ログストレージ**: アクセスログ、エラーログなど、さまざまなタイプのアプリケーションログの格納に使用されます。将来の監査と分析のために、各データは詳細である必要があります。

* **ユーザー行動データ**: クリックデータやユーザーアクセスパスなど、ユーザー行動を分析する際、詳細なユーザーアクションを保持する必要があります。これは、ユーザープロファイルの構築と行動パターンの詳細な分析に役立ちます。

* **取引データ**: 取引や注文データの格納において、取引が完了すると、通常はデータ変更の必要がありません...

## テーブル作成手順

テーブルを作成する際、**DUPLICATE KEY**キーワードを使用してDuplicate Key tableを指定できます。Duplicate Keyテーブルは、格納時にデータをソートするために使用されるKey列を指定する必要があります。以下の例では、Duplicate Key tableはログ情報を格納し、`log_time`、`log_type`、`error_code`列に基づいてデータをソートします：

```sql
CREATE TABLE IF NOT EXISTS example_tbl_duplicate
(
    log_time        DATETIME       NOT NULL,
    log_type        INT            NOT NULL,
    error_code      INT,
    error_msg       VARCHAR(1024),
    op_id           BIGINT,
    op_time         DATETIME
)
DUPLICATE KEY(log_time, log_type, error_code)
DISTRIBUTED BY HASH(log_type) BUCKETS 10;
```
## データの挿入と保存

Duplicate Keyテーブルでは、データは重複排除や集約されません。データを挿入すると直接保存されます。Duplicate Key TableのKeyカラムはソートに使用されます。

![columnar_storage](/images/table-desigin/duplicate-table-insert.png)

上記の例では、最初の4行に2行を挿入した後、データが追加され、合計6行になります。

```sql
-- 4 rows raw data
INSERT INTO example_tbl_duplicate VALUES
('2024-11-01 00:00:00', 2, 2, 'timeout', 12, '2024-11-01 01:00:00'),
('2024-11-02 00:00:00', 1, 2, 'success', 13, '2024-11-02 01:00:00'),
('2024-11-03 00:00:00', 2, 2, 'unknown', 13, '2024-11-03 01:00:00'),
('2024-11-04 00:00:00', 2, 2, 'unknown', 12, '2024-11-04 01:00:00');

-- insert into 2 rows
INSERT INTO example_tbl_duplicate VALUES
('2024-11-01 00:00:00', 2, 2, 'timeout', 12, '2024-11-01 01:00:00'),
('2024-11-01 00:00:00', 2, 2, 'unknown', 13, '2024-11-01 01:00:00');

-- check the rows of table
SELECT * FROM example_tbl_duplicate;
+---------------------+----------+------------+-----------+-------+---------------------+
| log_time            | log_type | error_code | error_msg | op_id | op_time             |
+---------------------+----------+------------+-----------+-------+---------------------+
| 2024-11-02 00:00:00 |        1 |          2 | success   |    13 | 2024-11-02 01:00:00 |
| 2024-11-01 00:00:00 |        2 |          2 | timeout   |    12 | 2024-11-01 01:00:00 |
| 2024-11-03 00:00:00 |        2 |          2 | unknown   |    13 | 2024-11-03 01:00:00 |
| 2024-11-04 00:00:00 |        2 |          2 | unknown   |    12 | 2024-11-04 01:00:00 |
| 2024-11-01 00:00:00 |        2 |          2 | unknown   |    13 | 2024-11-01 01:00:00 |
| 2024-11-01 00:00:00 |        2 |          2 | timeout   |    12 | 2024-11-01 01:00:00 |
+---------------------+----------+------------+-----------+-------+---------------------+
```
