---
{
  "title": "COMMIT",
  "language": "ja",
  "description": "明示的なトランザクションを送信します。BEGINと対で使用されます。"
}
---
## 説明

明示的なトランザクションを送信します。[BEGIN](./BEGIN)と組み合わせて使用されます。

## 構文

```sql
COMMIT
```
## 注意

- 明示的なトランザクションが有効になっていない場合、このコマンドを実行しても効果がありません。

## 例

次の例では、`test`という名前のテーブルを作成し、トランザクションを開始し、2行のデータを挿入し、トランザクションをコミットしてから、クエリを実行します。

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
INSERT INTO test VALUES(1, 'Alice', 100);
INSERT INTO test VALUES(2, 'Bob', 100);
COMMIT;
SELECT * FROM test;
```
