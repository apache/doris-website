---
{
  "title": "データ型",
  "language": "ja",
  "description": "Apache DorisはSQL標準構文をサポートし、MySQL Network Connection Protocolを使用して、MySQL構文プロトコルと高度に互換性があります。したがって、"
}
---
Apache Dorisは標準的なSQL構文をサポートし、MySQL Network Connection Protocolを使用し、MySQL構文プロトコルと高い互換性があります。したがって、データ型サポートにおいて、Apache DorisはMySQLに関連するデータ型と可能な限り合致するように設計されています。

Dorisでサポートされているデータ型のリストは以下の通りです：

## [数値データ型](../sql-manual/basic-element/sql-data-types/data-type-overview#numeric-types)

| 型名                                                          | ストレージ（バイト） | 説明                                                         |
| ------------------------------------------------------------ | ------------------ | ------------------------------------------------------------ |
| [BOOLEAN](../sql-manual/basic-element/sql-data-types/numeric/BOOLEAN) | 1                  | 2つの値のみを格納するブール型データ型：0はfalseを表し、1はtrueを表します。 |
| [TINYINT](../sql-manual/basic-element/sql-data-types/numeric/TINYINT) | 1                  | 整数値、符号付きの範囲は-128から127です。                    |
| [SMALLINT](../sql-manual/basic-element/sql-data-types/numeric/SMALLINT) | 2                  | 整数値、符号付きの範囲は-32768から32767です。                |
| [INT](../sql-manual/basic-element/sql-data-types/numeric/INT) | 4                  | 整数値、符号付きの範囲は-2147483648から2147483647です。      |
| [BIGINT](../sql-manual/basic-element/sql-data-types/numeric/BIGINT) | 8                  | 整数値、符号付きの範囲は-9223372036854775808から9223372036854775807です。 |
| [LARGEINT](../sql-manual/basic-element/sql-data-types/numeric/LARGEINT) | 16                 | 整数値、範囲は[-2^127 + 1から2^127 - 1]です。                |
| [FLOAT](../sql-manual/basic-element/sql-data-types/numeric/FLOAT) | 4                  | 単精度浮動小数点数、範囲は[-3.4 * 10^38から3.4 * 10^38]です。 |
| [DOUBLE](../sql-manual/basic-element/sql-data-types/numeric/DOUBLE) | 8                  | 倍精度浮動小数点数、範囲は[-1.79 * 10^308から1.79 * 10^308]です。 |
| [DECIMAL](../sql-manual/basic-element/sql-data-types/numeric/DECIMAL) | 4/8/16/32          | 精度（総桁数）とスケール（小数点以下の桁数）によって定義される正確な固定小数点数。形式：DECIMAL(P[,S])、ここでPは精度、Sはスケールです。Pの範囲は[1, MAX_P]で、`enable_decimal256`=falseの場合MAX_P=38、`enable_decimal256`=trueの場合MAX_P=76、Sの範囲は[0, P]です。<br>`enable_decimal256`のデフォルト値はfalseです。trueに設定するとより正確な結果が得られますが、パフォーマンスの低下を招きます。<br>ストレージ要件：<ul><li>0 < 精度 <= 9の場合4バイト。</li><li>9 < 精度 <= 18の場合8バイト。</li><li>18 < 精度 <= 38の場合16バイト。</li><li>38 < 精度 <= 76の場合32バイト。</ul> |

## [日時データ型](../sql-manual/basic-element/sql-data-types/data-type-overview#date-types)

