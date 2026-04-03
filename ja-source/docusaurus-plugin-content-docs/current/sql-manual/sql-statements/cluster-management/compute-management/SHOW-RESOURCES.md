---
{
  "title": "リソースを表示",
  "language": "ja",
  "description": "この文は、ユーザーが使用する権限を持つリソースを表示するために使用されます。一般ユーザーは権限のあるリソースのみを表示できます。"
}
---
## 説明

この文は、ユーザーが使用する権限を持つリソースを表示するために使用されます。通常のユーザーは権限のあるリソースのみ表示でき、rootまたはadminユーザーはすべてのリソースが表示されます。

## 構文

```sql
SHOW RESOURCES
[
  WHERE
  [NAME [ = "<your_resource_name>" | LIKE "<name_matcher>"]]
  [RESOURCETYPE = "<type>"]
] | [LIKE "<pattern>"]
[ORDER BY ...]
[LIMIT <limit>][OFFSET <offset>];
```
## 使用上の注意

1. NAME LIKE を使用する場合、RESOURCES 内で Name に name_matcher を含む Resource にマッチします
2. NAME = を使用する場合、指定された Name と完全に一致します
3. RESOURCETYPE が指定されている場合、対応する Resrouce タイプにマッチします。サポートされている RESOURCETYPE については [CREATE-RESOURCE](./CREATE-RESOURCE.md) を参照してください
4. ORDER BY を使用して任意の列の組み合わせでソートできます
5. LIMIT が指定されている場合、マッチするレコードを制限して表示します。それ以外の場合はすべて表示します
6. OFFSET が指定されている場合、クエリ結果はオフセット offset から開始して表示されます。デフォルトではオフセットは 0 です
7. LIKE を使用する場合、WHERE 句は無視されます。

## 例

1. 現在のユーザーが権限を持つすべてのリソースを表示する

   ```sql
   SHOW RESOURCES;
   ```
2. 指定されたResourceを表示し、名前に文字列"20140102"を含み、10個の属性を表示する

   ```sql
   SHOW RESOURCES WHERE NAME LIKE "2014_01_02" LIMIT 10;
   ```
3. 指定されたResourceを表示し、名前を"20140102"として指定し、KEYで降順にソートする

   ```sql
   SHOW RESOURCES WHERE NAME = "20140102" ORDER BY `KEY` DESC;
   ```
3. LIKEを使用したリソースのマッチング

   ```sql
   SHOW RESOURCES LIKE "jdbc%";
   ```
