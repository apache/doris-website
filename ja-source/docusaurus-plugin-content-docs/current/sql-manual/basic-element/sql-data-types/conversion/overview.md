---
{
  "title": "型変換",
  "language": "ja",
  "description": "Dorisでは、各式に型があります。例えば、式select 1, col1, fromunixtime(col2) from table1における1、col1、fromunixtime(col2)などです。"
}
---
Dorisでは、各式には型があります。例えば、`select 1, col1, from_unixtime(col2) from table1`という式における`1`、`col1`、`from_unixtime(col2)`などです。式をある型から別の型に変換するプロセスを「型変換」と呼びます。

型変換は2つのケースで発生します：明示的変換と暗黙的変換です。

すべての型変換は特定のルールに従います。変換の**ターゲット型**に応じて、関連するルールを説明します。例えば、`INT`から`DOUBLE`への変換と`STRING`から`DOUBLE`への変換は、どちらも[Conversion to FLOAT/DOUBLE](./float-double-conversion)ドキュメントで説明されています。

変換が実行できるかどうか、および結果がnull許可型になるかどうかは、厳密モードが有効かどうか（セッション変数`enable_strict_cast`）に依存します。一般的に、厳密モードが有効な場合、変換に失敗したデータは即座にエラーを引き起こし、SQLの失敗につながります。厳密モードが無効な場合、変換に失敗したデータ行は`NULL`になります。

## 明示的変換

明示的変換は`CAST`関数を使用して実行されます。例えば：

`CAST(1.23 as INT)`は数値1.23をINT型に変換します。

`CAST(colA as DATETIME(6))`は列/式colAをDATETIME(6)型（つまり、マイクロ秒精度のDATETIME型）に変換します。

以下は、厳密モード（`enable_strict_cast = true`）と非厳密モード（`enable_strict_cast = false`）での異なる型間の型変換関係について説明し、以下の4つのケースを含みます：

|記号|意味|
|-|-|
|x|変換が許可されない|
|P|戻り値の型は入力パラメータがすでにNullable型である場合のみNullableになります。つまり、変換は非Null値をNullに変換**しません**|
|A|戻り値の型は常にNullableです。変換は非Null値をNullに変換**する可能性があります**|
|O|戻り値の型は入力型から出力型への変換で**オーバーフローが発生する可能性がある**場合にNullableになります。非Null入力値について、変換で実際にオーバーフローが発生した場合、変換結果はNullになる可能性があります|

具体的な型変換ルールとNullable特性については、現在のディレクトリの型変換ドキュメントを確認してください。

### 厳密モード

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

### 非厳密モード

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

## 暗黙的変換

暗黙的変換は、入力されたSQLで明示的に指定されていないが、DorisがCAST式を自動的に計画する特定の状況で発生します。主に以下のようなシナリオで発生します：

1. 関数呼び出しが行われた際に、実際のパラメータの型が関数シグネチャの型と一致しない場合。

2. 数学的式の両辺の型が一致していない場合。

など。

### 変換マトリックス

TODO

### 共通型

オペランドが数学的演算として使用されることにより暗黙的変換が必要になった場合、最初のステップは共通型を決定することです。両辺のオペランドが共通型と一致していない場合、それぞれが共通型へのCAST式を計画します。
