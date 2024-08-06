---
{
    "title": "Release 2.0.10",
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

Thanks to our community users and developers, about 83 improvements and bug fixes have been made in Doris 2.0.10 version.

**Quick Download:** [https://doris.apache.org/download/](https://doris.apache.org/download/)

**GitHub：** [https://github.com/apache/doris/releases](https://github.com/apache/doris/releases)



## Improvement and Optimizations

- This enhancement introduces the `read_only` and `super_read_only` variables to the database system, ensuring compatibility with MySQL's read-only modes.

- When the check status is not IO_ERROR, the disk path should not be added to the broken list. This ensures that only disks with actual I/O errors are marked as broken.

- When performing a Create Table As Select (CTAS) operation from an external table, convert the `VARCHAR` column to `STRING` type.

- Support mapping Paimon column type "ROW" to Doris type "STRUCT"

- Choose disk tolerate with little skew when creating tablet

- Write editlog to `set replica drop` to avoid confusing status on follower FE

- Make the schema change memory space adaptive to avoid memory over limit

- Inverted index 'unicode' tokenizer supports configuration to exclude stop words

See the complete list of improvements and bug fixes on [GitHub](https://github.com/apache/doris/compare/2.0.9...2.0.10) .

## Credits

Thanks to all who contributed to this release:

@airborne12, @BePPPower, @ByteYue, @CalvinKirs, @cambyzju, @csun5285, @dataroaring, @deardeng, @DongLiang-0, @eldenmoon, @felixwluo, @HappenLee, @hubgeter, @jackwener, @kaijchen, @kaka11chen, @Lchangliang, @liaoxin01, @LiBinfeng-01, @luennng, @morningman, @morrySnow, @Mryange, @nextdreamblue, @qidaye, @starocean999, @suxiaogang223, @SWJTU-ZhangLei, @w41ter, @xiaokang, @xy720, @yujun777, @Yukang-Lian, @zhangstar333, @zxealous, @zy-kkk, @zzzxl1993