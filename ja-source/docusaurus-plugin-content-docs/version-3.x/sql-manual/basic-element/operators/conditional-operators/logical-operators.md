---
{
  "title": "ロジック演算子",
  "description": "論理条件は、2つのコンポーネントの条件の結果を組み合わせて、それらに基づいて単一の結果を生成します。",
  "language": "ja"
}
---
## 説明

論理条件は、2つのコンポーネントの条件の結果を組み合わせて、それらに基づいて単一の結果を生成するか、条件の結果を反転させます。

## オペレータの紹介

| オペレータ | 機能                                                      | 例                |
| ------- | ------------------------------------------------------------ | ---------------------- |
| NOT    | 後続の条件がFALSEの場合、TRUEを返します。TRUEの場合、FALSEを返します。UNKNOWNの場合、UNKNOWNのまま残ります。 | `SELECT NOT (TRUE)`     |
| AND    | 両方のコンポーネントの条件がTRUEの場合、TRUEを返します。いずれかがFALSEの場合、FALSEを返します。それ以外の場合、UNKNOWNを返します。 | `SELECT TRUE AND FALSE` |
| OR     | いずれかのコンポーネントの条件がTRUEの場合、TRUEを返します。両方がFALSEの場合、FALSEを返します。それ以外の場合、UNKNOWNを返します。 | `SELECT TRUE OR NULL`  |

## 真理値表

### NOT真理値表

|       | TRUE   | FALSE | UNKNOWN |
| :----  | :------ | :------ |
| NOT    | FALSE  | TRUE   | UNKNOWN |

### AND真理値表

| AND      | TRUE    | FALSE | UNKNOWN |
| :------ | :------ | :---- | :------ |
| TRUE    | TRUE    | FALSE | UNKNOWN |
| FALSE   | FALSE   | FALSE | FALSE   |
| UNKNOWN | UNKNOWN | FALSE | UNKNOWN |

### OR真理値表

| OR       | TRUE | FALSE   | UNKNOWN |
| :------ | :--- | :------ | :------ |
| TRUE    | TRUE | TRUE    | TRUE    |
| FALSE   | TRUE | FALSE   | UNKNOWN |
| UNKNOWN | TRUE | UNKNOWN | UNKNOWN |
