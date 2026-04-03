---
{
  "title": "データ型",
  "language": "ja",
  "description": "Apache DorisはMySQL ネットワーク接続プロトコルを使用して標準SQL構文をサポートし、MySQL構文プロトコルと高い互換性があります。したがって、"
}
---
Apache DorisはSQL標準構文をサポートし、MySQL Network Connection Protocolを使用して、MySQL構文プロトコルと高い互換性を持ちます。そのため、データ型のサポートに関して、Apache DorisはMySQL関連のデータ型と可能な限り整合性を保つように設計されています。

Dorisがサポートするデータ型一覧は以下の通りです：

## [数値データ型](../sql-manual/basic-element/sql-data-types/data-type-overview#numeric-types)  
  
| 型名                                                    | ストレージ (bytes) | 説明                                                  |  
| ---------------------------------------------------------- | --------------- | ------------------------------------------------------------ |  
| [BOOLEAN](../sql-manual/basic-element/sql-data-types/numeric/BOOLEAN)       | 1               | 2つの値のみを格納するブール型データ型：0はfalse、1はtrueを表します。 |  
| [TINYINT](../sql-manual/basic-element/sql-data-types/numeric/TINYINT)       | 1               | 整数値、符号付き範囲は-128から127です。                 |  
| [SMALLINT](../sql-manual/basic-element/sql-data-types/numeric/SMALLINT)     | 2               | 整数値、符号付き範囲は-32768から32767です。             |  
| [INT](../sql-manual/basic-element/sql-data-types/numeric/INT)               | 4               | 整数値、符号付き範囲は-2147483648から2147483647です。   |  
| [BIGINT](../sql-manual/basic-element/sql-data-types/numeric/BIGINT)         | 8               | 整数値、符号付き範囲は-9223372036854775808から9223372036854775807です。 |  
| [LARGEINT](../sql-manual/basic-element/sql-data-types/numeric/LARGEINT)     | 16              | 整数値、範囲は[-2^127 + 1から2^127 - 1]です。               |  
| [FLOAT](../sql-manual/basic-element/sql-data-types/numeric/FLOATING-POINT)           | 4               | 単精度浮動小数点数、範囲は[-3.4 * 10^38から3.4 * 10^38]です。 |  
| [DOUBLE](../sql-manual/basic-element/sql-data-types/numeric/FLOATING-POINT)         | 8               | 倍精度浮動小数点数、範囲は[-1.79 * 10^308から1.79 * 10^308]です。 |  
| [DECIMAL](../sql-manual/basic-element/sql-data-types/numeric/DECIMAL)       | 4/8/16/32          | 精度（総桁数）とスケール（小数点以下の桁数）で定義される正確な固定小数点数。形式：DECIMAL(P[,S])、ここでPは精度、Sはスケールです。Pの範囲は[1, MAX_P]、MAX_Pは`enable_decimal256`=falseの場合38、`enable_decimal256`=trueの場合76、Sの範囲は[0, P]です。<br>`enable_decimal256`のデフォルト値はfalseです。trueに設定するとより正確な結果を得られますが、パフォーマンスが低下します。<br>ストレージ要件：<ul><li>0 < precision <= 9の場合4バイト</li><li>9 < precision <= 18の場合8バイト</li><li>18 < precision <= 38の場合16バイト</li><li>38 < precision <= 76の場合32バイト</li></ul> |

## [日時データ型](../sql-manual/basic-element/sql-data-types/data-type-overview#date-types)

| 型名      | ストレージ (bytes)| 説明                                                  |
| -------------- | --------------- | ------------------------------------------------------------ |
|  [DATE](../sql-manual/basic-element/sql-data-types/date-time/DATE)             | 4              | DATEは暦年、月、日の値を保持し、サポート範囲は['0000-01-01', '9999-12-31']です。デフォルト印刷形式：'yyyy-MM-dd'。 |
| [DATETIME](../sql-manual/basic-element/sql-data-types/date-time/DATETIME)        | 8              | DATEとTIMEの組み合わせ。形式：DATETIME ([P])。オプションパラメータPは時刻精度を表し、値の範囲は[0,6]で、最大6桁の小数点（マイクロ秒）をサポートします。設定されていない場合は0です。サポート範囲は['0000-01-01 00:00:00 [.000000]', '9999-12-31 23:59:59 [.999999]']です。デフォルト印刷形式：'yyyy-MM-dd HH:mm:ss.SSSSSS'。 |

## [文字列データ型](../sql-manual/basic-element/sql-data-types/data-type-overview#string-types)
| 型名      | ストレージ (bytes)| 説明                                                  |
| -------------- | --------------- | ------------------------------------------------------------ |
| [CHAR](../sql-manual/basic-element/sql-data-types/string-type/CHAR)            | M               | 固定長文字列。パラメータMは文字でのカラム長を指定します。Mの範囲は1から255です。 |
| [VARCHAR](../sql-manual/basic-element/sql-data-types/string-type/VARCHAR)         | 可変長 | 可変長文字列。パラメータMは文字での最大文字列長を指定します。Mの範囲は1から65533です。可変長文字列はUTF-8エンコーディングで格納されます。英字は1バイト、中国語文字は3バイトを占めます。 |
| [STRING](../sql-manual/basic-element/sql-data-types/string-type/STRING)          | 可変長 | 可変長文字列。デフォルトで1048576バイト（1 MB）をサポートし、最大2147483643バイト（2 GB）まで制限できます。サイズはBEのstring_type_length_soft_limit_bytesで調整可能です。STRING型はvalue列でのみ使用可能で、key列やpartition bucket列では使用できません。 |

## [半構造化データ型](../sql-manual/basic-element/sql-data-types/data-type-overview#semi-structured-types)

