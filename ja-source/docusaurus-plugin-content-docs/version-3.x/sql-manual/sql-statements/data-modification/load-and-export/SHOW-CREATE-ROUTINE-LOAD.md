---
{
  "title": "SHOW CREATE ROUTINE LOAD",
  "description": "この文は、routine loadジョブの作成文を表示するために使用されます。",
  "language": "ja"
}
---
## 説明

このステートメントは、routine loadジョブの作成ステートメントを表示するために使用されます。

結果には、現在消費しているKafkaパーティションと、それらに対応する消費対象のオフセットが表示されます。結果はリアルタイムの消費ポイントではない可能性があるため、[show routine load](./SHOW-ROUTINE-LOAD.md)の結果を基準とする必要があります。

## 構文

```sql
SHOW [ALL] CREATE ROUTINE LOAD for <load_name>;
```
## 必須パラメータ

**1. `<load_name>`**

> ルーチンロードジョブの名前

## オプションパラメータ

**1. `[ALL]`**

> 履歴ジョブを含むすべてのジョブを取得することを表すオプションパラメータ

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持っている必要があります：

| 権限       | オブジェクト | 備考                                                      |
| :--------- | :----------- | :-------------------------------------------------------- |
| LOAD_PRIV  | Table        | SHOW ROUTINE LOADにはTableに対するLOAD権限が必要です   |

## 例

- デフォルトデータベースの指定されたルーチンロードジョブの作成文を表示する

   ```sql
   SHOW CREATE ROUTINE LOAD for test_load
   ```
