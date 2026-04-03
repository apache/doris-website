---
{
  "title": "ROUTINE LOADを一時停止",
  "language": "ja",
  "description": "この構文は、1つまたはすべてのRoutine Loadジョブを一時停止するために使用されます。一時停止されたジョブは、RESUMEコマンドを使用して再開できます。"
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

> 一時停止するジョブの名前を指定します。ALLが指定された場合、job_nameは必要ありません。

## オプションパラメータ

**1. `[ALL]`**

> オプションパラメータ。ALLが指定された場合、すべてのroutine loadジョブを一時停止することを示します。

## アクセス制御要件

このSQLコマンドを実行するユーザーは、少なくとも以下の権限を持っている必要があります：

| 権限 | オブジェクト | 備考 |
| :-------- | :----- | :---- |
| LOAD_PRIV | Table | SHOW ROUTINE LOADにはテーブルに対するLOAD権限が必要です |

## 注意事項

- ジョブが一時停止された後、RESUMEコマンドを使用して再開できます
- 一時停止操作は、すでにBEにディスパッチされたタスクには影響せず、これらのタスクは完了まで継続されます

## 例

- test1という名前のroutine loadジョブを一時停止する。

   ```sql
   PAUSE ROUTINE LOAD FOR test1;
   ```
- すべてのルーチンロードジョブを一時停止します。

   ```sql
   PAUSE ALL ROUTINE LOAD;
   ```
