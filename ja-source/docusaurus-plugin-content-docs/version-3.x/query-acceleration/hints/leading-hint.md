---
{
  "title": "先頭ヒント",
  "description": "Leading Hintは、ユーザーがDorisオプティマイザーに対してクエリ内のtable結合順序を決定するよう導くことを可能にする強力なクエリ最適化技術です。",
  "language": "ja"
}
---
Leading Hintは、ユーザーがDorisオプティマイザーに対してクエリプランにおけるtable結合順序を決定するよう指示することができる強力なクエリ最適化技術です。Leading Hintを正しく使用することで、複雑なクエリのパフォーマンスを大幅に向上させることができます。この記事では、DorisでLeading Hintを使用して結合順序を制御する方法について詳しく説明します。

## 通常のLeading Hint

### 構文

Leading Hintを使用すると、オプティマイザーが従うべきtable結合順序を指定できます。Dorisでは、Leading Hintの基本構文は以下のとおりです：

```sql
SELECT /*+ LEADING(tablespec [tablespec]...) */ ...
```
以下の点に注意してください：

- Leading Hintは`/*+`と`*/`で囲み、SQL文のSELECTキーワードの後に配置します。
- `tablespec`はtable名またはtableエイリアスで、最低2つのtableを指定する必要があります。
- 複数のtableはスペースまたは','で区切ります。
- 中括弧`{}`を使用してJoin Treeの形状を明示的に指定することができます。

例：

```sql
mysql> explain shape plan select /*+ leading(t2 t1) */ * from t1 join t2 on c1 = c2;
+------------------------------------------------------------------------------+
| Explain String(Nereids Planner)                                              |
+------------------------------------------------------------------------------+
| PhysicalResultSink                                                           |
| --PhysicalDistribute[DistributionSpecGather]                                 |
| ----PhysicalProject                                                          |
| ------hashJoin[INNER_JOIN] hashCondition=((t1.c1 = t2.c2)) otherCondition=() |
| --------PhysicalOlapScan[t2]                                                 |
| --------PhysicalDistribute[DistributionSpecHash]                             |
| ----------PhysicalOlapScan[t1]                                               |
|                                                                              |
| Hint log:                                                                    |
| Used: leading(t2 t1)                                                         |
| UnUsed:                                                                      |
| SyntaxError:                                                                 |
+------------------------------------------------------------------------------+
```
Leading Hintが効果的でない場合、プランを生成するために通常のプロセスが使用されます。EXPLAINは使用されたHintが効果的かどうかを表示し、主に3つのタイプに分かれます：

| Status        | デスクリプション |
|--------------|--------------------------------------------------------------------------------------------------------------------------------|
| `Used`       | Leading Hintが正常に効果的です。 |
| `Unused`     | ここでのサポートされていないケースには、Leading Hintで指定された結合順序が元のSQLと等価でない場合や、この版でその機能がサポートされていない場合が含まれます（詳細は制限事項を参照）。 |
| `SyntaxError` | Leading Hintの構文エラーを示します。対応するtableが見つからない場合などです。 |

1. Leading Hintのデフォルト構文は左深木を構築します：

    ```sql
    mysql> explain shape plan select /*+ leading(t1 t2 t3) */ * from t1 join t2 on c1 = c2 join t3 on c2=c3;
    +--------------------------------------------------------------------------------+
    | Explain String(Nereids Planner)                                                |
    +--------------------------------------------------------------------------------+
    | PhysicalResultSink                                                             |
    | --PhysicalDistribute[DistributionSpecGather]                                   |
    | ----PhysicalProject                                                            |
    | ------hashJoin[INNER_JOIN] hashCondition=((t2.c2 = t3.c3)) otherCondition=()   |
    | --------hashJoin[INNER_JOIN] hashCondition=((t1.c1 = t2.c2)) otherCondition=() |
    | ----------PhysicalOlapScan[t1]                                                 |
    | ----------PhysicalDistribute[DistributionSpecHash]                             |
    | ------------PhysicalOlapScan[t2]                                               |
    | --------PhysicalDistribute[DistributionSpecHash]                               |
    | ----------PhysicalOlapScan[t3]                                                 |
    |                                                                                |
    | Hint log:                                                                      |
    | Used: leading(t1 t2 t3)                                                        |
    | UnUsed:                                                                        |
    | SyntaxError:                                                                   |
    +--------------------------------------------------------------------------------+
    ```
