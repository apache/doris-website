---
{
    "title": "USE COMPUTE GROUP",
    "language": "ja",
    "description": "ストレージとコンピュートを分離した構成で、使用するコンピュートクラスターを指定します。"
}
---

## 説明

ストレージとコンピュートを分離した構成で、使用するコンピュートクラスターを指定します。

## 構文


```sql
USE { [ <catalog_name>. ]<database_name>[ @<compute_group_name> ] | @<compute_group_name> }
```

## 必須パラメータ

`<compute_group_name>`： コンピュートクラスターの名前。

## 戻り値

コンピュートクラスターの切り替えに成功すると "Database changed" を返し、失敗すると対応するエラーメッセージを返します。

## 例

1. 使用するコンピュートクラスター `compute_cluster` を指定します。

    ```sql
    use @compute_cluster;
    Database changed
    ```

2. 使用するデータベース `mysql` とコンピュートクラスター `compute_cluster` の両方を指定します。

    ```sql
    use mysql@compute_cluster
    Database changed
    ```

## 権限管理

この SQL コマンドを実行するには、コンピュートグループに対する USAGE_PRIV 権限が必要です。権限に関するドキュメントを参照してください。

| 権限  | 対象        | 説明                                 |
| :--------- | :------------ | :------------------------------------ |
| USAGE_PRIV | Compute group | コンピュートクラスターの使用権限 |

コンピュートグループの権限を持たないユーザーがコンピュートグループを指定すると、エラーになります。たとえば `test` はその権限を持たない一般ユーザーです。

```sql
mysql -utest -h175.40.1.1 -P9030

use @compute_cluster;
ERROR 5042 (42000): errCode = 2, detailMessage = USAGE denied to user test'@'127.0.0.1' for compute group 'compute_cluster'
```


## 注意事項

1. データベース名またはコンピュートグループ名が予約語の場合は、次のようにバッククォートで囲む必要があります。

    ```sql
    use @`create`
    ```

2. コンピュートグループが存在しない場合はエラーメッセージが返されます。

    ```sql
    mysql> use @compute_group_not_exist;
    ERROR 5098 (42000): errCode = 2, detailMessage = Compute Group compute_group_not_exist not exist
    ```