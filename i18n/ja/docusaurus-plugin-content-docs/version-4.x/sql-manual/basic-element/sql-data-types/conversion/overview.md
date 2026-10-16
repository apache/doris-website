---
{
    "title": "型変換",
    "language": "ja",
    "description": "Doris では、式 select 1, col1, fromunixtime(col2) from table1 に含まれる 1、col1、fromunixtime(col2) のように、各式には型があります。"
}
---

Doris では、`1`、`col1`、`from_unixtime(col2)` のように、式 `select 1, col1, from_unixtime(col2) from table1` に含まれる各式には型があります。式をある型から別の型に変換する処理を「型変換」と呼びます。

型変換には、明示的な変換と暗黙的な変換の二種類があります。

すべての型変換には一定の規則があります。ここでは、**変換先の型** に基づいて規則を説明します。たとえば、`INT` から `DOUBLE` への変換と `STRING` から `DOUBLE` への変換は、どちらも [FLOAT/DOUBLE への変換](./float-double-conversion) で説明しています。

変換が可能かどうか、および結果の型が Nullable になるかどうかは、厳格モード（セッション変数 `enable_strict_cast`）が有効かどうかによって異なります。通常、厳格モードが有効な場合、変換に失敗したデータは直ちにエラーとなり、SQL の実行が失敗します。厳格モードが無効な場合、変換に失敗したデータ行の結果は `NULL` になります。

## 明示的な変換

明示的な変換には `CAST` 関数を使います。例：

`CAST(1.23 as INT)` は数値 1.23 を INT 型に変換します。

`CAST(colA as DATETIME(6))` は列または式 colA を DATETIME(6) 型（マイクロ秒精度の DATETIME 型）に変換します。

次に、厳格モード（`enable_strict_cast = true`）と非厳格モード（`enable_strict_cast = false`）における型間の変換関係を示します。表では、次の四つの記号を使います。

|記号|意味|
|-|-|
|x|変換できません|
|P|入力引数がすでに Nullable 型の場合に限り、戻り値の型は Nullable になります。つまり、この変換で **非 NULL 値が NULL に変わることはありません**|
|A|戻り値の型は常に Nullable です。この変換では **非 NULL 値が NULL に変わる可能性があります**|
|O|入力型から出力型への変換で **オーバーフローが発生する可能性がある** 場合、戻り値の型は Nullable です。非 NULL の入力値を変換する際に実際にオーバーフローが発生すると、結果が NULL になる可能性があります|

個々の型変換規則と Nullable の特性については、このディレクトリ内の型変換ドキュメントを参照してください。

### 厳格モード

