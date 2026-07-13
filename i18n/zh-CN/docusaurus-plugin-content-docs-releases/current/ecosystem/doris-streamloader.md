---
{
    "title": "Doris Streamloader",
    "language": "zh-CN",
    "description": "Doris Streamloader 版本发布说明。"
}
---

# Doris Streamloader

本文按版本倒序列出 Doris Streamloader 的版本发布说明。

## 1.0.3

来源：[1.0.3 Release Notes](https://github.com/apache/doris-streamloader/issues/29)

### 功能与改进

- 支持自定义换行符。[#27](https://github.com/apache/doris-streamloader/pull/27)

### Bug 修复

- 修复未设置 `workers` 时 Streamloader 无法工作的问题。[#24](https://github.com/apache/doris-streamloader/pull/24)
- 避免在 headers 中设置 labels 时产生 label 冲突。[#25](https://github.com/apache/doris-streamloader/pull/25)
