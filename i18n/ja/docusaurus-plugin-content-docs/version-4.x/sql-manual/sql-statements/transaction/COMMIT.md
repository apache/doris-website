---
{
    "title": "COMMIT",
    "language": "ja",
    "description": "明示的なトランザクションをコミットします。BEGIN と対で使用します。"
}
---

## 説明

明示的なトランザクションをコミットします。[BEGIN](./BEGIN) と対で使用します。

## 構文

```sql
COMMIT
```

## 注意事項

- 明示的なトランザクションが有効になっていない場合、このコマンドを実行しても効果はありません。

## 例

次の例では、`test` という名前のテーブルを作成し、トランザクションを開始して二行のデータを挿入した後、トランザクションをコミットしてクエリを実行します。

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
