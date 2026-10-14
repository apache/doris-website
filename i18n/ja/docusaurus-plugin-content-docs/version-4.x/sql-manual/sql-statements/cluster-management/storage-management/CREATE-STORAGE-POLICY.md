---
{
    "title": "CREATE STORAGE POLICY",
    "language": "ja",
    "description": "ストレージポリシーを作成するには、先にストレージリソースを作成する必要があります。"
}
---

## 説明

ストレージポリシーを作成するには、先にストレージリソースを作成し、データ移行ポリシーの作成時にそのストレージリソース名を指定する必要があります。詳細は RESOURCE セクションを参照してください。

## 構文

```sql
CREATE STORAGE POLICY <policy_name>
PROPERTIES(
    "storage_resource" = "<storage_resource_name>"
    [{, "cooldown_datetime" = "<cooldown_datetime>"
    | , "cooldown_ttl" = "<cooldown_ttl>"}]
);
```

## 必須パラメータ

1. `<policy_name>`: 作成するストレージポリシーの名前
2. `<storage_resource_name>`: 関連付けるストレージリソースの名前。作成方法については、RESOURCE セクションを参照してください

## オプションパラメータ

1. `<cooldown_datetime>`: データ移行ポリシーを作成する際のクールダウン日時を指定します
2. `<cooldown_ttl>`: データ移行ポリシーを作成する際のホットデータの保持期間を指定します

## アクセス制御要件

この SQL コマンドを正常に実行するには、ADMIN_PRIV 権限が必要です。権限に関するドキュメントを参照してください。

| 権限       | 対象                             | 備考                            |
| :--------- | :------------------------------- | :------------------------------ |
| ADMIN_PRIV | クラスター全体の管理権限         | NODE_PRIV 以外のすべての権限    |

## 例

1. データのクールダウン日時を指定して、データ移行ポリシーを作成します。

    ```sql
    CREATE STORAGE POLICY testPolicy
    PROPERTIES(
    "storage_resource" = "s3",
    "cooldown_datetime" = "2022-06-08 00:00:00"
    );
    ```

2. ホットデータの保持期間を指定して、データ移行ポリシーを作成します。

    ```sql
    CREATE STORAGE POLICY testPolicy
    PROPERTIES(
    "storage_resource" = "s3",
    "cooldown_ttl" = "1d"
    );
    ```
