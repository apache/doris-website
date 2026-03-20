---
{
  "title": "ストレージポリシーの作成",
  "description": "ストレージポリシーを作成するには、まずストレージリソースを作成する必要があります。",
  "language": "ja"
}
---
## デスクリプション

ストレージポリシーを作成するには、まずストレージリソースを作成し、その後マイグレーションポリシーを作成する際に作成したストレージリソース名を関連付ける必要があります。詳細については、RESOURCEセクションを参照してください。

## Syntax

```sql
CREATE STORAGE POLICY <policy_name>
PROPERTIES(
    "storage_resource" = "<storage_resource_name>"
    [{， "cooldown_datetime" = "<cooldown_datetime>"
    ｜ ， "cooldown_ttl" = "<cooldown_ttl>"}]
);
```
## 必須パラメータ

1. `<policy_name>`: 作成するストレージポリシーの名前
2. `<storage_resource_name>`: 関連付けるストレージリソースの名前。作成方法の詳細については、RESOURCEセクションを参照してください

## オプションパラメータ

1. `<cooldown_datetime>`: データ移行ポリシーを作成するためのクールダウン時刻を指定します
2. `<cooldown_ttl>`: データ移行ポリシーを作成するためのホットデータの期間を指定します

## アクセス制御要件

このSQLコマンドを正常に実行するための前提条件は、ADMIN_PRIV権限を持つことです。権限ドキュメントを参照してください。

| 権限       | オブジェクト                     | 備考                            |
| :--------- | :------------------------------- | :------------------------------ |
| ADMIN_PRIV | クラスタ全体の管理権限           | NODE_PRIV以外のすべての権限     |

## 例

1. 指定されたデータクールダウン時刻でデータ移行ポリシーを作成する。

    ```sql
    CREATE STORAGE POLICY testPolicy
    PROPERTIES(
    "storage_resource" = "s3",
    "cooldown_datetime" = "2022-06-08 00:00:00"
    );
    ```
2. 指定されたホットデータの期間を持つデータ移行ポリシーを作成する

    ```sql
    CREATE STORAGE POLICY testPolicy
    PROPERTIES(
    "storage_resource" = "s3",
    "cooldown_ttl" = "1d"
    );
    ```
