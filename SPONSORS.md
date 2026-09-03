# Sponsor Management Guide

## Overview

This guide explains how to manually add and update sponsors, donors, partners, and other organizations on the Slopes to Hope website without needing AI assistance.

The website is a **static HTML export from WordPress with Elementor**, so all sponsor information is hardcoded in the `index.html` file.

## 📚 Documentation Suite

This is the **main comprehensive guide**. Also available:

- 🚀 **[SPONSORS_QUICK_REFERENCE.md](./SPONSORS_QUICK_REFERENCE.md)** - Quick copy-paste templates (30 seconds)
- 📖 **[SPONSORS_EXAMPLES.md](./SPONSORS_EXAMPLES.md)** - Before/after examples for common tasks
- 🔧 **[SPONSORS_TROUBLESHOOTING.md](./SPONSORS_TROUBLESHOOTING.md)** - Fix common issues

**New to this?** Start with the Quick Reference, then come back here for details.

## Quick Reference

### Sponsor Sections in index.html

| Section | Line Numbers | Purpose |
|---------|-------------|---------|
| **Donors and Grantors** | 3660-3683 | Grant funders and individual donors |
| **Participating Resorts & Hotels** | 3684-3707 | Partner resorts and hotels |
| **Drop-off Locations** | 3713-3729 | Donation drop-off sites |
| **Nonprofit Recipients** | 3730-3753 | Organizations that receive donations |

## How to Add/Update Sponsors

### Step 1: Open the File

Open `/index.html` in any text editor (VS Code, Sublime, Notepad++, etc.)

### Step 2: Find the Right Section

Use your text editor's "Find" function (Ctrl+F or Cmd+F) to locate the section:

- For **donors/grantors**: Search for `"Thank You!"` or `"Donors and Grantors"`
- For **resorts/hotels**: Search for `"Participating"`
- For **drop-off locations**: Search for `"Drop-off Locations"`
- For **nonprofits**: Search for `"Nonprofit Recipients"`

### Step 3: Add Your Sponsor

Copy one of the existing sponsor lines and modify it with your new sponsor's information.

## Detailed Examples

### Example 1: Adding a New Individual Donor

**Location**: Lines 3666-3683 (Donors and Grantors section)

**Current code:**
```html
<div class="elementor-widget-container">
  <p style="text-align: center;"><strong>Lisa Strauss</strong></p>
  <p style="text-align: center;"><strong>Eric Bahr</strong></p>
  <p style="text-align: center;"><strong>Joyce &amp; Allyn Mosher</strong></p>
  <p style="text-align: center;"><strong>Tom &amp; Debbie Jaskolski</strong></p>
  <p style="text-align: center;"><strong>Anonymous</strong></p>
</div>
```

**To add "Jane Smith" as a new donor:**
```html
<div class="elementor-widget-container">
  <p style="text-align: center;"><strong>Lisa Strauss</strong></p>
  <p style="text-align: center;"><strong>Eric Bahr</strong></p>
  <p style="text-align: center;"><strong>Joyce &amp; Allyn Mosher</strong></p>
  <p style="text-align: center;"><strong>Tom &amp; Debbie Jaskolski</strong></p>
  <p style="text-align: center;"><strong>Jane Smith</strong></p>
  <p style="text-align: center;"><strong>Anonymous</strong></p>
</div>
```

**Key points:**
- Add a new `<p>` line with the donor's name
- Keep `style="text-align: center;"` for consistency
- Use `<strong>` tags to make text bold
- Keep "Anonymous" at the bottom if it exists

---

### Example 2: Adding an Organization with a Link

**Location**: Lines 3666-3683 (Donors and Grantors section)

**Current code:**
```html
<p style="text-align: center;"><a href="https://www.friscogov.com/departments/environmental-programs/waste-reduction/frisco-waste-reduction-business-grant/"><strong>Town of Frisco</strong></a></p>
<p style="text-align: center;"><a href="https://highcountryconservation.org/recycling/recycling-grants/"><span style="color: #0000ff;"><b>High Country Conservation Center</b></span></a></p>
```

**To add "Summit County Foundation" with a link:**
```html
<p style="text-align: center;"><a href="https://www.summitfoundation.org/"><strong>Summit County Foundation</strong></a></p>
```

**Or with blue color:**
```html
<p style="text-align: center;"><a href="https://www.summitfoundation.org/"><span style="color: #0000ff;"><b>Summit County Foundation</b></span></a></p>
```

**Key points:**
- Use `<a href="URL">` for clickable links
- Option 1: Use `<strong>` for black text (default link color)
- Option 2: Use `<span style="color: #0000ff;"><b>` for blue text
- Always include the full URL with `https://`

---

### Example 3: Adding a Resort/Hotel Partner

**Location**: Lines 3690-3707 (Participating Resorts, Hotels, Organizations)

