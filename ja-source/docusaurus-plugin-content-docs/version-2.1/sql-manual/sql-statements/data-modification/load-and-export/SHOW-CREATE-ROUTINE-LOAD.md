---
{
  "title": "SHOW CREATE ROUTINE LOAD",
  "language": "ja",
  "description": "この文は、ルーチンロードジョブの作成文を表示するために使用されます。"
}
---
## 説明

このステートメントは、routine load ジョブの作成ステートメントを表示するために使用されます。

結果には、現在消費中のKafkaパーティションと、消費される対応するオフセットが表示されます。結果はリアルタイムの消費ポイントではない可能性があり、[show routine load](./SHOW-ROUTINE-LOAD.md)の結果に基づく必要があります。

## 構文

```sql
SHOW [ALL] CREATE ROUTINE LOAD for <load_name>;
```
## 必須パラメータ

**1. `<load_name>`**

> routine loadジョブの名前

## オプションパラメータ

**1. `[ALL]`**

> 履歴ジョブを含む全てのジョブを取得することを表すオプションパラメータ

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持っている必要があります：

| 権限  | オブジェクト | 備考                                                    |
| :--------- | :----- | :------------------------------------------------------- |
| LOAD_PRIV  | Table  | SHOW ROUTINE LOADにはテーブルに対するLOAD権限が必要です |

## 例

- デフォルトデータベースの指定されたroutine loadジョブの作成文を表示

   ```sql
   SHOW CREATE ROUTINE LOAD for test_load
   ```
