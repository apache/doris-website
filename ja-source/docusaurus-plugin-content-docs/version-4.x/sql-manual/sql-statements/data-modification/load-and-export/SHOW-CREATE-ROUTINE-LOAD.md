---
{
  "title": "SHOW CREATE ROUTINE LOAD",
  "description": "この文は、ルーチンロードジョブの作成文を表示するために使用されます。",
  "language": "ja"
}
---
## デスクリプション

このステートメントは、routine loadジョブの作成ステートメントを表示するために使用されます。

結果は現在消費しているKafkaパーティションと、消費される対応するオフセットを表示します。結果はリアルタイムの消費ポイントではない可能性があり、[show routine load](./SHOW-ROUTINE-LOAD.md)の結果に基づく必要があります。

## Syntax

```sql
SHOW [ALL] CREATE ROUTINE LOAD for <load_name>;
```
## 必須パラメータ

**1. `<load_name>`**

> routine loadジョブの名前

## オプションパラメータ

**1. `[ALL]`**

> 履歴ジョブを含むすべてのジョブを取得することを表すオプションパラメータ

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持つ必要があります：

| Privilege  | Object | 注釈                                                    |
| :--------- | :----- | :------------------------------------------------------- |
| LOAD_PRIV  | Table  | SHOW ROUTINE LOADにはTableに対するLOAD権限が必要です |

## 例

- デフォルトデータベース内の指定されたroutine loadジョブの作成文を表示

   ```sql
   SHOW CREATE ROUTINE LOAD for test_load
   ```
