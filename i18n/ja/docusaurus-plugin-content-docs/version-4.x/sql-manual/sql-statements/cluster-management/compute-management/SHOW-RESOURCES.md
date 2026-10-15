---
{
    "title": "SHOW RESOURCES",
    "language": "ja",
    "description": "この文は、ユーザーが使用権限を持つリソースを表示します。一般ユーザーが表示できるのは、権限を持つリソースのみです。"
}
---

## 説明

この文は、ユーザーが使用権限を持つリソースを表示します。一般ユーザーには権限を持つリソースのみが表示され、root または admin ユーザーにはすべてのリソースが表示されます。

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

1. NAME LIKE を使用すると、RESOURCES 内で Name に name_matcher を含むリソースに一致します。
2. NAME = を使用すると、指定した Name と完全に一致します。
3. RESOURCETYPE を指定すると、対応するリソースタイプに一致します。サポートされる RESOURCETYPE については、[CREATE-RESOURCE](./CREATE-RESOURCE.md) を参照してください。
4. ORDER BY を使用すると、任意の列の組み合わせで並べ替えられます。
5. LIMIT を指定すると、一致するレコードを指定した件数まで表示します。指定しない場合はすべて表示します。
6. OFFSET を指定すると、クエリ結果の指定したオフセットから表示します。デフォルトのオフセットは 0 です。
7. LIKE を使用すると、WHERE 句は無視されます。

## 例

1. 現在のユーザーが権限を持つすべてのリソースを表示します。

   ```sql
   SHOW RESOURCES;
   ```

2. 名前に文字列「20140102」を含む指定のリソースについて、属性を 10 件表示します。

   ```sql
   SHOW RESOURCES WHERE NAME LIKE "2014_01_02" LIMIT 10;
   ```

3. 名前を「20140102」と指定したリソースを表示し、KEY の降順に並べ替えます。

   ```sql
   SHOW RESOURCES WHERE NAME = "20140102" ORDER BY `KEY` DESC;
   ```

3. LIKE を使用してリソースに一致させます。

   ```sql
   SHOW RESOURCES LIKE "jdbc%";
   ```
