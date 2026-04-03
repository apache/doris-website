---
{
  "title": "データ型",
  "language": "ja",
  "description": "Apache Dorisは標準SQL構文をサポートし、MySQL Network Connection Protocolを使用して、MySQL構文プロトコルと高い互換性を持っています。したがって、"
}
---
Apache Dorisは標準SQL構文をサポートし、MySQL Network Connection Protocolを使用して、MySQL構文プロトコルと高い互換性があります。そのため、データ型サポートの観点から、Apache DorisはMySQL関連のデータ型と可能な限り密接に整合しています。

Dorisでサポートされているデータ型のリストは以下の通りです：

## [数値データ型](../sql-manual/basic-element/sql-data-types/data-type-overview#numeric-types)  
  
| 型名                                                    | ストレージ (バイト) | 説明                                                  |  
| ---------------------------------------------------------- | --------------- | ------------------------------------------------------------ |  
| [BOOLEAN](../sql-manual/basic-element/sql-data-types/numeric/BOOLEAN)       | 1               | 2つの値のみを格納するBoolean データ型：0は false を表し、1は true を表します。 |  
| [TINYINT](../sql-manual/basic-element/sql-data-types/numeric/TINYINT)       | 1               | 整数値、符号付きの範囲は -128 から 127 です。                 |  
| [SMALLINT](../sql-manual/basic-element/sql-data-types/numeric/SMALLINT)     | 2               | 整数値、符号付きの範囲は -32768 から 32767 です。             |  
| [INT](../sql-manual/basic-element/sql-data-types/numeric/INT)               | 4               | 整数値、符号付きの範囲は -2147483648 から 2147483647 です。   |  
| [BIGINT](../sql-manual/basic-element/sql-data-types/numeric/BIGINT)         | 8               | 整数値、符号付きの範囲は -9223372036854775808 から 9223372036854775807 です。 |  
| [LARGEINT](../sql-manual/basic-element/sql-data-types/numeric/LARGEINT)     | 16              | 整数値、範囲は [-2^127 + 1 から 2^127 - 1] です。               |  
| [FLOAT](../sql-manual/basic-element/sql-data-types/numeric/FLOATING-POINT)           | 4               | 単精度浮動小数点数、範囲は [-3.4 * 10^38 から 3.4 * 10^38] です。 |  
| [DOUBLE](../sql-manual/basic-element/sql-data-types/numeric/FLOATING-POINT)         | 8               | 倍精度浮動小数点数、範囲は [-1.79 * 10^308 から 1.79 * 10^308] です。 |  
| [DECIMAL](../sql-manual/basic-element/sql-data-types/numeric/DECIMAL)       | 4/8/16/32          | 精度（桁数の合計）とスケール（小数点以下の桁数）で定義される正確な固定小数点数。形式：DECIMAL(P[,S])、ここで P は精度、S はスケールです。P の範囲は [1, MAX_P] で、`enable_decimal256`=false の場合 MAX_P=38、`enable_decimal256`=true の場合 MAX_P=76 です。S の範囲は [0, P] です。<br>`enable_decimal256` のデフォルト値は false です。これを true に設定すると、より正確な結果が得られますが、パフォーマンスの低下を招きます。<br>ストレージ要件：<ul><li>0 < precision <= 9 の場合は 4 バイト。</li><li>9 < precision <= 18 の場合は 8 バイト。<li>18 < precision <= 38 の場合は 16 バイト。<li>38 < precision <= 76 の場合は 32 バイト。</ul> |

## [日時データ型](../sql-manual/basic-element/sql-data-types/data-type-overview#date-types)

