---
title: Java Code Formatting Specification
language: en
description: "Apache Doris Java code formatting specification: import order, Checkstyle, and IDE configuration."
keywords:
    - Apache Doris
    - Java code formatting
    - Checkstyle
    - IDEA
    - VS Code
    - Import Order
    - formatter-check
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

# Java Code Formatting Specification

<!-- Knowledge type: Code specification -->
<!-- Applicable scenarios: FE development / Pull Request submission -->

The Java portion of Apache Doris code (mainly the FE module) is typically formatted automatically by the IDE. This document lists the general formatting rules and the corresponding configuration methods for different IDEs. The CI pipeline validates code formatting through `formatter-check`.

## Import Order Rules

<!-- Knowledge type: Code specification -->

Import statements must be arranged in the following group order, with one blank line separating each group:

```text
org.apache.doris
<blank line>
third party package
<blank line>
standard java package
<blank line>
```

Additional rules:

| Rule | Description |
|------|-------------|
| No `import *` | Every class must be imported explicitly |
| No `import static` | Static imports are not allowed |

## Checkstyle Check at Compile Time

When compiling with `maven`, the `Checkstyle` check runs by default, which slightly slows down compilation. To skip the check, use the following command:

```bash
mvn clean install -DskipTests -Dcheckstyle.skip
```

The `formatter-check` in CI enforces code format validation. Skipping the check locally is only for development and debugging. Make sure the format complies before submitting a PR.

## Checkstyle Plugin Configuration

### Configure Checkstyle in IDEA

1. Install the `Checkstyle-IDEA` plugin in the settings.
2. Go to `Tools -> Checkstyle`, find `Configuration File`, and click `Use a local Checkstyle file`.
3. Select the `fe/check/checkstyle/checkstyle.xml` file in the project root directory.
4. Confirm that the `Checkstyle` version is 9.3 or above (the latest version is recommended).

![](/images/idea-checkstyle-version.png)

Once configured, you can use the `Checkstyle-IDEA` plugin to run Checkstyle checks on the code:

![](/images/idea-checkstyle-plugin-cn.png)

### Configure Checkstyle in VS Code

1. Install the `Checkstyle for Java` plugin.
2. Complete the configuration by following the instructions and animations in the [Java Linting official documentation](https://code.visualstudio.com/docs/java/java-linting).

## IDEA Code Formatting

### Auto-Formatting Configuration

The auto-formatting feature of IDEA is recommended:

1. Go to `Preferences -> Editor -> Code Style -> Java`.
2. Click the configuration icon's `Import Scheme` and select `IntelliJ IDEA code style XML`.
3. Select the `build-support/IntelliJ-code-format.xml` file in the project root directory.

### Rearrange Code

Checkstyle checks the order of code declarations according to [Class and Interface Declarations](https://www.oracle.com/java/technologies/javase/codeconventions-fileorganization.html#1852).

After importing the `build-support/IntelliJ-code-format.xml` above, use `Code/Rearrange Code` to perform the sorting automatically:

![](/images/idea-rearrange-code.png)

## Automatically Remove Unused Imports

| Purpose | Action |
|---------|--------|
| Remove unused imports only | Default shortcut `CTRL + ALT + O` |
| Automatically remove and reorder on save | Check `Preferences -> Editor -> General -> Auto Import -> Optimize Imports on the Fly` |

## FAQ

**Q: How do I troubleshoot a `formatter-check` failure in CI?**

Run the check locally with IDEA or the Checkstyle plugin. Make sure the import order, naming conventions, and declaration order all comply with the requirements in `fe/check/checkstyle/checkstyle.xml`, then resubmit.

**Q: Does skipping Checkstyle locally affect PR merging?**

Yes. CI still runs `formatter-check`. The local `-Dcheckstyle.skip` option is only for speeding up development builds. The final code must pass Checkstyle.
