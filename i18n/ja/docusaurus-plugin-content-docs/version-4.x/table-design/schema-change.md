---
{
  "title": "スキーマ変更",
  "language": "ja",
  "description": "ユーザーはAlter Table操作を通じてDorisテーブルのスキーマを変更できます。スキーマ変更は主にカラムの変更とインデックスの変更を含みます。"
}
---
ユーザーは [Alter Table](../sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-COLUMN.md) 操作を通じて Doris テーブルのスキーマを変更できます。スキーマ変更は主にカラムの変更とインデックスの変更に関わります。この記事では主にカラムに関するスキーマ変更について紹介します。インデックス関連の変更については、[Table Index](./index/index-overview.md) を参照してインデックス変更の異なる方法について理解してください。

## 原理の紹介

Doris は2つのタイプのスキーマ変更操作をサポートしています：軽量スキーマ変更と重量スキーマ変更です。主な違いは実行プロセスの複雑さ、実行速度、リソース消費にあります。

| 機能             | 軽量スキーマ変更 | 重量スキーマ変更 |
|---------------------|---------------------------|---------------------------|
| 実行速度      | 秒単位（ほぼリアルタイム） | 分、時間、日単位（テーブル内のデータ量に依存。データが大きいほど実行が遅くなる） |
| データ書き換えが必要  | いいえ                        | はい、データファイルの書き換えが関わる |
| システムパフォーマンスへの影響 | 最小限               | システムパフォーマンスに影響を与える可能性がある、特にデータ変換中 |
| リソース消費  | 低い                       | 高い、データを再編成するために計算リソースを消費し、プロセスに関わるテーブルデータが占有するストレージ容量が倍になる |
| 操作タイプ      | 値カラムの追加・削除、カラム名変更、VARCHAR 長の変更 | カラムデータタイプの変更、主キーの変更、カラム順序の変更など |

### 軽量スキーマ変更

軽量スキーマ変更とは、データの書き換えを伴わないシンプルなスキーマ変更操作を指します。これらの操作は通常メタデータレベルで実行され、テーブルのメタデータを変更するだけで、データファイルへの物理的な変更は関わりません。軽量スキーマ変更操作は通常数秒で完了し、システムパフォーマンスに大きな影響を与えません。軽量スキーマ変更には以下が含まれます：

- 値カラムの追加または削除
- カラムの名前変更
- VARCHAR カラムの長さの変更（UNIQUE および DUP テーブルキーカラムを除く）

### 重量スキーマ変更

重量スキーマ変更はデータファイルの書き換えまたは変換を伴い、これらの操作は比較的複雑で、通常 Doris の Backend (BE) の支援を必要として実際のデータ変更や再編成を実行します。重量スキーマ変更操作は通常テーブルのデータ構造への深い変更を伴い、ストレージの物理レイアウトに影響を与える可能性があります。軽量スキーマ変更をサポートしないすべての操作は重量スキーマ変更に該当します。例えば：

- カラムのデータタイプの変更
- カラム順序の変更

重量操作はバックグラウンドでデータ変換のためのタスクを開始します。バックグラウンドタスクはテーブルの各 tablet を変換し、tablet 単位で元のデータを新しいデータファイルに書き換えます。データ変換プロセス中に「二重書き込み」現象が発生する可能性があり、新しいデータが新しい tablet と古い tablet の両方に同時に書き込まれます。データ変換が完了すると、古い tablet は削除され、新しい tablet がそれを置き換えます。

## ジョブ管理
### ジョブの表示

ユーザーは [`SHOW ALTER TABLE COLUMN`](../sql-manual/sql-statements/table-and-view/table/SHOW-ALTER-TABLE.md) コマンドを通じてスキーマ変更ジョブの進行状況を確認できます。このコマンドにより、ユーザーは現在実行中または完了したスキーマ変更ジョブを見ることができます。スキーマ変更ジョブがマテリアライズドビューを含む場合、このコマンドは複数行を表示し、各行がマテリアライズドビューに対応します。例は以下の通りです：

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

### カラム名の変更

```sql
ALTER TABLE [database.]table RENAME COLUMN old_column_name new_column_name;
```
具体的な構文については、[ALTER TABLE RENAME](../sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-RENAME)を参照してください。

### カラムの追加

- aggregate modelが値カラムを追加する場合、`agg_type`を指定する必要があります。

- 非aggregate model（DUPLICATE KEYなど）がキーカラムを追加する場合、KEYキーワードを指定する必要があります。

*非aggregateテーブルへのカラム追加*

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
*集約テーブルへの列の追加*

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
2. `example_db.my_table`の`col1`の後にキー列`key_col`を追加する

```sql
ALTER TABLE example_db.my_table ADD COLUMN key_col INT DEFAULT "0" AFTER col1;
```
3. `example_db.my_table`の`col4`の後に、SUM集約タイプの値列`value_col`を追加する

