---
{
    "title": "複合型のクエリ",
    "language": "ja",
    "description": "Apache Doris で Array、Map、Struct、JSON などの複合型をクエリし、専用の SQL 関数を使って半構造化データを処理する方法を説明します。",
    "keywords": [
        "Doris の複合型",
        "Array クエリ",
        "Map クエリ",
        "Struct クエリ",
        "JSON クエリ",
        "半構造化データ",
        "複合型の関数"
    ]
}
---

<!-- Knowledge type: Capability overview / Function index -->
<!-- Applicable scenarios: Semi-structured data queries / Nested field access -->

ログ、イベントトラッキング、ユーザープロファイル、注文の詳細などでは、業務データが平坦なリレーショナル構造であることはまれです。通常は入れ子構造か半構造化データです。Apache Doris は Array、Map、Struct、JSON などの複合型をサポートしているため、こうしたデータを元の構造のまま保存し、専用の関数を使ってクエリや計算を行えます。

## 利用シナリオ

複合型は、次のようなクエリのシナリオに適しています。

- タグ、カテゴリー、複数の値を持つ商品属性など、**Array** で表すリスト形式のフィールド。
- 設定や属性のキーと値のペアなど、**Map** で表す辞書形式のフィールド。
- 入れ子のオブジェクトや複合フィールドなど、**Struct** で表す構造化レコード。
- スキーマが固定されていない上流システムからの **JSON** 半構造化データ。

## 複合型関数の一覧

Doris は、上記の複合型に対応する SQL 関数を提供しており、クエリで直接使用できます。各関数の詳細については、SQL マニュアルの SQL 関数の章を参照してください。

| 複合型 | 関数のドキュメント |
| --- | --- |
| Array | [Array 関数](../sql-manual/sql-functions/scalar-functions/array-functions/array) |
| Map | [Map 関数](../sql-manual/basic-element/sql-data-types/semi-structured/MAP) |
| Struct | [Struct 関数](../sql-manual/sql-functions/scalar-functions/struct-functions/struct) |
| JSON | [JSON 関数](../sql-manual/sql-functions/scalar-functions/json-functions/json-parse) |