2. 同時に、波括弧を使用してJoinツリーの形状を指定することができます：

    ```sql
    mysql> explain shape plan select /*+ leading(t1 {t2 t3}) */ * from t1 join t2 on c1 = c2 join t3 on c2=c3;
    +----------------------------------------------------------------------------------+
    | Explain String(Nereids Planner)                                                  |
    +----------------------------------------------------------------------------------+
    | PhysicalResultSink                                                               |
    | --PhysicalDistribute[DistributionSpecGather]                                     |
    | ----PhysicalProject                                                              |
    | ------hashJoin[INNER_JOIN] hashCondition=((t1.c1 = t2.c2)) otherCondition=()     |
    | --------PhysicalOlapScan[t1]                                                     |
    | --------PhysicalDistribute[DistributionSpecHash]                                 |
    | ----------hashJoin[INNER_JOIN] hashCondition=((t2.c2 = t3.c3)) otherCondition=() |
    | ------------PhysicalOlapScan[t2]                                                 |
    | ------------PhysicalDistribute[DistributionSpecHash]                             |
    | --------------PhysicalOlapScan[t3]                                               |
    |                                                                                  |
    | Hint log:                                                                        |
    | Used: leading(t1 { t2 t3 })                                                      |
    | UnUsed:                                                                          |
    | SyntaxError:                                                                     |
    +----------------------------------------------------------------------------------+
    ```
3. ViewがJoinReorderに参加するためのエイリアスとして使用される場合、対応するViewをLeading Hintのパラメータとして指定できます。例えば：

    ```sql
    mysql> explain shape plan select /*+ leading(alias t1) */ count(*) from t1 join (select c2 from t2 join t3 on t2.c2 = t3.c3) as alias on t1.c1 = alias.c2;
      +--------------------------------------------------------------------------------------+
      | Explain String(Nereids Planner)                                                      |
      +--------------------------------------------------------------------------------------+
      | PhysicalResultSink                                                                   |
      | --hashAgg[GLOBAL]                                                                    |
      | ----PhysicalDistribute[DistributionSpecGather]                                       |
      | ------hashAgg[LOCAL]                                                                 |
      | --------PhysicalProject                                                              |
      | ----------hashJoin[INNER_JOIN] hashCondition=((t1.c1 = alias.c2)) otherCondition=()  |
      | ------------PhysicalProject                                                          |
      | --------------hashJoin[INNER_JOIN] hashCondition=((t2.c2 = t3.c3)) otherCondition=() |
      | ----------------PhysicalProject                                                      |
      | ------------------PhysicalOlapScan[t2]                                               |
      | ----------------PhysicalDistribute[DistributionSpecHash]                             |
      | ------------------PhysicalProject                                                    |
      | --------------------PhysicalOlapScan[t3]                                             |
      | ------------PhysicalDistribute[DistributionSpecHash]                                 |
      | --------------PhysicalProject                                                        |
      | ----------------PhysicalOlapScan[t1]                                                 |
      |                                                                                      |
      | Hint log:                                                                            |
      | Used: leading(alias t1)                                                              |
      | UnUsed:                                                                              |
      | SyntaxError:                                                                         |
      +--------------------------------------------------------------------------------------+
    ```
### Case

#### Basic シナリオ

1. table作成文は以下の通りです：

    ```sql
    CREATE DATABASE testleading;
    USE testleading;
    
    create table t1 (c1 int, c11 int) distributed by hash(c1) buckets 3 properties('replication_num' = '1');
    create table t2 (c2 int, c22 int) distributed by hash(c2) buckets 3 properties('replication_num' = '1');
    create table t3 (c3 int, c33 int) distributed by hash(c3) buckets 3 properties('replication_num' = '1');
    create table t4 (c4 int, c44 int) distributed by hash(c4) buckets 3 properties('replication_num' = '1');
    ```
2. 元の計画:

    ```sql
    mysql> explain shape plan select * from t1 join t2 on t1.c1 = c2;
    +-------------------------------------------+
    | Explain String                            |
    +-------------------------------------------+
    | PhysicalResultSink                        |
    | --PhysicalDistribute                      |
    | ----PhysicalProject                       |
    | ------hashJoin[INNER_JOIN](t1.c1 = t2.c2) |
    | --------PhysicalOlapScan[t2]              |
    | --------PhysicalDistribute                |
    | ----------PhysicalOlapScan[t1]            |
    +-------------------------------------------+
    ```
