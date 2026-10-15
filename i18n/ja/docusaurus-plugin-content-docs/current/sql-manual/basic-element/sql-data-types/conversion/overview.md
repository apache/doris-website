---
{
    "title": "型変換",
    "language": "ja",
    "description": "Doris では各式に型があります。例えば、式 select 1, col1, fromunixtime(col2) from table1 に含まれる 1、col1、fromunixtime(col2) はそれぞれ型を持ちます。"
}
---

Doris では各式に型があります。例えば、`1`、`col1`、`from_unixtime(col2)` は、式 `select 1, col1, from_unixtime(col2) from table1` に含まれ、それぞれ型を持ちます。式の型を別の型に変える処理を「型変換」と呼びます。

型変換には、明示的な変換と暗黙的な変換の二種類があります。

すべての型変換にはそれぞれ規則があります。関連する規則は変換の**変換先の型**ごとに説明します。例えば、`INT` から `DOUBLE` への変換と `STRING` から `DOUBLE` への変換は、どちらも [FLOAT/DOUBLE への変換](./float-double-conversion) で説明しています。

変換が可能かどうか、および結果が Nullable 型になるかどうかは、厳格モード（セッション変数 `enable_strict_cast`）の有効・無効によって異なります。通常、厳格モードが有効な場合、変換に失敗したデータは直ちにエラーとなり、SQL の実行は失敗します。厳格モードが無効な場合、変換に失敗したデータ行の結果は `NULL` になります。

解析と移行の規則については、[UUID の変換](./uuid-conversion.md) を参照してください。文字列は UUID に CAST でき、UUID は文字列または VARIANT に CAST できます。ただし、UUID を数値型、日付・時刻型、IP 型に直接 CAST することはできません。

## 明示的な変換

明示的な変換には `CAST` 関数を使用します。例：

`CAST(1.23 as INT)` は、数値 1.23 を INT 型に変換します。

`CAST(colA as DATETIME(6))` は、列または式 colA を DATETIME(6) 型（マイクロ秒精度の DATETIME 型）に変換します。

以下では、厳格モード（`enable_strict_cast = true`）と非厳格モード（`enable_strict_cast = false`）での型間の変換関係を、次の四種類の記号で示します。

|記号|意味|
|-|-|
|x|変換不可|
|P|入力引数がすでに Nullable 型の場合にのみ、戻り値の型が Nullable になります。つまり、この変換で NULL 以外の値が NULL に変わることは**ありません**|
|A|戻り値の型は常に Nullable です。この変換では **NULL 以外の値が NULL に変わる場合があります**|
|O|入力型から出力型への変換で**オーバーフローが発生する可能性がある**場合、戻り値の型は Nullable になります。NULL 以外の入力値で実際にオーバーフローが発生した場合、変換結果が NULL になることがあります|

型変換の具体的な規則と Nullable の性質については、このディレクトリにある各型変換のドキュメントを参照してください。

### 厳格モード

