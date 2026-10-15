---
{
    "title": "PAUSE ROUTINE LOAD",
    "language": "ja",
    "description": "この構文は、個別またはすべての Routine Load ジョブを一時停止するために使用します。一時停止したジョブは、RESUME コマンドで再開できます。"
}
---

## 説明

この構文は、個別またはすべての Routine Load ジョブを一時停止するために使用します。一時停止したジョブは、RESUME コマンドで再開できます。

## 構文

```sql
PAUSE [ALL] ROUTINE LOAD FOR <job_name>
```

## 必須パラメータ

**1. `<job_name>`**

> 一時停止するジョブの名前を指定します。ALL を指定した場合、job_name は不要です。

## オプションパラメータ

**1. `[ALL]`**

> オプションのパラメータです。ALL を指定すると、すべての Routine Load ジョブを一時停止します。

## 必要な権限

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。

| 権限 | オブジェクト | 備考 |
| :-------- | :----- | :---- |
| LOAD_PRIV | テーブル | PAUSE ROUTINE LOAD には、テーブルに対する LOAD 権限が必要です |

## 注意事項

- 一時停止したジョブは、RESUME コマンドで再開できます
- 一時停止操作は、すでに BE にディスパッチされたタスクには影響しません。これらのタスクは実行を継続し、完了します

## 例

- test1 という名前の Routine Load ジョブを一時停止します。

   ```sql
   PAUSE ROUTINE LOAD FOR test1;
   ```

- すべての Routine Load ジョブを一時停止します。

   ```sql
   PAUSE ALL ROUTINE LOAD;
   ```