| 型名           | ストレージ（バイト） | 説明                                                         |
| -------------- | ------------------ | ------------------------------------------------------------ |
| [DATE](../sql-manual/basic-element/sql-data-types/date-time/DATE) | 4                  | DATEはカレンダーの年、月、日の値を保持し、サポートされる範囲は['0000-01-01', '9999-12-31']です。デフォルト出力形式：'yyyy-MM-dd'。 |
| [DATETIME](../sql-manual/basic-element/sql-data-types/date-time/DATETIME) | 8                  | DATEとTIMEの組み合わせ 形式：DATETIME ([P])。オプションパラメータPは時間精度を表し、値の範囲は[0,6]で、最大6桁の小数点以下（マイクロ秒）をサポートします。設定されない場合は0です。サポートされる範囲は['0000-01-01 00:00:00 [.000000]', '9999-12-31 23:59:59 [.999999]']です。デフォルト出力形式：'yyy-MM-dd HH: mm: ss. SSSSSS '。 |

## [文字列データ型](../sql-manual/basic-element/sql-data-types/data-type-overview#string-types)

| 型名           | ストレージ（バイト） | 説明                                                         |
| -------------- | ------------------ | ------------------------------------------------------------ |
| [CHAR](../sql-manual/basic-element/sql-data-types/string-type/CHAR) | M                  | 固定長文字列、パラメータMは文字でのカラム長を指定します。Mの範囲は1から255です。 |
| [VARCHAR](../sql-manual/basic-element/sql-data-types/string-type/VARCHAR) | 可変長             | 可変長文字列、パラメータMは文字での最大文字列長を指定します。Mの範囲は1から65533です。可変長文字列はUTF-8エンコーディングで格納されます。英字は1バイト、中国語文字は3バイトを占めます。 |
| [STRING](../sql-manual/basic-element/sql-data-types/string-type/STRING) | 可変長             | 可変長文字列、デフォルトでは1048576バイト（1 MB）をサポートし、最大2147483643バイト（2 GB）の上限があります。サイズはstring_type_length_soft_limit_bytesを通じてBEで調整可能です。String型はvalue columnでのみ使用でき、key columnやpartition bucket columnでは使用できません。 |

## [半構造化データ型](../sql-manual/basic-element/sql-data-types/data-type-overview#semi-structured-types)

| 型名           | ストレージ（バイト） | 説明                                                         |
| -------------- | ------------------ | ------------------------------------------------------------ |
| [ARRAY](../sql-manual/basic-element/sql-data-types/semi-structured/ARRAY) | 可変長             | 型Tの要素で構成される配列で、key columnとしては使用できません。現在、DuplicateおよびUniqueモデルのテーブルでの使用がサポートされています。 |
| [MAP](../sql-manual/basic-element/sql-data-types/semi-structured/MAP) | 可変長             | 型KとVの要素で構成されるマップで、Key columnとしては使用できません。これらのマップは現在、DuplicateおよびUniqueモデルを使用するテーブルでサポートされています。 |
| [STRUCT](../sql-manual/basic-element/sql-data-types/semi-structured/STRUCT) | 可変長             | 複数のFieldで構成される構造体で、複数のカラムのコレクションとしても理解できます。Keyとして使用することはできません。現在、STRUCTはDuplicateモデルのテーブルでのみ使用できます。Struct内のFieldの名前と数は固定で、常にNullableです。 |
| [JSON](../sql-manual/basic-element/sql-data-types/semi-structured/JSON) | 可変長             | バイナリJSON型で、バイナリJSON形式で格納され、JSON関数を通じて内部JSONフィールドにアクセスします。デフォルトで最大1048576バイト（1MB）をサポートし、最大2147483643バイト（2GB）まで調整可能です。この制限はBE設定パラメータ'jsonb_type_length_soft_limit_bytes'を通じて変更できます。 |
| [VARIANT](../sql-manual/basic-element/sql-data-types/semi-structured/VARIANT) | 可変長             | VARIANT データ型は動的適応型で、JSONなどの半構造化データ専用に設計されています。任意のJSONオブジェクトを格納でき、ストレージ効率とクエリパフォーマンスの向上のためにJSONフィールドを自動的にサブカラムに分割します。長さ制限と設定方法はSTRING型と同じです。ただし、VARIANT型はvalue columnでのみ使用でき、key columnやpartition / bucket columnでは使用できません。 |

