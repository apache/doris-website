---
{
  "title": "SELECT",
  "description": "主にSelect構文の使用方法を紹介します",
  "language": "ja"
}
---
## デスクリプション

主にSelect構文の使用方法について紹介します

文法:

```sql
SELECT
    [hint_statement, ...]
    [ALL | DISTINCT | DISTINCTROW | ALL EXCEPT ( col_name1 [, col_name2, col_name3, ...] )]
    select_expr [, select_expr ...]
    [FROM table_references
      [PARTITION partition_list]
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
1. **構文説明:**

   1. select_expr, ... 結果で取得され表示される列で、エイリアスを使用する場合、asはオプションです。

   2. select_expr, ... 取得対象Table（サブクエリによって生成された一時Tableを含む1つ以上のTable）

   3. where_definitionは取得条件（式）で、WHERE句がある場合、条件は行データをフィルタリングします。where_conditionは選択される各行に対してtrueと評価される式です。WHERE句がない場合、ステートメントはすべての行を選択します。WHERE式では、集計関数を除いてMySQLがサポートするすべての関数と演算子を使用できます

   4. `ALL | DISTINCT` : 結果セットを更新するため、allはすべて、distinct/distinctrowは重複する列を更新し、デフォルトはallです
   
   5. `ALL EXCEPT`: 完全な（all）結果セットでフィルタリングし、exceptは完全な結果セットから除外する1つ以上の列名を指定します。一致するすべての列名は出力で無視されます。
    
   この機能はApache Doris 1.2バージョン以降でサポートされています
    

   6. `INTO OUTFILE 'file_name'` : 結果を新しいファイル（以前は存在しなかった）に保存し、違いは保存形式にあります。

   7. `Group by having`: 結果セットをグループ化し、havingが現れたときにgroup byの結果をブラッシュします。`Grouping Sets`、`Rollup`、`Cube`はgroup byの拡張です。詳細は[GROUPING SETS DESIGN](https://doris.apache.org/community/design/grouping_sets_design)を参照してください。

   8. `Order by`: 最終結果をソートします。Order byは1つ以上の列のサイズを比較して結果セットをソートします。

      Order byは時間とリソースを消費する操作です。すべてのデータが1つのノードに送信されてからソートする必要があり、ソート操作は非ソート操作よりも多くのメモリを必要とするためです。

      上位Nのソート結果を返す必要がある場合は、LIMIT句を使用する必要があります。メモリ使用量を制限するため、ユーザーがLIMIT句を指定しない場合、デフォルトで最初の65535のソート結果が返されます。

   9. `Limit n`: 出力結果の行数を制限します。`limit m,n`はm行目からn個のレコードを出力することを意味します。`limit m,n`を使用する前に`order by`を使用する必要があります。そうでなければ実行するたびにデータが一致しない可能性があります。

   10. `Having`句はTableの行データをフィルタリングするのではなく、集計関数によって生成された結果をフィルタリングします。

       通常`having`は集計関数（例：`COUNT(), SUM(), AVG(), MIN(), MAX()`）および`group by`句と一緒に使用されます。

   11. SELECTは`table_reference`内のTable名の後にパーティションまたはサブパーティション（またはその両方）のリストを含むPARTITIONを使用した明示的なパーティション選択をサポートします

   12. `[TABLET tids] TABLESAMPLE n [ROWS | PERCENT] [REPEATABLE seek]`: FROM句のTableから読み取る行数を制限し、指定された行数またはパーセンテージに従ってTableから疑似ランダムに多数のTabletsを選択し、REPEATABLEでシード数を指定して選択されたサンプルを再度返します。さらに、TableIDを手動で指定することもできます。これはOLAPTableにのみ使用できることに注意してください。
   
   13. `hint_statement`: selectlistの前のhintは、望ましい実行プランを取得するためにオプティマイザーの動作に影響を与えるためにヒントを使用できることを示しています。詳細は[joinHint使用ドキュメント](https://doris.apache.org/docs/dev/query-acceleration/hints/hints-overview)を参照してください

**構文制約:**

1. SELECTはTableを参照せずに計算された行を取得するためにも使用できます。
2. すべての句は上記の形式に従って厳密に順序付けする必要があり、HAVING句はGROUP BY句の後、ORDER BY句の前に配置する必要があります。
3. エイリアスキーワードASはオプションです。エイリアスはgroup by、order by、havingで使用できます
4. Where句: WHEREステートメントは、GROUP BY部分にどの行を含めるべきかを決定するために実行され、HAVINGは結果セット内のどの行を使用するべきかを決定するために使用されます。
5. HAVING句は集計関数を参照できますが、WHERE句はcount、sum、max、min、avgなどを参照できません。同時に、where句は集計関数以外の他の関数を参照できます。列エイリアスはWhere句で条件を定義するために使用できません。
6. Group byの後にwith rollupを続けると、結果を1回以上カウントできます。

**結合クエリ:**

DorisはJOIN構文をサポートしています

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
**UNION Grammar:**

```sql
SELECT ...
UNION [ALL| DISTINCT] SELECT ......
[UNION [ALL| DISTINCT] SELECT ...]
```
`UNION`は複数の`SELECT`文の結果を単一の結果セットに結合するために使用されます。

最初の`SELECT`文の列名が、返される結果の列名として使用されます。各`SELECT`文の対応する位置にリストされた選択された列は、同じデータ型である必要があります。（例えば、最初の文で選択された最初の列は、他の文で選択された最初の列と同じ型である必要があります。）

`UNION`のデフォルトの動作は、結果から重複行を削除することです。オプションの`DISTINCT`キーワードは、重複行の削除も指定するため、デフォルト以外の効果はありません。オプションの`ALL`キーワードを使用すると、重複行の削除は行われず、結果にはすべての`SELECT`文のすべての一致する行が含まれます。

**WITH文**：

共通Table式を指定するには、1つ以上のカンマ区切りの句を含む`WITH`句を使用します。各副句は結果セットを生成するサブクエリを提供し、名前をサブクエリに関連付けます。次の例では、`cte1`と`cte2`という名前のCTEで`WITH`句を定義し、それらの最上位の`SELECT`の下で`WITH`句を参照しています：

```sql
WITH
  cte1 AS (SELECT a，b FROM table1),
  cte2 AS (SELECT c，d FROM table2)
