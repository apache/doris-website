---
{
  "title": "AI_MASK",
  "language": "ja",
  "description": "指定されたラベルに関連するテキスト内の機密情報をマスクするために使用されます。"
}
---
<!-- 
Apache Software Foundation (ASF) にライセンスされており、一つまたは
複数の貢献者ライセンス契約の下にあります。著作権所有権に関する
追加情報については、この作業と共に配布されるNOTICEファイルを
参照してください。ASFはこのファイルをApache License, Version 2.0
（以下「License」）の下であなたにライセンスします。このLicenseに
準拠する場合を除き、このファイルを使用することはできません。
Licenseのコピーは以下で入手できます：

  http://www.apache.org/licenses/LICENSE-2.0

適用法で要求される場合、または書面で合意された場合を除き、
Licenseの下で配布されるソフトウェアは、明示的または暗示的を
問わず、いかなる種類の保証や条件もなく「現状のまま」で配布
されます。Licenseの下での特定の言語による権限と制限については、
Licenseを参照してください。
-->

## 説明

指定されたラベルに関連するテキスト内の機密情報をマスクするために使用されます。

## 構文

```sql
AI_MASK([<resource_name>], <text>, <labels>)
```
## パラメータ

|    パラメータ      | 説明                                                      |
| ----------------- | ---------------------------------------------------------------- |
| `<resource_name>` | 指定されたリソース名                                      |
| `<text>`          | 機密情報を含む可能性があるテキスト                  |
| `<labels>`        | マスクするラベルの配列、例：`ARRAY('name', 'phone', 'email')` |

## 戻り値

機密情報がマスクされたテキストを返します。マスクされた部分は「[MASKED]」に置換されます。

入力がNULLの場合、NULLを返します。

結果は大規模言語モデルによって生成されるため、出力は変動する可能性があります。

## 例

```sql
SET default_ai_resource = 'resource_name';
SELECT AI_MASK('Wccccat is a 20-year-old Doris community contributor.', ['name', 'age']) AS Result;
```
```text
+-----------------------------------------------------+
| Result                                              |
+-----------------------------------------------------+
| [MASKED] is a [MASKED] Doris community contributor. |
+-----------------------------------------------------+
```
```sql
SELECT AI_MASK('resource_name', 'My email is rarity@example.com and my phone is 123-456-7890',
                ['email', 'phone_num']) AS RESULT;
```
```text
+-----------------------------------------------+
| RESULT                                        |
+-----------------------------------------------+
| My email is [MASKED] and my phone is [MASKED] |
+-----------------------------------------------+
```
