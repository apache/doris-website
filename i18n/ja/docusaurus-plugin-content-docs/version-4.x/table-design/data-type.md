---
{
    "title": "データ型",
    "language": "ja",
    "description": "Apache Doris がサポートするデータ型の一覧は次のとおりです。"
}
---

Apache Doris がサポートするデータ型の一覧は次のとおりです。

### [数値型](../sql-manual/basic-element/sql-data-types/data-type-overview#numeric-types)


| 型名      | ストレージサイズ（バイト） | 説明                                                  |
| -------------- | --------- | ------------------------------------------------------------ |
| [BOOLEAN](../sql-manual/basic-element/sql-data-types/numeric/BOOLEAN)        | 1         | 真偽値。0 は false、1 は true を表します。        |
| [TINYINT](../sql-manual/basic-element/sql-data-types/numeric/TINYINT)        | 1         | 符号付き整数。範囲は [-128, 127] です。                           |
| [SMALLINT](../sql-manual/basic-element/sql-data-types/numeric/SMALLINT)       | 2         | 符号付き整数。範囲は [-32768, 32767] です。                       |
| [INT](../sql-manual/basic-element/sql-data-types/numeric/INT)            | 4         | 符号付き整数。範囲は [-2147483648, 2147483647] です。             |
| [BIGINT](../sql-manual/basic-element/sql-data-types/numeric/BIGINT)         | 8         | 符号付き整数。範囲は [-9223372036854775808, 9223372036854775807] です。 |
| [LARGEINT](../sql-manual/basic-element/sql-data-types/numeric/LARGEINT)       | 16        | 符号付き整数。範囲は [-2^127 + 1 ~ 2^127 - 1] です。              |
| [FLOAT](../sql-manual/basic-element/sql-data-types/numeric/FLOATING-POINT)          | 4         | 浮動小数点数。範囲は [-3.4*10^38 ~ 3.4*10^38] です。       |
| [DOUBLE](../sql-manual/basic-element/sql-data-types/numeric/FLOATING-POINT)         | 8         | 浮動小数点数。範囲は [-1.79*10^308 ~ 1.79*10^308] です。   |
| [DECIMAL](../sql-manual/basic-element/sql-data-types/numeric/DECIMAL)        | 4/8/16/32    | 高精度の固定小数点数。形式は DECIMAL(P[,S]) です。P は有効桁数の合計（精度）を、S は小数点以下の桁数（スケール）を表します。P の範囲は [1, MAX_P] です。`enable_decimal256`=false の場合、MAX_P=38 です。`enable_decimal256`=true の場合、MAX_P=76 です。S の範囲は [0, P] です。<br>`enable_decimal256` のデフォルト値は false です。true に設定すると結果の精度が高くなりますが、パフォーマンスに多少のオーバーヘッドが生じます。<br>ストレージサイズ：<ul><li>0 < precision <= 9 の場合、4 バイトを使用します。</li><li>9 < precision <= 18 の場合、8 バイトを使用します。</li><li>18 < precision <= 38 の場合、16 バイトを使用します。</li><li>38 < precision <= 76 の場合、32 バイトを使用します。</li></ul>|

### [日付・時刻型](../sql-manual/basic-element/sql-data-types/data-type-overview#date-types)

| 型名             | ストレージサイズ（バイト） | 説明                                                                                |  
| --------------------- | ---------------- | ------------------------------------------------------------------------------------------ |  
| [DATE](../sql-manual/basic-element/sql-data-types/date-time/DATE)         | 4               | 日付型。現在の値の範囲は ['0000-01-01', '9999-12-31'] で、デフォルトの表示形式は 'yyyy-MM-dd' です。         |  
| [DATETIME](../sql-manual/basic-element/sql-data-types/date-time/DATETIME) | 8               | 日付・時刻型。形式は DATETIME([P]) です。省略可能なパラメータ P は時刻の精度を表し、値の範囲は [0, 6] です。最大 6 桁の小数部（マイクロ秒）をサポートします。指定しない場合のデフォルト値は 0 です。<br />値の範囲は ['0000-01-01 00:00:00[.000000]', '9999-12-31 23:59:59[.999999]'] です。表示形式は 'yyyy-MM-dd HH:mm:ss.SSSSSS' です。 |

### [文字列型](../sql-manual/basic-element/sql-data-types/data-type-overview#string-types)

| 型名      | ストレージサイズ（バイト） | 説明                                                  |
| -------------- | --------- | ------------------------------------------------------------ |
| [CHAR](../sql-manual/basic-element/sql-data-types/string-type/CHAR)           | M         | 固定長文字列。M は固定長文字列のバイト長を表します。M の範囲は 1-255 です。 |
| [VARCHAR](../sql-manual/basic-element/sql-data-types/string-type/VARCHAR)        | 可変     | 可変長文字列。M は可変長文字列のバイト長を表します。M の範囲は 1-65533 です。可変長文字列は UTF-8 エンコーディングで保存されるため、英字は通常 1 バイト、中国語の文字は 3 バイトを使用します。 |
| [STRING](../sql-manual/basic-element/sql-data-types/string-type/STRING)         | 可変     | 可変長文字列。デフォルトでは 1048576 バイト（1MB）までサポートし、最大 2147483643 バイト（2GB）まで増やせます。BE 設定の `string_type_length_soft_limit_bytes` で調整できます。String 型は Value 列でのみ使用でき、Key 列やパーティション列、バケット分割列では使用できません。 |