**Current code:**
```html
<div class="elementor-widget-container">
  <p><strong>Spinnaker Lake Dillon</strong></p>
  <p><strong>ReSaddled</strong></p>
  <p><strong>Keystone Resort</strong></p>
  <p><strong>Marriott's Mountain Valley Lodge at Breckenridge</strong></p>
</div>
```

**To add "Copper Mountain Resort":**
```html
<div class="elementor-widget-container">
  <p><strong>Spinnaker Lake Dillon</strong></p>
  <p><strong>ReSaddled</strong></p>
  <p><strong>Keystone Resort</strong></p>
  <p><strong>Copper Mountain Resort</strong></p>
  <p><strong>Marriott's Mountain Valley Lodge at Breckenridge</strong></p>
</div>
```

**Key points:**
- No `style="text-align: center;"` in this section (left-aligned)
- Each resort on a new `<p>` line
- Use `<strong>` tags for bold text

---

### Example 4: Adding a Drop-off Location with Map Link

**Location**: Lines 3718-3729 (Clothing Donation Drop-off Locations)

**Current code:**
```html
<p><strong>Helly Hansen – 400 S. Main Street, Breckenridge <a href="https://maps.app.goo.gl/HeFo5rAMm9zEYuhx9">(map)</a></strong></p>
<p><strong>U.S. Bank – 130 Ski Hill Road, Breckenridge <a href="https://maps.app.goo.gl/JeTf26LphKStvN827">(map)</a></strong></p>
```

**To add "New Coffee Shop – 123 Main St, Frisco":**

1. First, get a Google Maps link:
   - Go to Google Maps
   - Search for the address
   - Click "Share"
   - Copy the short link (looks like `https://maps.app.goo.gl/XXXXXXXXX`)

2. Then add the code:
```html
<p><strong>New Coffee Shop – 123 Main Street, Frisco <a href="https://maps.app.goo.gl/YOUR_LINK_HERE">(map)</a></strong></p>
```

**Key points:**
- Format: `Name – Address <a href="LINK">(map)</a>`
- Use an en dash (–) between name and address, not a hyphen (-)
- Include a Google Maps short link for the "(map)" text
- Keep everything inside `<strong>` tags

---

### Example 5: Adding a Nonprofit Recipient

**Location**: Lines 3736-3753 (Nonprofit Recipients & Organizations)

**Current code:**
```html
<div class="elementor-widget-container">
  <p><strong>Adopt an Angel – Summit County Rotary Club</strong></p>
  <p><strong>Dillon Community Church</strong></p>
  <p><strong>ReSaddled</strong></p>
</div>
```

**To add "Mountain Youth Collective":**
```html
<div class="elementor-widget-container">
  <p><strong>Adopt an Angel – Summit County Rotary Club</strong></p>
  <p><strong>Dillon Community Church</strong></p>
  <p><strong>Mountain Youth Collective</strong></p>
  <p><strong>ReSaddled</strong></p>
</div>
```

**Key points:**
- Simple format: just the organization name
- Use `<strong>` tags for bold text
- Each organization on a new `<p>` line

---

## Template Library

### Template 1: Simple Name (No Link)
```html
<p style="text-align: center;"><strong>NAME HERE</strong></p>
```

### Template 2: Name with Link (Black Text)
```html
<p style="text-align: center;"><a href="https://URL_HERE"><strong>NAME HERE</strong></a></p>
```

### Template 3: Name with Link (Blue Text)
```html
<p style="text-align: center;"><a href="https://URL_HERE"><span style="color: #0000ff;"><b>NAME HERE</b></span></a></p>
```

### Template 4: Resort/Hotel (Left-Aligned, No Link)
```html
<p><strong>NAME HERE</strong></p>
```

### Template 5: Drop-off Location with Map
```html
<p><strong>NAME HERE – ADDRESS HERE <a href="https://maps.app.goo.gl/LINK_HERE">(map)</a></strong></p>
```

---

## Important Notes

### HTML Special Characters

When typing sponsor names, be aware of these special characters:

| Character | HTML Code | Example |
|-----------|-----------|---------|
| & (ampersand) | `&amp;` | Joyce `&amp;` Allyn Mosher |
| < (less than) | `&lt;` | Price `&lt;` $100 |
| > (greater than) | `&gt;` | Sales `&gt;` 1000 |
| " (quote) | `&quot;` | Say `&quot;Hello`&quot; |

**Example:**
- ❌ Wrong: `<strong>Tom & Debbie</strong>`
- ✅ Correct: `<strong>Tom &amp; Debbie</strong>`

### Alphabetical Order

Consider keeping sponsors in alphabetical order within each category for easier maintenance.

### Testing Your Changes

After editing `index.html`:

1. **Save the file**
2. **Open index.html in a web browser** (double-click the file)
3. **Scroll to the sponsors section** to verify your changes
4. **Check all links work** by clicking them
5. **Test on mobile** by resizing your browser window

### Common Mistakes to Avoid

