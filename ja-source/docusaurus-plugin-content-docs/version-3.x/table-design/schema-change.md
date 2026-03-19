---
{
  "title": "スキーマ変更",
  "language": "ja",
  "description": "ユーザーはAlter table操作を通じてDorisテーブルのスキーマを変更できます。スキーマ変更は主に列の変更とインデックスの変更を含みます。"
}
---
ユーザーは[Alter table](../sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-COLUMN.md)操作を通じてDorisテーブルのスキーマを変更できます。スキーマ変更は主にカラムの変更とインデックスの変更を含みます。この記事では主にカラム関連のスキーマ変更について紹介します。インデックス関連の変更については、[table Index](./index/index-overview.md)を参照してインデックス変更の異なる方法について理解してください。

## 原理の紹介

Dorisは2種類のスキーマ変更操作をサポートします：軽量スキーマ変更と重量スキーマ変更です。違いは主に実行プロセスの複雑さ、実行速度、リソース消費にあります。

| 機能             | 軽量スキーマ変更 | 重量スキーマ変更 |
|---------------------|---------------------------|---------------------------|
| 実行速度      | 数秒（ほぼリアルタイム） | 数分、数時間、数日（テーブル内のデータ量に依存；データが多いほど実行が遅い） |
| データ書き換えが必要  | いいえ                        | はい、データファイルの書き換えを含む |
| システムパフォーマンスへの影響 | 最小限               | システムパフォーマンスに影響する可能性があり、特にデータ変換中 |
| リソース消費  | 低                       | 高、データ再編成のために計算リソースを消費し、プロセスに関わるテーブルのデータが占めるストレージ容量が倍増する。 |
| 操作タイプ      | value列の追加、削除、列名の変更、VARCHAR長の変更 | 列データタイプの変更、主キーの変更、列順序の変更など |

### 軽量スキーマ変更

軽量スキーマ変更とは、データの書き換えを含まない単純なスキーマ変更操作を指します。これらの操作は通常メタデータレベルで実行され、データファイルへの物理的な変更を含むことなく、テーブルのメタデータの変更のみが必要です。軽量スキーマ変更操作は通常数秒で完了でき、システムパフォーマンスに大きな影響を与えません。軽量スキーマ変更には以下が含まれます：

- value列の追加または削除
- 列名の変更
- VARCHAR列の長さの変更（UNIQUEおよびDUPテーブルのキー列を除く）

### 重量スキーマ変更

重量スキーマ変更はデータファイルの書き換えまたは変換を含み、これらの操作は比較的複雑で、通常DorisのBackend（BE）の支援を必要として実際のデータ変更または再編成を実行します。重量スキーマ変更操作は通常テーブルのデータ構造への深い変更を含み、ストレージの物理レイアウトに影響を与える可能性があります。軽量スキーマ変更をサポートしないすべての操作は重量スキーマ変更に分類されます。例：

- 列のデータタイプの変更
- 列の順序の変更

重量操作はデータ変換のためにバックグラウンドでタスクを開始します。バックグラウンドタスクはテーブルの各tabletを変換し、元のデータをtabletベースで新しいデータファイルに書き換えます。データ変換プロセス中に「ダブルライト」現象が発生する可能性があり、新しいデータが新しいtabletと古いtabletの両方に同時に書き込まれます。データ変換が完了すると、古いtabletは削除され、新しいtabletがそれを置き換えます。

## ジョブ管理
### ジョブの表示

ユーザーは[`SHOW ALTER TABLE COLUMN`](../sql-manual/sql-statements/table-and-view/table/SHOW-ALTER-TABLE.md)コマンドを通じてスキーマ変更ジョブの進行状況を表示できます。このコマンドにより、ユーザーは現在実行中または完了したスキーマ変更ジョブを確認できます。スキーマ変更ジョブがマテリアライズドビューを含む場合、このコマンドは複数の行を表示し、各行がマテリアライズドビューに対応します。例は以下の通りです：

```sql
mysql > SHOW ALTER TABLE COLUMN\G;
*************************** 1. row ***************************
        JobId: 20021
    TableName: tbl1
   CreateTime: 2019-08-05 23:03:13
   FinishTime: 2019-08-05 23:03:42
    IndexName: tbl1
      IndexId: 20022
OriginIndexId: 20017
SchemaVersion: 2:792557838
TransactionId: 10023
        State: FINISHED
          Msg:
     Progress: NULL
      Timeout: 86400
1 row in set (0.00 sec)
```
### ジョブのキャンセル

ジョブステータスがFINISHEDまたはCANCELLEDでない場合、以下のコマンドを使用してスキーマ変更ジョブをキャンセルできます：

