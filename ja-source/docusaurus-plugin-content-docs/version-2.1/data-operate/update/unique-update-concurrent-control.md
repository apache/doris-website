---
{
  "title": "プライマリキーモデルにおける更新の並行制御",
  "language": "ja",
  "description": "Dorisは並行更新を処理するためにMulti-Version Concurrency Control (MVCC)を採用している。各データ書き込み操作には書き込みトランザクションが割り当てられ、"
}
---
## 概要

Dorisは並行更新を処理するためにMulti-Version Concurrency Control（MVCC）を採用しています。各データ書き込み操作には書き込みトランザクションが割り当てられ、原子性（つまり、書き込み操作が完全に成功するか完全に失敗するか）が確保されます。書き込みトランザクションをコミットすると、システムはバージョン番号を割り当てます。Unique Keyモデルでは、データを複数回ロードする際に重複するプライマリキーがある場合、Dorisはバージョン番号に基づいて上書き順序を決定します：より高いバージョン番号のデータがより低いバージョン番号のデータを上書きします。

一部のシナリオでは、ユーザーがテーブル作成文でsequence列を指定することで、データの有効順序を調整する必要がある場合があります。例えば、複数のスレッドを通じてDorisにデータを並行して同期する際、異なるスレッドからのデータが順不同で到着する可能性があります。この場合、後で到着する古いデータが新しいデータを誤って上書きする可能性があります。この問題を解決するため、ユーザーは古いデータにより低いsequence値を、新しいデータにより高いsequence値を割り当てることで、Dorisがユーザー提供のsequence値に基づいて更新順序を正しく判定できるようにします。

さらに、`UPDATE`文は基盤メカニズムレベルでデータロードを通じて実装される更新と大きく異なります。`UPDATE`操作は2つのステップを含みます：データベースから更新対象のデータを読み取り、更新されたデータを書き込みます。デフォルトでは、`UPDATE`文はテーブルレベルロックを通じてSerializable分離レベルでのトランザクション機能を提供し、複数の`UPDATE`操作は連続的にのみ実行できることを意味します。ユーザーは以下のセクションで詳述されているように、設定を調整してこの制限を回避することもできます。

## UPDATE並行制御

デフォルトでは、同じテーブルに対する並行`UPDATE`操作は許可されていません。

主な理由は、Dorisが現在行更新をサポートしており、ユーザーが`SET v2 = 1`を宣言したとしても、他のすべての値列も上書きされる（値が変更されていない場合でも）ことを意味するためです。

これにより、2つの`UPDATE`操作が同時に同じ行を更新する場合、動作が不確定になる可能性があり、ダーティデータを引き起こす可能性があるという問題が発生します。

しかし、実際のアプリケーションでは、並行更新が同時に同じ行を操作しないことをユーザーが保証できる場合、手動で並行更新を有効にできます。FE設定`enable_concurrent_update`を変更し、この設定値を`true`に設定すると、更新コマンドのトランザクション保証が無効になります。

## Sequence列

Uniqueモデルは主に一意のプライマリキーが必要なシナリオ用で、プライマリキーの一意性制約を確保します。同じバッチまたは異なるバッチでロードされるデータの置換順序は保証されません。保証された置換順序がなければ、最終的にテーブルにロードされる具体的なデータは不確定です。

この問題を解決するため、Dorisはsequence列をサポートしています。ロード時にsequence列を指定することで、同じキー列を持つデータはsequence列の値に基づいて置換され、より大きな値がより小さな値を置換し、その逆も同様です。この方法により、ユーザーは置換順序を制御できます。

実装では、Dorisは隠し列**__DORIS_SEQUENCE_COL__**を追加し、その型はテーブル作成時にユーザーによって指定されます。この列の具体的な値はデータロード時に決定され、同じキー列の有効行はこの値に基づいて決定されます。

:::caution 注意
sequence列は現在Uniqueモデルのみをサポートしています。
:::

### Sequence列サポートの有効化

新しいテーブルを作成する際、`function_column.sequence_col`または`function_column.sequence_type`が設定されている場合、新しいテーブルはsequence列をサポートします。

sequence列をサポートしていないテーブルの場合、次の文を使用してこの機能を有効にできます：`ALTER TABLE example_db.my_table ENABLE FEATURE "SEQUENCE_LOAD" WITH PROPERTIES ("function_column.sequence_type" = "Date")`。