3. t1とt2の結合順序を交換する必要がある場合、前に`leading(t2 t1)`を追加するだけです。`explain`を実行すると、このヒントが使用されているかどうかが表示されます。以下はLeadingプランです：`Used`は、Hintが正常に有効であることを示します。

    ```sql
    mysql> explain shape plan select /*+ leading(t2 t1) */ * from t1 join t2 on c1 = c2;
    +------------------------------------------------------------------------------+
    | Explain String(Nereids Planner)                                              |
    +------------------------------------------------------------------------------+
    | PhysicalResultSink                                                           |
    | --PhysicalDistribute[DistributionSpecGather]                                 |
    | ----PhysicalProject                                                          |
    | ------hashJoin[INNER_JOIN] hashCondition=((t1.c1 = t2.c2)) otherCondition=() |
    | --------PhysicalOlapScan[t2]                                                 |
    | --------PhysicalDistribute[DistributionSpecHash]                             |
    | ----------PhysicalOlapScan[t1]                                               |
    |                                                                              |
    | Hint log:                                                                    |
    | Used: leading(t2 t1)                                                         |
    | UnUsed:                                                                      |
    | SyntaxError:                                                                 |
    +------------------------------------------------------------------------------+
    ```
4. Leading Hintに構文エラーがある場合、`explain`を実行すると、対応する情報が`SyntaxError`に表示されますが、プランは引き続き正常に生成されます。ただし、Leadingは使用されません。例：

    ```sql
    mysql> explain shape plan select /*+ leading(t2 t3) */ * from t1 join t2 on t1.c1 = c2;
    +--------------------------------------------------------+
    | Explain String                                         |
    +--------------------------------------------------------+
    | PhysicalResultSink                                     |
    | --PhysicalDistribute                                   |
    | ----PhysicalProject                                    |
    | ------hashJoin[INNER_JOIN](t1.c1 = t2.c2)              |
    | --------PhysicalOlapScan[t1]                           |
    | --------PhysicalDistribute                             |
    | ----------PhysicalOlapScan[t2]                         |
    |                                                        |
    | Used:                                                  |
    | UnUsed:                                                |
    | SyntaxError: leading(t2 t3) Msg:can not find table: t3 |
    +--------------------------------------------------------+
    ```
#### Extended シナリオ

1. Left-Deep Tree

   上述のように、DorisでQueryステートメントが括弧を使用しない場合、Leadingはデフォルトでleft-deep treeを生成します。

    ```sql
    mysql> explain shape plan select /*+ leading(t1 t2 t3) */ * from t1 join t2 on t1.c1 = c2 join t3 on c2 = c3;
    +--------------------------------------------------------------------------------+
    | Explain String(Nereids Planner)                                                |
    +--------------------------------------------------------------------------------+
    | PhysicalResultSink                                                             |
    | --PhysicalDistribute[DistributionSpecGather]                                   |
    | ----PhysicalProject                                                            |
    | ------hashJoin[INNER_JOIN] hashCondition=((t2.c2 = t3.c3)) otherCondition=()   |
    | --------hashJoin[INNER_JOIN] hashCondition=((t1.c1 = t2.c2)) otherCondition=() |
    | ----------PhysicalOlapScan[t1]                                                 |
    | ----------PhysicalDistribute[DistributionSpecHash]                             |
    | ------------PhysicalOlapScan[t2]                                               |
    | --------PhysicalDistribute[DistributionSpecHash]                               |
    | ----------PhysicalOlapScan[t3]                                                 |
    |                                                                                |
    | Hint log:                                                                      |
    | Used: leading(t1 t2 t3)                                                        |
    | UnUsed:                                                                        |
    | SyntaxError:                                                                   |
    +--------------------------------------------------------------------------------+
    ```
2. Right-Deep Tree

   プランの形状をright-deep tree、Bushy tree、またはzig-zag treeにする必要がある場合、波括弧を追加してプランの形状を制限するだけで済み、Oracleのようにswapを使用してleft-deep treeから段階的に調整する必要はありません。

    ```sql
    mysql> explain shape plan select /*+ leading(t1 {t2 t3}) */ * from t1 join t2 on t1.c1 = c2 join t3 on c2 = c3;
    +-----------------------------------------------+
    | Explain String                                |
    +-----------------------------------------------+
    | PhysicalResultSink                            |
    | --PhysicalDistribute                          |
    | ----PhysicalProject                           |
    | ------hashJoin[INNER_JOIN](t1.c1 = t2.c2)     |
    | --------PhysicalOlapScan[t1]                  |
    | --------PhysicalDistribute                    |
    | ----------hashJoin[INNER_JOIN](t2.c2 = t3.c3) |
    | ------------PhysicalOlapScan[t2]              |
    | ------------PhysicalDistribute                |
    | --------------PhysicalOlapScan[t3]            |
    |                                               |
    | Used: leading(t1 { t2 t3 })                   |
    | UnUsed:                                       |
    | SyntaxError:                                  |
    +-----------------------------------------------+
    ```