SELECT b，d FROM cte1 JOIN cte2
WHERE cte1.a = cte2.c;
```
`WITH`句を含むステートメントにおいて、各CTE名を参照して対応するCTE結果セットにアクセスできます。

CTE名は他のCTEから参照することができ、他のCTEに基づいてCTEを定義することが可能です。

再帰CTEは現在サポートされていません。

## Example

1. 年齢が18、20、25の学生の名前をクエリする

   ```sql
   select Name from student where age in (18,20,25);
   ```
2. Example以外のすべて

   ```sql
   -- Query all information except the students' age
   select * except(age) from student; 
   ```
3. GROUP BY の例

   ```sql
   --Query the tb_book table, group by type, and find the average price of each type of book,
   select type,avg(price) from tb_book group by type;
   ```
4. DISTINCT の使用

   ```
   --Query the tb_book table to remove duplicate type data
   select distinct type from tb_book;
   ```
5. ORDER BY の例

   クエリ結果を昇順（デフォルト）または降順（DESC）でソートします。昇順では NULL が最初に、降順では NULL が最後になります。

   ```sql
   --Query all records in the tb_book table, sort them in descending order by id, and display three records
   select * from tb_book order by id desc limit 3;
   ```
6. LIKEファジークエリ

   ファジークエリを実現でき、2つのワイルドカードがあります：`%`と`_`、`%`は1文字以上にマッチでき、`_`は1文字にマッチできます

   ```
   --Find all books whose second character is h
   select * from tb_book where name like('_h%');
   ```
7. LIMITは結果行の数を制限します

   ```sql
   --1. Display 3 records in descending order
   select * from tb_book order by price desc limit 3;
   
   --2. Display 4 records from id=1
   select * from tb_book where id limit 1,4;
   ```
8. CONCAT 複数の列を結合する

   ```sql
   --Combine name and price into a new string output
   select id,concat(name,":",price) as info,type from tb_book;
   ```
9. 関数と式の使用

   ```sql
   --Calculate the total price of various books in the tb_book table
   select sum(price) as total,type from tb_book group by type;
   --20% off price
   select *,(price * 0.8) as "20%" from tb_book;
   ```
10. UNION の例

    ```sql
    SELECT a FROM t1 WHERE a = 10 AND B = 1 ORDER by LIMIT 10
    UNION
    SELECT a FROM t2 WHERE a = 11 AND B = 2 ORDER by LIMIT 10;
    ```
11. WITH句の例

    ```sql
    WITH cte AS
    (
      SELECT 1 AS col1, 2 AS col2
      UNION ALL
      SELECT 3, 4
    )
    SELECT col1, col2 FROM cte;
    ```
12. JOIN 例

    ```sql
    SELECT * FROM t1 LEFT JOIN (t2, t3, t4)
                     ON (t2.a = t1.a AND t3.b = t1.b AND t4.c = t1.c)
    ```
同等

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
## Keywords

    SELECT

## Best Practice

1. SELECT句に関する追加知識

   - select_exprにはAS alias_nameを使用してエイリアスを指定できます。エイリアスは式内でカラム名として使用され、GROUP BY、ORDER BY、HAVING句で使用できます。ASキーワードはカラムのエイリアスを指定する際に使用する良い習慣です。

   - FROMの後のtable_referencesは、クエリに参加する1つ以上のTableを示します。複数のTableがリストされている場合、JOIN操作が実行されます。そして指定された各Tableに対して、エイリアスを定義できます。

   - SELECTの後に選択されたカラムは、ORDER INおよびGROUP BYでカラム名、カラムエイリアス、またはカラム位置を表す整数（1から開始）によって参照できます。

     ```sql
     SELECT college, region, seed FROM tournament
       ORDER BY region, seed;
     
     SELECT college, region AS r, seed AS s FROM tournament
       ORDER BY r, s;
     
     SELECT college, region, seed FROM tournament
       ORDER BY 2, 3;
     ```
- サブクエリにORDER BYが含まれ、外側のクエリにも適用される場合、最も外側のORDER BYが優先されます。

   - GROUP BYを使用した場合、グループ化されたカラムは自動的に昇順でソートされます（同じカラムに続いてORDER BY文があるかのように）。自動ソートによるGROUP BYのオーバーヘッドを回避したい場合は、ORDER BY NULLを追加することで解決できます：

     ```sql
     SELECT a, COUNT(b) FROM test_table GROUP BY a ORDER BY NULL;
     ```
- SELECT で ORDER BY や GROUP BY を使用して列をソートする際、サーバーは max_sort_length システム変数で指定された初期バイト数のみを使用して値をソートします。

   - Having 句は一般的に最後に適用され、結果セットが MySQL クライアントに返される直前に実行されるため、最適化されません。（LIMIT は HAVING の後に適用されます）

     SQL 標準では、HAVING は GROUP BY リスト内の列、または集約関数で使用される列を参照する必要があります。しかし、MySQL では HAVING が Select 句リスト内の列や外部サブクエリの列も参照できるよう拡張されています。

     HAVING で参照される列が曖昧な場合、警告が生成されます。以下のステートメントでは、col2 が曖昧です：

     ```sql
     SELECT COUNT(col1) AS col2 FROM t GROUP BY col2 HAVING col2 = 2;
     ```
- WHERE を使うべき場所で HAVING を使わないよう注意してください。HAVING は GROUP BY と組み合わせて使用します。

   - HAVING 句は集約関数を参照できますが、WHERE では参照できません。

     ```sql
     SELECT user, MAX(salary) FROM users
       GROUP BY user HAVING MAX(salary) > 10;
     ```
LIMIT句は、SELECT文によって返される行数を制限するために使用できます。LIMITは1つまたは2つの引数を持つことができ、どちらも非負の整数である必要があります。

     ```sql
     /*Retrieve 6~15 rows in the result set*/
     SELECT * FROM tbl LIMIT 5,10;
     /*Then if you want to retrieve all rows after a certain offset is set, you can set a very large constant for the second parameter. The following query fetches all data from row 96 onwards */
     SELECT * FROM tbl LIMIT 95,18446744073709551615;
     /*If LIMIT has only one parameter, the parameter specifies the number of rows that should be retrieved, and the offset defaults to 0, that is, starting from the first row*/
     ```
- SELECT...INTOはクエリ結果をファイルに書き込むことを可能にします

2. SELECTキーワードの修飾子

   - 重複除去

     ALLとDISTINCT修飾子は、結果セット内の行を重複除去するかどうかを指定します（列であってはなりません）。

     ALLはデフォルト修飾子で、つまり要件を満たすすべての行を取得します。

     DISTINCTは重複する行を削除します。

2. サブクエリの主な利点

    - サブクエリは構造化されたクエリを可能にし、ステートメントの各部分を分離できます。
    - 一部の操作には複雑な結合と関連付けが必要です。サブクエリはこれらの操作を実行する他の方法を提供します。

3. クエリの高速化

    - データスキャンの範囲を減らすために、可能な限りDorisのパーティションとバケットをデータフィルタリング条件として使用してください
    - クエリ速度を向上させるために、Dorisのプレフィックスインデックスフィールドをデータフィルタ条件として十分に活用してください
    
4. UNION

   - unionキーワードのみを使用することは、union disitnctを使用することと同じ効果があります。重複除去作業はメモリ集約的であるため、union all操作を使用したクエリ速度はより高速になり、メモリ消費量も少なくなります。返された結果セットに対してorder byとlimit操作を実行したい場合、サブクエリ内にunion操作を配置し、その後サブクエリからselectを行い、最後にサブクエリとorder byをサブクエリの外側に配置する必要があります。

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
   
      - inner join条件では、等価結合をサポートするだけでなく、非等価結合もサポートします。パフォーマンス上の理由により、等価結合の使用を推奨します。
      - その他のjoinは等価結合のみをサポートします
