---
{
    "title": "論理演算子",
    "language": "ja",
    "description": "論理条件は、二つの条件の結果を組み合わせ、それらに基づいて一つの結果を生成します。"
}
---

## 説明

論理条件は、二つの条件の結果を組み合わせて一つの結果を生成するか、条件の結果を反転します。

## 演算子の概要

| 演算子 | 機能 | 例 |
| ------- | ------------------------------------------------------------ | ---------------------- |
| NOT | 後続の条件が FALSE の場合は TRUE、TRUE の場合は FALSE を返します。UNKNOWN の場合は UNKNOWN のままです。 | `SELECT NOT (TRUE)` |
| AND | 両方の条件が TRUE の場合は TRUE、いずれかが FALSE の場合は FALSE を返します。それ以外の場合は UNKNOWN を返します。 | `SELECT TRUE AND FALSE` |
| OR | いずれかの条件が TRUE の場合は TRUE、両方が FALSE の場合は FALSE を返します。それ以外の場合は UNKNOWN を返します。 | `SELECT TRUE OR NULL` |

## 真理値表

### NOT の真理値表

| | TRUE | FALSE | UNKNOWN |
| :----  | :------ | :------ |
| NOT | FALSE | TRUE | UNKNOWN |

### AND の真理値表

| AND | TRUE | FALSE | UNKNOWN |
| :------ | :------ | :---- | :------ |
| TRUE | TRUE | FALSE | UNKNOWN |
| FALSE | FALSE | FALSE | FALSE |
| UNKNOWN | UNKNOWN | FALSE | UNKNOWN |

### OR の真理値表

| OR | TRUE | FALSE | UNKNOWN |
| :------ | :--- | :------ | :------ |
| TRUE | TRUE | TRUE | TRUE |
| FALSE | TRUE | FALSE | UNKNOWN |
| UNKNOWN | TRUE | UNKNOWN | UNKNOWN |