| **変換元**\\**変換先** | bool | tinyint | smallint | int | bigint | largeint | float | double | decimal | date | datetime | timestamp_ns | time | IPv4 | IPv6 | char | varchar | string | bitmap | hll | json | array | map | struct | variant | UUID |
| ---------------- | ---- | ------- | -------- | --- | ------ | -------- | ----- | ------ | ------- | ---- | -------- | ------------ | ---- | ---- | ---- | ---- | ------- | ------ | ------ | --- | ---- | ----- | --- | ------ | ------- | ---- |
| bool             | P    | P       | P        | P   | P      | P        | P     | P      | O       | x    | x        | x            | x    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         | x |
| tinyint          | P    | P       | P        | P   | P      | P        | P     | P      | O       | A    | A        | A            | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         | x |
| smallint         | P    | A       | P        | P   | P      | P        | P     | P      | O       | A    | A        | A            | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         | x |
| int              | P    | A       | A        | P   | P      | P        | P     | P      | O       | A    | A        | A            | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         | x |
| bigint           | P    | A       | A        | A   | P      | P        | P     | P      | O       | A    | A        | A            | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         | x |
| largeint         | P    | A       | A        | A   | A      | P        | P     | P      | O       | A    | A        | A            | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         | x |
| float            | P    | A       | A        | A   | A      | A        | P     | P      | A       | A    | A        | A            | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         | x |
| double           | P    | A       | A        | A   | A      | A        | P     | P      | A       | A    | A        | A            | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         | x |
| decimal          | P    | O       | O        | O   | O      | O        | P     | P      | O       | A    | A        | A            | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         | x |
| date             | x    | x       | x        | P   | P      | P        | x     | x      | x       | P    | P        | A            | x    | x    | x    |      |         |        | x      | x   | x    | x     | x   | x      |         | x |
| datetime         | x    | x       | x        | x   | P      | P        | x     | x      | x       | P    | A        | A            | P    | x    | x    |      |         |        | x      | x   | x    | x     | x   | x      |         | x |
| timestamp_ns     | x    | x       | x        | x   | P      | P        | x     | x      | x       | P    | P        | P            | P    | x    | x    | P    | P       | P      | x      | x   | x    | x     | x   | x      | P       | x |
| time             | x    | A       | A        | A   | P      | P        | x     | x      | x       | P    | P        | P            | A    | x    | x    |      |         |        | x      | x   | x    | x     | x   | x      |         | x |
| IPv4             | x    | x       | x        | x   | x      | x        | x     | x      | x       | x    | x        | x            | x    | P    | P    |      |         |        | x      | x   | x    | x     | x   | x      |         | x |
| IPv6             | x    | x       | x        | x   | x      | x        | x     | x      | x       | x    | x        | x            | x    | x    | P    |      |         |        | x      | x   | x    | x     | x   | x      |         | x |
| char             | A    | A       | A        | A   | A      | A        | A     | A      | A       | A    | A        | A            | A    | A    | A    |      |         |        | x      | x   | A    | A     | A   | A      |         | A |
| varchar          | A    | A       | A        | A   | A      | A        | A     | A      | A       | A    | A        | A            | A    | A    | A    |      |         |        | x      | x   | A    | A     | A   | A      |         | A |
| string           | A    | A       | A        | A   | A      | A        | A     | A      | A       | A    | A        | A            | A    | A    | A    |      |         |        | x      | x   | A    | A     | A   | A      |         | A |
| bitmap           | x    | x       | x        | x   | x      | x        | x     | x      | x       | x    | x        | x            | x    | x    | x    | x    | x       | x      | P      | x   | x    | x     | x   | x      |         | x |
| hll              | x    | x       | x        | x   | x      | x        | x     | x      | x       | x    | x        | x            | x    | x    | x    | x    | x       | x      | x      | P   | x    | x     | x   | x      |         | x |
| json             | A    | A       | A        | A   | A      | A        | A     | A      | A       | x    | x        | x            | x    | x    | x    | A    | A       | A      | x      | x   | P    | A     | x   | A      |         | x |
| array            | x    | x       | x        | x   | x      | x        | x     | x      | x       | x    | x        | x            | x    | x    | x    |      |         |        | x      | x   | P    | P     | x   | x      |         | x |
| map              | x    | x       | x        | x   | x      | x        | x     | x      | x       | x    | x        | x            | x    | x    | x    |      |         |        | x      | x   | x    | x     | P   | x      |         | x |
| struct           | x    | x       | x        | x   | x      | x        | x     | x      | x       | x    | x        | x            | x    | x    | x    |      |         |        | x      | x   | P    | x     | x   | P      |         | x |
| variant          |      |         |          |     |        |          |       |        |         |      |          | A            |      |      |      |      |         |        |        |     |      |       |     |        |         | A |
| UUID | x | x | x | x | x | x | x | x | x | x | x | x | x | x | x | P | P | P | x | x | x | x | x | x | P | P |

### 非厳格モード