```sql
CANCEL ALTER TABLE COLUMN FROM tbl_name;
```
## 使用例

### カラムの名前変更

```sql
ALTER TABLE [database.]table RENAME COLUMN old_column_name new_column_name;
```
特定の構文については、[ALTER TABLE RENAME](../sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-RENAME)を参照してください。

### カラムの追加

- 集約モデルが値カラムを追加する場合、`agg_type`を指定する必要があります。

- 非集約モデル（DUPLICATE KEYなど）がキーカラムを追加する場合、KEYキーワードを指定する必要があります。

*非集約テーブルへのカラムの追加*

1. テーブル作成文

```sql
CREATE TABLE IF NOT EXISTS example_db.my_table(
    col1 int,
    col2 int,
    col3 int,
    col4 int,
    col5 int
) DUPLICATE KEY(col1, col2, col3)
DISTRIBUTED BY RANDOM BUCKETS 10;
```
2. `example_db.my_table`の`col1`の後にキー列`key_col`を追加する

```sql
ALTER TABLE example_db.my_table ADD COLUMN key_col INT KEY DEFAULT "0" AFTER col1;
```
3. `example_db.my_table`の`col4`の後に値列`value_col`を追加する

```sql
ALTER TABLE example_db.my_table ADD COLUMN value_col INT DEFAULT "0" AFTER col4;
```
*aggregate テーブルへの列の追加*

1. Create table ステートメント

```sql
CREATE TABLE IF NOT EXISTS example_db.my_table(
    col1 int,
    col2 int,
    col3 int,
    col4 int SUM,
    col5 varchar(32) REPLACE DEFAULT "abc"
) AGGREGATE KEY(col1, col2, col3)
DISTRIBUTED BY HASH(col1) BUCKETS 10;
```
2. `example_db.my_table`の`col1`の後にキーカラム`key_col`を追加する

```sql
ALTER TABLE example_db.my_table ADD COLUMN key_col INT DEFAULT "0" AFTER col1;
```
3. `example_db.my_table`の`col4`の後にSUM集約タイプの値列`value_col`を追加する

```sql
ALTER TABLE example_db.my_table ADD COLUMN value_col INT SUM DEFAULT "0" AFTER col4;
```
### 複数のカラムを追加する

- 集計モデルがvalue カラムを追加する場合、`agg_type`を指定する必要があります。

- 集計モデルがkey カラムを追加する場合、KEYキーワードを指定する必要があります。

*aggregateテーブルに複数のカラムを追加する*

1. テーブル作成文

```sql
CREATE TABLE IF NOT EXISTS example_db.my_table(
    col1 int,
    col2 int,
    col3 int,
    col4 int SUM,
    col5 varchar(32) REPLACE DEFAULT "abc"
) AGGREGATE KEY(col1, col2, col3)
DISTRIBUTED BY HASH(col1) BUCKETS 10;
```
2. `example_db.my_table`（集約モデル）に複数のカラムを追加する

```sql
ALTER TABLE example_db.my_table
ADD COLUMN (c1 INT DEFAULT "1", c2 FLOAT SUM DEFAULT "0");
```
### カラムの削除

- パーティションカラムは削除できません。

- UNIQUE keyカラムは削除できません。

`example_db.my_table`からカラムを削除するには

1. テーブル作成文

```sql
CREATE TABLE IF NOT EXISTS example_db.my_table(
    col1 int,
    col2 int,
    col3 int,
    col4 int SUM,
    col5 varchar(32) REPLACE DEFAULT "abc"
) AGGREGATE KEY(col1, col2, col3)
DISTRIBUTED BY HASH(col1) BUCKETS 10;
```
2. `example_db.my_table`から`col4`列を削除する

```sql
ALTER TABLE example_db.my_table DROP COLUMN col4;
```
### カラムの型と位置の変更

- 集約モデルが値カラムを変更する場合、`agg_type` を指定する必要があります。

- 非集約型がキーカラムを変更する場合、**KEY** キーワードを指定する必要があります。

- カラムの型のみ変更可能で、カラムの他の属性は同じままにする必要があります。

- パーティションカラムとバケットカラムは変更できません。

