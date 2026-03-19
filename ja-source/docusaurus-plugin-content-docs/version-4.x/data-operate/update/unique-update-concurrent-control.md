---
{
  "title": "Primary Key Modelにおける更新の並行性制御",
  "description": "Dorisは、並行更新を処理するためにMulti-Version Concurrency Control (MVCC)を採用しています。各データ書き込み操作には書き込みトランザクションが割り当てられ、",
  "language": "ja"
}
---
## 概要

Dorisは同時更新を処理するためにMulti-Version Concurrency Control (MVCC)を採用しています。各データ書き込み操作には書き込みトランザクションが割り当てられ、原子性（つまり、書き込み操作が完全に成功するか完全に失敗するか）が保証されます。書き込みトランザクションのコミット時に、システムはバージョン番号を割り当てます。Unique Keyモデルでは、データを複数回ロードする際に重複する主キーがある場合、Dorisはバージョン番号に基づいて上書き順序を決定します：より高いバージョン番号のデータがより低いバージョン番号のデータを上書きします。

一部のシナリオでは、ユーザーはtable作成文でsequence列を指定することにより、データの有効順序を調整する必要があるかもしれません。例えば、複数のスレッドを通じてDorisに同時にデータを同期する場合、異なるスレッドからのデータが順序外で到着する可能性があります。この場合、後から到着した古いデータが新しいデータを誤って上書きしてしまう可能性があります。この問題を解決するために、ユーザーは古いデータにより低いsequence値を、新しいデータにより高いsequence値を割り当てることで、Dorisがユーザー提供のsequence値に基づいて更新順序を正しく判断できるようにします。

さらに、`UPDATE`文は基盤メカニズムレベルでデータロードによる更新とは大きく異なります。`UPDATE`操作は2つのステップを含みます：更新対象のデータをデータベースから読み取り、更新されたデータを書き込む。デフォルトでは、`UPDATE`文はtableレベルロックを通じてSerializable分離レベルでトランザクション機能を提供し、複数の`UPDATE`操作は直列でのみ実行できることを意味します。ユーザーは設定を調整することでこの制限を回避することもでき、詳細は以下のセクションで説明します。

## UPDATE同時実行制御

デフォルトでは、同じtableに対する同時`UPDATE`操作は許可されません。

主な理由は、Dorisが現在行更新をサポートしているためで、これはユーザーが`SET v2 = 1`と宣言した場合でも、他のすべての値列も上書きされる（値が変更されていない場合でも）ことを意味します。

これにより、2つの`UPDATE`操作が同じ行を同時に更新した場合、動作が不定となり、ダーティデータが生成される可能性があるという問題が生じる可能性があります。

ただし、実際のアプリケーションでは、ユーザーが同時更新が同じ行を同時に操作しないことを保証できる場合、手動で同時更新を有効にできます。FE設定`enable_concurrent_update`を変更し、この設定値を`true`に設定すると、updateコマンドのトランザクション保証が無効になります。

## Sequence列

Uniqueモデルは主に一意の主キーが必要なシナリオ向けで、主キーの一意性制約を保証します。同じバッチまたは異なるバッチでロードされるデータの置換順序は保証されません。保証された置換順序がなければ、最終的にtableにロードされる具体的なデータは不確実です。

この問題を解決するために、Dorisはsequence列をサポートしています。ロード時にsequence列を指定することで、同じkey列を持つデータはsequence列の値に基づいて置換され、より大きい値がより小さい値を置換し、その逆も同様です。この方法により、ユーザーは置換順序を制御できます。

実装では、Dorisは隠し列**__DORIS_SEQUENCE_COL__**を追加し、その型はtable作成時にユーザーによって指定されます。この列の具体的な値はデータロード時に決定され、同じkey列の有効行はこの値に基づいて決定されます。

:::caution Note
sequence列は現在Uniqueモデルのみをサポートしています。
:::

### Sequence列サポートの有効化

新しいtableを作成する際、`function_column.sequence_col`または`function_column.sequence_type`が設定されている場合、新しいtableはsequence列をサポートします。

sequence列をサポートしていないtableについては、次の文を使用してこの機能を有効にできます：`ALTER TABLE example_db.my_table ENABLE FEATURE "SEQUENCE_LOAD" WITH PROPERTIES ("function_column.sequence_type" = "Date")`。

