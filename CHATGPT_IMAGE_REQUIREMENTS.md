# Image Requirements for ChatGPT

## ⚠️ CRITICAL: JPEG Only, ≤100KB

**ChatGPT must generate images with these EXACT specifications:**

### Format
- ✅ **JPEG ONLY** (`.jpg` or `.jpeg`)
- ❌ **NO PNG** - PNG files are too large and kill PWA performance

### File Size
- ✅ **≤100KB** (must be compressed to 100KB or less)
- ❌ **NO files >100KB** - Will break PWA performance

### Resolution
- ✅ **1024×1024 pixels** (exactly)

### Style
- ✅ **Pinterest-style soft natural lighting** (Style #5)
- ✅ **Professional food photography**
- ✅ **Appetizing presentation**
- ✅ **Food only** - NO overlays, NO text, NO titles

### Background
- ✅ Light rustic / natural / soft gradient backgrounds allowed
- ❌ NO busy backgrounds that distract from food

---

## How to Generate

1. **Generate JSON first** (includes image prompt)
2. **User imports JSON** → Saves recipe
3. **User asks**: "Generate image for this recipe"
4. **You generate**: JPEG (1024×1024, ≤100KB) using the image prompt from JSON
5. **User uploads**: JPEG file to Recipe Editor

---

## Why These Requirements

- **PWA Performance**: Large PNG files (>500KB) kill mobile app performance
- **Storage Costs**: Smaller files = faster loading = better UX
- **Consistency**: 1024×1024 ensures uniform grid display
- **Quality**: JPEG ≤100KB still looks great when properly compressed

---

## Example Image Prompt (from JSON)

```
"A delicious linguine with three colors vegetables and pesto sauce, professionally photographed, appetizing presentation, food photography style, Pinterest-style soft natural lighting, 1024x1024"
```

**You generate**: JPEG file matching this prompt, 1024×1024, ≤100KB

---

**Remember**: JPEG ≤100KB is NON-NEGOTIABLE. PNG files will break the PWA! ⚠️

