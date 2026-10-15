---
{
    "title": "概要 | SQL データ型",
    "language": "ja",
    "description": "Apache Doris の数値型、日付・時刻型、文字列型、バイナリ型、半構造化型、集約型、IP 型、UUID 型の概要。",
    "sidebar_label": "概要"
}
---

# 概要

## 数値型

Doris は次の数値データ型をサポートします。

### BOOLEAN

値は二種類で、0 は false、1 は true を表します。

詳しくは [BOOLEAN](../sql-data-types/numeric/BOOLEAN.md) を参照してください。

### 整数型

すべて符号付き整数です。各整数型は、使用するバイト数と表現できる値の範囲が異なります。

- **[TINYINT](../sql-data-types/numeric/TINYINT.md)**: 1 バイト、[-128, 127]

- **[SMALLINT](../sql-data-types/numeric/SMALLINT.md)**: 2 バイト、[-32768, 32767]

- **[INT](../sql-data-types/numeric/INT.md)**: 4 バイト、[-2147483648, 2147483647]

- **[BIGINT](../sql-data-types/numeric/BIGINT.md)**: 8 バイト、[-9223372036854775808, 9223372036854775807]

- **[LARGEINT](../sql-data-types/numeric/LARGEINT.md)**: 16 バイト、[-2^127, 2^127 - 1]


### 浮動小数点型


非厳密な浮動小数点型には [FLOAT](../sql-data-types/numeric/FLOATING-POINT.md) と [DOUBLE](../sql-data-types/numeric/FLOATING-POINT.md) があり、一般的なプログラミング言語の `float` と `double` にそれぞれ対応します。

### 固定小数点型

厳密な固定小数点型の [DECIMAL](../sql-data-types/numeric/DECIMAL.md) は、財務など、厳密な精度が必要な場合に使用します。



## 日付・時刻型

日付・時刻型には DATE、TIME、DATETIME、TIMESTAMP_NS、TIMESTAMPTZ があります。DATE は日単位の精度で日付を格納します。DATETIME はタイムゾーン情報を持たない日時を最大マイクロ秒の精度で格納します。TIMESTAMP_NS はタイムゾーン情報を持たない日時を固定のナノ秒精度で格納し、その範囲は 1677 年から 2262 年です。TIME は時刻のみを保持し、**現時点ではテーブルへの格納をサポートせず、クエリ処理中にのみ使用できます**。TIMESTAMPTZ はタイムゾーンを考慮する日時型です。値を UTC で格納し、クエリ時にはセッションのタイムゾーンに応じて自動的に変換します。

日時型の値を計算したり数値型に変換したりする場合は、[TIME_TO_SEC](../../sql-functions/scalar-functions/date-time-functions/time-to-sec)、[DATE_DIFF](../../sql-functions/scalar-functions/date-time-functions/datediff)、[UNIX_TIMESTAMP](../../sql-functions/scalar-functions/date-time-functions/unix-timestamp) などの関数を使用してください。数値型に直接変換した場合の結果は保証されません。

詳しくは [DATE](../sql-data-types/date-time/DATE)、[TIME](../sql-data-types/date-time/TIME)、[DATETIME](../sql-data-types/date-time/DATETIME)、[TIMESTAMP_NS](../sql-data-types/date-time/TIMESTAMP-NS)、[TIMESTAMPTZ](../sql-data-types/date-time/TIMESTAMPTZ) を参照してください。




## 文字列型

Doris は、次の固定長文字列型と可変長文字列型をサポートします。

- **[CHAR(M)](./string-type/CHAR)**: 固定長文字列です。M はバイト単位の長さで、範囲は [1, 255] です。

- **[VARCHAR(M)](./string-type/VARCHAR)**: 可変長文字列です。M は最大長で、範囲は [1, 65533] です。

- **[STRING](./string-type/STRING)**: デフォルトの最大長が 1,048,576 バイト (1 MB) の可変長文字列です。`string_type_length_soft_limit_bytes` の設定により、最大長を 2,147,483,643 バイト (2 GB) まで増やせます。

## バイナリ型