3. Bushy Tree

    ```sql
    mysql> explain shape plan select /*+ leading({t1 t2} {t3 t4}) */ * from t1 join t2 on t1.c1 = c2 join t3 on c2 = c3 join t4 on c3 = c4;
    +-----------------------------------------------+
    | Explain String                                |
    +-----------------------------------------------+
    | PhysicalResultSink                            |
    | --PhysicalDistribute                          |
    | ----PhysicalProject                           |
    | ------hashJoin[INNER_JOIN](t2.c2 = t3.c3)     |
    | --------hashJoin[INNER_JOIN](t1.c1 = t2.c2)   |
    | ----------PhysicalOlapScan[t1]                |
    | ----------PhysicalDistribute                  |
    | ------------PhysicalOlapScan[t2]              |
    | --------PhysicalDistribute                    |
    | ----------hashJoin[INNER_JOIN](t3.c3 = t4.c4) |
    | ------------PhysicalOlapScan[t3]              |
    | ------------PhysicalDistribute                |
    | --------------PhysicalOlapScan[t4]            |
    |                                               |
    | Used: leading({ t1 t2 } { t3 t4 })            |
    | UnUsed:                                       |
    | SyntaxError:                                  |
    +-----------------------------------------------+
    ```
4. zig-zag tree

    ```sql
    mysql> explain shape plan select /*+ leading(t1 {t2 t3} t4) */ * from t1 join t2 on t1.c1 = c2 join t3 on c2 = c3 join t4 on c3 = c4;
    +--------------------------------------------------------------------------------------+
    | Explain String(Nereids Planner)                                                      |
    +--------------------------------------------------------------------------------------+
    | PhysicalResultSink                                                                   |
    | --PhysicalDistribute[DistributionSpecGather]                                         |
    | ----PhysicalProject                                                                  |
    | ------hashJoin[INNER_JOIN] hashCondition=((t3.c3 = t4.c4)) otherCondition=()         |
    | --------PhysicalDistribute[DistributionSpecHash]                                     |
    | ----------hashJoin[INNER_JOIN] hashCondition=((t1.c1 = t2.c2)) otherCondition=()     |
    | ------------PhysicalOlapScan[t1]                                                     |
    | ------------PhysicalDistribute[DistributionSpecHash]                                 |
    | --------------hashJoin[INNER_JOIN] hashCondition=((t2.c2 = t3.c3)) otherCondition=() |
    | ----------------PhysicalOlapScan[t2]                                                 |
    | ----------------PhysicalDistribute[DistributionSpecHash]                             |
    | ------------------PhysicalOlapScan[t3]                                               |
    | --------PhysicalDistribute[DistributionSpecHash]                                     |
    | ----------PhysicalOlapScan[t4]                                                       |
    |                                                                                      |
    | Hint log:                                                                            |
    | Used: leading(t1 { t2 t3 } t4)                                                       |
    | UnUsed:                                                                              |
    | SyntaxError:                                                                         |
    +--------------------------------------------------------------------------------------+
    ```
5. Non-inner Join

   non-inner join（Outer JoinやSemi/Anti Joinなど）に遭遇した場合、Leading Hintは元のSQLセマンティクスに従って、各joinのjoinメソッドを自動的に導出します。Leading Hintが元のSQLセマンティクスと異なる場合、または生成できない場合は、UnUsedに配置されますが、これはプランの正常な生成には影響しません。
   以下は交換できない例です：

    ```sql
    -------- test outer join which can not swap
    -- t1 leftjoin (t2 join t3 on (P23)) on (P12) != (t1 leftjoin t2 on (P12)) join t3 on (P23)
    mysql> explain shape plan select /*+ leading(t1 {t2 t3}) */ * from t1 left join t2 on c1 = c2 join t3 on c2 = c3;
    +--------------------------------------------------------------------------------+
    | Explain String(Nereids Planner)                                                |
    +--------------------------------------------------------------------------------+
    | PhysicalResultSink                                                             |
    | --PhysicalDistribute[DistributionSpecGather]                                   |
    | ----PhysicalProject                                                            |
    | ------hashJoin[INNER_JOIN] hashCondition=((t2.c2 = t3.c3)) otherCondition=()   |
    | --------hashJoin[INNER_JOIN] hashCondition=((t1.c1 = t2.c2)) otherCondition=() |
    | ----------PhysicalOlapScan[t1]                                                 |
    | ----------PhysicalDistribute[DistributionSpecHash]                             |
    | ------------PhysicalOlapScan[t2]                                               |
    | --------PhysicalDistribute[DistributionSpecHash]                               |
    | ----------PhysicalOlapScan[t3]                                                 |
    |                                                                                |
    | Hint log:                                                                      |
    | Used:                                                                          |
    | UnUsed: leading(t1 { t2 t3 })                                                  |
    | SyntaxError:                                                                   |
    +--------------------------------------------------------------------------------+
    ```
