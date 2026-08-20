---
name: doris-img-gen
description: Create Apache Doris article illustrations in the Doris hand-drawn whiteboard style, using a randomly selected Pip, Dori, or Flux mascot only when a task, guide, operator, diagnosis, or anthropomorphic narrative benefits from a character. Use when the user invokes $doris-img-gen or asks for a Doris technical article illustration, concept visual, infographic, architecture diagram, process diagram, or mascot-assisted explanatory graphic.
---

# Doris Article Illustration Generator

Create technically clear, visually consistent illustrations for Apache Doris articles. Treat the text after `$doris-img-gen` as the primary content brief.

## Prepare

1. Read `references/visual-style.md` completely before generating an image.
2. Extract the requested concepts, relationships, sequence, labels, and layout constraints. Preserve them; do not invent technical facts, metrics, components, or product claims.
3. If the request refers to an article, section, or local draft, read the relevant passage before composing the illustration.
4. Keep all in-image wording in English by default. Use the user's exact quoted labels when supplied. Keep labels short and render each label exactly once.

## Decide Whether to Use a Mascot

Apply the **semantic-role test**: include a mascot only when it performs a meaningful action that can be stated as a verb in the image.

Include one mascot when the scene needs:

- an operator starting or running a task;
- an investigator searching, observing, comparing, or diagnosing;
- a guide teaching or walking readers through a process;
- a central actor already present in the requested narrative;
- a human-like moment that makes an abstract idea easier to understand.

Omit the mascot when the image is primarily:

- architecture, topology, data flow, or component relationships;
- a chart, table, query plan, dashboard, or factual comparison;
- a compact process whose clarity would be reduced by a character;
- a scene where the mascot would be decorative rather than explanatory.

Never add a mascot only to fill space. Use one mascot by default. Use more than one only when interaction among roles is itself part of the requested content.

An explicit user request for a character always overrides random selection.

Treat the character roles as personality and prop hints, not fixed assignment rules:

- **Pip — The Query Runner:** purple triangular character; can run, launch, point, inspect, or guide.
- **Dori — The Core Engine:** cyan capsule character; can compute, operate, inspect, compare, or guide.
- **Flux — The Data Explorer:** mint-green diagonal capsule character; can search, investigate, connect, inspect, or guide.

### Randomize Mascot Selection

After applying the semantic-role test, count only the images that need a mascot and do not already have a user-specified character. Randomize those slots by running the bundled selector once from the skill directory:

```bash
python3 scripts/select_mascot.py --count <number-of-unspecified-mascot-slots>
```

Assign the returned names to the mascot-bearing images in output order. For a single image, omit `--count` or pass `--count 1`.

The selector creates a fresh system-random order on every invocation. In a batch, it uses every character once before reshuffling and avoids the same character on adjacent slots. Use its output exactly: do not replace or rerun a valid result because another mascot seems more suitable for the scene. Do not run the selector for images that fail the semantic-role test.

Inspect `assets/meet-d-crew.jpg` with an image-viewing tool whenever a mascot will appear. Use it as the identity reference and preserve the selected character's silhouette, body color, face, and simple black limbs. Translate the character into the illustration style instead of copying the reference card layout or its surrounding text.

## Compose the Image Prompt

Build a structured prompt with these fields:

```text
Use case: infographic-diagram
Asset type: Apache Doris technical article illustration
Primary request: <content and relationships from the user's brief>
Scene/backdrop: <only what is needed to explain the content>
Subject: <main concepts, icons, arrows, and the mascot's action if included>
Style/medium: <the canonical style from references/visual-style.md>
Composition/framing: landscape 1200 x 630 with a clear reading order and generous margins
Text (verbatim): <exact English labels, or "No text">
Color palette: <the canonical palette from references/visual-style.md>
Constraints: technically faithful; readable labels; consistent icon scale; clear arrow direction; no extra text; no watermark; no photorealism; no 3D
Avoid: decorative clutter; dense paragraphs; tiny labels; unrelated logos; mascot use without a semantic role
```

If using the D-Crew reference, add:

```text
Input images: Image N is the D-Crew identity reference. Use only the selected mascot; do not reproduce the reference poster, logo lockup, cards, headings, or descriptive copy.
Character consistency: preserve the selected mascot's recognizable geometry, color, face, and limbs; render it with the same hand-drawn marker linework as the rest of the illustration.
```

If the user also supplies a composition reference, identify each input image by number and role. Preserve the composition's information architecture without copying irrelevant artifacts.

## Generate and Review

1. Use the built-in image-generation tool by default.
2. For a new image without a mascot or other supplied image reference, omit all reference-image parameters.
3. When using a local mascot or composition reference, pass the required local files through `referenced_image_paths` and describe each image's role explicitly.
4. Save the final image in the user's project or requested destination as a PNG with a descriptive filename.
5. Inspect the result at full resolution. Verify:
   - all requested concepts and relationships are present;
   - arrow directions and process order are correct;
   - every label is English, legible, and spelled correctly;
   - no unrequested wording appears;
   - the mascot decision adds meaning, and the chosen character follows the random rotation or the user's explicit request;
   - the image follows the canonical palette, background, linework, and dimensions.
6. If any verification fails, refine the smallest necessary area and inspect again.

## Invocation Examples

```text
$doris-img-gen Show a query diagnosis loop with the exact labels "Hypothesis", "Evidence", "Observation", and "Elimination". A data investigator reviews profile, plan, chart, and checklist evidence.
```

```text
$doris-img-gen Draw a left-to-right Doris data flow from client to FE to BE to object storage. Use no mascot and no text beyond the component labels.
```
