# Sponsor Management Examples

This file provides practical before/after examples of adding different types of sponsors to the Slopes to Hope website.

## Example 1: Adding a New Individual Donor

### Before
```html
<p style="text-align: center;"><strong>Tom &amp; Debbie Jaskolski</strong></p>
<p style="text-align: center;"><strong>Anonymous</strong></p>
```

### After (Added "Sarah Johnson")
```html
<p style="text-align: center;"><strong>Tom &amp; Debbie Jaskolski</strong></p>
<p style="text-align: center;"><strong>Sarah Johnson</strong></p>
<p style="text-align: center;"><strong>Anonymous</strong></p>
```

**What Changed**: 
- Added a new line for "Sarah Johnson"
- Kept "Anonymous" at the bottom
- Used the same formatting pattern

---

## Example 2: Adding a Grant Organization with Link

### Before
```html
<p style="text-align: center;"><strong><a href="https://www.boulderflatironsrotary.org/">Rotary Club of Boulder Flat Irons</a></strong></p>
<p style="text-align: center;"><span style="font-weight: bolder;">Lisa Strauss</span></p>
```

### After (Added "Summit Foundation")
```html
<p style="text-align: center;"><strong><a href="https://www.boulderflatironsrotary.org/">Rotary Club of Boulder Flat Irons</a></strong></p>
<p style="text-align: center;"><a href="https://www.summitfoundation.org/"><strong>Summit Foundation</strong></a></p>
<p style="text-align: center;"><span style="font-weight: bolder;">Lisa Strauss</span></p>
```

**What Changed**:
- Added new organization between the last Rotary Club and first individual donor
- Included clickable link to their website
- Followed the pattern of other linked organizations

---

## Example 3: Adding a Hotel Partner

### Before
```html
<p><strong>Beaver Run Resort</strong></p>
<p><strong>Breckenridge Ski Resort</strong></p>
</div>
```

### After (Added "Copper Mountain Resort")
```html
<p><strong>Beaver Run Resort</strong></p>
<p><strong>Breckenridge Ski Resort</strong></p>
<p><strong>Copper Mountain Resort</strong></p>
</div>
```

**What Changed**:
- Added new resort at the end of the list
- No center alignment needed (this section is left-aligned)
- Kept the simple bold format

---

## Example 4: Adding a Drop-off Location with Map Link

### Before
```html
<p><strong>Silverthorne Library – 651 Center Circle, Silverthorne <a href="https://maps.app.goo.gl/hTvfHTnQXSkFU77y5">(map)</a></strong></p>
<p><strong>Breckenridge Library – (soon)</strong></p>
```

### After (Breckenridge Library is now open with address)
```html
<p><strong>Silverthorne Library – 651 Center Circle, Silverthorne <a href="https://maps.app.goo.gl/hTvfHTnQXSkFU77y5">(map)</a></strong></p>
<p><strong>Breckenridge Library – 100 N Ridge Street, Breckenridge <a href="https://maps.app.goo.gl/ABC123XYZ456">(map)</a></strong></p>
```

**What Changed**:
- Replaced "(soon)" with actual address
- Added Google Maps link
- Used the same format as other locations