読者が自分で検証できるように、Leading Hintを使ったOuter、Semi、Anti Joinの例をいくつか示します。

    ```sql
    -------- test outer join which can swap
    -- (t1 leftjoin t2  on (P12)) innerjoin t3 on (P13) = (t1 innerjoin t3 on (P13)) leftjoin t2  on (P12)
    explain shape plan select * from t1 left join t2 on c1 = c2 join t3 on c1 = c3;
    explain shape plan select /*+ leading(t1 t3 t2) */ * from t1 left join t2 on c1 = c2 join t3 on c1 = c3;

    -- (t1 leftjoin t2  on (P12)) leftjoin t3 on (P13) = (t1 leftjoin t3 on (P13)) leftjoin t2  on (P12)
    explain shape plan select * from t1 left join t2 on c1 = c2 left join t3 on c1 = c3;
    explain shape plan select /*+ leading(t1 t3 t2) */ * from t1 left join t2 on c1 = c2 left join t3 on c1 = c3;

    -- (t1 leftjoin t2  on (P12)) leftjoin t3 on (P23) = t1 leftjoin (t2  leftjoin t3 on (P23)) on (P12)
    select /*+ leading(t2 t3 t1) SWAP_INPUT(t1) */ * from t1 left join t2 on c1 = c2 left join t3 on c2 = c3;
    explain shape plan select /*+ leading(t1 {t2 t3}) */ * from t1 left join t2 on c1 = c2 left join t3 on c2 = c3;
    explain shape plan select /*+ leading(t1 {t2 t3}) */ * from t1 left join t2 on c1 = c2 left join t3 on c2 = c3;

    -------- test outer join which can not swap
    --  t1 leftjoin (t2  join t3 on (P23)) on (P12) != (t1 leftjoin t2  on (P12)) join t3 on (P23)
    -- eliminated to inner join
    explain shape plan select /*+ leading(t1 {t2 t3}) */ * from t1 left join t2 on c1 = c2 join t3 on c2 = c3;
    explain graph select /*+ leading(t1 t2 t3) */ * from t1 left join (select * from t2 join t3 on c2 = c3) on c1 = c2;

    -- test semi join
    explain shape plan select * from t1 where c1 in (select c2 from t2);
    explain shape plan select /*+ leading(t2 t1) */ * from t1 where c1 in (select c2 from t2);

    -- test anti join
    explain shape plan select * from t1 where exists (select c2 from t2);
    ```
6. View

   エイリアス（Alias）が関与する場合、エイリアスは完全で独立したサブツリーとして指定でき、結合順序はテキスト順序に従って生成されます

    ```sql
    mysql>  explain shape plan select /*+ leading(alias t1) */ count(*) from t1 join (select c2 from t2 join t3 on t2.c2 = t3.c3) as alias on t1.c1 = alias.c2;
    +--------------------------------------------------------------------------------------+
    | Explain String(Nereids Planner)                                                      |
    +--------------------------------------------------------------------------------------+
    | PhysicalResultSink                                                                   |
    | --hashAgg[GLOBAL]                                                                    |
    | ----PhysicalDistribute[DistributionSpecGather]                                       |
    | ------hashAgg[LOCAL]                                                                 |
    | --------PhysicalProject                                                              |
    | ----------hashJoin[INNER_JOIN] hashCondition=((t1.c1 = alias.c2)) otherCondition=()  |
    | ------------PhysicalProject                                                          |
    | --------------hashJoin[INNER_JOIN] hashCondition=((t2.c2 = t3.c3)) otherCondition=() |
    | ----------------PhysicalProject                                                      |
    | ------------------PhysicalOlapScan[t2]                                               |
    | ----------------PhysicalDistribute[DistributionSpecHash]                             |
    | ------------------PhysicalProject                                                    |
    | --------------------PhysicalOlapScan[t3]                                             |
    | ------------PhysicalDistribute[DistributionSpecHash]                                 |
    | --------------PhysicalProject                                                        |
    | ----------------PhysicalOlapScan[t1]                                                 |
    |                                                                                      |
    | Hint log:                                                                            |
    | Used: leading(alias t1)                                                              |
    | UnUsed:                                                                              |
    | SyntaxError:                                                                         |
    +--------------------------------------------------------------------------------------+
    ```
