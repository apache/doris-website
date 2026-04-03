---
{
  "title": "tableインデックス設計の最適化",
  "description": "Dorisは現在、2種類のインデックスをサポートしています：",
  "language": "ja"
}
---
## 概要

Dorisは現在、2つのタイプのインデックスをサポートしています：

1. Built-in Indexes: prefix indexes、ZoneMap indexesなどが含まれます。
2. Secondary Indexes: inverted indexes、Bloom filter indexes、N-Gram Bloom filter indexes、Bitmap indexesなどが含まれます。

ビジネス最適化の過程において、ビジネス特性を十分に分析し、インデックスを効果的に活用することで、クエリと分析の効果を大幅に向上させ、パフォーマンスチューニングの目的を達成することができます。

各種インデックスの詳細な紹介については、[table Index](../../../table-design/index/index-overview.md)セクションを参照してください。本章では、実際のケースの観点から、いくつかの典型的なシナリオにおけるインデックス使用技法を実演し、ビジネスチューニングにおける参考のための最適化提案をまとめます。

## Case 1: Prefix Indexesを活用してクエリを高速化するためのキー列の順序の最適化

[optimizing table schema design](optimizing-table-schema.md)において、適切なフィールドをキーフィールドとして選択し、Dorisのキー列ソート機能を活用してクエリを高速化する方法を紹介しました。このケースでは、このシナリオをさらに詳しく展開します。

Dorisのbuilt-in prefix index機能により、table作成時にtableのKeyの最初の36バイトを自動的にprefix indexとして取得します。クエリ条件がprefix indexのプレフィックスと一致する場合、クエリを大幅に高速化することができます。以下はtable定義の例です：

```sql
CREATE TABLE `t1` (
  `c1` VARCHAR(10) NULL,
  `c2` VARCHAR(10) NULL
) ENGINE=OLAP
DUPLICATE KEY(`c1`)
DISTRIBUTED BY HASH(`c2`) BUCKETS 10
PROPERTIES (
"replication_allocation" = "tag.location.default: 1"
);
```
対応するビジネスSQLパターンは以下の通りです：

```sql
select * from t1 where t1.c2 = '1';
select * from t1 where t1.c2 in ('1', '2', '3');
```
上記のスキーマ定義では、`c1`が`c2`より前に配置されています。しかし、クエリでは`c2`フィールドをフィルタリングに使用しています。この場合、プレフィックスインデックスの高速化機能を活用できません。最適化するために、`c1`と`c2`の定義順序を調整し、`c2`列を最初のフィールド位置に配置してプレフィックスインデックスの高速化機能を活用することができます。

調整後のスキーマは以下の通りです：

```sql
CREATE TABLE `t1` (
  `c2` VARCHAR(10) NULL,
  `c1` VARCHAR(10) NULL
) ENGINE=OLAP
DUPLICATE KEY(`c2`)
DISTRIBUTED BY HASH(`c1`) BUCKETS 10
PROPERTIES (
"replication_allocation" = "tag.location.default: 1"
);
```
:::tip

スキーマの列順序を定義する際は、ビジネスクエリフィルタリングにおける高頻度かつ高優先度の列を参照し、Dorisのprefix index加速機能を最大限に活用してください。

:::

## Case 2: Inverted Indexを使用したクエリの高速化

Dorisは、テキスト型の等価値、範囲、全文検索などのビジネスシナリオを高速化するセカンダリインデックスとしてinverted indexをサポートしています。inverted indexの作成と管理は独立しており、元のTableスキーマに影響を与えることなく、またTableデータの再インポートを必要とせずに、便利なビジネスパフォーマンスの最適化を可能にします。

典型的な使用シナリオ、構文、ケースについては、[Table Index - Inverted Index](../../../table-design/index/inverted-index)セクションで詳細に紹介されているため、本章では説明を繰り返しません。

:::tip

テキスト型の全文検索や、文字列、数値、datetime型フィールドでの等価値または範囲クエリに対して、inverted indexを活用してクエリを高速化できます。特に、元のTable構造とキー定義の最適化が困難な場合や、Tableデータの再インポートコストが高い場合など、特定の状況において、inverted indexはビジネス実行パフォーマンスを最適化する柔軟な加速ソリューションを提供します。

:::

## まとめ

スキーマチューニングにおいて、Tableレベルのスキーマ最適化に加えて、インデックス最適化も重要な位置を占めています。Dorisは、prefix indexなどの組み込みインデックス、およびinverted indexなどのセカンダリインデックスを含む複数のインデックスタイプを提供し、パフォーマンス加速に強力なサポートを提供します。これらのインデックスを合理的に活用することで、複数のシナリオにおけるビジネスクエリと分析の速度を大幅に向上させることができ、これは多シナリオビジネスクエリと分析にとって非常に重要な意味を持ちます。
