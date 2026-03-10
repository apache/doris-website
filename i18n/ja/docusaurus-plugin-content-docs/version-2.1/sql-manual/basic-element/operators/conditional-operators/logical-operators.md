---
{
  "title": "論理演算子",
  "language": "ja",
  "description": "論理条件は、2つのコンポーネントの条件の結果を組み合わせて、それらに基づいて単一の結果を生成します。"
}
---
## 説明

論理条件は、2つのコンポーネントの条件の結果を組み合わせて、それらに基づいて単一の結果を生成するか、条件の結果を反転させます。

## 演算子の紹介

| 演算子 | 機能                                                      | 例                |
| ------- | ------------------------------------------------------------ | ---------------------- |
| NOT    | 後続の条件がFALSEの場合にTRUEを返します。TRUEの場合はFALSEを返します。UNKNOWNの場合は、UNKNOWNのまま残ります。 | `SELECT NOT (TRUE)`     |
| AND    | 両方のコンポーネントの条件がTRUEの場合にTRUEを返します。いずれかがFALSEの場合はFALSEを返します。それ以外の場合は、UNKNOWNを返します。 | `SELECT TRUE AND FALSE` |
| OR     | いずれかのコンポーネントの条件がTRUEの場合にTRUEを返します。両方がFALSEの場合はFALSEを返します。それ以外の場合は、UNKNOWNを返します。 | `SELECT TRUE OR NULL`  |

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