### [半構造化型](../sql-manual/basic-element/sql-data-types/data-type-overview#semi-structured-types)
| 型名      | ストレージサイズ（バイト） | 説明                                                  |
| -------------- | --------- | ------------------------------------------------------------ |
| [ARRAY](../sql-manual/basic-element/sql-data-types/semi-structured/ARRAY)          | 可変     | 型 T の要素で構成される配列です。Key 列には使用できません。現在、Duplicate モデルと Unique モデルのテーブルでサポートされています。 |
| [MAP](../sql-manual/basic-element/sql-data-types/semi-structured/MAP)            | 可変     | 型 K と型 V の要素で構成されるマップです。Key 列には使用できません。現在、Duplicate モデルと Unique モデルのテーブルでサポートされています。 |
| [STRUCT](../sql-manual/basic-element/sql-data-types/semi-structured/STRUCT)         | 可変	    | 複数のフィールドで構成される構造体で、複数の列の集合とも捉えられます。Key には使用できません。現在、STRUCT は Duplicate モデルのテーブルでのみサポートされています。Struct 内のフィールドの名前と数は固定され、各フィールドは常に Nullable です。|
| [JSON](../sql-manual/basic-element/sql-data-types/semi-structured/JSON)           | 可変     | バイナリ JSON 型です。バイナリ JSON 形式で保存され、JSON 内部のフィールドには JSON 関数を使ってアクセスします。長さの制限と設定方法は String と同じです。 |
| [VARIANT](../sql-manual/basic-element/sql-data-types/semi-structured/VARIANT)        | 可変     | JSON などの半構造化データ向けに設計された、動的に変化するデータ型です。任意の JSON を保存でき、JSON 内のフィールドを自動的にサブカラムに分割して保存することで、ストレージ効率とクエリ分析の性能を向上させます。長さの制限と設定方法は String と同じです。Variant 型は Value 列でのみ使用でき、Key 列やパーティション列、バケット分割列では使用できません。|

### [集約型](../sql-manual/basic-element/sql-data-types/data-type-overview#aggregation-types)

| 型名      | ストレージサイズ（バイト） | 説明                                                  |
| -------------- | --------- | ------------------------------------------------------------ |
| [HLL](../sql-manual/basic-element/sql-data-types/aggregate/HLL)            | 可変     | HLL は近似的な重複排除を行います。データ量が多い場合は Count Distinct よりも性能に優れています。HLL の誤差は通常約 1% で、2% に達することもあります。HLL は Key 列には使用できず、テーブル作成時に集約型 HLL_UNION を指定する必要があります。長さとデフォルト値を指定する必要はありません。長さはデータの集約度に応じてシステム内部で制御されます。HLL 列のクエリまたは使用には、対応する `hll_union_agg`、`hll_raw_agg`、`hll_cardinality`、`hll_hash` 関数を使用する必要があります。|
| [BITMAP](../sql-manual/basic-element/sql-data-types/aggregate/BITMAP)         | 可変     | Bitmap 型の列は Aggregate テーブル、Unique テーブル、Duplicate テーブルで使用できます。Unique テーブルまたは Duplicate テーブルで使用する場合は、非 Key 列として使用する必要があります。Aggregate テーブルで使用する場合も非 Key 列とし、テーブル作成時に集約型 BITMAP_UNION を指定する必要があります。長さとデフォルト値を指定する必要はありません。長さはデータの集約度に応じてシステム内部で制御されます。BITMAP 列のクエリまたは使用には、対応する `bitmap_union_count`、`bitmap_union`、`bitmap_hash`、`bitmap_hash64` などの関数を使用する必要があります。 |
| [QUANTILE_STATE](../sql-manual/basic-element/sql-data-types/aggregate/QUANTILE-STATE) | 可変     | QUANTILE_STATE は近似的な分位数の計算に使用する型です。データ取り込み時に、同じ Key に対する異なる Value を事前集約します。値の数が 2048 以下の場合は、すべてのデータを詳細に記録します。値の数が 2048 を超える場合は、TDigest アルゴリズムでデータを集約（クラスタリング）し、クラスタリング後の重心を保存します。QUANTILE_STATE は Key 列には使用できず、テーブル作成時に集約型 QUANTILE_UNION を指定する必要があります。長さとデフォルト値を指定する必要はありません。長さはデータの集約度に応じてシステム内部で制御されます。QUANTILE_STATE 列のクエリまたは使用には、対応する `QUANTILE_PERCENT`、`QUANTILE_UNION`、`TO_QUANTILE_STATE` などの関数を使用する必要があります。 |
| [AGG_STATE](../sql-manual/basic-element/sql-data-types/aggregate/AGG-STATE)      | 可変     | 集約関数です。state/merge/union 関数コンビネータと組み合わせてのみ使用できます。AGG_STATE は Key 列には使用できず、テーブル作成時には集約関数のシグネチャも宣言する必要があります。長さとデフォルト値を指定する必要はありません。保存データの実際のサイズは関数の実装によって異なります。 |

### [IP 型](../sql-manual/basic-element/sql-data-types/data-type-overview#ip-types)
| 型名      | ストレージサイズ（バイト） | 説明                                                  |
| -------------- | --------- | ------------------------------------------------------------ |
| [IPv4](../sql-manual/basic-element/sql-data-types/ip/IPV4)            |   4 バイト  |  IPv4 アドレスを 4 バイトのバイナリデータとして保存し、`ipv4_*` ファミリーの関数とともに使用します。         |
| [IPv6](../sql-manual/basic-element/sql-data-types/ip/IPV6)            |   16 バイト  |  IPv6 アドレスを 16 バイトのバイナリデータとして保存し、`ipv6_*` ファミリーの関数とともに使用します。      |

`SHOW DATA TYPES;` 文を使用して、Apache Doris がサポートするすべてのデータ型を確認することもできます。