**How to get the map link**:
1. Go to google.com/maps
2. Search for "100 N Ridge Street, Breckenridge, CO"
3. Click the "Share" button
4. Copy the short link (https://maps.app.goo.gl/...)
5. Paste it in the `<a href="">` tag

---

## Example 5: Adding a Nonprofit Recipient

### Before
```html
<p><strong>HAAT Force</strong></p>
<p><strong>Englewood Police Department</strong></p>
</div>
```

### After (Added "Mountain Family Center")
```html
<p><strong>HAAT Force</strong></p>
<p><strong>Englewood Police Department</strong></p>
<p><strong>Mountain Family Center</strong></p>
</div>
```

**What Changed**:
- Added new nonprofit at the end
- Simple format: just organization name in bold
- Each organization on its own line

---

## Example 6: Updating an Existing Sponsor Name

### Before
```html
<p style="text-align: center;"><a href="https://highcountryconservation.org/recycling/recycling-grants/"><span style="color: #0000ff;"><b>High Country Conservation Center</b></span></a></p>
```

### After (Updated organization name)
```html
<p style="text-align: center;"><a href="https://highcountryconservation.org/recycling/recycling-grants/"><span style="color: #0000ff;"><b>High Country Conservation & Recycling Center</b></span></a></p>
```

**What Changed**:
- Updated the organization name
- Kept the same link
- Preserved all formatting (blue color, bold, center alignment)

---

## Example 7: Adding Multiple Sponsors at Once

### Before
```html
<p><strong>Christ's Body Ministries</strong></p>
<p><strong>Crutches 4 Africa</strong></p>
<p><strong>HAAT Force</strong></p>
</div>
```

### After (Added 3 new nonprofits)
```html
<p><strong>Christ's Body Ministries</strong></p>
<p><strong>Crutches 4 Africa</strong></p>
<p><strong>HAAT Force</strong></p>
<p><strong>Mountain Meals on Wheels</strong></p>
<p><strong>Summit County Youth Center</strong></p>
<p><strong>Habitat for Humanity Summit County</strong></p>
</div>
```

**What Changed**:
- Added three new organizations
- Each on a separate line
- Maintained consistent formatting
- Added at the end of the list

---

## Example 8: Adding Sponsor with Special Characters

### Before
```html
<p style="text-align: center;"><strong>Tom &amp; Debbie Jaskolski</strong></p>
```

### After (Added couple with ampersand)
```html
<p style="text-align: center;"><strong>Tom &amp; Debbie Jaskolski</strong></p>
<p style="text-align: center;"><strong>Mike &amp; Sarah O'Brien</strong></p>
```

**What Changed**:
- Used `&amp;` for the ampersand symbol (not just `&`)
- Apostrophe in "O'Brien" doesn't need special encoding
- Maintained all formatting

**Special Character Reference**:
- `&` → `&amp;`
- `<` → `&lt;`
- `>` → `&gt;`
- `"` → `&quot;` (inside attributes)
- `'` → Can be used as-is in text

---

## Common Patterns Summary

| Sponsor Type | Alignment | Link | Special Notes |
|--------------|-----------|------|---------------|
| Individual Donor | center | optional | Use `&amp;` for `&` |
| Organization/Grant | center | yes (recommended) | Can use blue color |
| Resort/Hotel | left | optional | Simpler format |
| Drop-off Location | left | yes (map link) | Include address |
| Nonprofit Recipient | left | no | Just name |

---

## Testing Your Changes

After making any changes:

1. **Save the file** (`Ctrl+S` or `Cmd+S`)
2. **Open in browser**: Double-click `index.html` or open with browser
3. **Scroll to sponsor section**: Check your changes appear correctly
4. **Click all links**: Verify they go to the right websites
5. **Check mobile view**: Resize browser window to mobile size (~375px width)
6. **Validate HTML**: Optional but recommended - use https://validator.w3.org/

---

## Troubleshooting Common Issues

### Issue: Text shows weird characters like `&amp;amp;`
**Cause**: Double-encoded HTML entities  
**Fix**: Use `&amp;` only once for each `&` symbol

### Issue: Link doesn't work
**Cause**: Missing `https://` in URL  
**Fix**: Make sure all URLs start with `https://`

### Issue: Formatting looks different
**Cause**: Missing or incorrect style attributes  
**Fix**: Copy the style attributes from a working example in the same section

### Issue: Sponsor doesn't appear
**Cause**: Likely placed outside the `<div class="elementor-widget-container">` tags  
**Fix**: Make sure your new line is between the opening and closing `</div>` of the container

---

## Quick Validation Checklist

Before saving your changes:

- [ ] Used `&amp;` for all `&` symbols
- [ ] All links start with `https://`
- [ ] Copied formatting from existing sponsors in same section
- [ ] Kept all opening and closing tags (`<p>`, `</p>`, `<strong>`, `</strong>`, etc.)
- [ ] Didn't accidentally delete any `</div>` closing tags
- [ ] Tested in browser
- [ ] Links work correctly
- [ ] Looks good on mobile

---

**For full documentation**, see:
- [SPONSORS.md](./SPONSORS.md) - Complete guide with all details
- [SPONSORS_QUICK_REFERENCE.md](./SPONSORS_QUICK_REFERENCE.md) - Templates and quick reference
