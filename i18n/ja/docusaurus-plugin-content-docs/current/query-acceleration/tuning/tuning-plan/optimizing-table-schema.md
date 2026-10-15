---
{
    "title": "テーブルスキーマ設計の最適化：テーブルモデル、バケット列、Key 列、フィールド型の調整",
    "sidebar_label": "テーブルスキーマ設計の最適化",
    "language": "ja",
    "description": "テーブルモデルの選択、バケット列の設計、Key 列の最適化、フィールド型の調整を通じて Doris のテーブルスキーマを最適化する方法を、典型的な事例に基づいて説明します。",
    "keywords": ["Doris のスキーマ設計", "Doris のテーブルモデル", "バケット列の最適化", "Key 列の最適化", "フィールド型の最適化", "データの偏り", "Doris のパフォーマンスチューニング"]
}
---

<!-- Knowledge type: concept + how-to guide -->
<!-- Applicable scenario: schema design before table creation and query performance tuning -->

テーブルスキーマの設計は、Doris のパフォーマンスチューニングにおいて重要です。データの分布、クエリの並列度、ソートの効率に直接影響します。

不適切なスキーマ設計は、次のような問題を引き起こします。

- データが偏り、クエリの並列処理能力を十分に活用できない
- ソートの効果が得られず、等価条件や範囲条件を使うクエリが遅くなる
- フィールド型が適切でなく、計算の負荷が増える

詳しい設計原則については、[テーブル設計](../../../table-design/overview.mdx)の章を参照してください。この章では、実際の事例をもとに、典型的なスキーマ設計上の問題と改善策を説明します。

### チューニングのチェックリスト

テーブルスキーマを設計するときや問題を調査するときは、次の項目を順に確認してください。

- 業務要件に合ったテーブルモデル（Duplicate / Unique / Aggregate）を選んでいるか
- バケット列のハッシュ値が均等に分散し、NULL や固定値による偏りがないか
- 等価条件や範囲条件を使うクエリで頻繁に参照する列を Key 列に定義しているか
- フィールド型は「固定長を優先し、低精度を優先する」という原則に従っているか

## 事例 1：テーブルモデルの選択

<!-- Knowledge type: concept comparison -->
<!-- Applicable scenario: model selection before table creation -->

Doris には、Duplicate、Unique（MOR/MOW）、Aggregate の三種類のテーブルモデルがあります。クエリ性能と機能上の特性はそれぞれ異なります。

### 三種類のテーブルモデルの比較

| テーブルモデル | クエリ性能 | 更新への対応 | 典型的な用途 |
| -------------- | ---------- | ------------ | ------------ |
| Duplicate | 最も高い | なし | ログや明細データに対する高速なクエリ |
| Unique (MOW) | 高い | あり | 高いクエリ性能が必要な、主キーによる重複排除 |
| Unique (MOR) | 標準的 | あり | 書き込みが頻繁な、主キーによる重複排除 |
| Aggregate | 標準的 | 集約更新 | 事前集約したレポートや指標のロールアップ |

> 性能の順位：Duplicate > MOW > MOR ≈ Aggregate

:::tip チューニングの推奨事項

データを更新する必要がなく、高いクエリ性能が求められる場合は、[Duplicate テーブル](../../../table-design/data-model/duplicate.md)を優先してください。

:::

## 事例 2：バケット列の選択

<!-- Knowledge type: how-to guide -->
<!-- Applicable scenario: data skew troubleshooting and design before table creation -->

**一文での説明**：バケット列は、データを各バケットにどう分散させるかを決めます。選択が適切でないとデータが偏り、クエリ性能のボトルネックになります。

バケット列を適切に設計すると、次の効果が得られます。

- データの偏りを防ぎ、並列処理能力を十分に活用できる
- Colocate Join と Bucket Shuffle Join の効果を最大限に引き出せる

### 悪い例：c2 列に多数の NULL が含まれる

次の例では、バケット列を `c2` に設定していますが、インポートするデータの `c2` はすべて NULL です。その結果、64 個のバケットのうち 1 個にすべてのデータが集中します。

```sql
CREATE TABLE `t1` (
  `c1` INT NULL,
  `c2` INT NULL
) ENGINE=OLAP
DUPLICATE KEY(`c1`)
DISTRIBUTED BY HASH(`c2`) BUCKETS 64
PROPERTIES (
"replication_allocation" = "tag.location.default: 1"
);
insert into t1 select number, null from numbers ('number'='10000000');
```

### 改善策：カーディナリティの高い列に切り替える

バケット列を `c2` から `c1` に変更すると、データが各バケットに均等に分散し、並列処理能力が向上します。

### データの偏りを調査するコマンド

**目的**：バケット列の値に偏りがないか確認します。
**コマンド**：

```sql
select c2, count(*) cnt from t1 group by c2 order by cnt desc limit 10;
```

**説明**：出現回数（cnt）が多い値の件数がほかの値に比べて著しく大きい場合、その列には深刻な偏りがあり、バケット列には適していません。

