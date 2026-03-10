---
{
  "title": "集約キーテーブル",
  "language": "ja",
  "description": "DorisのAggregate Key Tableは、大規模データクエリにおける集計操作を効率的に処理するように設計されています。"
}
---
Dorisの**Aggregate Key Table**は、大規模データクエリにおける集約操作を効率的に処理するよう設計されています。データの事前集約を実行することで、計算の冗長性を削減し、クエリパフォーマンスを向上させます。このテーブルは集約されたデータのみを保存し、生データを省略することで、ストレージスペースを節約し、クエリパフォーマンスを向上させます。

## ユースケース

* **詳細データの要約**: Aggregate Key Tableは、eコマースプラットフォームでの月間売上評価、金融リスク管理での顧客取引総額計算、広告キャンペーンでの総広告クリック数分析など、詳細データの多次元要約を行うシナリオで使用されます。

* **生の詳細データをクエリする必要がない場合**: ダッシュボードレポートやユーザー取引行動分析など、生データがデータレイクに保存されており、データベースに保持する必要がないユースケースでは、集約されたデータのみが保存されます。

## 原理

各データインポートはAggregate Key Tableでバージョンを作成し、**Compaction**段階でバージョンがマージされます。クエリ時には、プライマリキーによってデータが集約されます：

* **データインポート段階**

  * データはバッチ単位でaggregate key tableにインポートされ、各バッチが新しいバージョンを作成します。

  * 各バージョン内では、同じ集約キーを持つデータが事前集約されます（例：sum、countなど）。

* **バックグラウンドファイルマージ段階（Compaction）**

  * 複数のバッチが複数のバージョンファイルを生成し、これらは定期的により大きなバージョンファイルにマージされます。

  * マージプロセス中に、同じ集約キーを持つデータが再集約され、冗長性を削減し、ストレージを最適化します。

* **クエリ段階**

  * クエリ中、システムはすべてのバージョンから同じ集約キーを持つデータを集約し、正確な結果を保証します。

  * このプロセスにより、大量のデータボリュームでも集約操作が効率的に実行されることが保証されます。集約された結果は高速クエリ用に最適化され、生データクエリと比較して大幅なパフォーマンス向上を提供します。

## テーブル作成手順

テーブル作成時には、**AGGREGATE KEY**キーワードを使用してAggregate Key Tableを指定できます。Aggregate Key TableはKeyカラムを指定する必要があり、これらはストレージ時にValueカラムを集約するために使用されます。

```sql
CREATE TABLE IF NOT EXISTS example_tbl_agg
(
    user_id             LARGEINT    NOT NULL,
    load_date           DATE        NOT NULL,
    city                VARCHAR(20),
    last_visit_dt       DATETIME    REPLACE DEFAULT "1970-01-01 00:00:00",
    cost                BIGINT      SUM DEFAULT "0",
    max_dwell           INT         MAX DEFAULT "0",
)
AGGREGATE KEY(user_id, load_date, city)
DISTRIBUTED BY HASH(user_id) BUCKETS 10;
```
上記の例では、ユーザー情報とアクセス行動のファクトテーブルが定義されており、`user_id`、`load_date`、`city`が集約用のKeyカラムとして使用されています。データインポート時に、Keyカラムは1行に集約され、Valueカラムは指定された集約タイプに従って集約されます。

Aggregate Key Tableでは以下のタイプのディメンション集約がサポートされています：


| 集約方法                    | 説明                                                                |
|--------------------------|---------------------------------------------------------------------|
| SUM                      | 合計、複数のValue行を累積します。                                        |
| REPLACE                  | 置換、次のバッチのValueが以前に挿入されたValueを置き換えます。                |
| MAX                      | 最大値を保持します。                                                   |
| MIN                      | 最小値を保持します。                                                   |
| REPLACE_IF_NOT_NULL      | null以外の値を置換します。REPLACEとは異なり、null値は置換されません。        |
| HLL_UNION                | HLL型カラムの集約方法で、HyperLogLogアルゴリズムを使用します。              |
| BITMAP_UNION             | BITMAP型カラムの集約方法で、ビットマップunion集約を実行します。             |



:::info Tip:

上記の集約方法がビジネス要件を満たさない場合は、`agg_state`型の使用を検討してください。

:::


## データ挿入とストレージ

Aggregate Key tableでは、データはプライマリキーに基づいて集約されます。データ挿入後、集約操作が完了します。

![aggrate-key-table-insert](/images/table-desigin/aggrate-key-model-insert.png)

上記の例では、テーブルに元々4行のデータがありました。2行を挿入した後、Keyカラムに基づいてディメンションカラムの集約操作が実行されます：

