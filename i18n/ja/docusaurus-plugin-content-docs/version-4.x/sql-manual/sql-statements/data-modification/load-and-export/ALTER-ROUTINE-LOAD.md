---
{
    "title": "ALTER ROUTINE LOAD",
    "language": "ja",
    "description": "この構文は、既存の Routine Load ジョブを変更するために使用します。変更できるのは PAUSED 状態のジョブのみです。"
}
---

## 説明

この構文は、既存の Routine Load ジョブを変更するために使用します。変更できるのは PAUSED 状態のジョブのみです。

## 構文

```sql
ALTER ROUTINE LOAD FOR [<db>.]<job_name>
[<job_properties>]
FROM [<data_source>]
[<data_source_properties>]
```

## 必須パラメータ

**1. `[<db>.]<job_name>`**

> 変更するジョブの名前を指定します。識別子は英字で始める必要があります。識別子全体をバッククォートで囲まない限り、空白や特殊文字は使用できません。
>
> 識別子に予約語は使用できません。詳しくは、識別子の要件と予約語を参照してください。

## 任意パラメータ

**1. `<job_properties>`**

> 変更するジョブのパラメータを指定します。現在サポートされているパラメータは次のとおりです。
>
> - desired_concurrent_number
> - max_error_number
> - max_batch_interval
> - max_batch_rows
> - max_batch_size
> - jsonpaths
> - json_root
> - strip_outer_array
> - strict_mode
> - timezone
> - num_as_string
> - fuzzy_parse
> - partial_columns
> - max_filter_ratio

**2. `<data_source_properties>`**

> データソースに関するプロパティを指定します。現在サポートされているものは次のとおりです。
>
> - `<kafka_partitions>`
> - `<kafka_offsets>`
> - `<kafka_broker_list>`
> - `<kafka_topic>`
> - `<property.group.id>` などのカスタムプロパティ

**3. `<data_source>`**

> データソースの種類を指定します。現在サポートされているものは次のとおりです。
>
> - KAFKA

## 必要な権限

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。

| 権限 | 対象 | 説明 |
| :-------- | :----- | :---- |
| LOAD_PRIV | テーブル | ALTER ROUTINE LOAD には、テーブルに対する LOAD 権限が必要です |

## 使用上の注意

- `kafka_partitions` と `kafka_offsets` は、消費対象となる Kafka パーティションのオフセットを変更するために使用します。変更できるのは現在消費中のパーティションのみです。新しいパーティションは追加できません。

## 例

- `desired_concurrent_number` を 1 に変更します。

    ```sql
    ALTER ROUTINE LOAD FOR db1.label1
    PROPERTIES
    (
        "desired_concurrent_number" = "1"
    );
    ```

- `desired_concurrent_number` を 10 に変更し、パーティションのオフセットとグループ ID も変更します。

    ```sql
    ALTER ROUTINE LOAD FOR db1.label1
    PROPERTIES
    (
        "desired_concurrent_number" = "10"
    )
    FROM kafka
    (
        "kafka_partitions" = "0, 1, 2",
        "kafka_offsets" = "100, 200, 100",
        "property.group.id" = "new_group"
    );
    ```
