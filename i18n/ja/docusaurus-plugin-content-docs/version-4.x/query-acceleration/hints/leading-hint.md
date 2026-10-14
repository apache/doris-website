---
title: Leading Hint による Join 順序の制御
language: ja
description: Doris の Leading Hint を使用して複数テーブルの Join 順序を手動で指定し、複雑なクエリのチューニングに役立てる方法。
keywords:
    - Doris Leading Hint
    - Join 順序の制御
    - Ordered Hint
    - 左深木、右深木、Bushy 木
    - Join Reorder のチューニング
    - SyntaxError UnUsed
---

<!-- Knowledge type: Feature description / Operation steps -->
<!-- Applicable scenario: Complex query performance tuning / Manual intervention in Join order -->

## 概要

Leading Hint は、Doris で複数テーブルの Join 順序を手動で指定するためのクエリヒントです。`/*+ LEADING(...) */` コメントを `SELECT` キーワードの後に追加すると、指定した順序で Join プランを生成するようオプティマイザに指示でき、複雑なクエリの性能改善に役立ちます。

## 適用する場面

<!-- Knowledge type: Scenario guide -->
<!-- Applicable scenario: Choosing the appropriate Hint type -->

次のような場合は、Leading Hint または Ordered Hint の使用を検討してください。

- オプティマイザが自動的に選択した Join 順序が適切でなく、手動で調整する必要がある場合。
- 複雑な複数テーブルの Join で、左深木、右深木、Bushy 木、またはジグザグ木の形状を明示的に指定したい場合。
- ビューやサブクエリがエイリアスとして Join Reorder に参加し、そのサブツリー全体の位置をまとめて指定する必要がある場合。
- SQL にテーブルが記述された順序で Join を実行するよう強制したい場合（Ordered Hint を使用）。

## 使用前のチェックリスト

<!-- Knowledge type: Operation checklist -->

Hint を記述する前に、以下を確認してください。

- [ ] SQL に、Join に参加するテーブルが少なくとも二つある。
- [ ] Hint で使用するテーブル名またはエイリアスが `FROM` 句のものと一致している。
- [ ] `EXPLAIN SHAPE PLAN` を使用して、元のプランと目標のプランを比較している。
- [ ] 目標の Join 順序が元の SQL と意味的に等価かどうかを確認している（特に Outer Join、Semi Join、Anti Join の場合）。

## ページ内リンク