```sql
-- 4 rows raw data
INSERT INTO example_tbl_agg VALUES
(101, '2024-11-01', 'BJ', '2024-10-29', 10, 20),
(102, '2024-10-30', 'BJ', '2024-10-29', 20, 20),
(101, '2024-10-30', 'BJ', '2024-10-28', 5, 40),
(101, '2024-10-30', 'SH', '2024-10-29', 10, 20);

-- insert into 2 rows
INSERT INTO example_tbl_agg VALUES
(101, '2024-11-01', 'BJ', '2024-10-30', 20, 10),
(102, '2024-11-01', 'BJ', '2024-10-30', 10, 30);

-- check the rows of table
SELECT * FROM example_tbl_agg;
+---------+------------+------+---------------------+------+----------------+
| user_id | load_date  | city | last_visit_date     | cost | max_dwell_time |
+---------+------------+------+---------------------+------+----------------+
| 102     | 2024-10-30 | BJ   | 2024-10-29 00:00:00 |   20 |             20 |
| 102     | 2024-11-01 | BJ   | 2024-10-30 00:00:00 |   10 |             30 |
| 101     | 2024-10-30 | BJ   | 2024-10-28 00:00:00 |    5 |             40 |
| 101     | 2024-10-30 | SH   | 2024-10-29 00:00:00 |   10 |             20 |
| 101     | 2024-11-01 | BJ   | 2024-10-30 00:00:00 |   30 |             20 |
+---------+------------+------+---------------------+------+----------------+
```
## AGG_STATE

::: Info Tips:
AGG_STATEは実験的機能であり、開発およびテスト環境での使用が推奨されます。
:::

AGG_STATEはKeyカラムとして使用できません。テーブル作成時に集約関数のシグネチャを宣言する必要があります。ユーザーは長さやデフォルト値を指定する必要はありません。データストレージサイズは関数の実装に依存します。

```sql
set enable_agg_state = true;
CREATE TABLE aggstate(
    k1   int  NULL,
    v1   int  SUM,
    v2   agg_state<group_concat(string)> generic
)
AGGREGATE KEY(k1)
DISTRIBUTED BY HASH(k1) BUCKETS 3;
```
この場合、`agg_state`は`agg_state`としてデータ型を宣言するために使用され、`sum/group_concat`は集計関数のシグネチャです。`agg_state`は`int`、`array`、`string`と同様にデータ型であることに注意してください。`agg_state`は[state](../../sql-manual/sql-functions/combinators/state)、[merge](../../sql-manual/sql-functions/combinators/merge)、[union](../../sql-manual/sql-functions/combinators/union)などのコンビネータとのみ使用できます。`agg_state`は集計関数の中間結果を表します。例えば、集計関数`group_concat`の場合、`agg_state`は最終結果ではなく、`group_concat('a', 'b', 'c')`の中間状態を表すことができます。

`agg_state`型は`state`関数を使用して生成する必要があります。このテーブルでは、`group_concat_state`を使用する必要があります：

```sql
insert into aggstate values(1, 1, group_concat_state('a'));
insert into aggstate values(1, 2, group_concat_state('b'));
insert into aggstate values(1, 3, group_concat_state('c'));
insert into aggstate values(2, 4, group_concat_state('d'));
```
表の計算方法を以下の図に示します：

![state-func-group-concat-state-result-1](/images/table-desigin/state-func-group-concat-state-result-1.png)

テーブルをクエリする際、[merge](../../sql-manual/sql-functions/combinators/merge/)操作を使用して複数の`state`値をマージし、最終的な集計結果を返すことができます。`group_concat`では順序が必要なため、結果が不安定になる可能性があります。

```sql
select group_concat_merge(v2) from aggstate;
+------------------------+
| group_concat_merge(v2) |
+------------------------+
| d,c,b,a                |
+------------------------+
```
最終的な集計結果が不要な場合は、`union`を使用して複数の中間集計結果を結合し、新しい中間結果を生成できます。

```sql
insert into aggstate select 3,sum_union(k2),group_concat_union(k3) from aggstate;
```
テーブル内の計算は以下の通りです：

![state-func-group-concat-state-result-2](/images/table-desigin/state-func-group-concat-state-result-2.png)

クエリ結果は以下の通りです：

```sql
mysql> select sum_merge(k2) , group_concat_merge(k3)from aggstate;
+---------------+------------------------+
| sum_merge(k2) | group_concat_merge(k3) |
+---------------+------------------------+
|            20 | c,b,a,d,c,b,a,d        |
+---------------+------------------------+

mysql> select sum_merge(k2) , group_concat_merge(k3)from aggstate where k1 != 2;
+---------------+------------------------+
| sum_merge(k2) | group_concat_merge(k3) |
+---------------+------------------------+
|            16 | c,b,a,d,c,b,a          |
+---------------+------------------------+
```
