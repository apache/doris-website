---
{
    "title": "CREATE JOB",
    "language": "ja",
    "description": "Doris Job は、設定したスケジュールに従って実行されるタスクです。指定した時刻または時間間隔で、あらかじめ定義した操作を開始するために使用します。",
}
---

## 説明

Doris Job は、設定したスケジュールに従って実行されるタスクです。指定した時刻または時間間隔で、あらかじめ定義した操作を開始し、タスクの自動実行に役立ちます。機能的には、OS のスケジュールタスク（Linux の cron や Windows のタスク スケジューラなど）に似ています。

Job には `ONE_TIME` と `RECURRING` の二種類があります。`ONE_TIME` タイプの Job は指定した時点で実行され、一回限りのタスクに使用します。`RECURRING` タイプの Job は、指定した時間間隔で繰り返し実行され、定期的なタスクに使用します。
`RECURRING` タイプの Job では、`STARTS/ENDS` によって開始時刻と終了時刻を指定できます。開始時刻を指定しない場合、初回の実行時刻は現在時刻にスケジュール間隔を加えた時刻になります。終了時刻を指定した場合、終了時刻に達したとき、終了時刻を超えたとき、または次回の実行時刻が終了時刻を超えるときに、Job は FINISHED 状態に更新され、それ以降の TASK は生成されません。

Job には `RUNNING`、`STOPPED`、`PAUSED`、`FINISHED` の 4 つの状態があります。

初期状態は `RUNNING` です。`RUNNING` 状態の Job は、設定したスケジュール間隔に従って実行用の TASK を生成します。Job が完了し、終了時刻に達すると、状態は `FINISHED` に変わります。

`PAUSED` 状態の Job は、RESUME 操作によって再開でき、RUNNING 状態に変わります。

`STOPPED` 状態はユーザーが明示的に操作したときに発生し、実行中の Job はキャンセルされ、Job は削除されます。

`FINISHED` 状態の Job はシステム内に 24 時間保持され、24 時間後に削除されます。

JOB は Job の情報のみを記述します。実行時には TASK が生成されます。TASK の状態には `PENDING`、`RUNNING`、`SUCCEESS`、`FAILED`、`CANCELED` があります。
`PENDING` は実行予定時刻に達したものの、実行リソースを待っている状態です。リソースが割り当てられると `RUNNING` に変わります。実行の成功または失敗に応じて、`SUCCESS` または `FAILED` に変わります。
`CANCELED` はキャンセルされた状態です。TASK の最終状態である `SUCCESS` または `FAILED` は永続化されます。その他の状態は実行中に確認できますが、再起動後は表示されません。

## 構文

```sql
CREATE
    JOB  
    <job_name>
    ON SCHEDULE <schedule>
    [ COMMENT <string> ]
    DO <sql_body> 
```

ここで、schedule は次のとおりです。

```sql
schedule:
  { AT <at_timestamp> | EVERY <interval> [STARTS <start_timestamp> ] [ENDS <end_timestamp> ] }
```

また、interval は次のとおりです。

```sql
interval:
  quantity { WEEK | DAY | HOUR | MINUTE }
```

## 必須パラメータ

**1. `<job_name>`**
> データベース内の一意なイベントを識別する Job 名です。Job 名はグローバルに一意でなければなりません。同じ名前の Job がすでに存在する場合、エラーになります。**inner_** プレフィックスはシステム内部で使用するために予約されており、ユーザーは **inner_** で始まる名前を作成できません。

**2. `<schedule>`**
> ON SCHEDULE 句では、Job の種類、実行時刻、実行頻度を指定します。一回限りの Job または定期的な Job を指定できます。

**3. `<sql_body>`**
> DO 句では、Job の実行時に行う操作、つまり SQL ステートメントを指定します。

## オプションパラメータ

**1. `AT <at_timestamp>`**
> 形式: 'YYYY-MM-DD HH:MM:SS'。**一回限りのイベント**に使用し、指定した日時に一度だけ実行します。実行が完了すると、Job の状態は FINISHED に変わります。

**2. `EVERY <interval>`**
> 定期的に繰り返す操作を表します。Job の実行頻度を指定し、このキーワードの後に時間間隔を指定する必要があります。単位には日、時間、分、秒、週を使用できます。

**3. `STARTS <start_timestamp>`**
> 形式: 'YYYY-MM-DD HH:MM:SS'。Job の開始時刻を指定します。指定しない場合、現在時刻から数えて次の実行時刻に開始します。開始時刻は現在時刻より後でなければなりません。

