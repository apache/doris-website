---
{
  "title": "データ型",
  "language": "ja",
  "description": "Apache DorisはMySQL Networkコネクションプロトコルを使用した標準SQL構文をサポートし、MySQL構文プロトコルと高い互換性を持っています。したがって、"
}
---
Apache DorisはStandard SQL構文をサポートし、MySQL Network Connection Protocolを使用し、MySQL構文プロトコルとの高い互換性を持ちます。そのため、データ型サポートの観点から、Apache DorisはMySQLの関連データ型と可能な限り密接に整合しています。

Dorisがサポートするデータ型のリストは以下の通りです：

## [数値データ型](../sql-manual/basic-element/sql-data-types/data-type-overview#numeric-types)  
  
| タイプ Name                                                    | Storage (bytes) | 詳細                                                  |  
| ---------------------------------------------------------- | --------------- | ------------------------------------------------------------ |  
| [BOOLEAN](../sql-manual/basic-element/sql-data-types/numeric/BOOLEAN)       | 1               | 2つの値のみを格納するBooleanデータ型：0はfalseを表し、1はtrueを表します。 |  
| [TINYINT](../sql-manual/basic-element/sql-data-types/numeric/TINYINT)       | 1               | 整数値、符号付き範囲は-128から127です。                 |  
| [SMALLINT](../sql-manual/basic-element/sql-data-types/numeric/SMALLINT)     | 2               | 整数値、符号付き範囲は-32768から32767です。             |  
| [INT](../sql-manual/basic-element/sql-data-types/numeric/INT)               | 4               | 整数値、符号付き範囲は-2147483648から2147483647です。   |  
| [BIGINT](../sql-manual/basic-element/sql-data-types/numeric/BIGINT)         | 8               | 整数値、符号付き範囲は-9223372036854775808から9223372036854775807です。 |  
| [LARGEINT](../sql-manual/basic-element/sql-data-types/numeric/LARGEINT)     | 16              | 整数値、範囲は[-2^127 + 1から2^127 - 1]です。               |  
| [FLOAT](../sql-manual/basic-element/sql-data-types/numeric/FLOAT)           | 4               | 単精度浮動小数点数、範囲は[-3.4 * 10^38から3.4 * 10^38]です。 |  
| [DOUBLE](../sql-manual/basic-element/sql-data-types/numeric/DOUBLE)         | 8               | 倍精度浮動小数点数、範囲は[-1.79 * 10^308から1.79 * 10^308]です。 |  
| [DECIMAL](../sql-manual/basic-element/sql-data-types/numeric/DECIMAL)       | 4/8/16/32          | 精度（総桁数）とスケール（小数点以下の桁数）で定義される正確な固定小数点数です。形式：DECIMAL(P[,S])、PはPrecision、SはScaleです。Pの範囲は[1, MAX_P]で、`enable_decimal256`=falseの場合MAX_P=38、`enable_decimal256`=trueの場合MAX_P=76、Sの範囲は[0, P]です。<br>`enable_decimal256`のデフォルト値はfalseです。これをtrueに設定するとより正確な結果を得られますが、パフォーマンスの低下を招きます。<br>ストレージ要件：<ul><li>0 < precision <= 9の場合4バイト。</li><li>9 < precision <= 18の場合8バイト。<li>18 < precision <= 38の場合16バイト。<li>38 < precision <= 76の場合32バイト。</ul> |

## [日時データ型](../sql-manual/basic-element/sql-data-types/data-type-overview#date-types)