| **変換元**\\**変換先** | bool | tinyint | smallint | int | bigint | largeint | float | double | decimal | date | datetime | timestamp_ns | time | IPv4 | IPv6 | char | varchar | string | bitmap | hll | json | array | map | struct | variant | UUID |
| ---------------- | ---- | ------- | -------- | --- | ------ | -------- | ----- | ------ | ------- | ---- | -------- | ------------ | ---- | ---- | ---- | ---- | ------- | ------ | ------ | --- | ---- | ----- | --- | ------ | ------- | ---- |
| bool             | P    | P       | P        | P   | P      | P        | P     | P      | O       | x    | x        | x            | x    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         | x |
| tinyint          | P    | P       | P        | P   | P      | P        | P     | P      | O       | A    | A        | A            | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         | x |
| smallint         | P    | A       | P        | P   | P      | P        | P     | P      | O       | A    | A        | A            | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         | x |
| int              | P    | A       | A        | P   | P      | P        | P     | P      | O       | A    | A        | A            | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         | x |
| bigint           | P    | A       | A        | A   | P      | P        | P     | P      | O       | A    | A        | A            | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         | x |
| largeint         | P    | A       | A        | A   | A      | P        | P     | P      | O       | A    | A        | A            | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         | x |
| float            | P    | A       | A        | A   | A      | A        | P     | P      | A       | A    | A        | A            | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         | x |
| double           | P    | A       | A        | A   | A      | A        | P     | P      | A       | A    | A        | A            | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         | x |
| decimal          | P    | O       | O        | O   | O      | O        | P     | P      | O       | A    | A        | A            | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         | x |
| date             | x    | x       | x        | P   | P      | P        | P     | P      | x       | P    | P        | A            | x    | x    | x    |      |         |        | x      | x   | x    | x     | x   | x      |         | x |
| datetime         | x    | x       | x        | x   | P      | P        | P     | P      | x       | P    | A        | A            | P    | x    | x    |      |         |        | x      | x   | x    | x     | x   | x      |         | x |
| timestamp_ns     | x    | x       | x        | x   | P      | P        | P     | P      | x       | P    | P        | P            | P    | x    | x    | P    | P       | P      | x      | x   | x    | x     | x   | x      | P       | x |
| time             | x    | A       | A        | A   | P      | P        | P     | P      | x       | P    | P        | P            | A    | x    | x    |      |         |        | x      | x   | x    | x     | x   | x      |         | x |
| IPv4             | x    | x       | x        | x   | x      | x        | x     | x      | x       | x    | x        | x            | x    | P    | P    |      |         |        | x      | x   | x    | x     | x   | x      |         | x |
| IPv6             | x    | x       | x        | x   | x      | x        | x     | x      | x       | x    | x        | x            | x    | x    | P    |      |         |        | x      | x   | x    | x     | x   | x      |         | x |
| char             | A    | A       | A        | A   | A      | A        | A     | A      | A       | A    | A        | A            | A    | A    | A    |      |         |        | x      | x   | A    | A     | A   | A      |         | A |
| varchar          | A    | A       | A        | A   | A      | A        | A     | A      | A       | A    | A        | A            | A    | A    | A    |      |         |        | x      | x   | A    | A     | A   | A      |         | A |
| string           | A    | A       | A        | A   | A      | A        | A     | A      | A       | A    | A        | A            | A    | A    | A    |      |         |        | x      | x   | A    | A     | A   | A      |         | A |
| bitmap           | x    | x       | x        | x   | x      | x        | x     | x      | x       | x    | x        | x            | x    | x    | x    | x    | x       | x      | P      | x   | x    | x     | x   | x      |         | x |
| hll              | x    | x       | x        | x   | x      | x        | x     | x      | x       | x    | x        | x            | x    | x    | x    | x    | x       | x      | x      | P   | x    | x     | x   | x      |         | x |
| json             | A    | A       | A        | A   | A      | A        | A     | A      | A       | x    | x        | x            | x    | x    | x    | A    | A       | A      | x      | x   | P    | A     | x   | A      |         | x |
| array            | x    | x       | x        | x   | x      | x        | x     | x      | x       | x    | x        | x            | x    | x    | x    |      |         |        | x      | x   | P    | P     | x   | x      |         | x |
| map              | x    | x       | x        | x   | x      | x        | x     | x      | x       | x    | x        | x            | x    | x    | x    |      |         |        | x      | x   | x    | x     | P   | x      |         | x |
| struct           | x    | x       | x        | x   | x      | x        | x     | x      | x       | x    | x        | x            | x    | x    | x    |      |         |        | x      | x   | P    | x     | x   | P      |         | x |
| variant          |      |         |          |     |        |          |       |        |         |      |          | A            |      |      |      |      |         |        |        |     |      |       |     |        |         | A |
| UUID | x | x | x | x | x | x | x | x | x | x | x | x | x | x | x | P | P | P | x | x | x | x | x | x | P | P |

`TIMESTAMP_NS` の変換規則の詳細は、[TIMESTAMP_NS への CAST](./timestamp-ns-conversion.md) を参照してください。`TIMESTAMPTZ` は上記の表に含まれていません。`TIMESTAMP_NS` と `TIMESTAMPTZ` の間の変換は、厳格モードと非厳格モードの両方でサポートされています。

## 暗黙的な変換

暗黙的な変換は、入力 SQL に明示されていなくても Doris が CAST 式を自動的に計画する場合に発生します。主な例は次のとおりです。

1. 関数呼び出し時に、実引数の型が関数シグネチャの型と一致しない場合。

2. 数学的な式の両辺の型が一致しない場合。

など。

### 変換マトリックス

TODO

### 共通型

算術演算で使用するオペランドに暗黙的な変換が必要な場合、まず共通型を決定します。両辺のオペランドの型が共通型と一致しない場合は、それぞれを共通型に変換する CAST 式が計画されます。

比較、CASE、COALESCE、または集合演算で文字列と UUID に共通型が必要な場合、その共通型は UUID となり、文字列は UUID のテキストとして解析されます。無効な文字列には CAST の規則が適用されます。UUID は数値演算の共通型の推論には使用されません。