- **[VARBINARY](./binary-type/VARBINARY)**: 可変長のバイナリバイト列です。M はバイト単位の最大長を表します。VARCHAR に似ていますが、文字セットや照合順序を使用せず、バイト単位で格納・比較します。ファイルの断片、暗号化データ、圧縮データなど、任意のバイナリデータの格納に適しています。4.0 以降でサポートされています。現時点では Doris のテーブルの列として定義・格納することはできませんが、Catalog を使用して他のデータベースの BINARY 列を Doris にマッピングし、利用できます。

## 半構造化型


Doris は JSON データの処理に使う複数の半構造化データ型をサポートしており、それぞれ異なる用途に適しています。

- **[ARRAY](../sql-data-types/semi-structured/ARRAY.md)** / **[MAP](../sql-data-types/semi-structured/MAP.md)** / **[STRUCT](./semi-structured/STRUCT)**: ネストされたデータと固定スキーマをサポートします。ユーザー行動やプロファイルの分析、Parquet などのデータレイク形式のクエリに適しています。スキーマが固定されているため、動的なスキーマ推論のオーバーヘッドがなく、書き込みと分析の性能が高くなります。

- **[VARIANT](../sql-data-types/semi-structured/VARIANT.md)**: ネストされたデータと柔軟なスキーマをサポートします。ログ、トレース、IoT データの分析に適しています。有効な JSON データをすべて格納でき、データは列指向のストレージ形式で自動的にサブカラムへ展開されます。これにより、高い圧縮率と、集約・フィルタリング・ソートでの高い性能を実現します。

- **[JSON](../sql-data-types/semi-structured/JSON.md)**: ネストされたデータと柔軟なスキーマをサポートします。同時実行数が多いポイントクエリ向けに最適化されています。柔軟なスキーマにより、任意の有効な JSON データを取り込んでバイナリ形式で格納できます。このバイナリ JSON 形式からのフィールド抽出は、通常の JSON 文字列を使用する場合より 2X を超える速度です。

## 集約型

集約データ型は、集約中の結果または中間結果を格納します。集約処理が多いクエリの高速化に使用します。

- **[BITMAP](../sql-data-types/aggregate/BITMAP.md)**: UV 統計やオーディエンスのセグメント化などで、厳密な重複排除に使用します。`bitmap_union`、`bitmap_union_count`、`bitmap_hash`、`bitmap_hash64` などの BITMAP 関数と組み合わせて使用します。

- **[HLL](../sql-data-types/aggregate/HLL.md)**: 近似的な重複排除に使用し、`COUNT DISTINCT` より高い性能を発揮します。`hll_union_agg`、`hll_raw_agg`、`hll_cardinality`、`hll_hash` などの HLL 関数と組み合わせて使用します。

- **[QUANTILE_STATE](../sql-data-types/aggregate/QUANTILE-STATE.md)**: 近似的なパーセンタイルの計算に使用し、`PERCENTILE` 関数より高い性能を発揮します。`QUANTILE_PERCENT`、`QUANTILE_UNION`、`TO_QUANTILE_STATE` などの関数と組み合わせて使用します。

- **[AGG_STATE](../sql-data-types/aggregate/AGG-STATE.md)**: 集約処理の高速化に使用します。state/merge/union などの集約関数コンビネータと組み合わせて使用します。


## IP 型


IP データ型は IP アドレスをバイナリ形式で格納します。文字列として格納する場合よりも、クエリが高速になり、必要な領域も少なくなります。次の二種類の IP データ型をサポートします。

- **[IPv4](../sql-data-types/ip/IPV4.md)**: IPv4 アドレスを 4 バイトのバイナリ値として格納します。`ipv4_*` 系の関数と組み合わせて使用します。
- **[IPv6](../sql-data-types/ip/IPV6.md)**: IPv6 アドレスを 16 バイトのバイナリ値として格納します。`ipv6_*` 系の関数と組み合わせて使用します。

## UUID

[UUID](./uuid.md) は、128 ビットの識別子型で、固定長の 16 バイトを使用します。正規形式またはコンパクト形式の十六進数テキストを受け付け、正規形式の小文字テキストを出力します。比較、ソート、グループ化、結合をサポートします。