| **From**\\**To** | bool | tinyint | smallint | int | bigint | largeint | float | double | decimal | date | datetime | time | IPv4 | IPv6 | char | varchar | string | bitmap | hll | json | array | map | struct | variant |
| ---------------- | ---- | ------- | -------- | --- | ------ | -------- | ----- | ------ | ------- | ---- | -------- | ---- | ---- | ---- | ---- | ------- | ------ | ------ | --- | ---- | ----- | --- | ------ | ------- |
| bool             | P    | P       | P        | P   | P      | P        | P     | P      | O       | x    | x        | x    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         |
| tinyint          | P    | P       | P        | P   | P      | P        | P     | P      | O       | A    | A        | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         |
| smallint         | P    | A       | P        | P   | P      | P        | P     | P      | O       | A    | A        | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         |
| int              | P    | A       | A        | P   | P      | P        | P     | P      | O       | A    | A        | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         |
| bigint           | P    | A       | A        | A   | P      | P        | P     | P      | O       | A    | A        | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         |
| largeint         | P    | A       | A        | A   | A      | P        | P     | P      | O       | A    | A        | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         |
| float            | P    | A       | A        | A   | A      | A        | P     | P      | A       | A    | A        | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         |
| double           | P    | A       | A        | A   | A      | A        | P     | P      | A       | A    | A        | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         |
| decimal          | P    | O       | O        | O   | O      | O        | P     | P      | O       | A    | A        | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         |
| date             | x    | x       | x        | P   | P      | P        | x     | x      | x       | P    | P        | x    | x    | x    |      |         |        | x      | x   | x    | x     | x   | x      |         |
| datetime         | x    | x       | x        | x   | P      | P        | x     | x      | x       | P    | A        | P    | x    | x    |      |         |        | x      | x   | x    | x     | x   | x      |         |
| time             | x    | A       | A        | A   | P      | P        | x     | x      | x       | P    | P        | A    | x    | x    |      |         |        | x      | x   | x    | x     | x   | x      |         |
| IPv4             | x    | x       | x        | x   | x      | x        | x     | x      | x       | x    | x        | x    | P    | P    |      |         |        | x      | x   | x    | x     | x   | x      |         |
| IPv6             | x    | x       | x        | x   | x      | x        | x     | x      | x       | x    | x        | x    | x    | P    |      |         |        | x      | x   | x    | x     | x   | x      |         |
| char             | A    | A       | A        | A   | A      | A        | A     | A      | A       | A    | A        | A    | A    | A    |      |         |        | x      | x   | A    | A     | A   | A      |         |
| varchar          | A    | A       | A        | A   | A      | A        | A     | A      | A       | A    | A        | A    | A    | A    |      |         |        | x      | x   | A    | A     | A   | A      |         |
| string           | A    | A       | A        | A   | A      | A        | A     | A      | A       | A    | A        | A    | A    | A    |      |         |        | x      | x   | A    | A     | A   | A      |         |
| bitmap           | x    | x       | x        | x   | x      | x        | x     | x      | x       | x    | x        | x    | x    | x    | x    | x       | x      | P      | x   | x    | x     | x   | x      |         |
| hll              | x    | x       | x        | x   | x      | x        | x     | x      | x       | x    | x        | x    | x    | x    | x    | x       | x      | x      | P   | x    | x     | x   | x      |         |
| json             | A    | A       | A        | A   | A      | A        | A     | A      | A       | x    | x        | x    | x    | x    | A    | A       | A      | x      | x   | P    | A     | x   | A      |         |
| array            | x    | x       | x        | x   | x      | x        | x     | x      | x       | x    | x        | x    | x    | x    |      |         |        | x      | x   | P    | P     | x   | x      |         |
| map              | x    | x       | x        | x   | x      | x        | x     | x      | x       | x    | x        | x    | x    | x    |      |         |        | x      | x   | x    | x     | P   | x      |         |
| struct           | x    | x       | x        | x   | x      | x        | x     | x      | x       | x    | x        | x    | x    | x    |      |         |        | x      | x   | P    | x     | x   | P      |         |
| variant          |      |         |          |     |        |          |       |        |         |      |          |      |      |      |      |         |        |        |     |      |       |     |        |         |

### 非厳格モード

