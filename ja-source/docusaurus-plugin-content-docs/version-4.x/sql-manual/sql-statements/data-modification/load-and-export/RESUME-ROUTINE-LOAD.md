---
{
  "title": "RESUME ROUTINE LOAD",
  "description": "この構文は、一時停止された一つまたは全てのRoutine Loadジョブを再開するために使用されます。再開されたジョブは、以前に消費されたオフセットから消費を続行します。",
  "language": "ja"
}
---
## 説明

この構文は、一時停止されたRoutine Loadジョブの1つまたはすべてを再開するために使用されます。再開されたジョブは、以前に消費されたオフセットから消費を継続します。

## 構文

```sql
RESUME [ALL] ROUTINE LOAD FOR <job_name>
```
## 必須パラメータ

**1. `<job_name>`**

> 再起動するジョブの名前を指定します。ALLが指定された場合、job_nameは必要ありません。

## オプションパラメータ

**1. `[ALL]`**

> オプションパラメータです。ALLが指定された場合、一時停止されているすべてのroutine loadジョブを再起動することを示します。

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持つ必要があります：

| 権限 | オブジェクト | 備考 |
| :-------- | :----- | :---- |
| LOAD_PRIV | Table | SHOW ROUTINE LOADはTableに対するLOAD権限が必要です |

## 注意事項

- PAUSED状態のジョブのみ再起動可能です
- 再起動されたジョブは、最後に消費した位置からデータの消費を継続します
- ジョブが長時間一時停止されていた場合、Kafkaデータの有効期限切れにより再起動が失敗する可能性があります

## 例

- test1という名前のroutine loadジョブを再起動します。

   ```sql
   RESUME ROUTINE LOAD FOR test1;
   ```
- すべてのroutine loadジョブを再起動します。

   ```sql
   RESUME ALL ROUTINE LOAD;
   ```
