---
{
    "title": "RESUME ROUTINE LOAD",
    "language": "ja",
    "description": "この構文は、一時停止中の Routine Load ジョブを個別に、またはすべて再開するために使用します。再開したジョブは、前回データを消費したオフセットから消費を続けます。"
}
---

## 説明

この構文は、一時停止中の Routine Load ジョブを個別に、またはすべて再開するために使用します。再開したジョブは、前回データを消費したオフセットから消費を続けます。

## 構文

```sql
RESUME [ALL] ROUTINE LOAD FOR <job_name>
```

## 必須パラメータ

**1. `<job_name>`**

> 再開するジョブの名前を指定します。ALL を指定した場合、job_name は不要です。

## オプションパラメータ

**1. `[ALL]`**

> オプションパラメータです。ALL を指定すると、一時停止中のすべての Routine Load ジョブを再開します。

## アクセス制御要件

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。

| 権限 | オブジェクト | 備考 |
| :-------- | :----- | :---- |
| LOAD_PRIV | テーブル | RESUME ROUTINE LOAD には、テーブルに対する LOAD 権限が必要です |

## 注意事項

- PAUSED 状態のジョブのみ再開できます
- 再開したジョブは、最後にデータを消費した位置から消費を続けます
- ジョブの一時停止期間が長すぎると、Kafka のデータが期限切れになり、再開に失敗する場合があります

## 例

- test1 という名前の Routine Load ジョブを再開します。

   ```sql
   RESUME ROUTINE LOAD FOR test1;
   ```

- すべての Routine Load ジョブを再開します。

   ```sql
   RESUME ALL ROUTINE LOAD;
   ```
