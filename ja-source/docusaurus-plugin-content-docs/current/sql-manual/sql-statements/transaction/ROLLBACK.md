---
{
  "title": "ROLLBACK",
  "language": "ja",
  "description": "明示的なトランザクションをロールバックします。BEGINと対で使用されます。"
}
---
## 説明

明示的なトランザクションをロールバックします。[BEGIN](./BEGIN)と組み合わせて使用されます。

## Syntax（Syntax）

```sql
ROLLBACK
```
## 使用上の注意

- 明示的なトランザクションが開始されていない場合、このコマンドを実行しても効果がありません。

## 例

以下の例では、`test`という名前のテーブルを作成し、トランザクションを開始し、2行のデータを挿入し、トランザクションをロールバックしてから、クエリを実行します。

```sql
CREATE TABLE `test` (
  `ID` int NOT NULL,
  `NAME` varchar(100) NULL,
  `SCORE` int NULL
) ENGINE=OLAP
DUPLICATE KEY(`ID`)
DISTRIBUTED BY HASH(`ID`) BUCKETS 1
PROPERTIES (
    "replication_allocation" = "tag.location.default: 3"
);

BEGIN;
INSERT INTO test VALUES(1, 'Bob', 100);
INSERT INTO test VALUES(2, 'Bob', 100);
ROLLBACK;
SELECT * FROM test;
```