- 現在、以下の型変換がサポートされています（ユーザーは精度の損失に注意する必要があります）：

  - TINYINT/SMALLINT/INT/BIGINT/LARGEINT/FLOAT/DOUBLE 型は、より大きな数値型に変換できます。

  - TINTINT/SMALLINT/INT/BIGINT/LARGEINT/FLOAT/DOUBLE/DECIMAL は VARCHAR に変換できます。

  - VARCHAR は最大長の変更をサポートします。

  - VARCHAR/CHAR は TINTINT/SMALLINT/INT/BIGINT/LARGEINT/FLOAT/DOUBLE に変換できます。

  - VARCHAR/CHAR は DATE に変換できます（現在6つの形式をサポート："%Y-%m-%d", "%y-%m-%d", "%Y%m%d", "%y%m%d", "%Y/%m/%d", "%y/%m/%d"）。

  - DATETIME は DATE に変換できます（年月日の情報のみ保持、例：`2019-12-09 21:47:05` <--> `2019-12-09`）。

  - DATE は DATETIME に変換できます（時、分、秒は自動的に0に設定、例：`2019-12-09` <--> `2019-12-09 00:00:00`）。

  - FLOAT は DOUBLE に変換できます。

  - INT は DATE に変換できます（INT型のデータが無効な場合、変換に失敗し、元のデータは変更されません）。

  - DATE と DATETIME 以外のすべての型は STRING に変換できますが、STRING は他の型に変換できません。

1. テーブル作成文

```sql
CREATE TABLE IF NOT EXISTS example_db.my_table(
    col0 int,
    col1 int DEFAULT "1",
    col2 int,
    col3 varchar(32),
    col4 int SUM,
    col5 varchar(32) REPLACE DEFAULT "abc"
) AGGREGATE KEY(col0, col1, col2, col3)
DISTRIBUTED BY HASH(col0) BUCKETS 10;
```
2. キー列 `col1` の型を BIGINT に変更し、列 `col2` の後に移動する

```sql
ALTER TABLE example_db.my_table 
MODIFY COLUMN col1 BIGINT KEY DEFAULT "1" AFTER col2;
```
注意：キーカラムまたはバリューカラムを変更する場合、完全なカラム情報を宣言する必要があります。

3. ベーステーブルの`val1`カラムの最大長を変更します。元の`val1`は(val1 VARCHAR(32) REPLACE DEFAULT "abc")でした

```sql
ALTER TABLE example_db.my_table 
MODIFY COLUMN col5 VARCHAR(64) REPLACE DEFAULT "abc";
```
注意: 列の型のみ変更可能です。列の他の属性は同じままである必要があります。

4. キー列のフィールドの長さを変更する

```sql
ALTER TABLE example_db.my_table
MODIFY COLUMN col3 varchar(50) KEY NULL comment 'to 50';
```
### 並び替え

- すべての列を列挙する必要があります。
- 値列はキー列の後に配置する必要があります。

1. Create table statement

```sql
CREATE TABLE IF NOT EXISTS example_db.my_table(
    k1 int DEFAULT "1",
    k2 int,
    k3 varchar(32),
    k4 date,
    v1 int SUM,
    v2 int MAX,
) AGGREGATE KEY(k1, k2, k3, k4)
DISTRIBUTED BY HASH(k1) BUCKETS 10;
```
2. `example_db.my_table`の列を並び替える

```sql
ALTER TABLE example_db.my_table
ORDER BY (k3,k1,k2,k4,v2,v1);
```
## 制限事項

- テーブルでは、同時に実行できるスキーマ変更ジョブは1つだけです。

- パーティション列とバケット列は変更できません。

- 集約テーブルでREPLACEメソッドを使用して集約された値列がある場合、キー列を削除することはできません。

- ユニークテーブルではキー列を削除することはできません。

- SUMまたはREPLACEの集約タイプで値列を追加する場合、その列のデフォルト値は履歴データに対して意味を持ちません。

- 履歴データは詳細情報が失われているため、デフォルト値は実際には集約値を反映できません。

- 列タイプを変更する際は、Type以外のすべてのフィールドを元の列の情報で補完する必要があります。

- 新しい列タイプを除き、集約メソッド、Nullable属性、デフォルト値は元の情報に従って補完する必要があることに注意してください。

- 集約タイプ、Nullable属性、デフォルト値の変更はサポートされていません。

## 関連設定

### FE設定

- `alter_table_timeout_second`: ジョブのデフォルトタイムアウト、86400秒。

### BE設定

- `alter_tablet_worker_count`: BE側で履歴データ変換を実行するために使用されるスレッド数。デフォルトは3です。スキーマ変更ジョブを高速化したい場合は、このパラメータを適切に増加させてBEを再起動できます。ただし、変換スレッドが多すぎるとIO圧迫が増加し、他の操作に影響を与える可能性があります。

- `alter_index_worker_count`: BE側で履歴データインデックス構築を実行するために使用されるスレッド数（注意：現在は転置インデックスのみサポート）。デフォルトは3です。インデックス変更ジョブを高速化したい場合は、このパラメータを適切に増加させてBEを再起動できます。ただし、スレッドが多すぎるとIO圧迫が増加し、他の操作に影響を与える可能性があります。
