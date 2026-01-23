# Sponsor Management - Quick Reference Card

## 🎯 In 30 Seconds

1. Open `index.html` in any text editor
2. Search for the section you need (Ctrl+F)
3. Copy an existing sponsor line
4. Change the name/link
5. Save and test in browser

---

## 📍 Where to Find Each Section

| What You're Adding | Search For | Line Numbers |
|-------------------|------------|--------------|
| Grant funder | "Donors and Grantors" | 3660-3683 |
| Individual donor | "Donors and Grantors" | 3660-3683 |
| Resort/Hotel | "Participating" | 3684-3707 |
| Drop-off location | "Drop-off Locations" | 3713-3729 |
| Nonprofit recipient | "Nonprofit Recipients" | 3730-3753 |

---

## 📋 Copy-Paste Templates

### Individual Donor (No Link)
```html
<p style="text-align: center;"><strong>DONOR NAME</strong></p>
```

### Organization with Link
```html
<p style="text-align: center;"><a href="https://WEBSITE_URL"><strong>ORGANIZATION NAME</strong></a></p>
```

### Resort/Hotel Partner
```html
<p><strong>RESORT NAME</strong></p>
```

### Drop-off Location with Map
```html
<p><strong>LOCATION NAME – ADDRESS <a href="https://maps.app.goo.gl/MAP_LINK">(map)</a></strong></p>
```

### Nonprofit Recipient
```html
<p><strong>NONPROFIT NAME</strong></p>
```

---

## ⚠️ Remember

- **Always use** `&amp;` for the `&` symbol (e.g., "Tom &amp; Jane")
- **Keep** `<strong>` tags for bold text
- **Test** changes in browser before publishing
- **Use** full URLs with `https://`

---

## 🧪 Testing Process

1. Save `index.html`
2. Double-click `index.html` to open in browser
3. Scroll to your section
4. Click links to verify they work
5. Check on mobile (resize browser)

---

## 🔧 Fix Common Issues

**Problem**: Ampersand (&) shows as weird characters
- **Solution**: Replace `&` with `&amp;`

**Problem**: Link doesn't work
- **Solution**: Make sure URL starts with `https://`

**Problem**: Text not showing up
- **Solution**: Check you didn't delete a closing tag (`</strong>`, `</p>`, `</div>`)

---

## 📤 Publishing Changes

```bash
git add index.html
git commit -m "Add [Name] to sponsors"
git push
```

Site updates automatically on GitHub Pages!

---

**Full guide**: See `SPONSORS.md` for detailed examples and troubleshooting.
