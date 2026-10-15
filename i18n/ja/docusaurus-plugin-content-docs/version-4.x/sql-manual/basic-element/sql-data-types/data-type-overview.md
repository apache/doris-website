---
{
    "title": "概要 | SQL データ型",
    "language": "ja",
    "description": "Doris は次の数値データ型をサポートします。",
    "sidebar_label": "概要"
}
---

# 概要

## 数値型

Doris は次の数値データ型をサポートします。

### BOOLEAN

値は 0（false）と 1（true）の二種類です。

詳しくは [BOOLEAN](../sql-data-types/numeric/BOOLEAN.md) を参照してください。

### 整数型

いずれも符号付き整数です。INT 系の型では、使用するバイト数と表現できる値の範囲が異なります。

- **[TINYINT](../sql-data-types/numeric/TINYINT.md)**: 1 バイト、[-128, 127]

- **[SMALLINT](../sql-data-types/numeric/SMALLINT.md)**: 2 バイト、[-32768, 32767]

- **[INT](../sql-data-types/numeric/INT.md)**: 4 バイト、[-2147483648, 2147483647]

- **[BIGINT](../sql-data-types/numeric/BIGINT.md)**: 8 バイト、[-9223372036854775808, 9223372036854775807]

- **[LARGEINT](../sql-data-types/numeric/LARGEINT.md)**: 16 バイト、[-2^127, 2^127 - 1]


### 浮動小数点型


精度が厳密ではない浮動小数点型の [FLOAT](../sql-data-types/numeric/FLOATING-POINT.md) と [DOUBLE](../sql-data-types/numeric/FLOATING-POINT.md) が含まれます。それぞれ一般的なプログラミング言語の `float` 型と `double` 型に対応します。

### 固定小数点型

厳密な精度が求められる金融などの用途には、正確な固定小数点型の [DECIMAL](../sql-data-types/numeric/DECIMAL.md) を使用します。



## 日付・時刻型

日付・時刻型には DATE、TIME、DATETIME、TIMESTAMPTZ があります。DATE 型は日単位の精度で日付だけを保存し、DATETIME 型はマイクロ秒単位までの精度で日付と時刻を保存します。TIME 型は時刻だけを保存しますが、**現時点ではテーブルの作成と保存には対応しておらず、クエリ処理でのみ使用できます**。TIMESTAMPTZ はタイムゾーン対応の日時型で、値を UTC で保存し、クエリ時にはセッションのタイムゾーンに応じて自動変換します。

日時型の計算や数値型への変換には、[TIME_TO_SEC](../../sql-functions/scalar-functions/date-time-functions/time-to-sec)、[DATE_DIFF](../../sql-functions/scalar-functions/date-time-functions/datediff)、[UNIX_TIMESTAMP](../../sql-functions/scalar-functions/date-time-functions/unix-timestamp) などの関数を使用してください。数値型へ直接変換した場合の結果は保証されません。

詳しくは [DATE](../sql-data-types/date-time/DATE)、[TIME](../sql-data-types/date-time/TIME)、[DATETIME](../sql-data-types/date-time/DATETIME)、[TIMESTAMPTZ](../sql-data-types/date-time/TIMESTAMPTZ) のドキュメントを参照してください。




## 文字列型

Doris は、次の固定長文字列型と可変長文字列型をサポートします。

- **[CHAR(M)](./string-type/CHAR)**: 固定長文字列です。M はバイト単位の長さで、指定できる範囲は [1, 255] です。

- **[VARCHAR(M)](./string-type/VARCHAR)**: 可変長文字列です。M は最大長で、指定できる範囲は [1, 65533] です。

- **[STRING](./string-type/STRING)**: 可変長文字列です。デフォルトの最大長は 1,048,576 バイト（1 MB）です。`string_type_length_soft_limit_bytes` 設定により、最大長を 2,147,483,643 バイト（2 GB）まで引き上げられます。

## バイナリ型

