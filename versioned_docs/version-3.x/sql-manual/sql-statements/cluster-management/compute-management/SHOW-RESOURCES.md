---
{
    "title": "SHOW RESOURCES",
    "language": "en",
    "description": "This statement is used to display resources that the user has permission to use. Ordinary users can only display resources with permission,"
}
---

## Description

This statement is used to display resources that the user has permission to use. Ordinary users can only display resources with permission, and root or admin users will display all resources.

## Syntax

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

## Usage Notes

1. If NAME LIKE is used, it will match Resource whose Name contains name_matcher in RESOURCES
2. If NAME = is used, it will match the specified Name exactly
3. If RESOURCETYPE is specified, match the corresponding Resrouce type, The supported RESOURCETYPEs can be referred to in [CREATE-RESOURCE](./CREATE-RESOURCE.md);
4. You can use ORDER BY to sort on any combination of columns
5. If LIMIT is specified, limit matching records are displayed. Otherwise show all
6. If OFFSET is specified, the query results are displayed starting at offset offset. By default the offset is 0.
7. If using LIKE, the WHERE clause will be ignored.

## Example

1. Display all resources that the current user has permissions to

   ```sql
   SHOW RESOURCES;
   ```

2. Display the specified Resource, the name contains the string "20140102", and display 10 attributes

   ```sql
   SHOW RESOURCES WHERE NAME LIKE "2014_01_02" LIMIT 10;
   ```

3. Display the specified Resource, specify the name as "20140102" and sort by KEY in descending order

   ```sql
   SHOW RESOURCES WHERE NAME = "20140102" ORDER BY `KEY` DESC;
   ```

3. Using LIKE to match the resource

   ```sql
   SHOW RESOURCES LIKE "jdbc%";
   ```