tableがsequence列をサポートしているかどうかを確認するには、隠し列を表示するセッション変数を設定し`SET show_hidden_columns=true`、その後`desc tablename`を使用します。出力に`__DORIS_SEQUENCE_COL__`列が含まれている場合はサポートされており、そうでなければサポートされていません。

### 使用例

以下はStream Loadを使用した例です：

**1. sequence列をサポートするtableの作成**

uniqueモデル`test_table`を作成し、sequence列を`modify_date`列にマップします。

```sql
CREATE TABLE test.test_table
(
    user_id bigint,
    date date,
    group_id bigint,
    modify_date date,
    keyword VARCHAR(128)
)
UNIQUE KEY(user_id, date, group_id)
DISTRIBUTED BY HASH (user_id) BUCKETS 32
PROPERTIES(
    "function_column.sequence_col" = 'modify_date',
    "replication_num" = "1",
    "in_memory" = "false"
);
```
`sequence_col`は、シーケンスカラムをTable内のカラムにマッピングすることを指定します。このカラムは整数型または日付/時刻型（DATE、DATETIME）である必要があり、作成後に変更することはできません。

Table構造は以下の通りです：

```sql
MySQL>  desc test_table;
+-------------+--------------+------+-------+---------+---------+
| Field       | Type         | Null | Key   | Default | Extra   |
+-------------+--------------+------+-------+---------+---------+
| user_id     | BIGINT       | No   | true  | NULL    |         |
| date        | DATE         | No   | true  | NULL    |         |
| group_id    | BIGINT       | No   | true  | NULL    |         |
| modify_date | DATE         | No   | false | NULL    | REPLACE |
| keyword     | VARCHAR(128) | No   | false | NULL    | REPLACE |
+-------------+--------------+------+-------+---------+---------+
```
列マッピングによるsequence列の指定に加えて、Dorisは指定された型に基づくsequence列の作成もサポートしています。この方法では、マッピングのためのスキーマ内の列は不要です。構文は以下の通りです：

```Plain
PROPERTIES (
    "function_column.sequence_type" = 'Date',
);
```
`sequence_type`はシーケンスカラムの型を指定し、integer型またはdate/time型（DATE、DATETIME）を指定できます。

**2. データの読み込み:**

カラムマッピング（`function_column.sequence_col`）を使用してシーケンスカラムを指定する場合、パラメータを変更する必要はありません。以下はStream Loadを使用してデータを読み込む例です：

```Plain
1	2020-02-22	1	2020-02-21	a
1	2020-02-22	1	2020-02-22	b
1	2020-02-22	1	2020-03-05	c
1	2020-02-22	1	2020-02-26	d
1	2020-02-22	1	2020-02-23	e
1	2020-02-22	1	2020-02-24	b
```
Stream loadコマンド:

```shell
curl --location-trusted -u root: -T testData http://host:port/api/test/test_table/_stream_load
```
結果:

```sql
MySQL> select * from test_table;
+---------+------------+----------+-------------+---------+
| user_id | date       | group_id | modify_date | keyword |
+---------+------------+----------+-------------+---------+
|       1 | 2020-02-22 |        1 | 2020-03-05  | c       |
+---------+------------+----------+-------------+---------+
```
このロードジョブでは、シーケンス列（modify_date）の値 '2020-03-05' が最大であるため、keyword列は 'c' を保持します。

Table作成時に `function_column.sequence_col` を使用してシーケンス列が指定されている場合、ロード時にシーケンス列のマッピングを指定する必要があります。

**1. Stream Load**

Stream Loadでは、ヘッダーでシーケンス列のマッピングを指定します：

```shell
curl --location-trusted -u root -H "columns: k1,k2,source_sequence,v1,v2" -H "function_column.sequence_col: source_sequence" -T testData http://host:port/api/testDb/testTbl/_stream_load
```
**2. Broker Load**

`ORDER BY`句で隠しカラムマッピングを設定します：

