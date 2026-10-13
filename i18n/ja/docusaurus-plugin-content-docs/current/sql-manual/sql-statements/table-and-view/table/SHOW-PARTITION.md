---
{
    "title": "SHOW PARTITION",
    "language": "ja",
    "description": "SHOW PARTITION は指定したパーティションの詳細情報を表示します。関連するデータベースの名前と ID、"
}
---

## 説明

SHOW PARTITION は指定したパーティションの詳細情報を表示します。関連するデータベースとテーブルの名前および ID、パーティション名が含まれます。

## 構文

```sql
SHOW PARTITION <partition_id>
```

## 必須パラメータ

**<partition_id>**

> パーティションの ID。パーティション ID は SHOW PARTITIONS などで取得できます。詳細は「SHOW PARTITIONS」を参照してください。

## 必要な権限

この SQL コマンドを実行するユーザーには、少なくとも `ADMIN_PRIV` 権限が必要です。

## 例

パーティション ID 13004 の情報を照会します。

```sql
SHOW PARTITION 13004;
```

実行結果:

```text
+--------+-----------+---------------+-------+---------+
| DbName | TableName | PartitionName | DbId  | TableId |
+--------+-----------+---------------+-------+---------+
| ods    | sales     | sales         | 13003 | 13005   |
+--------+-----------+---------------+-------+---------+
```