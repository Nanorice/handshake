# Handshake Design System

**Version**: 2.0 (Post-UI/UX Overhaul)  
**Last Updated**: December 2024  
**Status**: Complete Theme System Implementation

## 🎨 Overview

The Handshake design system provides a comprehensive foundation for building consistent, accessible, and beautiful user interfaces across the platform. Our design system emphasizes modern aesthetics, responsive behavior, and seamless theme switching between light and dark modes.

## 🌈 Color System

### **Theme Structure**
Our application supports both light and dark themes with persistent user preferences stored in localStorage.

#### **Dark Theme (Default)**
```css
Primary Background: #0d1117    /* GitHub-inspired dark */
Card Background:   #161b22     /* Elevated surfaces */
Text Primary:      #ffffff     /* High contrast text */
Text Secondary:    #8b949e     /* Subdued text */
Border:           #30363d      /* Subtle borders */
Accent:           #238636      /* Green accent (GitHub-inspired) */
Accent Hover:     #2ea043      /* Hover states */
```

#### **Light Theme**
```css
Primary Background: #ffffff    /* Clean white */
Card Background:   #f8f9fa     /* Subtle gray background */
Text Primary:      #24292f     /* Dark text */
Text Secondary:    #656d76     /* Gray text */
Border:           #d0d7de      /* Light borders */
Accent:           #0969da      /* Blue accent */
Accent Hover:     #0550ae      /* Hover states */
```

### **Gradient System**
Used for hero text and special emphasis:

#### **Dark Mode Gradients**
```css
Hero Gradient: linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #ec4899 100%)
```

#### **Light Mode Gradients**
```css
Hero Gradient: linear-gradient(135deg, #0969da 0%, #6f42c1 50%, #d63384 100%)
```

### **Form-Specific Colors**
```css
Input Background: Same as primary background
Input Border:     Same as border color
Input Focus:      Same as accent color
Shadow:          rgba(0, 0, 0, 0.3) dark / rgba(0, 0, 0, 0.1) light
```

## 📱 Responsive Design

### **Breakpoints**
```css
Mobile:     < 768px   /* Mobile-first approach */
Tablet:     768px+    /* Tablet and small desktop */
Desktop:    1024px+   /* Large desktop */
Wide:       1200px+   /* Ultra-wide screens */
```

### **Responsive Utilities**
```css
/* Adaptive sizing using clamp() */
Font Size:    clamp(min, preferred, max)
Padding:      clamp(16px, 4vw, 32px)
Margins:      clamp(20px, 3vw, 32px)
Hero Text:    clamp(48px, 8vw, 80px)
```

### **Navigation Behavior**
- **Desktop (≥768px)**: Full horizontal navigation with all links visible
- **Mobile (<768px)**: Hamburger menu with collapsible navigation
- **Auto-responsive**: Menu automatically adapts on window resize

## 🖋️ Typography

### **Font Family**
```css
Primary: "Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif
```

### **Font Scale**
```css
Hero Title:     clamp(48px, 8vw, 80px)    /* Main landing title */
Page Title:     clamp(28px, 5vw, 48px)    /* Section headers */
Body Large:     18px                       /* Important content */
Body:           16px                       /* Standard content */
Body Small:     14px                       /* Secondary content */
Caption:        12px                       /* Fine print */
Button:         14px - 16px                /* Interactive elements */
```

### **Font Weights**
```css
Light:    400   /* Body text */
Medium:   500   /* Emphasis */
Semibold: 600   /* Headings */
Bold:     700   /* Hero titles */
```

## 🧩 Component Patterns

### **Card Components**
```css
Background:    theme.cardBg
Border:        1px solid theme.border
Border Radius: 8px - 12px
Shadow:        theme.shadow
Padding:       16px - 24px
```

### **Button Variants**

#### **Primary Button**
```css
Background:    theme.accent
Color:         #ffffff
Border:        none
Border Radius: 6px - 8px
Padding:       8px 16px (small) / 16px 32px (large)
Hover:         theme.accentHover + translateY(-1px)
Shadow:        theme.shadow with accent color
```

#### **Secondary Button**
```css
Background:    theme.cardBg
Color:         theme.text
Border:        1px solid theme.border
Hover:         Darker background
```

### **Form Elements**

#### **Input Fields**
```css
Background:    theme.inputBg
Border:        1px solid theme.inputBorder
Border Radius: 6px
Padding:       12px
Focus:         Border color changes to theme.inputFocus
Placeholder:   theme.textSecondary
```

#### **Form Layout**
```css
Spacing:       16px between form elements
Label:         8px margin-bottom
Error States:  Red border (#f85149) and text
```

### **Navigation Components**