```sql
LOAD LABEL db1.label1
(
    DATA INFILE("hdfs://host:port/user/data/*/test.txt")
    INTO TABLE `tbl1`
    COLUMNS TERMINATED BY ","
    (k1,k2,source_sequence,v1,v2)
    ORDER BY source_sequence
)
WITH BROKER 'broker'
(
    "username"="user",
    "password"="pass"
)
PROPERTIES
(
    "timeout" = "3600"
);
```
**3. Routine Load**

マッピング方法は上記と同じです。例：

```sql
CREATE ROUTINE LOAD example_db.test1 ON example_tbl 
    [WITH MERGE|APPEND|DELETE]
    COLUMNS(k1, k2, source_sequence, v1, v2),
    WHERE k1 > 100 and k2 like "%doris%"
    [ORDER BY source_sequence]
    PROPERTIES
    (
        "desired_concurrent_number"="3",
        "max_batch_interval" = "20",
        "max_batch_rows" = "300000",
        "max_batch_size" = "209715200",
        "strict_mode" = "false"
    )
    FROM KAFKA
    (
        "kafka_broker_list" = "broker1:9092,broker2:9092,broker3:9092",
        "kafka_topic" = "my_topic",
        "kafka_partitions" = "0,1,2,3",
        "kafka_offsets" = "101,0,0,200"
    );
```
**3. 置換順序の確保**

上記の手順を完了した後、以下のデータを読み込んでください：

```Plain
1	2020-02-22	1	2020-02-22	a
1	2020-02-22	1	2020-02-23	b
```
クエリデータ:

```sql
MySQL [test]> select * from test_table;
+---------+------------+----------+-------------+---------+
| user_id | date       | group_id | modify_date | keyword |
+---------+------------+----------+-------------+---------+
|       1 | 2020-02-22 |        1 | 2020-03-05  | c       |
+---------+------------+----------+-------------+---------+
```
このロードでは、sequence列の値'2020-03-05'が最大であるため、keyword列は'c'を保持します。

**4. 以下のデータのロードを試してください**

```Plain
1	2020-02-22	1	2020-02-22	a
1	2020-02-22	1	2020-03-23	w
```
クエリデータ:

```sql
MySQL [test]> select * from test_table;
+---------+------------+----------+-------------+---------+
| user_id | date       | group_id | modify_date | keyword |
+---------+------------+----------+-------------+---------+
|       1 | 2020-02-22 |        1 | 2020-03-23  | w       |
+---------+------------+----------+-------------+---------+
```
今回は、Table内のデータが置き換えられます。要約すると、ロードプロセス中に、すべてのバッチのsequence列の値が比較され、最大値を持つレコードがDorisTableにロードされます。

### 注意

1. 誤用を防ぐため、Stream Load/Broker Loadロードタスクおよび行更新insert文では、ユーザーは明示的にsequence列を指定する必要があります（sequence列のデフォルト値がCURRENT_TIMESTAMPでない限り）。そうでなければ、以下のエラーメッセージが表示されます：

```Plain
Table test_tbl has sequence column, need to specify the sequence column
```
2. Insert文を使用してデータを挿入する際は、指定されたシーケンス列を表示する必要があります。そうでなければ、前述の例外が報告されます。一部のシナリオ（Table複製、内部データ移行など）でDorisの使用を容易にするため、Dorisはセッションパラメータによってシーケンス列のチェック制約を無効にすることができます：

```sql
set require_sequence_in_insert = false;
```
3. バージョン2.0以降、DorisはMerge-on-Write実装のUnique KeyTableに対して部分列更新機能をサポートしています。部分列更新のロードでは、ユーザーは毎回列の一部のみを更新できるため、sequence列を含める必要はありません。ユーザーが送信したロードタスクにsequence列が含まれている場合、動作は影響を受けません。ロードタスクにsequence列が含まれていない場合、Dorisは一致する履歴データのsequence列を、更新される行のsequence列の値として使用します。履歴データに一致するキー列がない場合は、nullまたはデフォルト値が使用されます。

4. 並行ロード中、DorisはMVCCメカニズムを使用してデータの正確性を確保します。2つのデータロードのバッチが同じキーの異なる列を更新する場合、より高いシステムバージョンを持つロードタスクは、より低いバージョンのロードタスクが成功した後、そのより低いバージョンのロードタスクによって書き込まれたデータ行を使用して同じキーを埋めます。
