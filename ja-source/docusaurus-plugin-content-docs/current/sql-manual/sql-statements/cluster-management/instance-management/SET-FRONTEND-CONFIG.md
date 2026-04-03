---
{
  "title": "フロントエンドCONFIGを設定",
  "language": "ja",
  "description": "このステートメントは、クラスターの設定項目を設定するために使用されます（現在はFE設定項目の設定のみサポートしています）。"
}
---
## 説明

このステートメントは、クラスターの設定項目を設定するために使用されます（現在はFE設定項目の設定のみサポートしています）。

## 構文:

```sql
ADMIN SET {ALL FRONTENDS | FRONTEND} CONFIG ("<fe_config_key>" = "<fe_config_value>")
```
## 必須パラメーター
**`{ALL FRONTENDS | FRONTEND}`**
> **`ALL FRONTENDS`**: Dorisクラスター内の全てのFEノードを表す
>
> **`FRONTEND`**: 現在接続中のFEノード、つまりユーザーが操作しているFEノードを表す

## オプショナルパラメーター
変更が必要な`<fe_config_key>`と`<fe_config_value>`は[SHOW FRONTEND CONFIG](./SHOW-FRONTEND-CONFIG)コマンドで確認できます

:::tip 説明

- バージョン2.0.11および2.1.5以降、`ALL`キーワードがサポートされています。`ALL`キーワードを使用すると、設定パラメーターは全てのFEに適用されます（`master_only`パラメーターを除く）。
- この構文では設定が永続的に変更されません。FEが再起動すると、変更された設定は無効になります。変更を永続化するには、設定項目をfe.confに同期して追加する必要があります。
:::

## 例

1. `disable_balance`を`true`に設定する

    ```sql
    ADMIN SET FRONTEND CONFIG ("disable_balance" = "true");
    ```
2. すべてのFEノードの`disable_balance`を`true`に設定する

   ```sql
   ADMIN SET ALL FRONTENDS CONFIG ("disable_balance" = "true");
   ```