| 型名      | ストレージ (バイト)| 説明                                                  |
| -------------- | --------------- | ------------------------------------------------------------ |
|  [DATE](../sql-manual/basic-element/sql-data-types/date-time/DATE)             | 4              | DATE は暦年、月、日の値を保持し、サポートされる範囲は ['0000-01-01', '9999-12-31'] です。デフォルト印刷形式：'yyyy-MM-dd'。 |
| [DATETIME](../sql-manual/basic-element/sql-data-types/date-time/DATETIME)        | 8              | DATE と TIME の組み合わせ　形式：DATETIME ([P])。オプションパラメータ P は時間精度を表し、値の範囲は [0,6] で、最大 6 桁の小数（マイクロ秒）をサポートします。設定されていない場合は 0 です。サポートされる範囲は ['0000-01-01 00:00:00 [.000000]', '9999-12-31 23:59:59 [.999999]'] です。デフォルト印刷形式：'yyy-MM-dd HH: mm: ss. SSSSSS '。 |

## [文字列データ型](../sql-manual/basic-element/sql-data-types/data-type-overview#string-types)
| 型名      | ストレージ (バイト)| 説明                                                  |
| -------------- | --------------- | ------------------------------------------------------------ |
| [CHAR](../sql-manual/basic-element/sql-data-types/string-type/CHAR)            | M               | 固定長文字列、パラメータ M は文字でカラムの長さを指定します。M の範囲は 1 から 255 です。 |
| [VARCHAR](../sql-manual/basic-element/sql-data-types/string-type/VARCHAR)         | 可変長 | 可変長文字列、パラメータ M は文字での最大文字列長を指定します。M の範囲は 1 から 65533 です。可変長文字列は UTF-8 エンコーディングで格納されます。英語文字は 1 バイト、中国語文字は 3 バイトを占有します。 |
| [STRING](../sql-manual/basic-element/sql-data-types/string-type/STRING)          | 可変長 | 可変長文字列、デフォルトで 1048576 バイト（1 MB）をサポートし、最大 2147483643 バイト（2 GB）の制限があります。サイズは BE の string_type_length_soft_limit_bytes で調整可能です。String 型は値カラムでのみ使用可能で、キーカラムやパーティションバケットカラムでは使用できません。 |

## [半構造化データ型](../sql-manual/basic-element/sql-data-types/data-type-overview#semi-structured-types)

| 型名      | ストレージ (バイト)| 説明                                                  |
| -------------- | --------------- | ------------------------------------------------------------ |
| [ARRAY](../sql-manual/basic-element/sql-data-types/semi-structured/ARRAY)          | 可変長 | 型 T の要素で構成される配列で、キーカラムとして使用できません。現在、Duplicate と Unique モデルのテーブルでの使用がサポートされています。 |
| [MAP](../sql-manual/basic-element/sql-data-types/semi-structured/MAP)            | 可変長 | 型 K と V の要素で構成されるマップで、Key カラムとして使用できません。これらのマップは現在、Duplicate と Unique モデルを使用するテーブルでサポートされています。 |
| [STRUCT](../sql-manual/basic-element/sql-data-types/semi-structured/STRUCT)         | 可変長 | 複数の Fields で構成される構造体で、複数のカラムの集合として理解することもできます。Key として使用することはできません。現在、STRUCT は Duplicate モデルのテーブルでのみ使用できます。Struct 内の Fields の名前と数は固定され、常に Nullable です。|
| [JSON](../sql-manual/basic-element/sql-data-types/semi-structured/JSON)           | 可変長 | バイナリ JSON 型で、バイナリ JSON 形式で格納され、JSON 関数を通して内部 JSON フィールドにアクセスします。デフォルトで最大 1048576 バイト（1MB）をサポートし、最大 2147483643 バイト（2GB）まで調整可能です。この制限は BE 設定パラメータ 'jsonb_type_length_soft_limit_bytes' で変更できます。 |
| [VARIANT](../sql-manual/basic-element/sql-data-types/semi-structured/VARIANT)        | 可変長 | VARIANT データ型は動的適応性を持ち、JSON のような半構造化データ用に特別に設計されています。任意の JSON オブジェクトを格納でき、自動的に JSON フィールドをサブカラムに分割して、ストレージ効率とクエリパフォーマンスを向上させます。長さ制限と設定方法は STRING 型と同じです。ただし、VARIANT 型は値カラムでのみ使用でき、キーカラムやパーティション/バケットカラムでは使用できません。 |