| **From**\\**To** | bool | tinyint | smallint | int | bigint | largeint | float | double | decimal | date | datetime | time | IPv4 | IPv6 | char | varchar | string | bitmap | hll | json | array | map | struct | variant |
| ---------------- | ---- | ------- | -------- | --- | ------ | -------- | ----- | ------ | ------- | ---- | -------- | ---- | ---- | ---- | ---- | ------- | ------ | ------ | --- | ---- | ----- | --- | ------ | ------- |
| bool             | P    | P       | P        | P   | P      | P        | P     | P      | O       | x    | x        | x    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         |
| tinyint          | P    | P       | P        | P   | P      | P        | P     | P      | O       | A    | A        | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         |
| smallint         | P    | A       | P        | P   | P      | P        | P     | P      | O       | A    | A        | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         |
| int              | P    | A       | A        | P   | P      | P        | P     | P      | O       | A    | A        | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         |
| bigint           | P    | A       | A        | A   | P      | P        | P     | P      | O       | A    | A        | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         |
| largeint         | P    | A       | A        | A   | A      | P        | P     | P      | O       | A    | A        | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         |
| float            | P    | A       | A        | A   | A      | A        | P     | P      | A       | A    | A        | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         |
| double           | P    | A       | A        | A   | A      | A        | P     | P      | A       | A    | A        | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         |
| decimal          | P    | O       | O        | O   | O      | O        | P     | P      | O       | A    | A        | A    | x    | x    |      |         |        | x      | x   | P    | x     | x   | x      |         |
| date             | x    | x       | x        | P   | P      | P        | P     | P      | x       | P    | P        | x    | x    | x    |      |         |        | x      | x   | x    | x     | x   | x      |         |
| datetime         | x    | x       | x        | x   | P      | P        | P     | P      | x       | P    | A        | P    | x    | x    |      |         |        | x      | x   | x    | x     | x   | x      |         |
| time             | x    | A       | A        | A   | P      | P        | P     | P      | x       | P    | P        | A    | x    | x    |      |         |        | x      | x   | x    | x     | x   | x      |         |
| IPv4             | x    | x       | x        | x   | x      | x        | x     | x      | x       | x    | x        | x    | P    | P    |      |         |        | x      | x   | x    | x     | x   | x      |         |
| IPv6             | x    | x       | x        | x   | x      | x        | x     | x      | x       | x    | x        | x    | x    | P    |      |         |        | x      | x   | x    | x     | x   | x      |         |
| char             | A    | A       | A        | A   | A      | A        | A     | A      | A       | A    | A        | A    | A    | A    |      |         |        | x      | x   | A    | A     | A   | A      |         |
| varchar          | A    | A       | A        | A   | A      | A        | A     | A      | A       | A    | A        | A    | A    | A    |      |         |        | x      | x   | A    | A     | A   | A      |         |
| string           | A    | A       | A        | A   | A      | A        | A     | A      | A       | A    | A        | A    | A    | A    |      |         |        | x      | x   | A    | A     | A   | A      |         |
| bitmap           | x    | x       | x        | x   | x      | x        | x     | x      | x       | x    | x        | x    | x    | x    | x    | x       | x      | P      | x   | x    | x     | x   | x      |         |
| hll              | x    | x       | x        | x   | x      | x        | x     | x      | x       | x    | x        | x    | x    | x    | x    | x       | x      | x      | P   | x    | x     | x   | x      |         |
| json             | A    | A       | A        | A   | A      | A        | A     | A      | A       | x    | x        | x    | x    | x    | A    | A       | A      | x      | x   | P    | A     | x   | A      |         |
| array            | x    | x       | x        | x   | x      | x        | x     | x      | x       | x    | x        | x    | x    | x    |      |         |        | x      | x   | P    | P     | x   | x      |         |
| map              | x    | x       | x        | x   | x      | x        | x     | x      | x       | x    | x        | x    | x    | x    |      |         |        | x      | x   | x    | x     | P   | x      |         |
| struct           | x    | x       | x        | x   | x      | x        | x     | x      | x       | x    | x        | x    | x    | x    |      |         |        | x      | x   | P    | x     | x   | P      |         |
| variant          |      |         |          |     |        |          |       |        |         |      |          |      |      |      |      |         |        |        |     |      |       |     |        |         |

## 暗黙的な変換

暗黙的な変換は、入力 SQL で明示的に指定していなくても、Doris が CAST 式を自動的に実行計画に組み込む場合に行われます。主に次のような場合です。

1. 関数を呼び出す際に、実引数の型が関数シグネチャの型と一致しない場合。

2. 算術式の両辺の型が一致しない場合。

など。

### 変換マトリックス

TODO

### 共通型

算術演算で使うオペランドに暗黙的な変換が必要な場合、まず共通型を決定します。両側のオペランドの型が共通型と一致しなければ、それぞれについて共通型への CAST 式を実行計画に組み込みます。
