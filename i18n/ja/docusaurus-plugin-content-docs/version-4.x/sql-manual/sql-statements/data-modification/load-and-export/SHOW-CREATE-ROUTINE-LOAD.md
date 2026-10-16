---
{
    "title": "SHOW CREATE ROUTINE LOAD",
    "language": "ja",
    "description": "この構文は、Routine Load ジョブの作成文を表示するために使用します。"
}
---

## 説明

この構文は、Routine Load ジョブの作成文を表示するために使用します。

結果には、現在消費中の Kafka パーティションと、それぞれで次に消費するオフセットが表示されます。この結果はリアルタイムの消費位置を反映していない場合があるため、[SHOW ROUTINE LOAD](./SHOW-ROUTINE-LOAD.md) の結果を基準にしてください。

## 構文

```sql
SHOW [ALL] CREATE ROUTINE LOAD for <load_name>;
```

## 必須パラメータ

**1. `<load_name>`**

> Routine Load ジョブの名前

## オプションパラメータ

**1. `[ALL]`**

> オプションのパラメータです。指定すると、履歴ジョブを含むすべてのジョブを取得します。

## 必要な権限

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。

| 権限 | オブジェクト | 備考 |
| :--------- | :----- | :------------------------------------------------------- |
| LOAD_PRIV | テーブル | SHOW CREATE ROUTINE LOAD には、テーブルに対する LOAD 権限が必要です |

## 例

- デフォルトのデータベースにある、指定した Routine Load ジョブの作成文を表示します。

   ```sql
   SHOW CREATE ROUTINE LOAD for test_load
   ```
