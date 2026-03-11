---
{
  "title": "tableインデックス設計の最適化",
  "description": "Dorisは現在、2種類のインデックスをサポートしています：",
  "language": "ja"
}
---
## 概要

Dorisは現在、2種類のインデックスをサポートしています：

1. 組み込みインデックス：プレフィックスインデックス、ZoneMapインデックスなどが含まれます。
2. セカンダリインデックス：転置インデックス、Bloomフィルタインデックス、N-Gram Bloomフィルタインデックス、Bitmapインデックスなどが含まれます。

ビジネス最適化のプロセスにおいて、ビジネス特性を十分に分析し、インデックスを効果的に活用することで、クエリと分析の有効性を大幅に向上させ、パフォーマンスチューニングの目的を達成できます。

各種インデックスの詳細については、[table Index](../../../table-design/index/index-overview.md)セクションを参照してください。本章では、実際のケースの観点から、いくつかの典型的なシナリオでのインデックス使用技術を実演し、ビジネスチューニングの参考として最適化の提案をまとめます。

## ケース1：キー列の順序を最適化してプレフィックスインデックスを活用したクエリの高速化

[tableスキーマ設計の最適化](optimizing-table-schema.md)では、適切なフィールドをキーフィールドとして選択し、Dorisのキー列ソート機能を活用してクエリを高速化する方法を紹介しました。このケースでは、このシナリオをさらに詳しく説明します。

Dorisの組み込みプレフィックスインデックス機能により、table作成時にtableのKeyの最初の36バイトをプレフィックスインデックスとして自動的に使用されます。クエリ条件がプレフィックスインデックスのプレフィックスと一致する場合、クエリを大幅に高速化できます。以下は、table定義の例です：

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
上記のスキーマ定義では、`c1`が`c2`より前に配置されています。しかし、クエリではフィルタリングに`c2`フィールドを使用しています。この場合、プレフィックスインデックスの高速化機能を利用することができません。最適化するために、`c1`と`c2`の定義順序を調整し、`c2`カラムを最初のフィールド位置に配置することで、プレフィックスインデックスの高速化機能を活用することができます。

調整されたスキーマは以下の通りです：

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

スキーマの列順序を定義する際は、ビジネスクエリフィルタリングにおける高頻度かつ高優先度の列を参照して、Dorisのprefix index加速機能を最大限に活用してください。

:::

## ケース2: Inverted Indexを使用したクエリの高速化

DorisはInverted Indexをsecondary indexとしてサポートし、テキストタイプの等値、範囲、全文検索などのビジネスシナリオを高速化します。Inverted Indexの作成と管理は独立しており、元のTableスキーマに影響を与えることなく、Tableデータの再インポートの必要もなく、便利にビジネスパフォーマンスの最適化を行うことができます。

典型的な使用シナリオ、構文、ケースについては、[Table Index - Inverted Index](../../../table-design/index/inverted-index)セクションで詳細に紹介されているため、本章では説明を繰り返しません。

:::tip

テキストタイプの全文検索や、string、numeric、datetime型フィールドの等値・範囲クエリに対しては、Inverted Indexを活用してクエリを高速化できます。特に、元のTable構造やキー定義の最適化が困難な場合や、Tableデータの再インポートコストが高い場合など、Inverted Indexは柔軟な加速ソリューションを提供し、ビジネス実行パフォーマンスを最適化します。

:::

## まとめ

スキーマチューニングにおいて、Tableレベルのスキーマ最適化以外にも、インデックス最適化は重要な位置を占めています。Dorisはprefix indexなどの内蔵インデックスやInverted IndexなどのSecondary Indexを含む複数のインデックスタイプを提供し、パフォーマンス加速に強力なサポートを提供しています。これらのインデックスを合理的に活用することで、複数のシナリオにおけるビジネスクエリと分析の速度を大幅に向上させることができ、マルチシナリオビジネスクエリと分析において大きな意義があります。
