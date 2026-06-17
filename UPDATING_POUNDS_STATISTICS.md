# Updating Pounds Statistics

This guide explains how to update the pounds of clothing collected statistics on the Slopes to Hope website.

## Quick Reference

**Current Value**: 8,371 pounds (as of January 2026)

**Files to Update**:
- `index.html` (2 locations)

## Manual Update Instructions

To update the pounds statistics manually, you need to edit the `index.html` file in two locations:

### Location 1: Counter Animation (Line ~3532)

Find this line:
```html
<span class="elementor-counter-number" data-duration="2500" data-to-value="8371" data-from-value="0" data-delimiter=",">0</span>
```

Update the `data-to-value` attribute with the new number (without commas):
```html
data-to-value="NEW_VALUE_HERE"
```

**Example**: To update to 10,000 pounds:
```html
<span class="elementor-counter-number" data-duration="2500" data-to-value="10000" data-from-value="0" data-delimiter=",">0</span>
```

### Location 2: Progress Bar Display (Line ~3649)

Find this line:
```html
<div class="eael-progressbar-title">8,371 pounds</div>
```

Update the number with proper comma formatting:
```html
<div class="eael-progressbar-title">NEW_VALUE pounds</div>
```

**Example**: To update to 10,000 pounds:
```html
<div class="eael-progressbar-title">10,000 pounds</div>
```

## Using AI Agent to Update

If you're using an AI coding agent (like GitHub Copilot), you can provide this simple instruction:

```
Update the pounds statistics to [NEW_VALUE] in the index.html file.
There are two locations that need updating:
1. The data-to-value attribute in the counter (no commas)
2. The progress bar title text (with comma formatting)
```

## Finding the Locations with grep

You can quickly find the current values using this command:

```bash
grep -n "data-to-value\|eael-progressbar-title.*pounds" index.html
```

This will show you both lines that need updating.

## Verification Steps

After updating, verify the changes:

1. **Check the counter animation**:
   ```bash
   grep "data-to-value=" index.html | grep -o 'data-to-value="[0-9]*"'
   ```
   Should show: `data-to-value="NEW_VALUE"`

2. **Check the progress bar**:
   ```bash
   grep "eael-progressbar-title" index.html | grep "pounds"
   ```
   Should show: `<div class="eael-progressbar-title">NEW_VALUE pounds</div>`

3. **View the website locally** (if possible) to ensure the counter animates correctly

## Important Notes

- **Use comma formatting** in the progress bar display (e.g., "8,371" not "8371")
- **Do NOT use commas** in the `data-to-value` attribute (e.g., "8371" not "8,371")
- The counter will automatically format the number with commas during animation because of `data-delimiter=","`
- Both locations must be updated together to keep the statistics consistent
- The value in `our-story/index.html` (3,052 pounds) is historical data from when the program started and should NOT be changed

## Update History

| Date | New Value | Updated By |
|------|-----------|------------|
| January 2026 | 8,371 | GitHub Copilot |
| Previous | 5,334 | - |

## Related Files

While these files contain references to "pounds," they use generic descriptive text ("thousands of pounds") and do NOT need to be updated when the statistics change:

- `contact-us/index.html` (line 3499)
- `staff/index.html` (line 3291)
- `our-story/index.html` (lines 3581, 3590, 3605, 3651)
- `gallery/index.html` (line 3646)

These are general descriptions about the program's impact and will remain accurate even as the specific numbers grow.
