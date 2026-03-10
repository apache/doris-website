---
{
  "title": "概要 | SQL データ型",
  "language": "ja",
  "description": "Dorisは以下の数値データ型をサポートしています：",
  "sidebar_label": "Overview"
}
---
# 概要

## 数値型

Dorisは以下の数値データ型をサポートしています：

### BOOLEAN

2つの値が可能です：0はfalseを表し、1はtrueを表します。

詳細については、[BOOLEAN](../sql-data-types/numeric/BOOLEAN.md)を参照してください。

### Integer

すべて符号付き整数です。INT型間の違いは、占有するバイト数と表現可能な値の範囲です：

- **[TINYINT](../sql-data-types/numeric/TINYINT.md)**：1バイト、[-128, 127]

- **[SMALLINT](../sql-data-types/numeric/SMALLINT.md)**：2バイト、[-32768, 32767]

- **[INT](../sql-data-types/numeric/INT.md)**：4バイト、[-2147483648, 2147483647]

- **[BIGINT](../sql-data-types/numeric/BIGINT.md)**：8バイト、[-9223372036854775808, 9223372036854775807]

- **[LARGEINT](../sql-data-types/numeric/LARGEINT.md)**：16バイト、[-2^127, 2^127 - 1]


### 浮動小数点

一般的なプログラミング言語の`float`と`double`に対応する、不正確な浮動小数点型[FLOAT](../sql-data-types/numeric/FLOATING-POINT.md)と[DOUBLE](../sql-data-types/numeric/FLOATING-POINT.md)を含みます

### 固定小数点

金融やその他の厳密な精度を必要とするケースで使用される、正確な固定小数点型[DECIMAL](../sql-data-types/numeric/DECIMAL.md)です。



## 日付型

日付型にはDATE、TIME、DATETIMEおよびTIMESTAMPTZが含まれます。DATE型は日単位まで正確な日付のみを保存し、DATETIME型は日付と時刻を保存し、マイクロ秒まで正確にできます。TIME型は時刻のみを保存し、**現時点ではテーブルストレージの構築はサポートされておらず、クエリプロセスでのみ使用可能です**。TIMESTAMPTZはタイムゾーン対応の日付時刻型で、値をUTCで保存し、クエリ時にセッションタイムゾーンに基づいて自動的に変換します。

datetime型の計算や数値型への変換には、[TIME_TO_SEC](../../sql-functions/scalar-functions/date-time-functions/time-to-sec)、[DATE_DIFF](../../sql-functions/scalar-functions/date-time-functions/datediff)、[UNIX_TIMESTAMP](../../sql-functions/scalar-functions/date-time-functions/unix-timestamp)などの関数を使用してください。直接数値型として変換した結果は保証されません。

詳細については、[DATE](../sql-data-types/date-time/DATE)、[TIME](../sql-data-types/date-time/TIME)、[DATETIME](../sql-data-types/date-time/DATETIME)、および[TIMESTAMPTZ](../sql-data-types/date-time/TIMESTAMPTZ)のドキュメントを参照してください。




## 文字列型

Dorisは固定長および可変長文字列の両方をサポートし、以下が含まれます：

- **[CHAR(M)](./string-type/CHAR)**：固定長文字列で、Mはバイト長です。Mの範囲は[1, 255]です。

- **[VARCHAR(M)](./string-type/VARCHAR)**：可変長文字列で、Mは最大長です。Mの範囲は[1, 65533]です。

- **[STRING](./string-type/STRING)**：デフォルト最大長が1,048,576バイト（1 MB）の可変長文字列です。この最大長は`string_type_length_soft_limit_bytes`設定を構成することで2,147,483,643バイト（2 GB）まで増加できます。

## バイナリ型

- **[VARBINARY](./binary-type/VARBINARY)**：可変長バイナリバイトシーケンスで、Mは最大長（バイト単位）です。VARCHARと似ていますが、文字セットや照合順序が関与しないバイト単位の保存と比較を使用します；任意のバイナリデータ（ファイル断片、暗号化データ、圧縮データなど）の保存に適しています。4.0以降でサポート；現在Dorisではテーブル作成と保存はサポートされていませんが、Catalogsを使用して他のデータベースのBINARYカラムをDorisにマッピングして使用できます。

## 半構造化型

DorisはJSONデータ処理用に異なる半構造化データ型をサポートし、それぞれ異なる使用ケースに適合しています。

- **[ARRAY](../sql-data-types/semi-structured/ARRAY.md)** / **[MAP](../sql-data-types/semi-structured/MAP.md)** / **[STRUCT](./semi-structured/STRUCT)**：ネストされたデータと固定スキーマをサポートし、ユーザー行動およびプロファイル分析などの分析ワークロードや、Parquetなどのデータレイク形式のクエリに適しています。固定スキーマのため、動的スキーマ推論のオーバーヘッドがなく、高い書き込みおよび分析パフォーマンスを実現します。

- **[VARIANT](../sql-data-types/semi-structured/VARIANT.md)**：ネストされたデータと柔軟なスキーマをサポートします。ログ、トレース、IoTデータ分析などの分析ワークロードに適しています。任意の有効なJSONデータに対応でき、カラム型ストレージ形式でサブカラムに自動的に展開されます。このアプローチにより、ストレージでの高圧縮率とデータ集約、フィルタリング、ソートでの高パフォーマンスを実現します。

- **[JSON](../sql-data-types/semi-structured/JSON.md)**：ネストされたデータと柔軟なスキーマをサポートします。高同期ポイントクエリ使用ケース用に最適化されています。柔軟なスキーマにより任意の有効なJSONデータを取り込むことができ、バイナリ形式で保存されます。このバイナリJSON形式からのフィールド抽出は、通常のJSON文字列の使用より2倍以上高速です。

## 集約型

集約データ型は、集約結果または集約中の中間結果を保存します。集約を多用するクエリの高速化に使用されます。

- **[BITMAP](../sql-data-types/aggregate/BITMAP.md)**：完全重複排除に使用され、（UV）統計やオーディエンス セグメンテーションなどで利用されます。`bitmap_union`、`bitmap_union_count`、`bitmap_hash`、`bitmap_hash64`などのBITMAP関数と連携して動作します。

- **[HLL](../sql-data-types/aggregate/HLL.md)**：近似重複排除に使用され、`COUNT DISTINCT`よりも良いパフォーマンスを提供します。`hll_union_agg`、`hll_raw_agg`、`hll_cardinality`、`hll_hash`などのHLL関数と連携して動作します。

- **[QUANTILE_STATE](../sql-data-types/aggregate/QUANTILE-STATE.md)**：近似パーセンタイル計算に使用され、`PERCENTILE`関数よりも良いパフォーマンスを提供します。`QUANTILE_PERCENT`、`QUANTILE_UNION`、`TO_QUANTILE_STATE`などの関数と連携して動作します。

- **[AGG_STATE](../sql-data-types/aggregate/AGG-STATE.md)**：集約の高速化に使用され、state/merge/unionなどの集約関数コンビネータと組み合わせて利用されます。


## IP型

IPデータ型はIPアドレスをバイナリ形式で保存し、文字列として保存するよりもクエリが高速で領域効率的です。サポートされているIPデータ型は2つあります：

- **[IPv4](../sql-data-types/ip/IPV4.md)**：IPv4アドレスを4バイトのバイナリ値として保存します。`ipv4_*`ファミリーの関数と連携して使用されます。
- **[IPv6](../sql-data-types/ip/IPV6.md)**：IPv6アドレスを16バイトのバイナリ値として保存します。`ipv6_*`ファミリーの関数と連携して使用されます。