- **[VARBINARY](./binary-type/VARBINARY)**: 可変長のバイナリバイト列です。M はバイト単位の最大長です。VARCHAR に似ていますが、文字セットや照合順序を使用せず、バイト単位で保存・比較します。ファイルの断片、暗号化データ、圧縮データなど、任意のバイナリデータの保存に適しています。4.0 以降でサポートされています。現時点では Doris でのテーブル作成と保存には対応していませんが、Catalog を使用して他のデータベースの BINARY カラムを Doris にマッピングして利用できます。

## 半構造化型


Doris は JSON データの処理に向けて、用途に応じた複数の半構造化データ型をサポートします。

- **[ARRAY](../sql-data-types/semi-structured/ARRAY.md)** / **[MAP](../sql-data-types/semi-structured/MAP.md)** / **[STRUCT](./semi-structured/STRUCT)**: ネストしたデータと固定スキーマをサポートします。ユーザー行動やプロファイルの分析に加え、Parquet などのデータレイク形式のクエリにも適しています。スキーマが固定されているため、動的なスキーマ推論のオーバーヘッドがなく、書き込みと分析の性能が高くなります。

- **[VARIANT](../sql-data-types/semi-structured/VARIANT.md)**: ネストしたデータと柔軟なスキーマをサポートします。ログ、トレース、IoT データなどの分析に適しています。任意の有効な JSON データを格納でき、データは自動的にサブカラムへ展開されて列指向形式で保存されます。これにより、保存時の圧縮率が高く、集約、フィルタリング、ソートでも高い性能を発揮します。

- **[JSON](../sql-data-types/semi-structured/JSON.md)**: ネストしたデータと柔軟なスキーマをサポートします。同時実行数の多いポイントクエリに最適化されています。柔軟なスキーマによって任意の有効な JSON データを取り込めます。データはバイナリ形式で保存され、このバイナリ JSON 形式からのフィールド抽出は、通常の JSON 文字列からの抽出よりも 2 倍を超える速度で行えます。

## 集約型

集約型は、集約結果や集約処理中の中間結果を保存します。集約処理の多いクエリを高速化するために使用します。

- **[BITMAP](../sql-data-types/aggregate/BITMAP.md)**: UV 統計やオーディエンスのセグメント分けなど、正確な重複排除に使用します。`bitmap_union`、`bitmap_union_count`、`bitmap_hash`、`bitmap_hash64` などの BITMAP 関数と組み合わせて使用します。

- **[HLL](../sql-data-types/aggregate/HLL.md)**: 近似的な重複排除に使用し、`COUNT DISTINCT` よりも高い性能を発揮します。`hll_union_agg`、`hll_raw_agg`、`hll_cardinality`、`hll_hash` などの HLL 関数と組み合わせて使用します。

- **[QUANTILE_STATE](../sql-data-types/aggregate/QUANTILE-STATE.md)**: 近似的なパーセンタイル計算に使用し、`PERCENTILE` 関数よりも高い性能を発揮します。`QUANTILE_PERCENT`、`QUANTILE_UNION`、`TO_QUANTILE_STATE` などの関数と組み合わせて使用します。

- **[AGG_STATE](../sql-data-types/aggregate/AGG-STATE.md)**: 集約処理の高速化に使用します。state/merge/union などの集約関数コンビネータと組み合わせて使用します。


## IP 型


IP データ型は IP アドレスをバイナリ形式で保存するため、文字列として保存する場合よりもクエリが高速になり、必要な容量も小さくなります。次の二種類の IP データ型をサポートします。

- **[IPv4](../sql-data-types/ip/IPV4.md)**: IPv4 アドレスを 4 バイトのバイナリ値として保存します。`ipv4_*` 系の関数と組み合わせて使用します。
- **[IPv6](../sql-data-types/ip/IPV6.md)**: IPv6 アドレスを 16 バイトのバイナリ値として保存します。`ipv6_*` 系の関数と組み合わせて使用します。
