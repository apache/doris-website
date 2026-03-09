---
{
  "title": "重複キーテーブル",
  "language": "ja",
  "description": "DorisのDuplicate Key Tableは、デフォルトのテーブルタイプであり、個別の生データレコードを格納するように設計されています。"
}
---
DorisにおけるDuplicate Key Tableはデフォルトのテーブル型で、個別の生データレコードを保存するために設計されています。テーブル作成時に指定される`Duplicate Key`は、ソートと保存のカラムを決定し、一般的なクエリを最適化します。ソートキーとして3つ以下のカラムを選択することが推奨されます。より具体的な選択ガイドラインについては、[Sort Key](../index/prefix-index)を参照してください。Duplicate Key Tableには以下の特徴があります：

* **生データの保持**: Duplicate Key Tableは全ての元データを保持するため、生データの保存とクエリに理想的です。データ損失を避けるために、詳細なデータ分析が必要なユースケースに推奨されます。

* **重複排除や集約なし**: AggregateテーブルやPrimary Keyテーブルとは異なり、Duplicate Key Tableは重複排除や集約を行わず、同一レコードを完全に保持します。

* **柔軟なデータクエリ**: Duplicate Key Tableは全ての元データを保持するため、メタデータ監査や細かい分析において、あらゆる次元で詳細な抽出と集約を可能にします。

## ユースケース

Duplicate Key Tableでは、データは一般的に追加のみで、古いデータは更新されません。Duplicate Key Tableは完全な生データが必要なシナリオに理想的です：

* **ログストレージ**: アクセスログ、エラーログなど、さまざまな種類のアプリケーションログを保存するために使用されます。各データは将来の監査と分析のために詳細である必要があります。

* **ユーザー行動データ**: クリックデータやユーザーアクセスパスなど、ユーザー行動を分析する際に、詳細なユーザーアクションを保持することが必要です。これは、ユーザープロファイルの構築と行動パターンの詳細な分析に役立ちます。

* **トランザクションデータ**: トランザクションや注文データを保存するために、トランザクションが完了すると、通常はデータ変更の必要がありません...

## テーブル作成手順

テーブルを作成する際、**DUPLICATE KEY**キーワードを使用してDuplicate Key Tableを指定できます。Duplicate Key Tableは、保存時にデータをソートするために使用されるKeyカラムを指定する必要があります。以下の例では、Duplicate Key Tableはログ情報を保存し、`log_time`、`log_type`、`error_code`カラムに基づいてデータをソートします：

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
## データ挿入とストレージ

Duplicate Keyテーブルでは、データは重複排除や集約されません。データを挿入すると直接格納されます。Duplicate Key TableのKeyカラムはソートに使用されます。

![columnar_storage](/images/table-desigin/duplicate-table-insert.png)

上記の例では、初期の4行に2行を挿入した後、データが追加され、合計6行になります。

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
