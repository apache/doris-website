---
{
    "title": "SELECT",
    "language": "ja",
    "description": "SELECT 構文の使い方を説明します"
}
---

## 説明

SELECT 構文の使い方を説明します。

構文:

```sql
SELECT
    [hint_statement, ...]
    [ALL | DISTINCT | DISTINCTROW | ALL EXCEPT ( col_name1 [, col_name2, col_name3, ...] )]
    select_expr [, select_expr ...]
    [FROM table_references
      [PARTITION (partition_list) | MAX_VISIBLE_PARTITION()]
      [TABLET tabletid_list]
      [TABLESAMPLE sample_value [ROWS | PERCENT]
        [REPEATABLE pos_seek]]
    [WHERE where_condition]
    [GROUP BY [GROUPING SETS | ROLLUP | CUBE] {col_name | expr | position}]
    [HAVING where_condition]
    [ORDER BY {col_name | expr | position}
      [ASC | DESC], ...]
    [LIMIT {[offset,] row_count | row_count OFFSET offset}]
    [INTO OUTFILE 'file_name']
```

1. **構文の説明:**

   1. select_expr, ...: 取得して結果に表示する列です。別名を指定する場合、AS は省略できます。

   2. select_expr, ...: 取得対象のテーブルです。サブクエリから生成される一時テーブルを含め、一つ以上のテーブルを指定します。

   3. where_definition は条件式を表します。WHERE 句がある場合、条件で行データを絞り込みます。where_condition は、選択する各行に対して真と評価される式です。WHERE 句がない場合は、すべての行を選択します。WHERE 式では、集約関数を除き、MySQL がサポートする関数と演算子を使用できます。

   4. `ALL | DISTINCT `: 結果セットの重複を制御します。ALL はすべての行を返し、DISTINCT と DISTINCTROW は重複を除去します。デフォルトは ALL です。
   
   5. `ALL EXCEPT`: すべての列を対象とし、EXCEPT で指定した一つ以上の列名を除外します。一致する列名はすべて出力から除外されます。
    
   この機能は Apache Doris 1.2 以降でサポートされています。
    

   6. `INTO OUTFILE 'file_name' `: 結果を新しいファイル（既存ではないファイル）に保存します。保存形式によって違いがあります。

   7. `Group by having`: 結果セットをグループ化し、HAVING がある場合は GROUP BY の結果を絞り込みます。`Grouping Sets`、`Rollup`、`Cube` は GROUP BY の拡張です。詳しくは [GROUPING SETS DESIGN](https://doris.apache.org/community/design/grouping_sets_design) を参照してください。

   8. `Order by`: 最終結果を並べ替えます。ORDER BY は、一つ以上の列の値を比較して結果セットを並べ替えます。

      ORDER BY は時間とリソースを消費する操作です。並べ替えの前にすべてのデータを 1 つのノードへ送る必要があり、並べ替えをしない場合より多くのメモリを使います。

      並べ替えた上位 N 件を返すには LIMIT 句を使います。メモリ使用量を抑えるため、LIMIT 句を指定しない場合、デフォルトでは並べ替え後の先頭 65535 件を返します。

   9. `Limit n`: 出力する行数を制限します。`limit m,n` は m 行目から n 件を出力します。`order by` を指定してから `limit m,n` を使用してください。指定しないと、実行ごとに結果が変わる可能性があります。

   10. `Having` 句はテーブル内の行データを絞り込むのではなく、集約関数が生成した結果を絞り込みます。

       通常、`having` は集約関数（`COUNT(), SUM(), AVG(), MIN(), MAX()` など）および `group by` 句とともに使用します。

   11. SELECT では、`table_reference` のテーブル名に続けて、パーティション、サブパーティション、またはその両方のリストを含む PARTITION を指定し、対象を明示的に選択できます。

   12. `MAX_VISIBLE_PARTITION()`: クエリプラン作成時に、パーティションキーが最大の可視パーティションを選択します。`PARTITION(...)` と同時には使用できません。詳細は [最大可視パーティションのクエリ](#query-the-maximum-visible-partition) を参照してください。

   13. `[TABLET tids] TABLESAMPLE n [ROWS | PERCENT] [REPEATABLE seek]`: FROM 句のテーブルから読み取る行数を制限します。指定した行数または割合に応じてテーブルの Tablet を疑似ランダムに選びます。REPEATABLE でシードを指定すると、同じサンプルを再び取得できます。TableID を手動で指定することもできます。これは OLAP テーブルでのみ使用できます。
   
   14. `hint_statement`: 選択リストの前に置くヒントです。オプティマイザーの動作に影響を与え、目的の実行プランを得るために使用します。詳しくは [joinHint の使用方法] (https://doris.apache.org/docs/dev/query-acceleration/hints/hints-overview) を参照してください。

**構文上の制約:**

1. SELECT は、テーブルを参照せずに計算結果の行を取得する場合にも使用できます。
2. 各句は上記の形式に厳密に従って並べます。HAVING 句は GROUP BY 句の後、ORDER BY 句の前に置きます。
3. 別名を指定する際、キーワード AS は省略できます。別名は GROUP BY、ORDER BY、HAVING で使用できます。
4. WHERE 句: WHERE は GROUP BY の対象となる行を決定し、HAVING は結果セットで使用する行を決定します。
5. HAVING 句では COUNT、SUM、MAX、MIN、AVG などの集約関数を参照できますが、WHERE 句では参照できません。WHERE 句では集約関数以外の関数を参照できます。列の別名を WHERE 句の条件に使用することはできません。
6. GROUP BY に WITH ROLLUP を続けると、結果を一回以上集計できます。

### 最大可視パーティションのクエリ {#query-the-maximum-visible-partition}

:::note
この構文は開発バージョン向けであり、対応する実装がマージされた後に使用できます。リリース済みの 4.x バージョンでは使用できません。
:::

`MAX_VISIBLE_PARTITION()` は、パーティションキーが最大の可視パーティションを自動的に選択します。用途は Hive エコシステムで一般的な `max_pt` と似ていますが、Doris のパーティションキーのセマンティクスと可視バージョンに基づいて選択します。

```sql
SELECT *
FROM <table_name> MAX_VISIBLE_PARTITION() [[AS] <table_alias>];
```

可視バージョンが初期バージョンを上回る通常パーティションのみが選択対象です。一時パーティションは対象外です。

| パーティションタイプ | 選択ルール |
| --- | --- |
| RANGE パーティション | 上限値が最大のパーティションを選択 |
| LIST パーティション | 各パーティション内の最大列挙キーを比較し、キーが最大のパーティションを選択 |
| LIST DEFAULT パーティション | 可視の非 DEFAULT パーティションが存在しない場合にのみ選択 |
| 非パーティションテーブル | テーブルが可視の場合、唯一のパーティションを選択 |

複数列のパーティションキーは、パーティション列の定義順に比較されます。可視パーティションが存在しない場合、クエリは空の結果を返します。この構文は内部 OLAP テーブルと非同期マテリアライズドビューでのみ使用でき、`PARTITION(...)` または履歴スナップショットクエリと同時には使用できません。

CTE 参照には直接適用できません。代わりに、CTE 定義内のベーステーブルに適用してください。

:::note
「可視」は「空ではない」という意味ではありません。`DELETE` ですべての行を削除した後も、そのパーティションが選択される場合があります。`TRUNCATE PARTITION` はパーティションバージョンをリセットします。
:::

次の例を実行するには、現在のデータベースに対する CREATE、INSERT、SELECT 権限が必要です。結果は、上限値が最大の可視パーティションから返されます。

```sql
CREATE TABLE max_partition_example (d DATE, amount INT)
DUPLICATE KEY(d)
PARTITION BY RANGE(d) (
    PARTITION p202601 VALUES LESS THAN ('2026-02-01'),
    PARTITION p202602 VALUES LESS THAN ('2026-03-01')
)
DISTRIBUTED BY HASH(d) BUCKETS 1
PROPERTIES ('replication_num' = '1');
INSERT INTO max_partition_example VALUES ('2026-01-15', 10), ('2026-02-15', 20);
SELECT * FROM max_partition_example MAX_VISIBLE_PARTITION();
```

```text
d           amount
2026-02-15  20
```

**JOIN クエリ:**

Doris は JOIN 構文をサポートしています。

```sql
JOIN
table_references:
    table_reference [, table_reference] …
table_reference:
    table_factor
  | join_table
table_factor:
    tbl_name [[AS] alias]
        [{USE|IGNORE|FORCE} INDEX (key_list)]
  | ( table_references )
  | { OJ table_reference LEFT OUTER JOIN table_reference
        ON conditional_expr }
join_table:
    table_reference [INNER | CROSS] JOIN table_factor [join_condition]
  | table_reference LEFT [OUTER] JOIN table_reference join_condition
  | table_reference NATURAL [LEFT [OUTER]] JOIN table_factor
  | table_reference RIGHT [OUTER] JOIN table_reference join_condition
  | table_reference NATURAL [RIGHT [OUTER]] JOIN table_factor
join_condition:
    ON conditional_expr
```

**UNION の構文:**

```sql
SELECT ...
UNION [ALL| DISTINCT] SELECT ......
[UNION [ALL| DISTINCT] SELECT ...]
```

`UNION` は、複数の `SELECT` 文の結果を一つの結果セットにまとめます。

最初の `SELECT` 文の列名が、返される結果の列名になります。各 `SELECT` 文で対応する位置に指定した列のデータ型は同じである必要があります。たとえば、最初の文の第一列は、ほかの文の第一列と同じ型にします。

デフォルトでは、`UNION` は結果から重複行を除去します。省略可能な `DISTINCT` キーワードを指定しても、デフォルトと同じ重複除去を行うため動作は変わりません。`ALL` キーワードを指定すると重複行を除去せず、各 `SELECT` 文に一致する行をすべて結果に含めます。

**WITH 文:**

共通テーブル式を指定するには、カンマで区切った一つ以上の句を持つ `WITH` 句を使用します。各句には結果セットを生成するサブクエリを記述し、その結果に名前を付けます。次の例では `WITH` 句で `cte1` と `cte2` という CTE を定義し、その `WITH` 句を後続の最上位の `SELECT` 文から参照します。

```sql
WITH
  cte1 AS (SELECT a，b FROM table1),
  cte2 AS (SELECT c，d FROM table2)
SELECT b，d FROM cte1 JOIN cte2
WHERE cte1.a = cte2.c;
```

`WITH` 句を含む文では、各 CTE 名を参照して対応する CTE の結果セットにアクセスできます。

ほかの CTE から CTE 名を参照できるため、別の CTE を基に CTE を定義できます。

再帰 CTE は現在サポートされていません。

## 例

1. 年齢が 18、20、25 の学生の名前を取得します。

   ```sql
   select Name from student where age in (18,20,25);
   ```
2. ALL EXCEPT の例
   ```sql
   -- Query all information except the students' age
   select * except(age) from student; 
   ```
   
3. GROUP BY の例

   ```sql
   --Query the tb_book table, group by type, and find the average price of each type of book,
   select type,avg(price) from tb_book group by type;
   ```

4. DISTINCT の使用例

   ```
   --Query the tb_book table to remove duplicate type data
   select distinct type from tb_book;
   ```

5. ORDER BY の例

   クエリ結果を昇順（デフォルト）または降順（DESC）に並べ替えます。昇順では NULL が先頭、降順では NULL が末尾になります。

   ```sql
   --Query all records in the tb_book table, sort them in descending order by id, and display three records
   select * from tb_book order by id desc limit 3;
   ```

6. LIKE によるあいまい検索

   あいまい検索には、`%` と `_` の二つのワイルドカードを使用できます。`%` は一文字以上、`_` は一文字に一致します。

   ```
   --Find all books whose second character is h
   select * from tb_book where name like('_h%');
   ```

7. LIMIT で結果の行数を制限する

   ```sql
   --1. Display 3 records in descending order
   select * from tb_book order by price desc limit 3;
   
   --2. Display 4 records from id=1
   select * from tb_book where id limit 1,4;
   ```

8. CONCAT で複数の列を結合する

   ```sql
   --Combine name and price into a new string output
   select id,concat(name,":",price) as info,type from tb_book;
   ```

9. 関数と式を使用する

   ```sql
   --Calculate the total price of various books in the tb_book table
   select sum(price) as total,type from tb_book group by type;
   --20% off price
   select *,(price * 0.8) as "20%" from tb_book;
   ```

10. UNION の例

    ```sql
    SELECT a FROM t1 WHERE a = 10 AND B = 1 ORDER BY a LIMIT 10
    UNION
    SELECT a FROM t2 WHERE a = 11 AND B = 2 ORDER BY a LIMIT 10;
    ```

11. WITH 句の例

    ```sql
    WITH cte AS
    (
      SELECT 1 AS col1, 2 AS col2
      UNION ALL
      SELECT 3, 4
    )
    SELECT col1, col2 FROM cte;
    ```

12. JOIN の例

    ```sql
    SELECT * FROM t1 LEFT JOIN (t2, t3, t4)
                     ON (t2.a = t1.a AND t3.b = t1.b AND t4.c = t1.c)
    ```

    以下と同等です。

    ```sql
    SELECT * FROM t1 LEFT JOIN (t2 CROSS JOIN t3 CROSS JOIN t4)
                     ON (t2.a = t1.a AND t3.b = t1.b AND t4.c = t1.c)
    ```

13. INNER JOIN

    ```sql
    SELECT t1.name, t2.salary
      FROM employee AS t1 INNER JOIN info AS t2 ON t1.name = t2.name;
    
    SELECT t1.name, t2.salary
      FROM employee t1 INNER JOIN info t2 ON t1.name = t2.name;
    ```

14. LEFT JOIN

    ```sql
    SELECT left_tbl.*
      FROM left_tbl LEFT JOIN right_tbl ON left_tbl.id = right_tbl.id
      WHERE right_tbl.id IS NULL;
    ```

15. RIGHT JOIN

    ```sql
    mysql> SELECT * FROM t1 RIGHT JOIN t2 ON (t1.a = t2.a);
    +------+------+------+------+
    | a    | b    | a    | c    |
    +------+------+------+------+
    |    2 | y    |    2 | z    |
    | NULL | NULL |    3 | w    |
    +------+------+------+------+
    ```

16. TABLESAMPLE

    ```sql
    --Pseudo-randomly sample 1000 rows in t1. Note that several Tablets are actually selected according to the statistics of the table, and the total number of selected Tablet rows may be greater than 1000, so if you want to explicitly return 1000 rows, you need to add Limit.
    SELECT * FROM t1 TABLET(10001) TABLESAMPLE(1000 ROWS) REPEATABLE 2 limit 1000;
    ```

## キーワード

    SELECT

## ベストプラクティス

1. SELECT 句に関する補足

   - select_expr には AS alias_name を使って別名を指定できます。別名は式内で列名として使用でき、GROUP BY、ORDER BY、HAVING 句でも使用できます。列の別名を指定するときは AS キーワードを使うことを推奨します。

   - FROM の後の table_references は、クエリに参加する一つ以上のテーブルを示します。複数のテーブルを指定すると JOIN 操作が行われます。各テーブルには別名を定義できます。

   - SELECT の後に選択した列は、ORDER IN と GROUP BY で、列名、列の別名、または 1 から始まる列位置の整数によって参照できます。

     ```sql
     SELECT college, region, seed FROM tournament
       ORDER BY region, seed;
     
     SELECT college, region AS r, seed AS s FROM tournament
       ORDER BY r, s;
     
     SELECT college, region, seed FROM tournament
       ORDER BY 2, 3;
     ```

   - サブクエリにも外側のクエリにも ORDER BY がある場合は、最も外側の ORDER BY が優先されます。

   - GROUP BY を使うと、グループ化した列は自動的に昇順で並べ替えられます（同じ列に対して ORDER BY を指定した場合と同様です）。自動並べ替えによる負荷を避けるには、ORDER BY NULL を追加します。

     ```sql
     SELECT a, COUNT(b) FROM test_table GROUP BY a ORDER BY NULL;
     ```

     

   - SELECT で ORDER BY または GROUP BY を使って列を並べ替える場合、サーバーはシステム変数 max_sort_length が示す先頭のバイト数だけを使って値を比較します。

   - HAVING 句は通常、結果セットを MySQL クライアントに返す直前に最後に適用され、最適化されません（LIMIT は HAVING の後に適用されます）。

     SQL 標準では、HAVING は GROUP BY リスト内の列を参照するか、集約関数で使用する必要があります。ただし、MySQL では拡張として、SELECT 句のリストにある列や外側のサブクエリの列も HAVING から参照できます。

     HAVING が参照する列が曖昧な場合は警告が生成されます。次の文では col2 が曖昧です。

     ```sql
     SELECT COUNT(col1) AS col2 FROM t GROUP BY col2 HAVING col2 = 2;
     ```

   - WHERE を使うべき箇所で HAVING を使わないでください。HAVING は GROUP BY と組み合わせて使用します。

   - HAVING 句では集約関数を参照できますが、WHERE 句では参照できません。

     ```sql
     SELECT user, MAX(salary) FROM users
       GROUP BY user HAVING MAX(salary) > 10;
     ```

   - LIMIT 句で SELECT 文が返す行数を制限できます。LIMIT には一つまたは二つの引数を指定でき、どちらも非負の整数である必要があります。

     ```sql
     /*Retrieve 6~15 rows in the result set*/
     SELECT * FROM tbl LIMIT 5,10;
     /*Then if you want to retrieve all rows after a certain offset is set, you can set a very large constant for the second parameter. The following query fetches all data from row 96 onwards */
     SELECT * FROM tbl LIMIT 95,18446744073709551615;
     /*If LIMIT has only one parameter, the parameter specifies the number of rows that should be retrieved, and the offset defaults to 0, that is, starting from the first row*/
     ```

   - SELECT...INTO を使うと、クエリ結果をファイルに書き込めます。

2. SELECT キーワードの修飾子

   - 重複の除去

     ALL と DISTINCT の修飾子は、結果セットの行から重複を除去するかどうかを指定します（列の重複を除去するものではありません）。

     ALL はデフォルトの修飾子で、条件を満たすすべての行を取得します。

     DISTINCT は重複行を除去します。

3. サブクエリの主な利点

    - サブクエリを使うと、文の各部分を分離して構造化されたクエリを記述できます。
    - 複雑な和集合や結合を必要とする操作では、サブクエリによって別の記述方法を選べます。

4. クエリを高速化する

    - スキャン対象を減らすため、Doris のパーティションとバケットをできるだけデータの絞り込み条件に使用します。
    - クエリを高速化するため、Doris のプレフィックスインデックスの列をデータの絞り込み条件に活用します。
    
5. UNION

   - UNION だけを指定した場合の効果は UNION DISTINCT と同じです。重複除去はメモリを多く消費するため、UNION ALL を使うクエリのほうが高速で、メモリ使用量も少なくなります。結合後の結果セットに ORDER BY と LIMIT を適用する場合は、UNION 操作をサブクエリ内に置き、そのサブクエリを外側のクエリから選択して ORDER BY を指定します。
   
       ```sql
       select * from (select age from student_01 union all select age from student_02) as t1
       order by age limit 4;
         
       +-------------+
       | age |
       +-------------+
       | 18 |
       | 19 |
       | 20 |
       | 21 |
       +-------------+
       4 rows in set (0.01 sec)
       ```
   
6. JOIN
   
      - 内部結合の条件は、等値結合だけでなく非等値結合もサポートします。パフォーマンス上の理由から、等値結合を推奨します。
      - その他の結合は等値結合のみをサポートします。
