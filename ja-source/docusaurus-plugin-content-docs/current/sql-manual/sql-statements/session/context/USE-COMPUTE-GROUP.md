---
{
  "title": "COMPUTE GROUPを使用",
  "language": "ja",
  "description": "ストレージとコンピュートが分離されたバージョンでは、使用するcomputeクラスターを指定してください。"
}
---
## 説明

ストレージとコンピュートが分離されたバージョンでは、使用するコンピュートクラスターを指定します。

## 構文

```sql
USE { [ <catalog_name>. ]<database_name>[ @<compute_group_name> ] | @<compute_group_name> }
```
## 必須パラメータ

`<compute_group_name>`： compute clusterの名前。

## 戻り値

compute clusterの切り替えが成功した場合は"Database changed"を返し、切り替えが失敗した場合は対応するエラーメッセージを返します。

## 例

1. 使用するcompute cluster `compute_cluster`を指定する：

    ```sql
    use @compute_cluster;
    Database changed
    ```
2. 使用するデータベース `mysql` とコンピュートクラスター `compute_cluster` の両方を指定します：

    ```sql
    use mysql@compute_cluster
    Database changed
    ```
## Permission Control

このSQLコマンドを正常に実行するための前提条件は、compute groupに対するUSAGE_PRIV権限を持つことです。権限に関するドキュメントを参照してください。

| Privilege  | Object        | Notes                                 |
| :--------- | :------------ | :------------------------------------ |
| USAGE_PRIV | Compute group | compute clusterを使用する権限 |

ユーザーがcompute group権限を持たずにcompute groupを指定しようとすると、エラーが報告されます。例えば、`test`はcompute group権限を持たない一般ユーザーです：

```sql
mysql -utest -h175.40.1.1 -P9030

use @compute_cluster;
ERROR 5042 (42000): errCode = 2, detailMessage = USAGE denied to user test'@'127.0.0.1' for compute group 'compute_cluster'
```
## 注意事項

1. データベース名またはコンピュートグループ名が予約キーワードの場合、バッククォートで囲む必要があります。例：

    ```sql
    use @`create`
    ```
2. compute groupが存在しない場合、エラーメッセージが返されます：

    ```sql
    mysql> use @compute_group_not_exist;
    ERROR 5098 (42000): errCode = 2, detailMessage = Compute Group compute_group_not_exist not exist
    ```
