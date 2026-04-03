---
{
  "title": "集約キーモデルでのデータ更新",
  "language": "ja",
  "description": "この文書では、主にデータロードに基づくDoris Aggregateモデルの更新方法について紹介します。"
}
---
このドキュメントは主にデータロードに基づいてDoris Aggregateモデルを更新する方法について説明します。

## 行全体の更新

Stream Load、Broker Load、Routine Load、Insert Intoなど、Dorisがサポートする方法を使用してAggregateモデルテーブルにデータをロードする場合、新しい値は列の集約関数に従って古い値と集約され、新しい集約値を生成します。この値は挿入時または非同期compaction時に生成される場合がありますが、ユーザーはクエリ時に同じ戻り値を取得します。

## Aggregateモデルの部分列更新

Aggregateテーブルは主にデータ更新シナリオではなく事前集約シナリオで使用されますが、集約関数をREPLACE_IF_NOT_NULLに設定することで部分列更新を実現できます。

**テーブル作成**

更新が必要なフィールドの集約関数を`REPLACE_IF_NOT_NULL`に設定します。

```sql
CREATE TABLE order_tbl (
  order_id int(11) NULL,
  order_amount int(11) REPLACE_IF_NOT_NULL NULL,
  order_status varchar(100) REPLACE_IF_NOT_NULL NULL
) ENGINE=OLAP
AGGREGATE KEY(order_id)
COMMENT 'OLAP'
DISTRIBUTED BY HASH(order_id) BUCKETS 1
PROPERTIES (
"replication_allocation" = "tag.location.default: 1"
);
```
**データ挿入**

Stream Load、Broker Load、Routine Load、または`INSERT INTO`のいずれであっても、更新するフィールドのデータを直接書き込みます。

**例**

前の例と同様に、対応するStream Loadコマンドは次の通りです（追加のヘッダーは不要）：

```shell
$ cat update.csv

1,To be shipped

curl  --location-trusted -u root: -H "column_separator:," -H "columns:order_id,order_status" -T ./update.csv http://127.0.0.1:8030/api/db1/order_tbl/_stream_load
```
対応する`INSERT INTO`文は次のとおりです（追加のセッション変数設定は不要）：

```sql
INSERT INTO order_tbl (order_id, order_status) values (1,'Shipped');
```
## 部分的な列の更新に関する注意事項

Aggregate Keyモデルは書き込み処理中に追加の処理を行わないため、書き込みパフォーマンスに影響はなく、通常のデータロードと同様です。しかし、クエリ中の集約のコストは比較的高く、典型的な集約クエリのパフォーマンスはUnique KeyモデルのMerge-on-Write実装より5-10倍低くなります。

`REPLACE_IF_NOT_NULL`集約関数は値がNULLでない場合にのみ有効になるため、ユーザーはフィールド値をNULLに変更することはできません。
