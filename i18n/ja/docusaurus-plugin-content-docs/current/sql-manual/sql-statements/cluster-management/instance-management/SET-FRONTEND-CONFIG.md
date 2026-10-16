---
{
    "title": "SET FRONTEND CONFIG",
    "language": "ja",
    "description": "このステートメントは、クラスターの設定項目を設定します（現在は FE の設定項目のみ対応しています）。"
}
---

## 説明

このステートメントは、クラスターの設定項目を設定します（現在は FE の設定項目のみ対応しています）。

## 構文

```sql
ADMIN SET {ALL FRONTENDS | FRONTEND} CONFIG ("<fe_config_key>" = "<fe_config_value>")
```

## 必須パラメータ
**`{ALL FRONTENDS | FRONTEND}`**
> **`ALL FRONTENDS`**: Doris クラスター内のすべての FE ノードを表します
>
> **`FRONTEND`**: 現在接続している FE ノード、つまりユーザーが操作している FE ノードを表します

## オプションパラメータ
変更する `<fe_config_key>` と `<fe_config_value>` は、[SHOW FRONTEND CONFIG](./SHOW-FRONTEND-CONFIG) コマンドで確認できます

:::tip 補足

- バージョン 2.0.11 および 2.1.5 以降では、`ALL` キーワードを使用できます。`ALL` キーワードを使用すると、設定パラメータがすべての FE に適用されます（`master_only` パラメータを除く）。
- この構文による設定変更は永続化されません。FE を再起動すると変更は無効になります。変更を永続化するには、設定項目を fe.conf にも追加する必要があります。
:::

## 例

1. `disable_balance` を `true` に設定する

    ```sql
    ADMIN SET FRONTEND CONFIG ("disable_balance" = "true");
    ```

2. すべての FE ノードの `disable_balance` を `true` に設定する
   ```sql
   ADMIN SET ALL FRONTENDS CONFIG ("disable_balance" = "true");
   ```
