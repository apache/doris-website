---
{
  "title": "SHOW CATALOG RECYCLE BIN",
  "language": "ja",
  "description": "このステートメントは、リサイクルビンにあるデータベース、テーブル、またはパーティションの復旧可能なメタデータを表示するために使用されます。"
}
---
## 説明

このステートメントは、ゴミ箱内のデータベース、テーブル、またはパーティションの回復可能なメタデータを表示するために使用されます。

## 構文

```sql
SHOW CATALOG RECYCLE BIN [ WHERE NAME [ = "<name>" | LIKE "<name_matcher>"] ]
```
## オプションパラメータ

名前でフィルタ

**1. `<name>`**
> データベース、テーブル、またはパーティションの名前。

パターンマッチングでフィルタ

**1. `<name_matcher>`**
> データベース、テーブル、またはパーティションの名前のパターンマッチング。

## 戻り値

| Column         | Type     | Note                                                                                                                                                                             |
|----------------|----------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Type           | String   | メタデータタイプ: Database、Table、Partition                                                                                                                                        |
| Name           | String   | メタデータ名                                                                                                                                                                    |
| DbId           | Bigint   | データベースのID                                                                                                                                                               |
| TableId        | Bigint   | テーブルのID                                                                                                                                                                  |
| PartitionId    | Bigint   | パーティションのID                                                                                                                                                              |
| DropTime       | DateTime | メタデータがリサイクルビンに移動された時刻                                                                                                                              |
| DataSize       | Bigint   | データサイズ。メタデータタイプがdatabaseの場合、この値にはリサイクルビン内のすべてのテーブルとパーティションのデータサイズが含まれます                                                   |
| RemoteDataSize | Decimal  | リモートストレージ（HDFSまたはオブジェクトストレージ）上のデータサイズ。メタデータタイプがdatabaseの場合、この値にはリサイクルビン内のすべてのテーブルとパーティションのリモートデータサイズが含まれます |

## アクセス制御要件

| Privilege   | Object | Notes |
|-------------|--------|-------|
| ADMIN_PRIV  |        |       |

## 例

1. リサイクルビン内のすべてのメタデータを表示

    ```sql
    SHOW CATALOG RECYCLE BIN;
    ```
2. ごみ箱で名前が 'test' のメタデータを表示する

    ```sql
    SHOW CATALOG RECYCLE BIN WHERE NAME = 'test';
    ```
3. ごみ箱内で'test'で始まる名前のメタデータを表示する

    ```sql
    SHOW CATALOG RECYCLE BIN WHERE NAME LIKE 'test%';
    ```
