---
{
    "title": "ALTER TABLE COLUMN",
    "language": "ja",
    "description": "このステートメントは、既存のテーブルのスキーマを変更するために使用します。スキーマ変更は非同期で実行されます。"
}
---

## 説明

このステートメントは、既存のテーブルのスキーマを変更するために使用します。スキーマ変更は非同期で実行され、タスクの送信に成功すると制御が戻ります。その後、[SHOW ALTER TABLE COLUMN](../../../../sql-manual/sql-statements/table-and-view/table/SHOW-ALTER-TABLE) コマンドで進捗を確認できます。

Doris では、テーブルの作成後にマテリアライズドインデックスという概念があります。テーブルが正常に作成されると、そのテーブルがベーステーブルとなり、対応するマテリアライズドインデックスがベースインデックスとなります。ベーステーブルを基に rollup インデックスを作成できます。ベースインデックスと rollup インデックスはいずれもマテリアライズドインデックスです。スキーマ変更時に rollup_index_name を指定しない場合、デフォルトではベーステーブルを対象に操作します。

:::tip
Doris 1.2.0 では、軽微な構造変更に対して light schema change をサポートしています。値列の追加と削除は、より迅速かつ同期的に完了できます。テーブル作成時に "light_schema_change" = 'true' を手動で指定できます。このパラメータはバージョン 2.0.0 以降、デフォルトで有効です。
:::

### 構文:

```sql
ALTER TABLE [database.]table alter_clause;
```

スキーマ変更の alter_clause では、次の変更方法をサポートします。

**1. 指定したインデックスの指定した位置に列を追加する**

**構文**

```sql
ALTER TABLE [database.]table table_name ADD COLUMN column_name column_type [KEY | agg_type] [DEFAULT "default_value"]
[AFTER column_name|FIRST]
[TO rollup_index_name]
[PROPERTIES ("key"="value", ...)]
```
  
**例**
  
1. example_db.my_table の key_1 の後にキー列 new_col を追加する（非集約モデル）
  
  ```sql
  ALTER TABLE example_db.my_table
  ADD COLUMN new_col INT KEY DEFAULT "0" AFTER key_1;
  ```
  
2. example_db.my_table の value_1 の後に値列 new_col を追加する（非集約モデル）
  
  ```sql
  ALTER TABLE example_db.my_table
  ADD COLUMN new_col INT DEFAULT "0" AFTER value_1;
  ```

3. example_db.my_table の key_1 の後にキー列 new_col を追加する（集約モデル）

  ```sql
  ALTER TABLE example_db.my_table
  ADD COLUMN new_col INT KEY DEFAULT "0" AFTER key_1;
  ```

4. example_db.my_table の value_1 の後に、集約方式が SUM の値列 new_col を追加する（集約モデル）

  ```sql
  ALTER TABLE example_db.my_table   
  ADD COLUMN new_col INT SUM DEFAULT "0" AFTER value_1; 
  ```

5. example_db.my_table の先頭に new_col を追加する（非集約モデル）

  ```sql
  ALTER TABLE example_db.my_table
  ADD COLUMN new_col INT KEY DEFAULT "0" FIRST;
  ```

:::tip 
- 集約モデルに値列を追加する場合は、agg_type を指定する必要があります。
- DUPLICATE KEY などの非集約モデルにキー列を追加する場合は、KEY キーワードを指定する必要があります。
- ベースインデックスに既に存在する列を rollup インデックスに追加することはできません（必要に応じて rollup インデックスを再作成できます）。
:::


**2. 指定したインデックスに複数の列を追加する**

**構文**
  
```sql
ALTER TABLE [database.]table table_name ADD COLUMN (column_name1 column_type [KEY | agg_type] DEFAULT "default_value", ...)
[TO rollup_index_name]
[PROPERTIES ("key"="value", ...)]
```

  
**例**
  
1. example_db.my_table に複数の列を追加する。new_col と new_col2 はいずれも集約方式が SUM の列（集約モデル）
  
  ```sql
  ALTER TABLE example_db.my_table
  ADD COLUMN (new_col1 INT SUM DEFAULT "0" ,new_col2 INT SUM DEFAULT "0");
  ```
  
