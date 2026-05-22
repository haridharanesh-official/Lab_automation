# LabOS Back Camera Labeling Rulebook

This rulebook defines the labeling standard for the back-camera people-detection dataset used by LabOS automation.

## Class List

Use one class only:

```text
0 person
```

## What To Label

- Label only real humans as `person`.
- Label standing people.
- Label sitting people.
- Label people bending, walking, entering, and exiting.
- Label far or small people if they are clearly visible.
- Label partially visible people when the visible region is clearly human.
- Label people behind desks or tables by boxing only the visible human body region.
- Label groups with one box per visible person.
- Label motion-blurred people when they are still clearly human.

## What Not To Label

Do not label:

- chairs
- bags
- tables
- monitors
- posters
- shadows
- reflections
- fans
- lab equipment
- mannequins or human-like objects that are not real humans
- wall patterns
- hanging clothes or bags
- door frames
- windows or window reflections

## Box Quality Rules

- Draw tight boxes around the visible human body region.
- Do not include large areas of desk, table, chair, or background.
- For occluded people, box only the visible human part.
- If only a tiny unclear body part is visible, skip it unless it is clearly human.
- Keep labeling style consistent across train, validation, and test.

## Negative Images

- Empty lab images must be included.
- Empty lab images must have empty `.txt` label files.
- Object-heavy scenes without people are valuable negatives.
- Do not label false-positive objects as people.

## Split Safety

- Do not train on test images.
- Split by video or time block, not by random individual frames only.
- Keep near-duplicate adjacent frames in the same split.
- Use the test split only for final unbiased evaluation.