- [通常の Leading Hint](#regular-leading-hint)：基本構文、適用状態、代表的な使用例。
- [代表的なシナリオの例](#typical-scenario-examples)：基本的な使い方と、左深木、右深木、Bushy 木、ジグザグ木、非 Inner Join、ビューの例。
- [Ordered Hint](#ordered-hint)：SQL に記述された順序に Join 順序を固定する特殊な Hint。
- [よくある質問（FAQ）](#frequently-asked-questions-faq)：Hint が適用されない場合や、他の Hint との優先順位など。

## 通常の Leading Hint {#regular-leading-hint}

<!-- Knowledge type: Syntax description -->

### 構文

Leading Hint は、オプティマイザに従わせたいテーブルの Join 順序を指定します。Doris での基本構文は次のとおりです。

```sql
SELECT /*+ LEADING(tablespec [tablespec]...) */ ...
```

構文の注意点：

- Leading Hint は `/*+` と `*/` で囲み、SQL 文の `SELECT` キーワードの後に配置します。
- `tablespec` はテーブル名またはテーブルのエイリアスです。少なくとも二つのテーブルを指定する必要があります。
- 複数のテーブルは空白または `,` で区切ります。
- 波括弧 `{}` を使用すると、Join 木の形状を明示的に指定できます。

最小構成の例：

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

### Hint の適用状態

Leading Hint が適用されない場合、通常の処理でプランが生成されます。`EXPLAIN` で Hint の適用結果を確認できます。主な状態は次の三つです。

| 状態         | 説明                                                                                                                                |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| `Used`        | Leading Hint が正常に適用されています。                                                                                                    |
| `UnUsed`      | Leading Hint で指定した Join 順序が元の SQL と等価でない場合や、このバージョンでまだサポートされていない機能を使用した場合など、Hint が適用されていません（詳細は制限事項を参照）。 |
| `SyntaxError` | Leading Hint に構文エラーがあります。たとえば、指定したテーブルが見つからない場合です。                                                 |

### 基本ルール

1. **既定では左深木を構築する**：括弧を使用しない場合、Leading Hint は既定で左深木を構築します。

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

2. **波括弧で Join 木の形状を指定する**：`{}` を使用すると、Join 木の形状を明示的に制御できます。

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

3. **ビューとエイリアスをパラメータに指定できる**：ビューがエイリアスとして Join Reorder に参加する場合、対応するビューを Leading Hint のパラメータとして指定できます。

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

## 代表的なシナリオの例 {#typical-scenario-examples}

<!-- Knowledge type: Operation example -->
<!-- Applicable scenario: Learning Leading Hint usage / Copying examples for verification -->

### 準備：テーブル作成文

以下の例はすべて、このテスト用テーブル群を使用します。

```sql
CREATE DATABASE testleading;
USE testleading;

create table t1 (c1 int, c11 int) distributed by hash(c1) buckets 3 properties('replication_num' = '1');
create table t2 (c2 int, c22 int) distributed by hash(c2) buckets 3 properties('replication_num' = '1');
create table t3 (c3 int, c33 int) distributed by hash(c3) buckets 3 properties('replication_num' = '1');
create table t4 (c4 int, c44 int) distributed by hash(c4) buckets 3 properties('replication_num' = '1');
```

### 基本例：二つのテーブルの Join 順序を入れ替える

1. 元のプラン：

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

2. t1 と t2 の Join 順序を入れ替えるには、`leading(t2 t1)` を追加します。`EXPLAIN` を実行したとき、`Used` は Hint が正常に適用されたことを示します。

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

3. Leading Hint に構文エラーがある場合、対応する情報は `SyntaxError` として `EXPLAIN` の出力に表示されます。ただし、プランは通常どおり生成され、Leading Hint だけが使用されません。

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

### 応用例：さまざまな Join 木の形状を構築する

次の表に、代表的な四種類の Join 木の形状を指定する構文をまとめます。

| 形状          | Leading の構文              | 説明                                       |
| -------------- | --------------------------- | ------------------------------------------------- |
| 左深木 | `leading(t1 t2 t3)`         | 既定の動作です。波括弧は不要です。     |
| 右深木 | `leading(t1 {t2 t3})`       | 右側のサブツリーを `{}` で囲みます。                 |
| Bushy 木     | `leading({t1 t2} {t3 t4})`  | 左右両方のサブツリーを `{}` で囲みます。  |
| ジグザグ木   | `leading(t1 {t2 t3} t4)`    | 途中にサブツリーを組み込んでジグザグ形にします。  |

#### 左深木

前述のとおり、括弧を使用しない場合、Leading Hint は既定で左深木を生成します。

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

#### 右深木

プランを右深木、Bushy 木、またはジグザグ木にするには、波括弧を追加してプランの形状を制約します。Oracle のように左深木から段階的に入れ替える必要はありません。

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

#### Bushy 木

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

#### ジグザグ木

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

### 非 Inner Join のシナリオ

Outer Join や Semi/Anti Join など、Inner Join 以外の Join が含まれる場合、Leading Hint は元の SQL の意味に基づいて各 Join の種類を自動的に導出します。Leading Hint の指定が元の SQL の意味と異なる場合や、指定したプランを生成できない場合は、`UnUsed` に分類されます。通常のプラン生成には影響しません。

次は Join 順序を入れ替えられない例です。

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

次に、Join 順序を入れ替えられる例と入れ替えられない例を示します。実際に試して確認できます。

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

### ビューとエイリアスのシナリオ

エイリアスがある場合、そのエイリアスを独立したサブツリー全体として指定できます。各サブツリー内の Join 順序は、SQL に記述された順序に従って生成されます。

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

## Ordered Hint {#ordered-hint}

<!-- Knowledge type: Feature description -->
<!-- Applicable scenario: Forcing the Join order to follow the SQL textual order -->

Ordered Hint は Leading Hint の特殊なケースとみなすことができ、Join 順序を SQL に記述された順序に一致させるために使用します。

### 構文

Ordered Hint の構文は `/*+ ORDERED */` です。`SELECT` 文の `SELECT` キーワードの後に配置し、その後にクエリの残りの部分を記述します。

### 例

Ordered Hint の使用例は次のとおりです。

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

### Leading Hint との優先順位

Ordered Hint と Leading Hint を同時に使用した場合は、Ordered Hint が優先されます。Leading Hint が指定されていても、クエリプランは Ordered Hint のルールに従って実行され、Leading Hint は無視されます。

次の例は、両方を同時に使用した場合を示します。

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

## Leading Hint と Ordered Hint の比較

<!-- Knowledge type: Comparison table -->
<!-- Applicable scenario: Choosing the appropriate Hint -->

| 比較項目              | Leading Hint                                        | Ordered Hint                                                                |
| ---------------------- | --------------------------------------------------- | --------------------------------------------------------------------------- |
| 構文                 | `/*+ LEADING(t1 t2 ...) */`                         | `/*+ ORDERED */`                                                            |
| Join 順序             | Hint に列挙したテーブルの順序に従います | SQL の `FROM` 句にテーブルが記述された順序に従います |
| Join 木の形状の制御 | `{}` で明示的に指定できます        | 指定できません。左深木に固定されます                                    |
| 柔軟性            | 高く、任意の Join 木の形状を指定できます            | 低く、SQL に記述された順序にのみ従います                                         |
| 併用時     | `UnUsed` に分類されます                                  | 優先されます                                                              |

## よくある質問（FAQ） {#frequently-asked-questions-faq}

<!-- Knowledge type: Troubleshooting -->
<!-- Applicable scenario: Hint not taking effect / Error troubleshooting -->

### Q1：Leading Hint が `UnUsed` と表示され、`Used` にならないのはなぜですか？（`EXPLAIN` の結果）

主な理由は次の二つです。

- Leading Hint で指定した Join 順序が、元の SQL と意味的に等価でないためです（たとえば、順序を入れ替えられない Outer Join の場合）。
- 現在のバージョンで、その機能がまだサポートされていないためです。

この場合、Doris は通常のプラン生成処理に戻り、クエリは引き続き正常に実行できます。

### Q2：`SyntaxError` でテーブルが見つからないと報告された場合はどうすればよいですか？

`SyntaxError` は Hint 自体に構文エラーがあることを示します。たとえば、`leading(t2 t3)` の `t3` が SQL の `FROM` 句に存在しない場合です。Hint 内のテーブル名またはエイリアスが、SQL で実際に使用されているものと一致しているか確認してください。

### Q3：Ordered Hint と Leading Hint を同時に使用した場合、どちらが適用されますか？

Ordered Hint の優先順位が高くなります。両方がある場合、クエリは Ordered Hint に従って実行され（Join 順序は SQL に記述された順序に従います）、Leading Hint は `UnUsed` に分類されます。

### Q4：既定で生成される Join 木の形状と、その変更方法を教えてください。

波括弧を使用しない場合、既定で左深木が生成されます。右深木、Bushy 木、またはジグザグ木を生成するには、`{}` で形状を明示的に指定します。Oracle のように左深木から段階的に入れ替える必要はありません。

### Q5：Hint のテーブル名は完全修飾名で指定する必要がありますか？

いいえ。Hint のテーブル名またはエイリアスが、現在のクエリの `FROM` 句で使用されている名前と一致していれば十分です。データベース名の接頭辞は不要です。

## まとめ

Leading Hint は Join 順序を手動で制御するための機能で、実運用でのチューニングに広く利用されています。適切に使用すると、Join 順序の調整に役立ち、システムの制御方法の柔軟性を高められます。Ordered Hint は Leading Hint の特殊な形式で、現在のクエリの Join 順序を SQL に記述された順序に固定します。使用時には、他の Hint との優先順位に注意してください。
