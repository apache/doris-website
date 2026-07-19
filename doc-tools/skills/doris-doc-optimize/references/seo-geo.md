# SEO and GEO Optimization Techniques (General)

## SEO (Search Engine Optimization)

### 1. Frontmatter Optimization

- **title**: Close to real search queries; include common user keywords
- **description**: Problem-oriented, usable as a search snippet; keep within 120 characters
- **keywords**: Cover synonyms and long-tail variants (optional)

### 2. Content Structure

- Clear H2/H3 hierarchy for easy parsing by search engines
- Provide a checklist or quick navigation at the beginning
- Each section has explicit subheadings to support quick scanning

### 3. Keyword Coverage

- Cover common error keywords or failure scenarios (e.g., `Too many open files`)
- Naturally weave in key synonyms (e.g., vector search / semantic search)
- Make the technical context explicit (Kafka / Iceberg / S3, etc.)

### 4. Enhancement Blocks

- **FAQ block**: Cover common questions to broaden search coverage
- **Troubleshooting section**: Add common errors and their solutions
- **Comparison table**: Clarify trade-offs across technology choices

---

## GEO (Generative Engine Optimization)

### 1. Knowledge Type Annotation

Add meta comments at the start of a section to declare the content type:

```html
<!-- Knowledge Type: Operational Steps -->
<!-- Knowledge Type: Configuration Parameters -->
<!-- Knowledge Type: Hardware Requirements -->
<!-- Knowledge Type: Architecture Decision -->
```

### 2. Use-Case Annotation

```html
<!-- Use Case: Pre-deployment Check / Environment Acceptance -->
<!-- Use Case: Troubleshooting / Performance Tuning -->
```

### 3. Structured Expression

| Technique | Description |
|-----------|-------------|
| Tabulation | Present parameters, configs, and version mappings as tables |
| Step-by-step | Standardize operational content as "Purpose → Command → Explanation" |
| Minimal example | Keep example code concise and direct; avoid redundant context |
| One-line definition | Feature docs should provide a quotable capability definition |

### 4. Conciseness and Decoupling

- Keep each explanatory paragraph to 3 sentences or fewer
- Avoid mixing content types (Guide vs. Reference)
- Front-load key information; drop redundant explanation

### 5. Unified Terminology

- Use the same term for the same concept throughout
- Define a term on first appearance, then use it directly afterward
- Avoid mixing synonyms

---

## Docusaurus Adaptation

### Frontmatter Best Practices

```yaml
---
title: A title the user would actually search
description: Problem-oriented description, within 120 characters, usable as a search snippet
keywords:
  - synonym1
  - synonym2
  - error-scenario keyword
---
```

### Content Organization

- Use H2 for top-level sections and H3 for sub-steps
- Add a brief intro sentence before each table
- Highlight important configuration with tables or lists
- Annotate expected output for code blocks (when applicable)

### Cross-link

- Add links between related docs
- Use meaningful link text; avoid "click here"

---

## SEO/GEO Strategy by Document Type

| Type | SEO Focus | GEO Focus |
|------|-----------|-----------|
| **Guide** | Executable steps, FAQ, Troubleshooting | Structured steps, knowledge-type annotation |
| **Reference** | Parameter accuracy, long-tail coverage, clear headings | Tabulated parameters, parseable structure |
| **Feature** | Scenario coverage, comparison, problem-oriented titles | Capability definition, decomposable structure |
| **Tutorial** | Clear path, no skipped steps, reusability | Step independence, minimal examples |
| **FAQ** | Comprehensive question coverage, keyword embedding | Concise, directly quotable answers |
| **Mixed** | Clear partitioning by type, heading differentiation | Independent blocks, selectively quotable |
