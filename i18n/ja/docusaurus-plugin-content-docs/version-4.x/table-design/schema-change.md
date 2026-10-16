---
{
    "title": "スキーマ変更",
    "language": "ja",
    "description": "Doris では ALTER TABLE を使用してテーブルのスキーマを変更します。この記事では、軽量スキーマ変更と重量スキーマ変更の違い、使用例、サポートされる型変換、ジョブの管理方法について説明します。",
    "keywords": [
        "Doris スキーマ変更",
        "ALTER TABLE",
        "軽量スキーマ変更",
        "重量スキーマ変更",
        "列の追加",
        "列の削除",
        "列の型変更",
        "VARCHAR の長さの変更",
        "列の並べ替え",
        "データ型の変換"
    ]
}
---

<!-- Knowledge type: Operation steps / Configuration parameters / Limitations -->
<!-- Applicable scenarios: Table schema change / Field adjustment / Type conversion -->

[`ALTER TABLE`](../sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-COLUMN.md) を使用して、Doris テーブルのスキーマを変更できます。この記事では**列に関する**スキーマ変更を扱います。インデックスに関する変更方法は、[テーブルインデックス](./index/index-overview.md)を参照してください。

## スキーマ変更の二つの種類

Doris は**軽量**と**重量**の二種類のスキーマ変更をサポートします。実行時の複雑さ、速度、リソース消費量は大きく異なります。操作を選ぶ際は、次の表を参考にしてください。

| 特性 | 軽量スキーマ変更 | 重量スキーマ変更 |
| --- | --- | --- |
| 実行速度 | 数秒（ほぼリアルタイム） | 数分、数時間、または数日（データ量が多いほど時間がかかる） |
| データの書き換え | 不要。メタデータのみ変更 | 必要。データファイルを書き換える |
| システム性能への影響 | 小さい | 特にデータ変換中はシステム性能に影響する可能性がある |
| リソース消費量 | 少ない | 多い。計算リソースを使用し、処理中はテーブルデータのストレージ使用量が倍増する |
| 代表的な操作 | 値列の追加・削除、列名の変更、VARCHAR の長さの変更 | 列のデータ型の変更、NOT NULL から NULL への変更、主キーの変更、列の並び順の変更など |

### 軽量スキーマ変更

**メタデータのみを変更し、データファイルを物理的には変更しません。** 通常は数秒で完了し、システム性能への影響はわずかです。対象となる操作は次のとおりです。

- 値列の追加または削除。
- 列名の変更。
- VARCHAR 列の長さの変更（UNIQUE テーブルと DUP テーブルのキー列を除く）。

### 重量スキーマ変更

**データファイルの書き換えや変換を伴い**、Backend（BE）がバックグラウンドでデータを変更または再編成します。軽量スキーマ変更に該当しない操作はすべて重量スキーマ変更です。たとえば、次の操作が該当します。

- 列のデータ型の変更。
- 列を NOT NULL から NULL に変更。
- 列の並び順の変更。

実行の流れは次のとおりです。

1. バックグラウンドでデータ変換ジョブが開始され、タブレット単位で元のデータが新しいデータファイルに書き換えられます。
2. 変換中は「二重書き込み」が行われ、新しいデータは新旧両方のタブレットに書き込まれます。
3. 変換が完了すると、古いタブレットが削除され、新しいタブレットに切り替わります。

## 使用例

次の表に、一般的な操作と対応する構文を示します。

| 操作 | 構文 |
| --- | --- |
| 列名の変更 | `RENAME COLUMN` |
| キー列または値列の追加 | `ADD COLUMN` |
| 複数列の一括追加 | `ADD COLUMN (...)` |
| 列の削除 | `DROP COLUMN` |
| 列の型または位置の変更 | `MODIFY COLUMN` |
| 列の並べ替え | `ORDER BY` |

### 列名の変更

```sql
ALTER TABLE [database.]table RENAME COLUMN old_column_name new_column_name;
```

構文の詳細は、[ALTER TABLE RENAME](../sql-manual/sql-statements/table-and-view/table/ALTER-TABLE-RENAME.md)を参照してください。

### 列の追加

注意事項：

