---
{
  "title": "CREATE STORAGE POLICY",
  "language": "ja",
  "description": "ストレージポリシーを作成するには、まずストレージリソースを作成する必要があります。"
}
---
## 説明

ストレージポリシーを作成するには、まずストレージリソースを作成し、次に移行ポリシーの作成時に作成したストレージリソース名を関連付ける必要があります。詳細については、RESOURCEセクションを参照してください。

## 構文

```sql
CREATE STORAGE POLICY <policy_name>
PROPERTIES(
    "storage_resource" = "<storage_resource_name>"
    [{， "cooldown_datetime" = "<cooldown_datetime>"
    ｜ ， "cooldown_ttl" = "<cooldown_ttl>"}]
);
```
## 必須パラメータ

**<policy_name>**

> 作成するストレージポリシーの名前

**<storage_resource_name>**

> 関連するストレージリソースの名前。作成方法の詳細については、RESOURCEセクションを参照してください

## オプションパラメータ

**<cooldown_datetime>**

> データ移行ポリシー作成のクールダウン時間を指定します

**<cooldown_ttl>**

> データ移行ポリシー作成のホットデータの期間を指定します

## アクセス制御要件

このSQLコマンドを正常に実行するための前提条件は、ADMIN_PRIV権限を持つことです。権限ドキュメントを参照してください。

| 権限       | オブジェクト                 | 備考                            |
| :--------- | :--------------------------- | :------------------------------ |
| ADMIN_PRIV | クラスタ全体の管理権限       | NODE_PRIV以外のすべての権限     |

## 例

1. 指定されたデータクールダウン時間でデータ移行ポリシーを作成する。

  ```sql
  CREATE STORAGE POLICY testPolicy
  PROPERTIES(
    "storage_resource" = "s3",
    "cooldown_datetime" = "2022-06-08 00:00:00"
  );
  ```
2. ホットデータの指定期間を含むデータ移行ポリシーを作成する

  ```sql
  CREATE STORAGE POLICY testPolicy
  PROPERTIES(
    "storage_resource" = "s3",
    "cooldown_ttl" = "1d"
  );
  ```