## [集約データ型](../sql-manual/basic-element/sql-data-types/data-type-overview#aggregation-types)

| 型名      | ストレージ (バイト)| 説明                                                  |
| -------------- | --------------- | ------------------------------------------------------------ |
| [HLL](../sql-manual/basic-element/sql-data-types/aggregate/HLL)            | 可変長 | HLL は HyperLogLog の略で、ファジー重複除去です。大きなデータセットを処理する際、Count Distinct よりも優れたパフォーマンスを発揮します。HLL のエラー率は通常約 1% で、時には 2% に達することがあります。HLL はキーカラムとして使用できず、テーブル作成時の集約タイプは HLL_UNION です。ユーザーは長さやデフォルト値を指定する必要がありません。これはデータの集約レベルに基づいて内部的に制御されます。HLL カラムは hll_union_agg、hll_raw_agg、hll_cardinality、hll_hash などの付属関数を通してのみクエリまたは使用できます。 |
| [BITMAP](../sql-manual/basic-element/sql-data-types/aggregate/BITMAP)         | 可変長 | BITMAP 型は Aggregate テーブル、Unique テーブル、または Duplicate テーブルで使用できます。- Unique テーブルまたは Duplicate テーブルで使用する場合、BITMAP は非キーカラムとして使用する必要があります。- Aggregate テーブルで使用する場合、BITMAP も非キーカラムとして機能し、テーブル作成時に集約タイプを BITMAP_UNION に設定する必要があります。ユーザーは長さやデフォルト値を指定する必要がありません。これはデータの集約レベルに基づいて内部的に制御されます。BITMAP カラムは bitmap_union_count、bitmap_union、bitmap_hash、bitmap_hash64 などの付属関数を通してのみクエリまたは使用できます。 |
| [QUANTILE_STATE](../sql-manual/basic-element/sql-data-types/aggregate/QUANTILE-STATE.md) | 可変長 | 近似分位値を計算するために使用される型です。ロード時に、異なる値を持つ同じキーに対して事前集約を実行します。値の数が 2048 を超えない場合、すべてのデータを詳細に記録します。値の数が 2048 より大きい場合、TDigest アルゴリズムを使用してデータを集約（クラスタ化）し、クラスタ化後の重心点を格納します。QUANTILE_STATE はキーカラムとして使用できず、テーブル作成時に集約タイプ QUANTILE_UNION と組み合わせる必要があります。ユーザーは長さやデフォルト値を指定する必要がありません。これはデータの集約レベルに基づいて内部的に制御されます。QUANTILE_STATE カラムは QUANTILE_PERCENT、QUANTILE_UNION、TO_QUANTILE_STATE などの付属関数を通してのみクエリまたは使用できます。 |
| [AGG_STATE](../sql-manual/basic-element/sql-data-types/aggregate/AGG-STATE)       | 可変長 | 集約関数は state/merge/union 関数コンバイナーとのみ使用できます。AGG_STATE はキーカラムとして使用できません。テーブル作成時には、集約関数のシグネチャを併せて宣言する必要があります。ユーザーは長さやデフォルト値を指定する必要がありません。実際のデータストレージサイズは関数の実装に依存します。 |

## [IP 型](../sql-manual/basic-element/sql-data-types/data-type-overview#ip-types)

| 型名                                                    | ストレージ (バイト) | 説明                                                  |  
| ---------------------------------------------------------- | --------------- | ------------------------------------------------------------ |  
| [IPv4](../sql-manual/basic-element/sql-data-types/ip/IPV4)                 | 4               | `ipv4_*` 系の関数と併せて使用されます。 |  
| [IPv6](../sql-manual/basic-element/sql-data-types/ip/IPV6)                 | 16              | `ipv6_*` 系の関数と併せて使用されます。 |

`SHOW DATA TYPES; `文を使用して、Doris でサポートされているすべてのデータ型を表示することもできます。
