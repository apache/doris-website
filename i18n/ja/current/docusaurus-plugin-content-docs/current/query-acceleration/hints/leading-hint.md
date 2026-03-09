---
{
  "title": "リーディングヒント",
  "language": "ja",
  "description": "Leading Hintは、ユーザーがDorisオプティマイザーを誘導してクエリ内のテーブル結合順序を決定できる強力なクエリ最適化技術です"
}
---
Leading Hintは、ユーザーがDorisオプティマイザーをガイドして、クエリプランにおけるテーブル結合順序を決定できる強力なクエリ最適化技術です。Leading Hintを正しく使用することで、複雑なクエリのパフォーマンスを大幅に向上させることができます。この記事では、DorisにおいてLeading Hintを使用して結合順序を制御する方法について詳細に説明します。

## 通常のLeading Hint

### 構文

Leading Hintでは、オプティマイザーが従うべきテーブル結合順序を指定できます。Dorisにおける、Leading Hintの基本構文は以下の通りです：

```sql
SELECT /*+ LEADING(tablespec [tablespec]...) */ ...
```
注意すべき点は以下の通りです：

- Leading Hintは`/*+`と`*/`で囲まれ、SQL文のSELECTキーワードの後に配置されます。
- `tablespec`はテーブル名またはテーブルエイリアスであり、最低2つのテーブルを指定する必要があります。
- 複数のテーブルはスペースまたは','で区切られます。
- 波括弧`{}`を使用してJoin Treeの形状を明示的に指定することができます。

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
Leading Hintが有効でない場合、プランの生成には通常のプロセスが使用されます。EXPLAINでは使用されたHintが有効かどうかが表示され、主に3つのタイプに分かれます：

| Status        | Description |
|--------------|--------------------------------------------------------------------------------------------------------------------------------|
| `Used`       | Leading Hintが正常に有効です。 |
| `Unused`     | ここでのサポートされていないケースには、Leading Hintで指定された結合順序が元のSQLと同等でない場合や、この版ではその機能がサポートされていない場合が含まれます（詳細は制限事項を参照してください）。 |
| `SyntaxError` | Leading Hintに構文エラーがあることを示します。たとえば、対応するテーブルが見つからない場合などです。 |

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
3. ViewがJoinReorderに参加するエイリアスとして使用される場合、対応するViewをLeading Hintのパラメータとして指定できます。例：

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

#### 基本シナリオ

1. テーブル作成文は以下の通りです：

    ```sql
    CREATE DATABASE testleading;
    USE testleading;
    
    create table t1 (c1 int, c11 int) distributed by hash(c1) buckets 3 properties('replication_num' = '1');
    create table t2 (c2 int, c22 int) distributed by hash(c2) buckets 3 properties('replication_num' = '1');
    create table t3 (c3 int, c33 int) distributed by hash(c3) buckets 3 properties('replication_num' = '1');
    create table t4 (c4 int, c44 int) distributed by hash(c4) buckets 3 properties('replication_num' = '1');
    ```
2. 元の計画：

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
3. t1とt2のjoin順序を交換する必要がある場合、前に`leading(t2 t1)`を追加するだけで済みます。`explain`を実行すると、このhintが使用されているかどうかが表示されます。以下がLeadingプランです：`Used`はHintが正常に有効であることを示します。

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
4. Leading Hintに構文エラーがある場合、`explain`を実行する際に対応する情報が`SyntaxError`に表示されますが、プランは通常通り生成できます。ただし、Leadingは使用されません。例：

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
#### 拡張シナリオ

1. Left-Deep Tree
    
    上記で述べたように、Dorisのクエリ文で括弧を使用しない場合、Leadingはデフォルトでleft-deep treeを生成します。

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
3. 茂った木

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
4. ジグザグ木

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
    
    非inner join（Outer JoinやSemi/Anti Joinなど）に遭遇した場合、Leading Hintは元のSQLセマンティクスに従って各joinのjoinメソッドを自動的に導出します。Leading Hintが元のSQLセマンティクスと異なる場合、または生成できない場合は、UnUsedに配置されますが、これは計画の通常の生成には影響しません。
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
読者が自分で確認できるように、Leading HintでのOuter、Semi、およびAnti Joinの例をいくつか紹介します。

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
    
    Alias（エイリアス）を含む場合、エイリアスは完全で独立したサブツリーとして指定でき、結合順序はテキスト順序に従って生成されます

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

Ordered hintはleading hintの特殊なケースとして扱うことができ、テキストの順序としてjoin順序を制御するために使用されます。

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

Ordered HintとLeading Hintを同時に使用する場合、Ordered HintがLeading Hintよりも優先されます。つまり、Leading Hintが指定されていても、Ordered Hintも存在する場合、クエリプランはOrdered Hintのルールに従って実行され、Leading Hintは無視されます。以下は、両方を同時に使用した場合の状況を示す例です：

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
## 概要

Leading Hintは結合順序を手動で制御するための強力な機能であり、本番環境のビジネスチューニングで広く使用されています。Leading Hintを適切に使用することで、現場での結合順序に対するチューニング要件を満たし、システム制御の柔軟性を向上させることができます。