テーブルがsequence列をサポートしているかを確認するには、隠し列を表示するセッション変数を設定`SET show_hidden_columns=true`し、その後`desc tablename`を使用します。出力に`__DORIS_SEQUENCE_COL__`列が含まれている場合はサポートされており、そうでなければサポートされていません。

### 使用例

以下はStream Loadを使用した例です：

**1. sequence列をサポートするテーブルの作成**

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
`sequence_col`は、シーケンス列のテーブル内の列へのマッピングを指定します。この列は整数型または日付/時刻型（DATE、DATETIME）である必要があり、作成後に変更することはできません。

テーブル構造は以下の通りです：

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
列マッピングを通じてsequence列を指定することに加えて、Dorisは指定された型に基づいてsequence列を作成することもサポートしています。この方法では、マッピング用のスキーマ内の列は必要ありません。構文は以下の通りです：

```Plain
PROPERTIES (
    "function_column.sequence_type" = 'Date',
);
```
`sequence_type`はシーケンス列の型を指定し、整数またはdate/time型（DATE、DATETIME）を指定できます。

**2. データのロード:**

列マッピング（`function_column.sequence_col`）を使用してシーケンス列を指定する場合、パラメータを変更する必要はありません。以下はStream Loadを使用してデータをロードする例です：

```Plain
1	2020-02-22	1	2020-02-21	a
1	2020-02-22	1	2020-02-22	b
1	2020-02-22	1	2020-03-05	c
1	2020-02-22	1	2020-02-26	d
1	2020-02-22	1	2020-02-23	e
1	2020-02-22	1	2020-02-24	b
```
Stream load コマンド:

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
このロードジョブでは、シーケンス列（modify_date）の値'2020-03-05'が最大であるため、キーワード列は'c'を保持します。

テーブル作成時に`function_column.sequence_col`を使用してシーケンス列が指定されている場合、ロード時にシーケンス列マッピングを指定する必要があります。

**1. Stream Load**

Stream Loadでは、ヘッダーでシーケンス列マッピングを指定します：

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
この読み込みでは、sequence列の値'2020-03-05'が最大であるため、keyword列は'c'を保持します。

**4. 次のデータの読み込みを試す**

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
今回、テーブル内のデータが置き換えられます。要約すると、ロードプロセス中に、すべてのバッチのsequence列の値が比較され、最大値を持つレコードがDorisテーブルにロードされます。

### 注意

1. 誤用を防ぐため、Stream Load/Broker Loadロードタスクおよび行更新insert文では、ユーザーはsequence列を明示的に指定する必要があります（sequence列のデフォルト値がCURRENT_TIMESTAMPでない限り）。そうでない場合、次のエラーメッセージが表示されます：

```Plain
Table test_tbl has sequence column, need to specify the sequence column
```
2. Insert文を使用してデータを挿入する場合、指定されたsequenceカラムを表示する必要があります。そうしないと、前述の例外が報告されます。一部のシナリオ（テーブル複製、内部データ移行など）でのDorisの使用を容易にするため、Dorisはsessionパラメータによってsequenceカラムのチェック制約を無効にすることができます：

```sql
set require_sequence_in_insert = false;
```
3. バージョン2.0以降、DorisはMerge-on-Write実装を持つUnique KeyテーブルでPartial Column Update機能をサポートしています。Partial Column Updateロードでは、ユーザーは毎回列の一部のみを更新できるため、sequence columnを含める必要はありません。ユーザーが送信したロードタスクにsequence columnが含まれている場合、動作は影響を受けません。ロードタスクにsequence columnが含まれていない場合、Dorisは更新される行のsequence columnの値として、マッチする履歴データからのsequence columnを使用します。履歴データに一致するkey columnが存在しない場合、nullまたはデフォルト値が使用されます。

4. 並行ロード中、DorisはMVCCメカニズムを使用してデータの正確性を保証します。2つのデータロードバッチが同じキーの異なる列を更新する場合、より高いシステムバージョンを持つロードタスクは、より低いバージョンのロードタスクが成功した後、より低いバージョンのロードタスクによって書き込まれたデータ行を使用して同じキーを埋めます。
