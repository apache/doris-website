---
{
  "title": "SHOW CATALOG RECYCLE BIN",
  "description": "この文は、リサイクルビン内のデータベース、table、またはパーティションの復元可能なメタデータを表示するために使用されます。",
  "language": "ja"
}
---
## 説明

このステートメントは、ごみ箱内のデータベース、table、またはパーティションの復元可能なメタデータを表示するために使用されます。

## 構文

```sql
SHOW CATALOG RECYCLE BIN [ WHERE NAME [ = "<name>" | LIKE "<name_matcher>"] ]
```
## オプションパラメータ

名前によるフィルタリング

**1. `<name>`**
> データベース、Table、またはパーティションの名前。

パターンマッチングによるフィルタリング

**1. `<name_matcher>`**
> データベース、Table、またはパーティションの名前のパターンマッチング。

## 戻り値

| Column         | タイプ     | Note                                                                                                                                                                             |
|----------------|----------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| タイプ           | String   | メタデータタイプ：Database、Table、パーティション                                                                                                                                        |
| Name           | String   | メタデータ名                                                                                                                                                                    |
| DbId           | Bigint   | データベースのID                                                                                                                                                               |
| TableId        | Bigint   | TableのID                                                                                                                                                                  |
| PartitionId    | Bigint   | パーティションのID                                                                                                                                                              |
| DropTime       | DateTime | メタデータがrecycle binに移動された時刻                                                                                                                              |
| DataSize       | Bigint   | データサイズ。メタデータタイプがdatabaseの場合、この値はrecycle bin内のすべてのTableとパーティションのデータサイズを含む                                                   |
| RemoteDataSize | Decimal  | リモートストレージ（HDFSまたはオブジェクトストレージ）上のデータサイズ。メタデータタイプがdatabaseの場合、この値はrecycle bin内のすべてのTableとパーティションのリモートデータサイズを含む |

## アクセス制御要件

| Privilege   | Object | 注釈 |
|-------------|--------|-------|
| ADMIN_PRIV  |        |       |

## 例

1. recycle bin内のすべてのメタデータを表示

    ```sql
    SHOW CATALOG RECYCLE BIN;
    ```
2. recycle bin内で名前が'test'のメタデータを表示する

    ```sql
    SHOW CATALOG RECYCLE BIN WHERE NAME = 'test';
    ```
3. リサイクルビンで'test'で始まる名前のメタデータを表示する

    ```sql
    SHOW CATALOG RECYCLE BIN WHERE NAME LIKE 'test%';
    ```