**4. `ENDS <end_timestamp>`**
> 形式: 'YYYY-MM-DD HH:MM:SS'。Job の終了時刻を指定します。指定しない場合、Job は無期限に実行されます。終了日時は現在時刻より後でなければなりません。STARTS で開始時刻を指定した場合、終了時刻は開始時刻より後でなければなりません。

## アクセス権限の要件

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。

| 権限 | オブジェクト | 備考 |
|:-----|:-------------|:-----|
| ADMIN_PRIV | データベース | 現在、この操作には **ADMIN** 権限のみ対応しています |

## 使用上の注意

- TASK では最新の 100 件のレコードのみ保持されます。

- 現在は**内部テーブルへの INSERT** 操作のみに対応しています。今後、対応する操作を追加する予定です。

- 次の TASK の実行予定時刻になった際、同じ JOB の過去の TASK がまだ実行中であれば、今回の TASK のスケジューリングはスキップされます。そのため、適切な実行間隔を設定することが重要です。

## 例

- 毎分実行する my_job という Job を作成します。実行する操作は、db2.tbl2 のデータを db1.tbl1 に取り込むことです。

  ```sql
  CREATE JOB my_job ON SCHEDULE EVERY 1 MINUTE DO INSERT INTO db1.tbl1 SELECT * FROM db2.tbl2;
  ```

- 2020-01-01 00:00:00 に一度だけ実行し、db2.tbl2 のデータを db1.tbl1 に取り込む Job を作成します。

  ```sql
  CREATE JOB my_job ON SCHEDULE AT '2020-01-01 00:00:00' DO INSERT INTO db1.tbl1 SELECT * FROM db2.tbl2;
  ```

- 2020-01-01 00:00:00 に開始し、毎日一回実行する Job を作成します。実行する操作は、db2.tbl2 のデータを db1.tbl1 に取り込むことです。

  ```sql
  CREATE JOB my_job ON SCHEDULE EVERY 1 DAY STARTS '2020-01-01 00:00:00' DO INSERT INTO db1.tbl1 SELECT * FROM db2.tbl2 WHERE create_time >= days_add(now(),-1);
  ```

- 2020-01-01 00:00:00 に開始し、毎日一回実行する Job を作成します。実行する操作は、db2.tbl2 のデータを db1.tbl1 に取り込むことです。Job は 2020-01-01 00:10:00 に終了します。

  ```sql
  CREATE JOB my_job ON SCHEDULE EVERY 1 DAY STARTS '2020-01-01 00:00:00' ENDS '2020-01-01 00:10:00' DO INSERT INTO db1.tbl1 SELECT * FROM db2.tbl2 create_time >= days_add(now(),-1);
  ```

## ベストプラクティス

- 多数の Job が同時に実行されると TASK が滞留し、システムの通常動作に影響するため、Job の数と実行時刻を適切に管理してください。
- TASK の実行間隔は、少なくとも TASK の実行時間より長く設定してください。

## 関連ドキュメント

- [Job の一時停止](../job/PAUSE-JOB.md)
- [Job の再開](../job/RESUME-JOB.md)
- [Job の削除](../job/DROP-JOB.md)
- [Job の照会](../../../sql-manual/sql-functions/table-valued-functions/jobs.md)
- [TASK の照会](../../sql-functions/table-valued-functions/jobs.md)

## 設定

**fe.conf**

- job_dispatch_timer_job_thread_num: スケジュールされた TASK の振り分けに使用するスレッド数です。デフォルト値は 2 です。定期的に実行する TASK が多い場合は、このパラメータを増やせます。

- job_dispatch_timer_job_queue_size: TASK が滞留したとき、スケジュールされた TASK を格納するキューのサイズです。デフォルト値は 1024 です。多数の TASK が同時に実行される場合は、このパラメータを増やせます。そうしないと、キューが満杯になり、投入された TASK がブロック状態に入って、その後の TASK を投入できなくなります。

- finished_job_cleanup_threshold_time_hour: 完了した TASK を削除するまでの時間のしきい値です。単位は時間で、デフォルト値は 24 時間です。

- job_insert_task_consumer_thread_num = 10: INSERT タスクの実行に使用するスレッド数です。値は 0 より大きくする必要があります。それ以外の場合は、デフォルト値の 5 が使用されます。