2. example_db.my_table に複数の列を追加する。new_col1 はキー列、new_col2 は値列（非集約モデル）
  
  ```sql
  ALTER TABLE example_db.my_table
  ADD COLUMN (new_col1 INT key DEFAULT "0" , new_col2 INT DEFAULT "0");
  ```

:::tip
  - 集約モデルに値列を追加する場合は、agg_type を指定する必要があります。
  - 集約モデルにキー列を追加する場合は、KEY キーワードを指定する必要があります。
  - ベースインデックスに既に存在する列を rollup インデックスに追加することはできません（必要に応じて rollup インデックスを再作成できます）。 
:::

**3. 指定したインデックスから列を削除する**

**構文***
  
  ```sql
  ALTER TABLE [database.]table table_name DROP COLUMN column_name
  [FROM rollup_index_name]
  ```

**例**
   
1. example_db.my_table から列 col1 を削除する
  
  ```sql
  ALTER TABLE example_db.my_table DROP COLUMN col1;
  ```

:::tip
  - パーティション列は削除できません。
  - 集約モデルでは KEY 列を削除できません。
  - ベースインデックスから列を削除すると、その列が rollup インデックスにも含まれている場合は、rollup インデックスからも削除されます。 
:::

**4. 指定したインデックスの列の型と位置を変更する**

**構文**
  
```sql
ALTER TABLE [database.]table table_name MODIFY COLUMN column_name column_type [KEY | agg_type] [NULL | NOT NULL] [DEFAULT "default_value"]
[AFTER column_name|FIRST]
[FROM rollup_index_name]
[PROPERTIES ("key"="value", ...)]
```
  
**例**
  
1. ベースインデックスのキー列 col1 の型を BIGINT に変更し、col2 の後に移動する

  ```sql
  ALTER TABLE example_db.my_table 
  MODIFY COLUMN col1 BIGINT KEY DEFAULT "1" AFTER col2;
  ```

  :::tip
  キー列と値列のどちらを変更する場合も、列の情報を完全に指定する必要があります。
  :::

2. ベースインデックスの列 val1 の最大長を変更する。変更前の val1 の定義は (val1 VARCHAR(32) REPLACE DEFAULT "abc")

  ```sql
  ALTER TABLE example_db.my_table 
  MODIFY COLUMN val1 VARCHAR(64) REPLACE DEFAULT "abc";
  ```

  :::tip
  変更できるのは列のデータ型だけです。列のその他の属性は変更せずに保持する必要があります。
  :::

3. Duplicate Key テーブルのキー列にあるフィールドの長さを変更する

  ```sql
  ALTER TABLE example_db.my_table 
  MODIFY COLUMN k3 VARCHAR(50) KEY NULL COMMENT 'to 50';
  ```

:::tip
  - 集約モデルの値列を変更する場合は、agg_type を指定する必要があります。
  - 非集約モデルのキー列を変更する場合は、KEY キーワードを指定する必要があります。
  - 変更できるのは列の型だけで、その他の属性はそのまま維持されます（つまり、元の属性をステートメント内に明示的に記述する必要があります。上記の例 2 を参照してください）。
  - パーティション列とバケット分割列はいかなる方法でも変更できません。
  - 現在、次の型変換をサポートしています（精度の低下についてはユーザーが責任を負います）。
    - TINYINT/SMALLINT/INT/BIGINT/LARGEINT/FLOAT/DOUBLE から、より大きい数値型への変換
    - TINTINT/SMALLINT/INT/BIGINT/LARGEINT/FLOAT/DOUBLE/DECIMAL から VARCHAR への変換
    - VARCHAR の最大長の変更
    - VARCHAR/CHAR から TINTINT/SMALLINT/INT/BIGINT/LARGEINT/FLOAT/DOUBLE への変換
    - VARCHAR/CHAR から DATE への変換（現在、"%Y-%m-%d"、"%y-%m-%d"、"%Y%m%d"、"%y%m%d"、"%Y/%m/%d, "%y/%m/%d" の六つの形式をサポート）
    - DATETIME から DATE への変換（年月日の情報のみを保持します。例: `2019-12-09 21:47:05` <--> `2019-12-09`）
    - DATE から DATETIME への変換（時分秒には自動的にゼロが補われます。例: `2019-12-09` <--> `2019-12-09 00:00:00`）
    - FLOAT から DOUBLE への変換
    - INT から DATE への変換（INT 型のデータが不正な場合、変換は失敗し、元のデータは変更されません）
    - DATE と DATETIME 以外のすべての型は STRING に変換できますが、STRING から他の型には変換できません。 