### バケット列を選ぶ原則

- 業務データで NULL や固定値になりやすい列を避ける
- ユーザー ID や注文 ID など、カーディナリティの高いフィールドを優先する
- テーブル作成前にフィールド値の分布を推定し、必要に応じてサンプリングで確認する

:::tip チューニングの推奨事項

バケット列のデータに偏りがないか確認してください。偏りがある場合は、よりカーディナリティの高いフィールドに置き換えます。事前に適切な設計を行うと、後から原因を調査して修正するコストを大幅に削減できます。

:::

## 事例 3：Key 列の最適化

<!-- Knowledge type: how-to guide -->
<!-- Applicable scenario: equality and range query performance tuning -->

**一文での説明**：Doris はストレージ層で Key 列に基づいてデータをソートします。クエリで頻繁に参照する列を Key 列に定義すると、等価条件や範囲条件を使うクエリを大幅に高速化できます。

### 業務クエリの例

```sql
select * from t1 where t1.c1 = 1;
select * from t1 where t1.c1 > 1 and t1.c1 < 10;
select * from t1 where t1.c1 in (1, 2, 3);
```

### 改善策：c1 を Key 列に定義する

```sql
CREATE TABLE `t1` (
  `c1` INT NULL,
  `c2` INT NULL
) ENGINE=OLAP
DUPLICATE KEY(`c1`)
DISTRIBUTED BY HASH(`c2`) BUCKETS 10
PROPERTIES (
"replication_allocation" = "tag.location.default: 1"
);
```

:::tip チューニングの推奨事項

業務クエリで等価条件や範囲条件に頻繁に使う列を Key 列に定義すると、クエリ処理を高速化できます。

:::

## 事例 4：フィールド型の最適化

<!-- Knowledge type: principles and best practices -->
<!-- Applicable scenario: table creation and field type refactoring -->

**一文での説明**：フィールド型は計算の複雑さに直接影響します。固定長型と低精度型は、可変長型や高精度型より効率的に処理できます。

### 型を選ぶ原則

| 原則 | 推奨 | 避ける型 |
| ---- | ---- | -------- |
| 固定長を優先 | INT, BIGINT, DATE, DATETIME | VARCHAR, STRING |
| 低精度を優先 | INT, BIGINT, FLOAT | DECIMAL（高精度を必要とする場面） |

### よくある置き換えの例

- 数値を格納するために使用している VARCHAR / STRING フィールドを BIGINT に置き換える
- 必要以上に高精度な DECIMAL フィールドを FLOAT / INT / BIGINT に置き換える
- 時刻を文字列で格納しているフィールドを DATETIME に置き換える

:::tip チューニングの推奨事項

スキーマの型を定義するときは、「固定長を優先し、低精度を優先する」という原則に従い、計算効率とシステム性能を向上させてください。

:::

## よくある質問

<!-- Knowledge type: FAQ -->
<!-- Applicable scenario: common questions during tuning -->

### Q1：テーブル作成後にバケット列が適切でないと分かった場合はどうすればよいですか？

テーブル作成後にバケット列を直接変更することはできません。新しいテーブルを作成してデータを再インポートするか、`ALTER TABLE` を使用して新しい Rollup またはパーティション方式を作成する必要があります。テーブル作成前にフィールドのカーディナリティを十分に評価することを推奨します。

### Q2：Key 列は多いほどよいですか？

いいえ。Key 列が多すぎると、ストレージでのソート負荷と書き込みコストが増えます。等価条件や範囲条件によるフィルタリングに実際によく使う列だけを Key 列に設定してください。

### Q3：Unique モデルや Aggregate モデルを使う必要があるのはどのような場合ですか？

- 主キーに基づくデータの重複排除や更新が必要な場合は、Unique を使用する
- 事前集約（SUM、MAX、MIN など）が必要な場合は、Aggregate を使用する
- 追記のみの明細データで、非常に高いクエリ性能が必要な場合は、Duplicate を使用する

### Q4：現在のテーブルでデータが偏っているかどうかは、どう判断しますか？

次の SQL を実行して、バケット列の値の分布を確認します。

```sql
select <bucket_col>, count(*) cnt from <table> group by <bucket_col> order by cnt desc limit 10;
```

出現回数の多い値の件数がほかの値を大きく上回る場合は、偏りがあります。

## まとめ

適切に設計したスキーマは Doris の機能を最大限に活用し、クエリ性能を大幅に向上させます。不適切なスキーマは、データの偏りなど、広範囲に影響する問題を引き起こす可能性があります。

チューニングの要点は次のとおりです。

- 更新が不要な場合は Duplicate テーブルモデルを優先する
- NULL や固定値を避け、カーディナリティの高いバケット列を選ぶ
- クエリで頻繁に参照する列を Key 列に定義する
- フィールド型は「固定長を優先し、低精度を優先する」という原則に従う

事前の設計は、後から行うチューニングよりも常に低コストです。スキーマ設計の段階で、上記の原則に厳密に従うことを推奨します。