1. ❌ Forgetting to close tags: `<strong>Name</p>` (missing `</strong>`)
2. ❌ Using wrong quotes: `style='text-align: center;'` (use double quotes `"`)
3. ❌ Breaking existing HTML structure by deleting closing `</div>` tags
4. ❌ Using plain `&` instead of `&amp;`
5. ❌ Forgetting `https://` in links

---

## Full Section Reference

### Complete Donors and Grantors Section (Lines 3660-3683)

```html
<div class="elementor-element elementor-element-5722f67 elementor-widget elementor-widget-text-editor" data-id="5722f67" data-element_type="widget" data-widget_type="text-editor.default">
  <div class="elementor-widget-container">
    <p style="text-align: center;"><strong>Thank You!</strong></p>
    <p style="text-align: center;"><strong>Donors and Grantors</strong></p>
  </div>
</div>
<div class="elementor-element elementor-element-cb3367e elementor-widget elementor-widget-text-editor" data-id="cb3367e" data-element_type="widget" data-widget_type="text-editor.default">
  <div class="elementor-widget-container">
    <p style="text-align: center;"><span style="text-decoration: underline;">&nbsp; &nbsp; &nbsp; &nbsp; &nbsp;</span></p>
    <p style="text-align: center;"><a href="https://www.friscogov.com/departments/environmental-programs/waste-reduction/frisco-waste-reduction-business-grant/"><strong>Town of Frisco</strong></a></p>
    <p style="text-align: center;"><a href="https://highcountryconservation.org/recycling/recycling-grants/"><span style="color: #0000ff;"><b>High Country Conservation Center</b></span></a></p>
    <p style="text-align: center;"><a href="https://portal.clubrunner.ca/2193"><span style="color: #0000ff;"><b>Rotary Club of Denver Southeast</b></span></a></p>
    <p style="text-align: center;"><a href="https://www.vailedwardsrotary.com/"><strong><span style="color: #0000ff;">Rotary Club of Vail Edwards</span></strong></a></p>
    <p style="text-align: center;"><strong><a href="https://www.boulderflatironsrotary.org/">Rotary Club of Boulder Flat Irons</a></strong></p>
    <p style="text-align: center;"><span style="font-weight: bolder;">Lisa Strauss</span></p>
    <p style="text-align: center;"><strong>Eric Bahr</strong></p>
    <p style="text-align: center;"><strong>Joyce &amp; Allyn Mosher</strong></p>
    <p style="text-align: center;"><strong>Tom &amp; Debbie Jaskolski</strong></p>
    <p style="text-align: center;"><strong>Anonymous</strong></p>
  </div>
</div>
```

**To modify**: Edit lines 3669-3681 (between the `<div class="elementor-widget-container">` tags)

---

## Quick Start Checklist

When adding a new sponsor:

- [ ] Determine which category (Donors, Resorts, Drop-offs, or Nonprofits)
- [ ] Find the line numbers for that section
- [ ] Open index.html in a text editor
- [ ] Navigate to the correct line numbers
- [ ] Copy an existing sponsor line
- [ ] Modify the copied line with new sponsor info
- [ ] Save the file
- [ ] Test in a web browser
- [ ] Commit and push changes to GitHub

---

## Getting Help

If you run into issues:

1. **Check your HTML syntax** using an online validator: https://validator.w3.org/
2. **Compare your code** with existing working examples in the file
3. **Revert your changes** if something breaks (use Git to restore the file)
4. **Contact the maintainer** for assistance

---

## Advanced: Using Find & Replace

If you need to update multiple instances of a sponsor name:

1. Open index.html in your text editor
2. Use Find & Replace (Ctrl+H or Cmd+H)
3. Find: `Old Sponsor Name`
4. Replace: `New Sponsor Name`
5. Review each replacement before confirming
6. Save and test

**Warning**: Be careful with Find & Replace - always review changes before saving!

---

## Version Control

After making changes:

```bash
# 1. Check what changed
git diff index.html

# 2. Stage your changes
git add index.html

# 3. Commit with a descriptive message
git commit -m "Add [Sponsor Name] to [Section Name] section"

# 4. Push to GitHub
git push
```

The website will automatically update on GitHub Pages after you push.

---

## Summary

**Key Takeaways:**
- All sponsors are in `index.html` between lines 3660-3760
- Four main sections: Donors, Resorts/Hotels, Drop-offs, Nonprofits
- Copy existing lines and modify them
- Always test changes in a browser before pushing
- Use templates from this guide for consistency

**No AI or complex tools needed** - just a text editor and basic HTML knowledge!

---

## Related Documentation

- 🚀 **[Quick Reference](./SPONSORS_QUICK_REFERENCE.md)** - Templates for common tasks
- 📖 **[Examples Guide](./SPONSORS_EXAMPLES.md)** - Before/after examples  
- 🔧 **[Troubleshooting](./SPONSORS_TROUBLESHOOTING.md)** - Fix common issues
- 📘 **[Main README](./README.md)** - General repository documentation
