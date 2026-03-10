---
{
  "title": "フロントエンド設定を設定",
  "language": "ja",
  "description": "このステートメントは、クラスターの設定項目を設定するために使用されます（現在はFE設定項目の設定のみをサポートしています）。"
}
---
## 説明

このステートメントはクラスターの設定項目を設定するために使用されます（現在はFE設定項目の設定のみをサポートしています）。

## 構文:

```sql
ADMIN SET {ALL FRONTENDS | FRONTEND} CONFIG ("<fe_config_key>" = "<fe_config_value>")
```
## 必須パラメータ
**`{ALL FRONTENDS | FRONTEND}`**
> **`ALL FRONTENDS`**: Dorisクラスター内のすべてのFEノードを表します
>
> **`FRONTEND`**: 現在接続されているFEノード、つまりユーザーが対話しているFEノードを表します

## オプションパラメータ
変更が必要な`<fe_config_key>`と`<fe_config_value>`は、[SHOW FRONTEND CONFIG](./SHOW-FRONTEND-CONFIG)コマンドで確認できます

:::tip 説明

- バージョン2.1.5以降、`ALL`キーワードがサポートされています。`ALL`キーワードを使用すると、設定パラメータがすべてのFEに適用されます（`master_only`パラメータを除く）。
- この構文は設定を永続的に変更しません。FEが再起動すると、変更された設定は無効になります。変更を永続化するには、設定項目をfe.confに同期して追加する必要があります。
  :::

## 例

1. `disable_balance`を`true`に設定

    ```sql
    ADMIN SET FRONTEND CONFIG ("disable_balance" = "true");
    ```
2. 全てのFEノードの`disable_balance`を`true`に設定する

   ```sql
   ADMIN SET ALL FRONTENDS CONFIG ("disable_balance" = "true");
   ```
