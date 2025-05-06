---
{
    "title": "Comments",
    "language": "en"
}
---

<!-- 
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
-->

## Description

Comments can make your application easier to read and maintain. For example, you can include a comment within a statement to describe the purpose of that statement in your application. Comments in SQL statements (except for HINT) do not affect the execution of the statement. For information on using this specific form of comments with HINT, please refer to the [HINT](../../query-acceleration/hints/hints-overview.md) section.

In SQL statements, comments can appear between any keywords, parameters, or punctuation marks. You can include comments in statements in two ways:

- Multi-line comments: Start the comment with a slash and asterisk (`/*`), followed by the comment text. This text can span multiple lines. End the comment with an asterisk and a slash (`*/`). There is no need for spaces or line breaks between the start and end characters and the text.
- Single-line comments: Start the comment with two dashes (`--`), followed by the comment text. This text cannot extend to a new line. The comment ends with a newline character.

## Examples

### Multi-line Comment

```sql
SELECT /* This is a multi-line comment
          that can span multiple lines */
       column_name
FROM   table_name;
```

### Single-line Comment

```sql
SELECT column_name -- This is a single-line comment
FROM   table_name;
```