| 型名      | ストレージ (bytes)| 説明                                                  |
| -------------- | --------------- | ------------------------------------------------------------ |
| [ARRAY](../sql-manual/basic-element/sql-data-types/semi-structured/ARRAY)          | 可変長 | 型Tの要素で構成される配列。key列として使用できません。現在、DuplicateおよびUniqueモデルのテーブルでの使用がサポートされています。 |
| [MAP](../sql-manual/basic-element/sql-data-types/semi-structured/MAP)            | 可変長 | 型KとVの要素で構成されるマップ。Key列として使用できません。現在、DuplicateおよびUniqueモデルのテーブルでサポートされています。 |
| [STRUCT](../sql-manual/basic-element/sql-data-types/semi-structured/STRUCT)         | 可変長 | 複数のFieldで構成される構造体。複数の列のコレクションとしても理解できます。Keyとして使用できません。現在、STRUCTはDuplicateモデルのテーブルでのみ使用可能です。Struct内のFieldの名前と数は固定で、常にNullableです。|
| [JSON](../sql-manual/basic-element/sql-data-types/semi-structured/JSON)           | 可変長 | バイナリJSON型。バイナリJSON形式で格納され、JSON関数を通じて内部JSONフィールドにアクセスします。デフォルトで最大1048576バイト（1MB）をサポートし、最大2147483643バイト（2GB）まで調整可能です。この制限はBE設定パラメータ'jsonb_type_length_soft_limit_bytes'で変更できます。 |
| [VARIANT](../sql-manual/basic-element/sql-data-types/semi-structured/VARIANT)        | 可変長 | VARIANT データ型は動的に適応可能で、JSONのような半構造化データ用に特別に設計されています。任意のJSONオブジェクトを格納でき、ストレージ効率とクエリパフォーマンスの向上のためにJSONフィールドを自動的にサブカラムに分割します。長さ制限と設定方法はSTRING型と同じです。ただし、VARIANT型はvalue列でのみ使用可能で、key列やpartition/bucket列では使用できません。 |

## [集計データ型](../sql-manual/basic-element/sql-data-types/data-type-overview#aggregation-types)

| 型名      | ストレージ (bytes)| 説明                                                  |
| -------------- | --------------- | ------------------------------------------------------------ |
| [HLL](../sql-manual/basic-element/sql-data-types/aggregate/HLL)            | 可変長 | HLLはHyperLogLogの略で、あいまい重複排除です。大規模データセットを扱う際、Count Distinctよりも優れたパフォーマンスを発揮します。HLLのエラー率は通常約1%で、時には2%に達することがあります。HLLはkey列として使用できず、テーブル作成時の集計タイプはHLL_UNIONです。ユーザーは長さやデフォルト値を指定する必要はなく、データの集計レベルに基づいて内部的に制御されます。HLL列はhll_union_agg、hll_raw_agg、hll_cardinality、hll_hashなどの付属関数を通じてのみクエリまたは使用できます。 |
| [BITMAP](../sql-manual/basic-element/sql-data-types/aggregate/BITMAP)         | 可変長 | BITMAP型はAggregateテーブル、Uniqueテーブル、またはDuplicateテーブルで使用できます。- UniqueテーブルまたはDuplicateテーブルで使用する場合、BITMAPは非key列として使用する必要があります。- Aggregateテーブルで使用する場合、BITMAPも非key列として機能し、テーブル作成時に集計タイプをBITMAP_UNIONに設定する必要があります。ユーザーは長さやデフォルト値を指定する必要はなく、データの集計レベルに基づいて内部的に制御されます。BITMAP列はbitmap_union_count、bitmap_union、bitmap_hash、bitmap_hash64などの付属関数を通じてのみクエリまたは使用できます。 |
| [QUANTILE_STATE](../sql-manual/basic-element/sql-data-types/aggregate/QUANTILE-STATE.md) | 可変長 | 近似分位値の計算に使用される型です。読み込み時に、同じキーで異なる値に対して事前集計を実行します。値の数が2048を超えない場合、すべてのデータを詳細に記録します。値の数が2048を超える場合、TDigestアルゴリズムを使用してデータを集計（クラスタ化）し、クラスタ化後の重心点を格納します。QUANTILE_STATEはkey列として使用できず、テーブル作成時に集計タイプQUANTILE_UNIONと組み合わせる必要があります。ユーザーは長さやデフォルト値を指定する必要はなく、データの集計レベルに基づいて内部的に制御されます。QUANTILE_STATE列はQUANTILE_PERCENT、QUANTILE_UNION、TO_QUANTILE_STATEなどの付属関数を通じてのみクエリまたは使用できます。 |
| [AGG_STATE](../sql-manual/basic-element/sql-data-types/aggregate/AGG-STATE)       | 可変長 | 集計関数はstate/merge/union関数コンバイナーでのみ使用できます。AGG_STATEはkey列として使用できません。テーブル作成時に、集計関数のシグネチャを宣言する必要があります。ユーザーは長さやデフォルト値を指定する必要はありません。実際のデータストレージサイズは関数の実装によって異なります。 |

## [IP型](../sql-manual/basic-element/sql-data-types/data-type-overview#ip-types)

| 型名                                                    | ストレージ (bytes) | 説明                                                  |  
| ---------------------------------------------------------- | --------------- | ------------------------------------------------------------ |  
| [IPv4](../sql-manual/basic-element/sql-data-types/ip/IPV4)                 | 4               | `ipv4_*`系列の関数と組み合わせて使用されます。 |  
| [IPv6](../sql-manual/basic-element/sql-data-types/ip/IPV6)                 | 16              | `ipv6_*`系列の関数と組み合わせて使用されます。 |

`SHOW DATA TYPES;`文でDorisがサポートするすべてのデータ型を表示することもできます。