## Ordered Hint

Ordered hintはleading hintの特殊なケースと見なすことができ、テキスト順序として結合順序を制御するために使用されます。

### 構文

Ordered Hintの構文は`/*+ ORDERED */`で、`SELECT`文の`SELECT`キーワードの後に配置され、その直後にクエリの残りの部分が続きます。

### ケース

以下はOrdered Hintを使用する例です：

```sql
mysql> explain shape plan select /*+ ORDERED */ t1.c1 from t2 join t1 on t1.c1 = t2.c2 join t3 on c2 = c3;
+--------------------------------------------------------------------------------+
| Explain String(Nereids Planner)                                                |
+--------------------------------------------------------------------------------+
| PhysicalResultSink                                                             |
| --PhysicalDistribute[DistributionSpecGather]                                   |
| ----PhysicalProject                                                            |
| ------hashJoin[INNER_JOIN] hashCondition=((t2.c2 = t3.c3)) otherCondition=()   |
| --------hashJoin[INNER_JOIN] hashCondition=((t1.c1 = t2.c2)) otherCondition=() |
| ----------PhysicalProject                                                      |
| ------------PhysicalOlapScan[t2]                                               |
| ----------PhysicalDistribute[DistributionSpecHash]                             |
| ------------PhysicalProject                                                    |
| --------------PhysicalOlapScan[t1]                                             |
| --------PhysicalDistribute[DistributionSpecHash]                               |
| ----------PhysicalProject                                                      |
| ------------PhysicalOlapScan[t3]                                               |
|                                                                                |
| Hint log:                                                                      |
| Used: ORDERED                                                                  |
| UnUsed:                                                                        |
| SyntaxError:                                                                   |
+--------------------------------------------------------------------------------+
```
Leading Hintとの関係

Ordered HintとLeading Hintが同時に使用される場合、Ordered HintがLeading Hintよりも優先されます。これは、Leading Hintが指定されていても、Ordered Hintも存在する場合、クエリプランはOrdered Hintのルールに従って実行され、Leading Hintは無視されることを意味します。以下は、両方が同時に使用される状況を示す例です：

```sql
mysql> explain shape plan select /*+ ORDERED LEADING(t1 t2 t3) */ t1.c1 from t2 join t1 on t1.c1 = t2.c2 join t3 on c2 = c3;
  +--------------------------------------------------------------------------------+
  | Explain String(Nereids Planner)                                                |
  +--------------------------------------------------------------------------------+
  | PhysicalResultSink                                                             |
  | --PhysicalDistribute[DistributionSpecGather]                                   |
  | ----PhysicalProject                                                            |
  | ------hashJoin[INNER_JOIN] hashCondition=((t2.c2 = t3.c3)) otherCondition=()   |
  | --------hashJoin[INNER_JOIN] hashCondition=((t1.c1 = t2.c2)) otherCondition=() |
  | ----------PhysicalProject                                                      |
  | ------------PhysicalOlapScan[t2]                                               |
  | ----------PhysicalDistribute[DistributionSpecHash]                             |
  | ------------PhysicalProject                                                    |
  | --------------PhysicalOlapScan[t1]                                             |
  | --------PhysicalDistribute[DistributionSpecHash]                               |
  | ----------PhysicalProject                                                      |
  | ------------PhysicalOlapScan[t3]                                               |
  |                                                                                |
  | Hint log:                                                                      |
  | Used: ORDERED                                                                  |
  | UnUsed: leading(t1 t2 t3)                                                      |
  | SyntaxError:                                                                   |
  +--------------------------------------------------------------------------------+
```
## 要約

Leading Hintは結合順序を手動で制御するための強力な機能であり、本番環境のビジネスチューニングで広く使用されています。leading hintを適切に使用することで、現場での結合順序に対するチューニング要件を満たし、システム制御の柔軟性を向上させることができます。