- 集約モデルに値列を追加する場合は、`agg_type` を指定する必要があります。
- 非集約モデル（DUPLICATE KEY など）にキー列を追加する場合は、`KEY` キーワードを指定する必要があります。

#### 例 1：非集約テーブルへの列の追加

1. テーブルを作成します。

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

2. キー列 `key_col` を `col1` の後に追加します。

    ```sql
    ALTER TABLE example_db.my_table ADD COLUMN key_col INT KEY DEFAULT "0" AFTER col1;
    ```

3. 値列 `value_col` を `col4` の後に追加します。

    ```sql
    ALTER TABLE example_db.my_table ADD COLUMN value_col INT DEFAULT "0" AFTER col4;
    ```

#### 例 2：集約テーブルへの列の追加

1. テーブルを作成します。

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

2. キー列 `key_col` を `col1` の後に追加します。

    ```sql
    ALTER TABLE example_db.my_table ADD COLUMN key_col INT DEFAULT "0" AFTER col1;
    ```

3. 集約方式が SUM の値列 `value_col` を `col4` の後に追加します。

    ```sql
    ALTER TABLE example_db.my_table ADD COLUMN value_col INT SUM DEFAULT "0" AFTER col4;
    ```

### 複数列の追加

注意事項：

- 集約モデルに値列を追加する場合は、`agg_type` を指定する必要があります。
- 集約モデルにキー列を追加する場合は、`KEY` キーワードを指定する必要があります。

集約テーブルに複数の列を追加する手順は次のとおりです。

1. テーブルを作成します。

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

2. 複数の列を一度に追加します。

    ```sql
    ALTER TABLE example_db.my_table
    ADD COLUMN (c1 INT DEFAULT "1", c2 FLOAT SUM DEFAULT "0");
    ```

### 列の削除

注意事項：

- パーティション列は削除できません。
- UNIQUE テーブルのキー列は削除できません。

`example_db.my_table` から列を削除する手順は次のとおりです。

1. テーブルを作成します。

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

2. `col4` 列を `example_db.my_table` から削除します。

    ```sql
    ALTER TABLE example_db.my_table DROP COLUMN col4;
    ```

### 列の型と位置の変更

注意事項：

