# Sponsor Management - Troubleshooting Guide

This guide helps you fix common issues when adding or updating sponsors on the Slopes to Hope website.

## Quick Diagnostic Questions

**Is the sponsor showing up?**
- ✅ YES → Go to "Formatting Issues"
- ❌ NO → Go to "Sponsor Not Appearing"

**Are links working?**
- ✅ YES → Go to "Visual Issues"
- ❌ NO → Go to "Broken Links"

**Does the page look broken?**
- ❌ YES → Go to "Page Structure Issues"

---

## Sponsor Not Appearing

### Problem: Added sponsor but it's not showing on the page

**Possible Causes:**

1. **Placed outside the container div**
   ```html
   <!-- ❌ WRONG - outside container -->
   </div>
   <p><strong>New Sponsor</strong></p>
   </div>
   
   <!-- ✅ CORRECT - inside container -->
   <p><strong>Existing Sponsor</strong></p>
   <p><strong>New Sponsor</strong></p>
   </div>
   </div>
   ```

2. **File not saved**
   - Press `Ctrl+S` (Windows/Linux) or `Cmd+S` (Mac)
   - Verify file was saved by checking the modification timestamp

3. **Browser cache**
   - Hard refresh: `Ctrl+F5` (Windows/Linux) or `Cmd+Shift+R` (Mac)
   - Or clear browser cache
   - Try opening in incognito/private mode

4. **Wrong section edited**
   - Verify you edited lines 3660-3760 in `index.html`
   - Search for "Thank You!" or "Donors and Grantors" to find the right section

---

## Broken Links

### Problem: Clicking sponsor link goes to 404 or wrong page

**Solutions:**

1. **Missing protocol**
   ```html
   <!-- ❌ WRONG -->
   <a href="www.example.com">
   
   <!-- ✅ CORRECT -->
   <a href="https://www.example.com">
   ```

2. **Typo in URL**
   - Copy-paste the URL from browser address bar
   - Test the link by visiting it first before adding to HTML

3. **Wrong quotation marks**
   ```html
   <!-- ❌ WRONG - curly quotes -->
   <a href="https://www.example.com">
   
   <!-- ✅ CORRECT - straight quotes -->
   <a href="https://www.example.com">
   ```

4. **Link testing checklist**
   ```bash
   # Test the link in browser first
   # Copy exact URL from working page
   # Verify URL starts with https://
   # Make sure URL is inside quotes: href="URL"
   # No spaces in the URL
   ```

---

## Formatting Issues

### Problem: Text alignment is wrong

**Check alignment style:**

```html
<!-- Donors section - centered -->
<p style="text-align: center;"><strong>Name</strong></p>

<!-- Resorts section - left aligned (no style needed) -->
<p><strong>Name</strong></p>
```

| Section | Alignment | Style Attribute |
|---------|-----------|-----------------|
| Donors and Grantors | Center | `style="text-align: center;"` |
| Resorts/Hotels | Left | No style needed |
| Drop-off Locations | Left | No style needed |
| Nonprofit Recipients | Left | No style needed |

### Problem: Text is not bold

```html
<!-- ❌ WRONG - no bold tags -->
<p style="text-align: center;">Sponsor Name</p>

<!-- ✅ CORRECT - with bold tags -->
<p style="text-align: center;"><strong>Sponsor Name</strong></p>
```

### Problem: Blue links showing as black (or vice versa)

**For blue text:**
```html
<a href="URL"><span style="color: #0000ff;"><b>Text</b></span></a>
```

**For black text (default):**
```html
<a href="URL"><strong>Text</strong></a>
```

---

## Special Characters Issues

### Problem: Ampersand shows as `&amp;` or weird characters

**Correct encoding:**

```html
<!-- ❌ WRONG -->
<p><strong>Tom & Jane</strong></p>

<!-- ✅ CORRECT -->
<p><strong>Tom &amp; Jane</strong></p>
```

### Problem: Seeing `&amp;amp;` on the page

**This means double encoding:**
```html
<!-- ❌ WRONG - double encoded -->
<p><strong>Tom &amp;amp; Jane</strong></p>

<!-- ✅ CORRECT - single encoding -->
<p><strong>Tom &amp; Jane</strong></p>
```

### Common HTML Entities Reference

| Character | Display | HTML Code | When to Use |
|-----------|---------|-----------|-------------|
| & | & | `&amp;` | Always in HTML |
| < | < | `&lt;` | Rare in sponsor names |
| > | > | `&gt;` | Rare in sponsor names |
| " | " | `&quot;` | Inside HTML attributes |
| ' | ' | `'` or `&apos;` | Usually fine as-is |

---

## Page Structure Issues

### Problem: Whole section disappeared or page looks broken

**Most likely cause**: Deleted or malformed closing tag

**Check these tags are complete:**

```html
<div class="elementor-widget-container">
  <p style="text-align: center;"><strong>Sponsor 1</strong></p>
  <p style="text-align: center;"><strong>Sponsor 2</strong></p>
</div>  <!-- Don't delete this! -->
```

**If page is broken:**
1. Use `git diff index.html` to see what changed
2. Use `git checkout index.html` to undo all changes
3. Start over more carefully

### Problem: All tags match but still broken

**Validate your HTML:**
1. Go to https://validator.w3.org/#validate_by_input
2. Copy lines 3660-3760 from your `index.html`
3. Paste into the validator
4. Fix any errors it reports

---

## Map Links for Drop-off Locations

### Problem: Map link not working

**Steps to create correct map link:**