```sql
ALTER TABLE example_db.my_table ADD COLUMN value_col INT SUM DEFAULT "0" AFTER col4;
```
### 複数列の追加

- 集約モデルが値列を追加する場合、`agg_type`を指定する必要があります。

- 集約モデルがキー列を追加する場合、KEYキーワードを指定する必要があります。

*集約テーブルへの複数列の追加*

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
### カラム型と位置の変更

- 集約モデルが値カラムを変更する場合、`agg_type`を指定する必要があります。

- 非集約型がキーカラムを変更する場合、**KEY**キーワードを指定する必要があります。

- カラムの型のみ変更可能で、カラムの他の属性は同じままでなければなりません。

- パーティションカラムとバケットカラムは変更できません。

- 現在、以下の型変換がサポートされています（ユーザーは精度の損失に注意する必要があります）：

  - TINYINT/SMALLINT/INT/BIGINT/LARGEINT/FLOAT/DOUBLE型は、より大きな数値型に変換できます。

  - TINTINT/SMALLINT/INT/BIGINT/LARGEINT/FLOAT/DOUBLE/DECIMALはVARCHARに変換できます。

  - VARCHARは最大長の変更をサポートしています。

  - VARCHAR/CHARはTINTINT/SMALLINT/INT/BIGINT/LARGEINT/FLOAT/DOUBLEに変換できます。

  - VARCHAR/CHARはDATEに変換できます（現在6つのフォーマットをサポート："%Y-%m-%d"、"%y-%m-%d"、"%Y%m%d"、"%y%m%d"、"%Y/%m/%d"、"%y/%m/%d"）。

  - DATETIMEはDATEに変換できます（年月日情報のみ保持、例：`2019-12-09 21:47:05` <--> `2019-12-09`）。

  - DATEはDATETIMEに変換できます（時分秒は自動的に0に設定、例：`2019-12-09` <--> `2019-12-09 00:00:00`）。

  - FLOATはDOUBLEに変換できます。

  - INTはDATEに変換できます（INT型データが無効な場合、変換に失敗し、元のデータは変更されません）。

  - DATEとDATETIME以外のすべての型はSTRINGに変換できますが、STRINGは他の型に変換できません。

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
注意: キー列または値列を変更する場合、完全な列情報を宣言する必要があります。

3. ベーステーブルの`val1`列の最大長を変更します。元の`val1`は (val1 VARCHAR(32) REPLACE DEFAULT "abc") でした

```sql
ALTER TABLE example_db.my_table 
MODIFY COLUMN col5 VARCHAR(64) REPLACE DEFAULT "abc";
```
注意: カラムのタイプのみ変更可能です。カラムの他の属性は同じままにする必要があります。

4. キーカラム内のフィールドの長さを変更する

```sql
ALTER TABLE example_db.my_table
MODIFY COLUMN col3 varchar(50) KEY NULL comment 'to 50';
```
### Reorder

- すべての列をリストする必要があります。
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

- テーブルは同時に実行できるスキーマ変更ジョブを1つだけ持つことができます。

- パーティションカラムとバケットカラムは変更できません。

- 集約テーブルがREPLACEメソッドを使用して集約された値カラムを持つ場合、キーカラムは削除できません。

- ユニークテーブルはキーカラムを削除できません。

- SUMまたはREPLACEの集約タイプで値カラムを追加する場合、そのカラムのデフォルト値は履歴データに対して意味を持ちません。

- 履歴データは詳細情報が失われているため、デフォルト値は実際には集約された値を反映できません。

- カラムタイプを変更する場合、Type以外のすべてのフィールドは元のカラムの情報で補完する必要があります。

- 新しいカラムタイプを除き、集約メソッド、Nullable属性、およびデフォルト値は元の情報に従って補完する必要があることに注意してください。

- 集約タイプ、Nullable属性、およびデフォルト値の変更はサポートされていません。

## 関連する設定

### FE設定

- `alter_table_timeout_second`: ジョブのデフォルトタイムアウト、86400秒。

### BE設定

- `alter_tablet_worker_count`: BE側で履歴データ変換を実行するために使用されるスレッド数。デフォルトは3。スキーマ変更ジョブを高速化したい場合は、このパラメータを適切に増加させてBEを再起動できます。ただし、変換スレッドが多すぎるとIO圧迫が増加し、他の操作に影響を与える可能性があります。

- `alter_index_worker_count`: BE側で履歴データのインデックス構築を実行するために使用されるスレッド数（注意：現在は転置インデックスのみサポート）。デフォルトは3。インデックス変更ジョブを高速化したい場合は、このパラメータを適切に増加させてBEを再起動できます。ただし、スレッドが多すぎるとIO圧迫が増加し、他の操作に影響を与える可能性があります。