- 集約モデルの値列を変更する場合は、`agg_type` を指定する必要があります。
- 非集約モデルのキー列を変更する場合は、`KEY` キーワードを指定する必要があります。
- 列の**型**を変更する場合、集約方式とデフォルト値は元の列と同じにする必要があります。
- **NOT NULL から NULL** への変更はサポートされており、重量スキーマ変更として実行されます。**NULL から NOT NULL** への変更はサポートされていません。
- **パーティション列とバケット列は、どのような変更もできません。**
- 列を変更する際は精度の損失に注意してください。サポートされる型変換については、後述の[サポートされる型変換](#supported-type-conversions)を参照してください。

例：

1. テーブルを作成します。

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

2. キー列 `col1` の型を `BIGINT` に変更し、`col2` の後に移動します（キー列と値列のどちらを変更する場合も、列の情報をすべて指定する必要があります）。

    ```sql
    ALTER TABLE example_db.my_table
    MODIFY COLUMN col1 BIGINT KEY DEFAULT "1" AFTER col2;
    ```

3. ベーステーブルの `col5` 列の最大長を変更します。元の `col5` は `VARCHAR(32) REPLACE DEFAULT "abc"` です（VARCHAR の長さのみを変更し、集約方式とデフォルト値は変更しません）。

    ```sql
    ALTER TABLE example_db.my_table
    MODIFY COLUMN col5 VARCHAR(64) REPLACE DEFAULT "abc";
    ```

4. キー列のフィールド長を変更します。

    ```sql
    ALTER TABLE example_db.my_table
    MODIFY COLUMN col3 varchar(50) KEY NULL COMMENT 'to 50';
    ```

5. 列を NOT NULL から NULL に変更します（重量スキーマ変更）。

    ```sql
    ALTER TABLE example_db.my_table
    MODIFY COLUMN col2 INT NULL;
    ```

#### サポートされる型変換 {#supported-type-conversions}

列の型を変更する際は、精度の損失に注意してください。現在、次の変換がサポートされています。

| 変換元の型 | 変換先の型 | 説明 |
| --- | --- | --- |
| TINYINT/SMALLINT/INT/BIGINT/LARGEINT/FLOAT/DOUBLE | 値の範囲がより広い数値型 | - |
| TINYINT/SMALLINT/INT/BIGINT/LARGEINT/FLOAT/DOUBLE/DECIMAL | VARCHAR | - |
| VARCHAR | VARCHAR | 最大長の変更のみサポート |
| VARCHAR/CHAR | TINYINT/SMALLINT/INT/BIGINT/LARGEINT/FLOAT/DOUBLE | - |
| VARCHAR/CHAR | DATE | `%Y-%m-%d`、`%y-%m-%d`、`%Y%m%d`、`%y%m%d`、`%Y/%m/%d`、`%y/%m/%d` の六形式をサポート |
| DATETIME | DATE | 年月日のみ保持される。たとえば、`2019-12-09 21:47:05` は `2019-12-09` になる |
| DATE | DATETIME | 時分秒に自動的にゼロが補われる。たとえば、`2019-12-09` は `2019-12-09 00:00:00` になる |
| FLOAT | DOUBLE | - |
| INT | DATE | INT のデータが無効な場合は変換に失敗し、元のデータは変更されない |
| DATE と DATETIME 以外の型 | STRING | STRING から他の型への変換はできない |

### 列の並べ替え

注意事項：

- テーブル内のすべての列を指定する必要があります。
- 値列はキー列の後に配置する必要があります。

例：

1. テーブルを作成します。

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

2. `example_db.my_table` の列を並べ替えます。

    ```sql
    ALTER TABLE example_db.my_table
    ORDER BY (k3, k1, k2, k4, v2, v1);
    ```

## ジョブの管理

### ジョブの表示

[`SHOW ALTER TABLE COLUMN`](../sql-manual/sql-statements/table-and-view/table/SHOW-ALTER-TABLE.md) コマンドで、スキーマ変更ジョブの進捗を確認できます。実行中または完了済みのジョブが表示されます。ジョブにマテリアライズドビューが含まれる場合、このコマンドはマテリアライズドビューごとに一行ずつ、複数の行を表示します。例：

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

ジョブの状態が `FINISHED` または `CANCELLED` でない場合は、次のコマンドでスキーマ変更ジョブをキャンセルできます。

```sql
CANCEL ALTER TABLE COLUMN FROM tbl_name;
```

## 制限事項

| カテゴリ | 制限 |
| --- | --- |
| **同時実行** | 一つのテーブルで同時に実行できるスキーマ変更ジョブは一つだけ |
| **変更できない列** | パーティション列とバケット列は変更できない |
| **キー列の削除** | REPLACE で集約される値列を含む集約テーブルでは、キー列を削除できない。UNIQUE テーブルのキー列も削除できない |
| **集約列のデフォルト値** | SUM 型または REPLACE 型の値列を追加する場合、過去のデータでは詳細情報が失われているため、デフォルト値は集約後の値を実際には表せず、過去のデータに対して意味を持たない |
| **型の変更** | 列の型を変更する場合、集約方式とデフォルト値は元の列の情報と一致させる必要がある |
| **NULL 許容の変更** | NOT NULL から NULL への変更はサポートされる（重量スキーマ変更）。NULL から NOT NULL への変更はサポートされない |
| **サポートされない変更** | 集約型またはデフォルト値の変更はサポートされない |

## 関連する設定

### FE の設定

| 設定項目 | デフォルト値 | 説明 |
| --- | --- | --- |
| `alter_table_timeout_second` | 86400（秒） | ジョブのデフォルトのタイムアウト |

### BE の設定

| 設定項目 | デフォルト値 | 説明 |
| --- | --- | --- |
| `alter_tablet_worker_count` | 3 | BE 側で過去のデータの変換に使用するスレッド数。この値を適切に増やすとスキーマ変更ジョブを高速化できるが、増やしすぎると IO 負荷が高まり、他の操作に影響する可能性がある |
| `alter_index_worker_count` | 3 | BE 側で過去のデータにインデックスを構築するスレッド数（現在は転置インデックスのみサポート）。調整時の推奨事項は上記と同じ |

> BE の設定を調整した後は、変更を反映するために BE を再起動する必要があります。