1. **Go to Google Maps** (https://maps.google.com)

2. **Search for the address**
   - Example: "400 S. Main Street, Breckenridge, CO"

3. **Click the Share button**
   - It's usually in the left panel

4. **Copy the link**
   - Click "Copy link"
   - Should look like: `https://maps.app.goo.gl/ABC123xyz`
   - NOT like: `https://www.google.com/maps/place/...` (too long)

5. **Use the short link in HTML**
   ```html
   <a href="https://maps.app.goo.gl/ABC123xyz">(map)</a>
   ```

### Problem: Map link is too long

**Shorten it:**
1. On Google Maps, click the Share button
2. Look for "Copy link" or "Short URL"
3. Use the short version (maps.app.goo.gl)

```html
<!-- ❌ WRONG - too long -->
<a href="https://www.google.com/maps/place/400+S+Main+St,+Breckenridge,+CO+80424/@39.4817,-106.0384,17z/">(map)</a>

<!-- ✅ CORRECT - short link -->
<a href="https://maps.app.goo.gl/HeFo5rAMm9zEYuhx9">(map)</a>
```

---

## Git and Version Control Issues

### Problem: Need to undo changes

**Undo all uncommitted changes:**
```bash
git checkout index.html
```

**See what changed:**
```bash
git diff index.html
```

**Undo last commit (but keep changes):**
```bash
git reset HEAD~1
```

### Problem: Accidentally committed wrong changes

```bash
# See recent commits
git log --oneline -5

# Undo last commit but keep changes
git reset HEAD~1

# Or undo and discard changes
git reset --hard HEAD~1
```

---

## Browser Testing Issues

### Problem: Changes show in one browser but not another

**Solution: Clear cache in all browsers**

**Chrome/Edge:**
- Press `Ctrl+Shift+Delete`
- Select "Cached images and files"
- Click "Clear data"

**Firefox:**
- Press `Ctrl+Shift+Delete`
- Select "Cache"
- Click "Clear Now"

**Safari:**
- `Cmd+Option+E` to empty cache

**Or use incognito/private mode:**
- Chrome: `Ctrl+Shift+N` (Windows) or `Cmd+Shift+N` (Mac)
- Firefox: `Ctrl+Shift+P` (Windows) or `Cmd+Shift+P` (Mac)
- Safari: `Cmd+Shift+N`

---

## Mobile Display Issues

### Problem: Looks good on desktop, broken on mobile

**Test mobile view on desktop:**
1. Open the page in browser
2. Press `F12` to open developer tools
3. Click the mobile device icon (usually top-left)
4. Select a phone size (e.g., iPhone 12, Pixel 5)
5. Verify sponsor section looks correct

**Common mobile issues:**
- Text too small: Check if `style="font-size: 8px;"` was accidentally added
- Text cut off: Might need to remove `style="width: 50%;"` if present
- Not centered on mobile: Make sure `style="text-align: center;"` is present for Donors section

---

## Still Having Issues?

### Step-by-Step Debugging Process

1. **Verify the file path**
   ```bash
   pwd
   # Should show: /home/runner/work/FFC-EX-slopestohope.org/FFC-EX-slopestohope.org
   
   ls -l index.html
   # Should show the file exists
   ```

2. **Check what you changed**
   ```bash
   git diff index.html
   ```

3. **Verify HTML structure**
   ```bash
   # Count opening and closing tags
   grep -o '<div' index.html | wc -l
   grep -o '</div>' index.html | wc -l
   # Numbers should match
   ```

4. **Test in browser**
   ```bash
   # Start a simple web server
   python3 -m http.server 8000
   
   # Then open in browser:
   # http://localhost:8000/index.html
   ```

5. **Start fresh if needed**
   ```bash
   git checkout index.html  # Undo all changes
   git status              # Verify clean state
   ```

### Get Help

If you're still stuck:

1. **Review the documentation**
   - [SPONSORS.md](./SPONSORS.md) - Full guide
   - [SPONSORS_QUICK_REFERENCE.md](./SPONSORS_QUICK_REFERENCE.md) - Templates
   - [SPONSORS_EXAMPLES.md](./SPONSORS_EXAMPLES.md) - Examples

2. **Check the example code**
   - Look at existing sponsors in the same section
   - Copy their exact format
   - Just change the name/link

3. **Use version control**
   - Make small changes
   - Test after each change
   - Commit working changes: `git commit -m "Added [sponsor]"`
   - Easy to rollback if needed

---

## Prevention Tips

### Best Practices to Avoid Issues

1. **Always make a backup first**
   ```bash
   cp index.html index.html.backup
   ```

2. **Make one change at a time**
   - Add one sponsor
   - Test it
   - Then add the next one

3. **Use a good text editor**
   - VS Code, Sublime Text, or Notepad++
   - NOT Microsoft Word or Google Docs
   - Enables syntax highlighting

4. **Copy existing patterns**
   - Find a similar sponsor
   - Copy the entire line
   - Just change the text/link

5. **Test before committing**
   - Open in browser
   - Click all links
   - Check mobile view
   - Validate HTML

6. **Commit often**
   ```bash
   git add index.html
   git commit -m "Add XYZ sponsor to donors section"
   git push
   ```

---

## Emergency Rollback

### If everything is broken and you need to start over:

```bash
# See recent commits
git log --oneline -5

# Go back to last working commit
git reset --hard HEAD

# Or go back multiple commits
git reset --hard HEAD~2  # Goes back 2 commits

# Force push if already pushed broken changes
git push --force
```

**Warning**: `--force` overwrites remote changes. Only use if you're sure!

---

**Quick Links:**
- [Main Guide](./SPONSORS.md)
- [Quick Reference](./SPONSORS_QUICK_REFERENCE.md)
- [Examples](./SPONSORS_EXAMPLES.md)
