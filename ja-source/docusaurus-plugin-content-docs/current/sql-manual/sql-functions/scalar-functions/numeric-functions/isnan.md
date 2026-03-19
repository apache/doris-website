---
{
  "title": "ISNAN",
  "language": "ja",
  "description": "指定された値がNaN（Not a Number）かどうかを判定します。"
}
---
<!-- 
Apache Software Foundation (ASF) にライセンス許可されています。1つまたは複数のコントリビューターライセンス契約に基づきます。著作権所有権に関する追加情報については、この作業と共に配布されるNOTICEファイルを参照してください。ASFはこのファイルを Apache License, Version 2.0 ("License") の下であなたにライセンス許可しています。Licenseに準拠する場合を除き、このファイルを使用することはできません。Licenseのコピーは以下で入手できます。

  http://www.apache.org/licenses/LICENSE-2.0

適用法で要求されるか書面で合意されない限り、Licenseの下で配布されるソフトウェアは「現状のまま」ベースで配布され、明示または暗示を問わずいかなる保証や条件もありません。Licenseの下での特定の言語における権限と制限については、Licenseを参照してください。
-->

## 説明

指定された値がNaN (Not a Number) かどうかを判定します。

## 構文

```sql
ISNAN(<value>)
```
## パラメータ

| パラメータ | 説明 |
| -- | -- |
| `<value>` | チェック対象の値。DOUBLE型またはFLOAT型である必要があります |

## 戻り値

値がNaNの場合は1を返し、そうでなければ0を返します。
値がNULLの場合は、NULLを返します。

## 例

```sql
SELECT isnan(1);
```
```text
+----------+
| isnan(1) |
+----------+
|        0 |
+----------+
```
```sql
SELECT cast('nan' as double),isnan(cast('nan' as double));
```
```text
+-----------------------+------------------------------+
| cast('nan' as double) | isnan(cast('nan' as double)) |
+-----------------------+------------------------------+
|                   NaN |                            1 |
+-----------------------+------------------------------+
```
```sql
SELECT isnan(NULL)
```
```text
+-------------+
| isnan(NULL) |
+-------------+
|        NULL |
+-------------+
```