#### **Navbar**
```css
Background:    theme.navbar.background (with transparency)
Backdrop:      blur(12px)
Border Bottom: 1px solid theme.border
Padding:       16px clamp(16px, 4vw, 32px)
Position:      sticky top: 0
Z-index:       50
```

#### **Mobile Menu**
```css
Background:    theme.cardBg
Shadow:        0 8px 24px theme.shadow
Border Bottom: 1px solid theme.border
Position:      absolute, full width
```

## 🎭 Theme Context Implementation

### **Theme Provider Usage**
```javascript
// Wrap your app with ThemeProvider
import { ThemeProvider } from './contexts/ThemeContext';

function App() {
  return (
    <ThemeProvider>
      <YourAppComponents />
    </ThemeProvider>
  );
}
```

### **Using Theme in Components**
```javascript
import { useTheme } from '../contexts/ThemeContext';

function MyComponent() {
  const { isDarkMode, toggleTheme, ...theme } = useTheme();
  
  return (
    <div style={{
      backgroundColor: theme.bg,
      color: theme.text,
      border: `1px solid ${theme.border}`
    }}>
      Content
    </div>
  );
}
```

### **Theme Toggle Implementation**
```javascript
// Theme toggle button
<button
  onClick={toggleTheme}
  style={{
    background: 'none',
    border: 'none',
    color: theme.textSecondary,
    cursor: 'pointer'
  }}
>
  {isDarkMode ? <SunIcon /> : <MoonIcon />}
</button>
```

## 🔄 Animation & Transitions

### **Standard Transitions**
```css
Default:       all 0.2s ease
Hover Effects: transform, background-color, box-shadow
Button Hover:  translateY(-1px) + enhanced shadow
Theme Switch:  transition: none (for instant theme changes)
```

### **Micro-Interactions**
- **Button Hover**: Slight elevation with enhanced shadow
- **Card Hover**: Subtle transform and shadow increase
- **Input Focus**: Border color change with smooth transition
- **Menu Toggle**: Smooth slide animations for mobile menu

## 📐 Layout Patterns

### **Container Patterns**
```css
Max Width:     1200px
Margin:        0 auto
Padding:       clamp(16px, 4vw, 32px)
```

### **Grid Layouts**
```css
/* Responsive grid */
display: grid;
grid-template-columns: windowWidth >= 768px ? '1fr 1fr' : '1fr';
gap: clamp(40px, 8vw, 80px);
```

### **Flex Patterns**
```css
/* Common flex utilities */
display: flex;
align-items: center;
justify-content: space-between;
gap: clamp(20px, 3vw, 32px);
```

## 🎯 Accessibility

### **Color Contrast**
- All text meets WCAG 2.1 AA standards
- Focus indicators are clearly visible
- Interactive elements have sufficient contrast

### **Interactive Elements**
- Minimum 44px touch targets on mobile
- Clear focus states for keyboard navigation
- Semantic HTML structure

### **Responsive Text**
- Text scales appropriately across devices
- Reading widths don't exceed 75 characters
- Line height optimized for readability

## 🔧 Implementation Guidelines

### **Component Creation**
1. **Use Theme Context**: Always consume theme values via `useTheme()`
2. **Responsive First**: Design for mobile, enhance for desktop
3. **Consistent Spacing**: Use `clamp()` for adaptive spacing
4. **Semantic HTML**: Use appropriate HTML elements for accessibility

### **Styling Approach**
```javascript
// Preferred: Inline styles with theme values
style={{
  backgroundColor: theme.cardBg,
  border: `1px solid ${theme.border}`,
  borderRadius: '8px',
  padding: '16px'
}}

// Alternative: CSS classes with CSS variables
className="card-style"
```

### **Theme-Aware Development**
- Test both light and dark themes during development
- Ensure gradient text renders properly during theme switches
- Use theme-aware shadows and borders
- Implement smooth transitions where appropriate

## 📱 Mobile-Specific Patterns

### **Touch Interactions**
- Minimum 44px touch targets
- Generous padding for finger-friendly interactions
- Swipe gestures where appropriate

### **Mobile Navigation**
- Hamburger menu pattern for space efficiency
- Auto-collapse on screen resize
- Thumb-friendly menu placement

### **Mobile Typography**
- Larger base font sizes for mobile readability
- Optimized line spacing for small screens
- Reduced text density on mobile

## 🚀 Future Enhancements

### **Planned Additions**
- [ ] Component library documentation
- [ ] Animation library integration
- [ ] Advanced accessibility features
- [ ] Custom icon system
- [ ] Micro-interaction patterns

### **Optimization Targets**
- [ ] CSS-in-JS performance optimization
- [ ] Bundle size reduction
- [ ] Enhanced mobile performance
- [ ] Progressive enhancement patterns

---

*This design system is a living document that evolves with the platform. All changes should be documented and communicated to the development team.*