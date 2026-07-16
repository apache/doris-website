---
{
  "title": "ALTER ROUTINE LOAD",
  "language": "ja",
  "description": "一時停止中の Routine Load ジョブを変更する構文について、単一テーブルの Kafka Routine Load ジョブのターゲットテーブル切り替え、ジョブプロパティ、Kafka データソースプロパティ、権限、および使用例を説明します。"
}
---

## 説明

この構文は、作成済みの Routine Load ジョブを変更するために使用します。`PAUSED` 状態のジョブのみ変更できます。[PAUSE ROUTINE LOAD](./PAUSE-ROUTINE-LOAD.md) を使用して、Routine Load ジョブを一時停止できます。

変更が成功した後は、次の操作を実行できます。

- [SHOW ROUTINE LOAD](./SHOW-ROUTINE-LOAD.md) を使用して、変更後のジョブの詳細を確認します。
- [RESUME ROUTINE LOAD](./RESUME-ROUTINE-LOAD.md) を使用して、ジョブを再開します。

## 構文

```sql
ALTER ROUTINE LOAD FOR [<db>.]<job_name>
[SET TARGET TABLE = "<new_table_name>"]
[PROPERTIES (
    "<job_property>" = "<value>"
    [, ...]
)]
[FROM <data_source> (
    "<data_source_property>" = "<value>"
    [, ...]
)];
```

## パラメータ

### 1. `[<db>.]<job_name>`

変更するジョブ名を指定します。識別子は英字で始める必要があり、識別子全体をバッククォートで囲まない限り、空白または特殊文字を含めることはできません。

予約キーワードは識別子として使用できません。詳細については、[識別子の要件](../../../basic-element/object-identifiers.md)および[予約キーワード](../../../basic-element/reserved-keywords.md)を参照してください。

### 2. `SET TARGET TABLE = "<new_table_name>"`

切り替え先となる新しいターゲットテーブルを指定します。

ターゲットテーブルだけを切り替えても、過去のデータは移動されません。既存のバッチは旧テーブルに残ります。ジョブの再開後、Doris は保持されている Kafka オフセットから消費を続行し、新しいバッチを新しいテーブルに書き込みます。

ターゲットテーブルは、ジョブと同じデータベースに属する、一時テーブルではない OLAP テーブルである必要があります。ターゲットテーブルの切り替えは、単一テーブルの Kafka Routine Load ジョブでのみサポートされます。

### 3. `<job_properties>`

変更するジョブプロパティを指定します。現在、次のプロパティがサポートされています。

- `desired_concurrent_number`
- `max_error_number`
- `max_batch_interval`
- `max_batch_rows`
- `max_batch_size`
- `jsonpaths`
- `json_root`
- `strip_outer_array`
- `strict_mode`
- `timezone`
- `num_as_string`
- `fuzzy_parse`
- `partial_columns`
- `max_filter_ratio`

### 4. `<data_source>`

データソースの種類を指定します。`SET TARGET TABLE` と併用する場合、現在サポートされているのは次の種類のみです。

- `KAFKA`

### 5. `<data_source_properties>`

変更するデータソースプロパティを指定します。現在、次のプロパティがサポートされています。

- `kafka_broker_list`
- `kafka_topic`
- `property.group.id` などのカスタムプロパティ
- `kafka_partitions` と `kafka_offsets` は、消費対象の Kafka パーティションのオフセットを変更するために使用します。`kafka_topic` を変更しない場合、現在消費しているパーティションのオフセットのみ変更でき、新しいパーティションは追加できません。

## アクセス制御要件

この SQL コマンドを実行するユーザーには、少なくとも次の権限が必要です。

| 権限 | オブジェクト | 説明 |
| --- | --- | --- |
| `LOAD_PRIV` | 現在のターゲットテーブル | 単一テーブルの Routine Load ジョブを変更する場合に必要です。 |
| `LOAD_PRIV` | データベース | マルチテーブルの Routine Load ジョブを変更する場合に必要です。 |
| `LOAD_PRIV` | 新しいターゲットテーブル | `SET TARGET TABLE` を使用する場合に追加で必要です。 |

## 例

### `desired_concurrent_number` を `1` に変更する

```sql
ALTER ROUTINE LOAD FOR db1.label1
PROPERTIES
(
    "desired_concurrent_number" = "1"
);
```

### `desired_concurrent_number` を `10` に変更し、パーティションのオフセットとグループ ID も変更する

```sql
ALTER ROUTINE LOAD FOR db1.label1
PROPERTIES
(
    "desired_concurrent_number" = "10"
)
FROM KAFKA
(
    "kafka_partitions" = "0, 1, 2",
    "kafka_offsets" = "100, 200, 100",
    "property.group.id" = "new_group"
);
```

### ターゲットテーブルを `new_table_name` に切り替える

```sql
ALTER ROUTINE LOAD FOR db1.label1
SET TARGET TABLE = "new_table_name";
```
