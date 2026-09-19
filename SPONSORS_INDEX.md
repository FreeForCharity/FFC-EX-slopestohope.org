# Sponsor Management Documentation - Index

## 📚 Complete Documentation Suite

This repository includes comprehensive documentation for managing sponsors on the Slopes to Hope website. Choose the guide that best fits your needs:

---

## 🚀 Quick Start (30 seconds)

**[SPONSORS_QUICK_REFERENCE.md](./SPONSORS_QUICK_REFERENCE.md)**

Perfect for: Quick copy-paste templates when you already know what you're doing.

**Contains:**
- Copy-paste templates for all sponsor types
- Section locations in index.html
- Common mistakes to avoid
- Quick testing process

**Use when:** You need to add a sponsor quickly and just want a template.

---

## 📖 Comprehensive Guide (10 minutes)

**[SPONSORS.md](./SPONSORS.md)**

Perfect for: First-time users or when you need detailed explanations.

**Contains:**
- Step-by-step instructions for all operations
- Detailed examples with code snippets
- HTML special characters reference
- Full section reference with line numbers
- Template library
- Best practices and tips

**Use when:** This is your first time adding sponsors or you want to understand the full process.

---

## 💡 Practical Examples (5 minutes)

**[SPONSORS_EXAMPLES.md](./SPONSORS_EXAMPLES.md)**

Perfect for: Learning by seeing before/after comparisons.

**Contains:**
- 8+ real-world before/after examples
- Adding individual donors
- Adding organizations with links
- Adding resorts/hotels
- Adding drop-off locations with maps
- Updating existing sponsors
- Adding multiple sponsors at once
- Handling special characters

**Use when:** You learn better by example and want to see exactly what changes to make.

---

## 🔧 Troubleshooting (When things go wrong)

**[SPONSORS_TROUBLESHOOTING.md](./SPONSORS_TROUBLESHOOTING.md)**

Perfect for: Fixing issues and debugging problems.

**Contains:**
- Quick diagnostic flowcharts
- Solutions for sponsors not appearing
- Fixing broken links
- Resolving formatting issues
- Special characters problems
- Page structure issues
- Map link creation
- Git version control help
- Emergency rollback procedures

**Use when:** Something isn't working correctly or the page looks broken.

---

## 📋 Quick Decision Guide

**Choose your documentation:**

```
┌─────────────────────────────────────────────────────────────┐
│ What do you need?                                           │
├─────────────────────────────────────────────────────────────┤
│ ☐ Add sponsor quickly with template                        │
│   → SPONSORS_QUICK_REFERENCE.md                             │
│                                                             │
│ ☐ Learn the complete process                               │
│   → SPONSORS.md                                             │
│                                                             │
│ ☐ See examples of changes                                  │
│   → SPONSORS_EXAMPLES.md                                    │
│                                                             │
│ ☐ Fix a problem                                            │
│   → SPONSORS_TROUBLESHOOTING.md                             │
│                                                             │
│ ☐ First time doing this                                    │
│   → Start with SPONSORS.md, then use Quick Reference       │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Common Tasks - Quick Links

### I want to add...

- **A new individual donor** → [SPONSORS_EXAMPLES.md - Example 1](./SPONSORS_EXAMPLES.md#example-1-adding-a-new-individual-donor)
- **An organization with a link** → [SPONSORS_EXAMPLES.md - Example 2](./SPONSORS_EXAMPLES.md#example-2-adding-a-grant-organization-with-link)
- **A resort or hotel partner** → [SPONSORS_EXAMPLES.md - Example 3](./SPONSORS_EXAMPLES.md#example-3-adding-a-hotel-partner)
- **A drop-off location** → [SPONSORS_EXAMPLES.md - Example 4](./SPONSORS_EXAMPLES.md#example-4-adding-a-drop-off-location-with-map-link)
- **A nonprofit recipient** → [SPONSORS_EXAMPLES.md - Example 5](./SPONSORS_EXAMPLES.md#example-5-adding-a-nonprofit-recipient)

### I need to fix...

- **Sponsor not showing up** → [SPONSORS_TROUBLESHOOTING.md - Sponsor Not Appearing](./SPONSORS_TROUBLESHOOTING.md#sponsor-not-appearing)
- **Broken link** → [SPONSORS_TROUBLESHOOTING.md - Broken Links](./SPONSORS_TROUBLESHOOTING.md#broken-links)
- **Wrong formatting** → [SPONSORS_TROUBLESHOOTING.md - Formatting Issues](./SPONSORS_TROUBLESHOOTING.md#formatting-issues)
- **Special characters** → [SPONSORS_TROUBLESHOOTING.md - Special Characters Issues](./SPONSORS_TROUBLESHOOTING.md#special-characters-issues)

---

## 📍 Where Are Sponsors Located?

All sponsor information is in the **`index.html`** file at these line numbers:

| Section | Lines | What Goes Here |
|---------|-------|----------------|
| **Donors and Grantors** | 3660-3683 | Grant funders and individual donors |
| **Participating Resorts & Hotels** | 3684-3707 | Partner resorts and hotels |
| **Drop-off Locations** | 3713-3729 | Donation drop-off sites with maps |
| **Nonprofit Recipients** | 3730-3753 | Organizations receiving donations |

---

## 🎓 Learning Path

**Recommended order for first-time users:**

1. **Start here:** Read [SPONSORS.md - Overview](./SPONSORS.md#overview) (2 minutes)
2. **See examples:** Browse [SPONSORS_EXAMPLES.md](./SPONSORS_EXAMPLES.md) (5 minutes)
3. **Try it:** Use [SPONSORS_QUICK_REFERENCE.md](./SPONSORS_QUICK_REFERENCE.md) to add a test sponsor (3 minutes)
4. **Bookmark:** Keep [SPONSORS_TROUBLESHOOTING.md](./SPONSORS_TROUBLESHOOTING.md) handy in case of issues

After the first time, you'll only need the Quick Reference!

---

## 🔑 Key Concepts

**Three most important things to remember:**

1. **Use `&amp;` not `&`** - For names like "Tom & Jane" write "Tom &amp; Jane"
2. **Include `https://`** - All links must start with `https://`
3. **Test before committing** - Open index.html in a browser to verify changes

---

## 📞 Need More Help?

1. Check the [Troubleshooting Guide](./SPONSORS_TROUBLESHOOTING.md)
2. Review the [Examples](./SPONSORS_EXAMPLES.md) for similar cases
3. Read the [Complete Guide](./SPONSORS.md) for detailed explanations
4. Contact the repository maintainers if still stuck

---

## 🔄 Quick Reference

**Common HTML patterns:**

```html
<!-- Individual donor (centered) -->
<p style="text-align: center;"><strong>NAME</strong></p>

<!-- Organization with link (centered, blue) -->
<p style="text-align: center;"><a href="https://URL"><span style="color: #0000ff;"><b>NAME</b></span></a></p>

<!-- Resort/hotel (left-aligned) -->
<p><strong>NAME</strong></p>

<!-- Drop-off with map (left-aligned) -->
<p><strong>NAME – ADDRESS <a href="https://maps.app.goo.gl/LINK">(map)</a></strong></p>
```

---

**Document Version:** 1.0.0  
**Last Updated:** January 2026  
**Maintained By:** Free For Charity  
**Website:** [Slopes to Hope](https://slopestohope.com)
