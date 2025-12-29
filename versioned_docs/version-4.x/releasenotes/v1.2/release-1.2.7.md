---
{
    "title": "Release 1.2.7",
    "language": "en",
    "description": "Bug Fixes:Fixed some query issues."
}
---

# Bug Fixes

- Fixed some query issues.
- Fix some storage issues.
- Fix some decimal precision issues.
- Fix query error caused by invalid `sql_select_limit` session variable's value.
- Fix the problem that hdfs short-circuit read cannot be used.
- Fix the problem that Tencent Cloud cosn cannot be accessed.
- Fix several issues with hive catalog kerberos access.
- Fix the problem that stream load profile cannot be used.
- Fix promethus monitoring parameter format problem.
- Fix the table creation timeout issue when creating a large number of tablets.

# New Features

- Unique Key model supports array type as value column
- Added `have_query_cache` variable for compatibility with MySQL ecosystem.
- Added `enable_strong_consistency_read` to support strong consistent read between sessions
- FE metrics supports user-level query counter