:::

**5. 指定したインデックスの列を並べ替える**

**構文**
  
  ```sql
  ALTER TABLE [database.]table table_name ORDER BY (column_name1, column_name2, ...)
  [FROM rollup_index_name]
  [PROPERTIES ("key"="value", ...)]
  ```
  
**例**
  
1. example_db.my_table のキー列と値列の順序を変更する（非集約モデル）
  
  ```sql
  CREATE TABLE `my_table`(
  `k_1` INT NULL,
  `k_2` INT NULL,
  `v_1` INT NULL,
  `v_2` varchar NULL,
  `v_3` varchar NULL
  ) ENGINE=OLAP
  DUPLICATE KEY(`k_1`, `k_2`)
  COMMENT 'OLAP'
  DISTRIBUTED BY HASH(`k_1`) BUCKETS 5
  PROPERTIES (
  "replication_allocation" = "tag.location.default: 1"
  );

  ALTER TABLE example_db.my_table ORDER BY (k_2,k_1,v_3,v_2,v_1);

  mysql> desc my_table;
  +-------+------------+------+-------+---------+-------+
  | Field | Type       | Null | Key   | Default | Extra |
  +-------+------------+------+-------+---------+-------+
  | k_2   | INT        | Yes  | true  | NULL    |       |
  | k_1   | INT        | Yes  | true  | NULL    |       |
  | v_3   | VARCHAR(*) | Yes  | false | NULL    | NONE  |
  | v_2   | VARCHAR(*) | Yes  | false | NULL    | NONE  |
  | v_1   | INT        | Yes  | false | NULL    | NONE  |
  +-------+------------+------+-------+---------+-------+
  ```
  
2. 二つの操作を同時に実行する
  
  ```sql
  CREATE TABLE `my_table` (
  `k_1` INT NULL,
  `k_2` INT NULL,
  `v_1` INT NULL,
  `v_2` varchar NULL,
  `v_3` varchar NULL
  ) ENGINE=OLAP
  DUPLICATE KEY(`k_1`, `k_2`)
  COMMENT 'OLAP'
  DISTRIBUTED BY HASH(`k_1`) BUCKETS 5
  PROPERTIES (
  "replication_allocation" = "tag.location.default: 1"
  );

  ALTER TABLE example_db.my_table
  ADD COLUMN col INT DEFAULT "0" AFTER v_1,
  ORDER BY (k_2,k_1,v_3,v_2,v_1,col);

  mysql> desc my_table;
  +-------+------------+------+-------+---------+-------+
  | Field | Type       | Null | Key   | Default | Extra |
  +-------+------------+------+-------+---------+-------+
  | k_2   | INT        | Yes  | true  | NULL    |       |
  | k_1   | INT        | Yes  | true  | NULL    |       |
  | v_3   | VARCHAR(*) | Yes  | false | NULL    | NONE  |
  | v_2   | VARCHAR(*) | Yes  | false | NULL    | NONE  |
  | v_1   | INT        | Yes  | false | NULL    | NONE  |
  | col   | INT        | Yes  | false | 0       | NONE  |
  +-------+------------+------+-------+---------+-------+
  ```

:::tip
  - インデックス内のすべての列を記述します。
  - 値列はキー列の後に配置します。
  - キー列はキー列の範囲内でのみ順序を変更できます。値列についても同様です。
:::
  
## キーワード

```text
ALTER, TABLE, COLUMN, ALTER TABLE
```

## ベストプラクティス
