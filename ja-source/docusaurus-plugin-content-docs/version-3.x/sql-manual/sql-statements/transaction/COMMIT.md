---
{
  "title": "COMMIT",
  "description": "明示的なトランザクションを送信します。BEGINと組み合わせて使用されます。",
  "language": "ja"
}
---
## デスクリプション

明示的なトランザクションを送信します。[BEGIN](./BEGIN)とペアで使用されます。

## Syntax

```sql
COMMIT
```
## 注意事項

- 明示的なトランザクションが有効になっていない場合、このコマンドを実行しても効果がありません。

## 例

以下の例では、`test`という名前のTableを作成し、トランザクションを開始して2行のデータを挿入し、トランザクションをコミットしてからクエリを実行します。

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
