# Cooking Skills Video ID Update Guide

## Problem
Many video IDs in `src/components/CookingSkills.jsx` are showing "Video unavailable" or incorrect content. We need 100% accuracy for each technique.

## Solution: Manual Verification Process

### Step 1: Find the Correct Video
For each cooking technique, follow these steps:

1. **Search YouTube** for the specific technique:
   - Example searches:
     - "knife skills tutorial"
     - "how to sauté vegetables"
     - "roasting technique cooking"
     - "braising meat tutorial"

2. **Look for reputable channels:**
   - ✅ Gordon Ramsay
   - ✅ Jamie Oliver
   - ✅ Bon Appétit
   - ✅ Food Network
   - ✅ Serious Eats
   - ✅ Tasty
   - ✅ Basics with Babish
   - ✅ Pro Home Cooks
   - ✅ Epicurious

3. **Verify the video:**
   - ✅ Is it actually about the technique?
   - ✅ Is it educational/instructional?
   - ✅ Is it high quality and clear?
   - ✅ Does it match the skill level (beginner/intermediate/advanced)?

### Step 2: Get the Video ID

1. Open the YouTube video
2. Look at the URL: `https://www.youtube.com/watch?v=VIDEO_ID_HERE`
3. Copy **only** the part after `v=`
   - Example: If URL is `https://www.youtube.com/watch?v=LtSdCnl7u34`
   - Video ID is: `LtSdCnl7u34`

### Step 3: Update the Code

1. Open `src/components/CookingSkills.jsx`
2. Find the technique in the `COOKING_TECHNIQUES` object
3. Replace the `videoId` value with the new one
4. Update the comment to note the source

Example:
```javascript
'Knife Skills': {
  level: 'beginner',
  // ... other properties ...
  videoId: 'LtSdCnl7u34', // Gordon Ramsay - Mastering Cooking Techniques
  // ... rest of properties ...
},
```

### Step 4: Test

1. Save the file
2. Refresh your app
3. Click on the technique
4. Verify the video:
   - ✅ Loads correctly
   - ✅ Is about the correct technique
   - ✅ Is educational and helpful
   - ✅ Plays in-app (doesn't redirect)

## Current Techniques Needing Verification

### Beginner Level
- [ ] Knife Skills - Current: `LtSdCnl7u34`
- [ ] Sautéing - Current: `6LDswBUN21o`
- [ ] Boiling - Current: `1c06xOF4uQ8`
- [ ] Steaming - Current: `Jj1fhYZJjek`

### Intermediate Level
- [ ] Roasting - Current: `2XqFv4Iu7l8`
- [ ] Braising - Current: `3yXn1N9RrjQ`
- [ ] Grilling - Current: `3yXn1N9RrjQ`
- [ ] Baking - Current: `1a3XQj2W8wA`
- [ ] Poaching - Current: `UMiCy8EH1go`
- [ ] Searing - Current: `I6T8n1I1j5A`
- [ ] Deglazing - Current: `2XqFv4WCGXo`
- [ ] Blanching - Current: `1APZzH1uH1g`
- [ ] Caramelizing - Current: `UMiCy8EH1go`

### Advanced Level
- [ ] Sous Vide - Current: `3yXn1N9RrjQ`
- [ ] Confit - Current: `1APZzH1uH1g`
- [ ] Emulsification - Current: `3yXn1N9RrjQ`
- [ ] Flambé - Current: `1APZzH1uH1g`
- [ ] Smoking - Current: `1APZzH1uH1g`
- [ ] Tempering - Current: `1a3XQj2W8wA`
- [ ] Spherification - Current: `Jg4JbWnJt0Q`

## Recommended Video Sources

### Gordon Ramsay
- Channel: `gordonramsay`
- Great for: Knife skills, basic techniques, professional methods

### Jamie Oliver
- Channel: `jamieoliver`
- Great for: Beginner-friendly techniques, simple explanations

### Bon Appétit
- Channel: `bonappetitmag`
- Great for: Modern techniques, detailed explanations

### Food Network
- Multiple channels
- Great for: Professional techniques, variety of styles

### Serious Eats
- Channel: `seriouseats`
- Great for: Scientific explanations, technique deep-dives

## Quick Test Checklist

For each video, verify:
- [ ] Video loads without errors
- [ ] Content matches the technique name
- [ ] Video is educational/instructional
- [ ] Quality is good (clear audio/video)
- [ ] Length is appropriate (not too short/long)
- [ ] Skill level matches (beginner/intermediate/advanced)
- [ ] Video plays in-app (doesn't redirect to YouTube)

## Notes

- Some video IDs may be duplicates (same video covering multiple techniques)
- This is okay if the video actually covers all those techniques
- If a video is unavailable, mark it in the checklist above
- Update this document as you verify each video

## Alternative: Use a Video Search API

If you want to automate this in the future, consider:
- YouTube Data API v3
- Search for videos by technique name
- Filter by channel, view count, duration
- Automatically update video IDs

But for now, manual verification ensures 100% accuracy!