| タイプ name      | Storeage (bytes)| 詳細                                                  |
| -------------- | --------------- | ------------------------------------------------------------ |
|  [DATE](../sql-manual/basic-element/sql-data-types/date-time/DATE)             | 4              | DATEは暦年、月、日の値を保持し、サポート範囲は['0000-01-01', '9999-12-31']です。デフォルトの印刷形式：'yyyy-MM-dd'。 |
| [DATETIME](../sql-manual/basic-element/sql-data-types/date-time/DATETIME)        | 8              | DATEとTIMEの組み合わせ　形式：DATETIME ([P])。　オプションパラメータPは時間精度を表し、値の範囲は[0,6]で、最大6桁の小数（マイクロ秒）をサポートします。設定しない場合は0です。　サポート範囲は['0000-01-01 00:00:00 [.000000]', '9999-12-31 23:59:59 [.999999]']です。　デフォルトの印刷形式：'yyy-MM-dd HH: mm: ss. SSSSSS '。 |

## [文字列データ型](../sql-manual/basic-element/sql-data-types/data-type-overview#string-types)
| タイプ name      | Storeage (bytes)| 詳細                                                  |
| -------------- | --------------- | ------------------------------------------------------------ |
| [CHAR](../sql-manual/basic-element/sql-data-types/string-type/CHAR)            | M               | 固定長文字列、パラメータMは文字単位での列長を指定します。Mの範囲は1から255です。 |
| [VARCHAR](../sql-manual/basic-element/sql-data-types/string-type/VARCHAR)         | Variable Length | 可変長文字列、パラメータMは文字単位での最大文字列長を指定します。Mの範囲は1から65533です。　可変長文字列はUTF-8エンコーディングで格納されます。英文字は1バイト、中国語文字は3バイトを占有します。 |
| [STRING](../sql-manual/basic-element/sql-data-types/string-type/STRING)          | Variable Length | 可変長文字列、デフォルトで1048576バイト（1MB）をサポートし、最大精度2147483643バイト（2GB）まで制限されます。　サイズはstring_type_length_soft_limit_bytesでBEを通じて設定可能です。　String型はvalue列でのみ使用でき、key列やpartition bucket列では使用できません。 |

## [半構造化データ型](../sql-manual/basic-element/sql-data-types/data-type-overview#semi-structured-types)

| タイプ name      | Storeage (bytes)| 詳細                                                  |
| -------------- | --------------- | ------------------------------------------------------------ |
| [ARRAY](../sql-manual/basic-element/sql-data-types/semi-structured/ARRAY)          | Variable Length | 型Tの要素で構成された配列で、key列として使用できません。現在、DuplicateおよびUniqueモデルのテーブルでの使用がサポートされています。 |
| [MAP](../sql-manual/basic-element/sql-data-types/semi-structured/MAP)            | Variable Length | 型Kと型Vの要素で構成されたマップで、Key列として使用できません。これらのマップは現在、DuplicateおよびUniqueモデルを使用するテーブルでサポートされています。 |
| [STRUCT](../sql-manual/basic-element/sql-data-types/semi-structured/STRUCT)         | Variable Length | 複数のFieldで構成された構造体で、複数列のコレクションとしても理解できます。Keyとして使用できません。現在、STRUCTはDuplicateモデルのテーブルでのみ使用できます。Struct内のFieldの名前と数は固定で、常にNullableです。|
| [JSON](../sql-manual/basic-element/sql-data-types/semi-structured/JSON)           | Variable Length | バイナリJSON型、バイナリJSON形式で格納され、JSON関数を通じて内部JSONフィールドにアクセスします。　デフォルトで最大1048576バイト（1MB）をサポートし、最大2147483643バイト（2GB）まで調整可能です。この制限はBE設定パラメータ'jsonb_type_length_soft_limit_bytes'で変更できます。 |
| [VARIANT](../sql-manual/basic-element/sql-data-types/semi-structured/VARIANT)        | Variable Length | VARIANTデータ型は動的に適応可能で、JSONなどの半構造化データ向けに特別に設計されています。任意のJSONオブジェクトを格納でき、ストレージ効率とクエリパフォーマンスを向上させるためにJSONフィールドを自動的にサブ列に分割します。長さ制限と設定方法はSTRING型と同じです。ただし、VARIANT型はvalue列でのみ使用でき、key列やpartition / bucket列では使用できません。 |

