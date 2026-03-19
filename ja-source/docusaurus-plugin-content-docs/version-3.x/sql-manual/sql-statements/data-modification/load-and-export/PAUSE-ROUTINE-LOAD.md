---
{
  "title": "PAUSE ROUTINE LOAD",
  "description": "この構文は、1つまたは全てのRoutine Loadジョブを一時停止するために使用されます。一時停止されたジョブは、RESUMEコマンドを使用して再開することができます。",
  "language": "ja"
}
---
## 説明

この構文は、1つまたはすべてのRoutine Loadジョブを一時停止するために使用されます。一時停止されたジョブは、RESUMEコマンドを使用して再開できます。

## 構文

```sql
PAUSE [ALL] ROUTINE LOAD FOR <job_name>
```
## 必須パラメータ

**1. `<job_name>`**

> 一時停止するジョブの名前を指定します。ALLが指定されている場合、job_nameは不要です。

## オプションパラメータ

**1. `[ALL]`**

> オプションパラメータです。ALLが指定されている場合、すべてのroutine loadジョブを一時停止することを示します。

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持つ必要があります：

| 権限 | オブジェクト | 備考 |
| :-------- | :----- | :---- |
| LOAD_PRIV | Table | SHOW ROUTINE LOADにはTableのLOAD権限が必要 |

## 注意事項

- ジョブが一時停止された後、RESUMEコマンドを使用して再開できます
- 一時停止操作は既にBEに送信されたタスクには影響しません。これらのタスクは完了まで継続されます

## 例

- test1という名前のroutine loadジョブを一時停止する。

   ```sql
   PAUSE ROUTINE LOAD FOR test1;
   ```
- 全ての定期ロードジョブを一時停止します。

   ```sql
   PAUSE ALL ROUTINE LOAD;
   ```