## [集約データ型](../sql-manual/basic-element/sql-data-types/data-type-overview#aggregation-types)

| 型名           | ストレージ（バイト） | 説明                                                         |
| -------------- | ------------------ | ------------------------------------------------------------ |
| [HLL](../sql-manual/basic-element/sql-data-types/aggregate/HLL) | 可変長             | HLLはHyperLogLogの略で、あいまい重複除去です。大規模なデータセットを扱う際にCount Distinctより優れたパフォーマンスを発揮します。HLLの誤差率は通常約1%で、時には2%に達することがあります。HLLはkey columnとして使用できず、テーブル作成時の集約タイプはHLL_UNIONです。ユーザーは長さやデフォルト値を指定する必要はありません。これはデータの集約レベルに基づいて内部的に制御されます。HLLカラムは、hll_union_agg、hll_raw_agg、hll_cardinality、hll_hashなどの関連関数を通じてのみクエリまたは使用できます。 |
| [BITMAP](../sql-manual/basic-element/sql-data-types/aggregate/BITMAP) | 可変長             | BITMAP型はAggregateテーブル、UniqueテーブルまたはDuplicateテーブルで使用できます。- UniqueテーブルまたはDuplicateテーブルで使用する場合、BITMAPは非キーカラムとして使用する必要があります。- Aggregateテーブルで使用する場合、BITMAPも非キーカラムとして使用する必要があり、テーブル作成時に集約タイプをBITMAP_UNIONに設定する必要があります。ユーザーは長さやデフォルト値を指定する必要はありません。これはデータの集約レベルに基づいて内部的に制御されます。BITMAPカラムは、bitmap_union_count、bitmap_union、bitmap_hash、bitmap_hash64などの関連関数を通じてのみクエリまたは使用できます。 |
| [QUANTILE_STATE](../sql-manual/basic-element/sql-data-types/aggregate/QUANTILE-STATE.md) | 可変長             | 近似分位値を計算するために使用される型です。ロード時、異なる値を持つ同じキーに対して事前集約を実行します。値の数が2048を超えない場合、すべてのデータを詳細に記録します。値の数が2048より大きい場合、TDigestアルゴリズムを使用してデータを集約（クラスタ化）し、クラスタ化後の重心点を保存します。QUANTILE_STATEはkey columnとして使用できず、テーブル作成時に集約タイプQUANTILE_UNIONと組み合わせる必要があります。ユーザーは長さやデフォルト値を指定する必要はありません。これはデータの集約レベルに基づいて内部的に制御されます。QUANTILE_STATEカラムは、QUANTILE_PERCENT、QUANTILE_UNION、TO_QUANTILE_STATEなどの関連関数を通じてのみクエリまたは使用できます。 |
| [AGG_STATE](../sql-manual/basic-element/sql-data-types/aggregate/AGG-STATE.md) | 可変長             | 集約関数はstate/merge/union関数コンビネータでのみ使用できます。AGG_STATEはkey columnとして使用できません。テーブル作成時、集約関数のシグネチャを併せて宣言する必要があります。ユーザーは長さやデフォルト値を指定する必要はありません。実際のデータストレージサイズは関数の実装に依存します。 |

## [IP型](../sql-manual/basic-element/sql-data-types/data-type-overview#ip-types)

| 型名                                                         | ストレージ（バイト） | 説明                                                         |
| ------------------------------------------------------------ | ------------------ | ------------------------------------------------------------ |
| [IPv4](../sql-manual/basic-element/sql-data-types/ip/IPV4) | 4                  | `ipv4_*`ファミリーの関数と組み合わせて使用されます。        |
| [IPv6](../sql-manual/basic-element/sql-data-types/ip/IPV6) | 16                 | `ipv6_*`ファミリーの関数と組み合わせて使用されます。        |

Dorisでサポートされているすべてのデータ型は、`SHOW DATA TYPES;`ステートメントでも確認できます。