## [集約データ型](../sql-manual/basic-element/sql-data-types/data-type-overview#aggregation-types)

| タイプ name      | Storeage (bytes)| 詳細                                                  |
| -------------- | --------------- | ------------------------------------------------------------ |
| [HLL](../sql-manual/basic-element/sql-data-types/aggregate/HLL)            | Variable Length | HLLはHyperLogLogの略で、ファジー重複除去です。大規模データセットを扱う際、Count Distinctより優れたパフォーマンスを発揮します。　HLLのエラー率は通常約1%で、時には2%に達することもあります。HLLはkey列として使用できず、テーブル作成時の集約タイプはHLL_UNIONです。　データの集約レベルに基づいて内部で制御されるため、ユーザーは長さやデフォルト値を指定する必要がありません。　HLL列は、hll_union_agg、hll_raw_agg、hll_cardinality、hll_hashなどの付随関数を通じてのみクエリまたは使用できます。 |
| [BITMAP](../sql-manual/basic-element/sql-data-types/aggregate/BITMAP)         | Variable Length | BITMAP型はAggregateテーブル、UniqueテーブルまたはDuplicateテーブルで使用できます。- UniqueテーブルまたはDuplicateテーブルで使用する場合、BITMAPは非key列として使用する必要があります。- Aggregateテーブルで使用する場合、BITMAPも非key列として機能し、テーブル作成時に集約タイプをBITMAP_UNIONに設定する必要があります。　データの集約レベルに基づいて内部で制御されるため、ユーザーは長さやデフォルト値を指定する必要がありません。BITMAP列は、bitmap_union_count、bitmap_union、bitmap_hash、bitmap_hash64などの付随関数を通じてのみクエリまたは使用できます。 |
| [QUANTILE_STATE](../sql-manual/basic-element/sql-data-types/aggregate/QUANTILE-STATE.md) | Variable Length | 近似分位値を計算するために使用される型です。　読み込み時に、異なる値を持つ同じキーに対して事前集約を実行します。値の数が2048を超えない場合、すべてのデータを詳細に記録します。値の数が2048より大きい場合、TDigestアルゴリズムを使用してデータを集約（クラスタ化）し、クラスタ化後の重心点を格納します。　QUANTILE_STATEはkey列として使用できず、テーブル作成時に集約タイプQUANTILE_UNIONと組み合わせる必要があります。データの集約レベルに基づいて内部で制御されるため、ユーザーは長さやデフォルト値を指定する必要がありません。　QUANTILE_STATE列は、QUANTILE_PERCENT、QUANTILE_UNION、TO_QUANTILE_STATEなどの付随関数を通じてのみクエリまたは使用できます。 |
| [AGG_STATE](../sql-manual/basic-element/sql-data-types/aggregate/AGG-STATE.md)       | Variable Length | 集約関数はstate/merge/union関数結合器でのみ使用できます。　AGG_STATEはkey列として使用できません。テーブル作成時に、集約関数のシグネチャを併せて宣言する必要があります。　ユーザーは長さやデフォルト値を指定する必要がありません。実際のデータストレージサイズは関数の実装に依存します。 |

## [IP型](../sql-manual/basic-element/sql-data-types/data-type-overview#ip-types)

| タイプ Name                                                    | Storage (bytes) | 詳細                                                  |  
| ---------------------------------------------------------- | --------------- | ------------------------------------------------------------ |  
| [IPv4](../sql-manual/basic-element/sql-data-types/ip/IPV4)                 | 4               | `ipv4_*`関数ファミリーと組み合わせて使用されます。 |  
| [IPv6](../sql-manual/basic-element/sql-data-types/ip/IPV6)                 | 16              | `ipv6_*`関数ファミリーと組み合わせて使用されます。 |

`SHOW DATA TYPES;`ステートメントでDorisがサポートするすべてのデータ型を確認することもできます。
