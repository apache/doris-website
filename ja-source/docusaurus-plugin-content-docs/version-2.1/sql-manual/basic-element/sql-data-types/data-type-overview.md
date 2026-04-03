---
{
  "title": "概要 | Sql データ型",
  "language": "ja",
  "description": "Dorisは以下の数値データ型をサポートしています：",
  "sidebar_label": "概要"
}
---
# 概要

## 数値型

Dorisは以下の数値データ型をサポートしています：

### BOOLEAN

2つの可能な値があります：0はfalseを表し、1はtrueを表します。

詳細については、[BOOLEAN](../sql-data-types/numeric/BOOLEAN.md)を参照してください。

### 整数

すべて符号付き整数です。INT型の違いは、占有するバイト数と表現できる値の範囲です：

- **[TINYINT](../sql-data-types/numeric/TINYINT.md)**: 1バイト、[-128, 127]

- **[SMALLINT](../sql-data-types/numeric/SMALLINT.md)**: 2バイト、[-32768, 32767]

- **[INT](../sql-data-types/numeric/INT.md)**: 4バイト、[-2147483648, 2147483647]

- **[BIGINT](../sql-data-types/numeric/BIGINT.md)**: 8バイト、[-9223372036854775808, 9223372036854775807]

- **[LARGEINT](../sql-data-types/numeric/LARGEINT.md)**: 16バイト、[-2^127, 2^127 - 1]


### 浮動小数点


一般的なプログラミング言語の`float`と`double`に対応する、不正確な浮動小数点型[FLOAT](../sql-data-types/numeric/FLOAT.md)と[DOUBLE](../sql-data-types/numeric/DOUBLE.md)を含みます

### 固定小数点

金融やその他の厳密な精度を必要とするケースで使用される、正確な固定小数点型[DECIMAL](../sql-data-types/numeric/DECIMAL.md)。



## 日付型

日付型にはDATE、TIME、DATETIMEが含まれます。DATE型は日まで正確な日付のみを格納し、DATETIME型は日付と時刻を格納し、マイクロ秒まで正確にできます。TIME型は時刻のみを格納し、**現時点ではテーブルストレージの構築をサポートしておらず、クエリプロセスでのみ使用できます**。

datetime型の計算や数値型への変換については、[TIME_TO_SEC](../../sql-functions/scalar-functions/date-time-functions/time-to-sec)、[DATE_DIFF](../../sql-functions/scalar-functions/date-time-functions/datediff)、[UNIX_TIMESTAMP](../../sql-functions/scalar-functions/date-time-functions/unix-timestamp)などの関数を使用してください。数値型として直接変換した結果は保証されません。

詳細については、[DATE](../sql-data-types/date-time/DATE)、[TIME](../sql-data-types/date-time/TIME)、[DATETIME](../sql-data-types/date-time/DATETIME)のドキュメントを参照してください。




## 文字列型

Dorisは固定長と可変長の両方の文字列をサポートしており、以下を含みます：

- **[CHAR(M)](./string-type/CHAR)**: 固定長文字列、Mはバイト長です。Mの範囲は[1, 255]です。

- **[VARCHAR(M)](./string-type/VARCHAR)**: 可変長文字列、Mは最大長です。Mの範囲は[1, 65533]です。

- **[STRING](./string-type/STRING)**: デフォルト最大長が1,048,576バイト（1MB）の可変長文字列です。この最大長は`string_type_length_soft_limit_bytes`設定を構成することで2,147,483,643バイト（2GB）まで増加させることができます。

## 半構造化型


DorisはJSONデータ処理用の異なる半構造化データ型をサポートしており、それぞれ異なる用途に合わせて調整されています。

- **[ARRAY](../sql-data-types/semi-structured/ARRAY.md)** / **[MAP](../sql-data-types/semi-structured/MAP.md)** / **[STRUCT](./semi-structured/STRUCT)**: これらはネストされたデータと固定スキーマをサポートし、ユーザー行動やプロファイル分析などの分析ワークロードや、Parquetなどのデータレイク形式のクエリに適しています。固定スキーマのため、動的スキーマ推論のオーバーヘッドがなく、高い書き込みおよび分析パフォーマンスを実現します。

- **[VARIANT](../sql-data-types/semi-structured/VARIANT.md)**: ネストされたデータと柔軟なスキーマをサポートします。ログ、トレース、IoTデータ分析などの分析ワークロードに適しています。任意の有効なJSONデータに対応でき、カラム型ストレージ形式でサブカラムに自動的に展開されます。このアプローチにより、ストレージでの高い圧縮率と、データ集約、フィルタリング、ソートでの高いパフォーマンスを実現します。

- **[JSON](../sql-data-types/semi-structured/JSON.md)**: ネストされたデータと柔軟なスキーマをサポートします。高い同時実行性のポイントクエリ用途に最適化されています。柔軟なスキーマにより任意の有効なJSONデータを取り込むことができ、バイナリ形式で格納されます。このバイナリJSON形式からのフィールド抽出は、通常のJSON文字列を使用するより2倍以上高速です。

## 集約型

集約データ型は集約結果や集約中の中間結果を格納します。集約が多いクエリの高速化に使用されます。

- **[BITMAP](../sql-data-types/aggregate/BITMAP.md)**: (UV)統計やオーディエンスセグメンテーションなど、正確な重複除去に使用されます。`bitmap_union`、`bitmap_union_count`、`bitmap_hash`、`bitmap_hash64`などのBITMAP関数と組み合わせて動作します。

- **[HLL](../sql-data-types/aggregate/HLL.md)**: 近似重複除去に使用され、`COUNT DISTINCT`よりも優れたパフォーマンスを提供します。`hll_union_agg`、`hll_raw_agg`、`hll_cardinality`、`hll_hash`などのHLL関数と組み合わせて動作します。

- **[QUANTILE_STATE](../sql-data-types/aggregate/QUANTILE-STATE.md)**: 近似パーセンタイル計算に使用され、`PERCENTILE`関数よりも優れたパフォーマンスを提供します。`QUANTILE_PERCENT`、`QUANTILE_UNION`、`TO_QUANTILE_STATE`などの関数と組み合わせて動作します。

- **[AGG_STATE](../sql-data-types/aggregate/AGG-STATE.md)**: 集約の高速化に使用され、state/merge/unionなどの集約関数コンビネーターと組み合わせて利用されます。


## IP型


IP データ型はIPアドレスをバイナリ形式で格納し、文字列として格納するのに比べてクエリがより高速で空間効率的です。サポートされているIPデータ型は2つあります：

- **[IPv4](../sql-data-types/ip/IPV4.md)**: IPv4アドレスを4バイトのバイナリ値として格納します。`ipv4_*`関数ファミリーと組み合わせて使用されます。
- **[IPv6](../sql-data-types/ip/IPV6.md)**: IPv6アドレスを16バイトのバイナリ値として格納します。`ipv6_*`関数ファミリーと組み合わせて使用されます。
