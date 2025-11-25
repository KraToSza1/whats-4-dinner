# 🎨 Foodie Animations Guide

## Overview

I've added modern, food-themed animations throughout the app to make it more engaging and delightful. All animations are optimized for performance and respect user preferences (reduced motion).

## New Animation Components

### 1. **FoodAnimations.jsx** - Core Animation Components

#### `FloatingIngredients`

- **Use**: Recipe cards, success states, celebrations
- **Props**: `count` (number of particles), `ingredients` (emoji array)
- **Example**:

```jsx
<FloatingIngredients count={5} ingredients={['🍅', '🥕', '🧄']} />
```

#### `CookingSparkles`

- **Use**: Loading states, cooking timers, active states
- **Props**: `intensity` ("low", "medium", "high")
- **Example**:

```jsx
<CookingSparkles intensity="medium" />
```

#### `SuccessAnimation`

- **Use**: Success confirmations, completed actions
- **Props**: `onComplete` (callback)
- **Example**:

```jsx
<SuccessAnimation onComplete={() => console.log('Done!')} />
```

#### `RecipeCardGlow`

- **Use**: Recipe card hover effects
- **Props**: `isHovered` (boolean)
- **Example**:

```jsx
<RecipeCardGlow isHovered={isHovered} />
```

#### `RecipeImageZoom`

- **Use**: Recipe card image zoom on hover
- **Props**: `isHovered` (boolean), `children` (image element)
- **Example**:

```jsx
<RecipeImageZoom isHovered={isHovered}>
  <img src="..." />
</RecipeImageZoom>
```

#### `CookingTimer`

- **Use**: Timer displays with visual progress
- **Props**: `seconds` (number), `size` (number)
- **Example**:

```jsx
<CookingTimer seconds={30} size={60} />
```

#### `IngredientItemAnimation`

- **Use**: Ingredient list items
- **Props**: `index` (number), `children` (ingredient content)
- **Example**:

```jsx
<IngredientItemAnimation index={0}>
  <li>Ingredient text</li>
</IngredientItemAnimation>
```

### 2. **FoodParticles.jsx** - Particle Effects

#### `FoodConfetti`

- **Use**: Celebrations, recipe completion, achievements
- **Props**: `trigger` (number - increment to trigger), `emojis` (array)
- **Example**:

```jsx
const [trigger, setTrigger] = useState(0);
// Trigger confetti
setTrigger(prev => prev + 1);
<FoodConfetti trigger={trigger} />;
```

#### `FloatingFoodBackground`

- **Use**: Background decoration (subtle)
- **Props**: `intensity` ("low", "medium", "high")
- **Example**:

```jsx
<FloatingFoodBackground intensity="low" />
```

#### `CookingSteam`

- **Use**: Cooking states, active preparation
- **Props**: `intensity` ("low", "medium", "high")
- **Example**:

```jsx
<CookingSteam intensity="medium" />
```

#### `IngredientReveal`

- **Use**: Ingredient list animations
- **Props**: `index` (number), `children` (ingredient element)
- **Example**:

```jsx
<IngredientReveal index={0}>
  <li>Ingredient</li>
</IngredientReveal>
```

#### `FoodLoader`

- **Use**: Loading states with food theme
- **Props**: `size` (number)
- **Example**:

```jsx
<FoodLoader size={40} />
```

## Where Animations Are Used

### ✅ RecipeCard.jsx

- **Enhanced hover effects**: Glow and image zoom
- **Favorite button**: Improved animations with particles
- **Badge animations**: Staggered entrance

### ✅ RecipePage.jsx

- **Ingredient list**: Reveal animations with checkmark effects
- **Confetti**: Triggers on ingredient check and recipe completion
- **Smooth transitions**: All sections fade in smoothly

### ✅ GroceryDrawer.jsx

- **List items**: Staggered entrance animations
- **Check animations**: Enhanced checkbox interactions

## Performance Considerations

1. **Reduced Motion**: All animations respect `prefers-reduced-motion`
2. **GPU Acceleration**: Uses `transform` and `opacity` for smooth 60fps
3. **Conditional Rendering**: Particles only render when needed
4. **Lazy Loading**: Animations load on demand

## Customization

### Adjusting Animation Speed

Modify transition durations in component files:

```jsx
transition={{ duration: 0.3 }} // Faster
transition={{ duration: 0.6 }} // Slower
```

### Changing Colors

Update Tailwind classes in components:

```jsx
className = 'bg-emerald-500'; // Change to your color
```

### Disabling Animations

Set `prefers-reduced-motion` in browser settings, or wrap components:

```jsx
{
  !prefersReducedMotion && <FloatingIngredients />;
}
```

## Best Practices

1. **Use sparingly**: Don't over-animate - it can be distracting
2. **Meaningful animations**: Each animation should have a purpose
3. **Performance first**: Test on lower-end devices
4. **Accessibility**: Always respect reduced motion preferences

## Future Enhancements

- [ ] Page transition animations
- [ ] Recipe search result animations
- [ ] Meal planner drag-and-drop animations
- [ ] Cooking mode step-by-step animations
- [ ] Achievement unlock animations

## Troubleshooting

### Animations not showing?

- Check browser console for errors
- Verify framer-motion is installed: `npm list framer-motion`
- Ensure components are wrapped in motion providers

### Performance issues?

- Reduce particle counts
- Lower animation intensity
- Check for too many simultaneous animations

### Animations too fast/slow?

- Adjust `duration` in transition props
- Modify `delay` values for staggered animations
