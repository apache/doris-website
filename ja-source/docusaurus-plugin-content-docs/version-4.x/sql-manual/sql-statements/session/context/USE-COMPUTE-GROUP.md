---
{
  "title": "COMPUTE GROUP を使用",
  "description": "storage-and-compute-separated版では、使用するcomputeクラスターを指定します。",
  "language": "ja"
}
---
## デスクリプション

storage-and-compute-separated バージョンにおいて、使用するコンピュートクラスターを指定します。

## Syntax

```sql
USE { [ <catalog_name>. ]<database_name>[ @<compute_group_name> ] | @<compute_group_name> }
```
## 必須パラメータ

`<compute_group_name>`： コンピュートクラスターの名前。

## 戻り値

コンピュートクラスターの切り替えが成功した場合、"Database changed"を返します。切り替えが失敗した場合、対応するエラーメッセージを返します。

## 例

1. 使用するコンピュートクラスター`compute_cluster`を指定する：

    ```sql
    use @compute_cluster;
    Database changed
    ```
2. 使用するデータベース`mysql`とコンピュートクラスター`compute_cluster`の両方を指定します：

    ```sql
    use mysql@compute_cluster
    Database changed
    ```
## 許可 Control

このSQLコマンドを正常に実行するための前提条件は、compute groupに対するUSAGE_PRIV権限を持つことです。権限に関する詳細は権限ドキュメントを参照してください。

| Privilege  | Object        | 注釈                                 |
| :--------- | :------------ | :------------------------------------ |
| USAGE_PRIV | Compute group | 許可 to use the compute cluster |

ユーザーがcompute group権限を持たずにcompute groupを指定しようとすると、エラーが報告されます。例えば、`test`はcompute group権限を持たない一般ユーザーです：

```sql
mysql -utest -h175.40.1.1 -P9030

use @compute_cluster;
ERROR 5042 (42000): errCode = 2, detailMessage = USAGE denied to user test'@'127.0.0.1' for compute group 'compute_cluster'
```
## 注釈

1. データベース名またはcompute group名が予約キーワードの場合は、バッククォートで囲む必要があります。例：

    ```sql
    use @`create`
    ```
2. compute groupが存在しない場合、エラーメッセージが返されます：

    ```sql
    mysql> use @compute_group_not_exist;
    ERROR 5098 (42000): errCode = 2, detailMessage = Compute Group compute_group_not_exist not exist
    ```
