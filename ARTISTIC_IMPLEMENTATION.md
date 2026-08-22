# Artistic Difficulty Judging System - Implementation Summary

## Overview
A complete electronic judging system for rhythmic gymnastics artistic difficulty scoring, compliant with the 2025-2028 Scoring Code. The system features two stages for comprehensive artistic evaluation during and after the routine.

## Architecture

### Technology Stack
- **Frontend**: HTML5, CSS3, JavaScript (ES Modules)
- **Build Tool**: Vite (for development server)
- **Design System**: Custom CSS with CSS variables for theming
- **State Management**: Single state object with real-time calculations

### File Structure
```
app_gr_2/
├── index.html
├── package.json
├── src/
│   ├── main.js       (Core application logic)
│   └── styles.css    (UI styling and layout)
└── ARTISTIC_IMPLEMENTATION.md
```

## Features

### Stage 1: During Routine Evaluation
Real-time penalty tracking as the routine progresses.

#### Penalty Buttons
1. **CONNECTION PENALTY**
   - Deduction: -0.1 per click
   - Maximum: 2.0 points
   - Counter-based tracking

2. **RHYTHM PENALTY**
   - Deduction: -0.1 per click
   - Maximum: 2.0 points
   - Counter-based tracking

3. **INTERRUPTION PENALTY**
   - Deduction: -0.6 (one-time only)
   - Can only be used once per routine
   - Button disables after first use

#### Counter Buttons
4. **DANCE STEPS**
   - Requirement: Minimum 2 per routine
   - Penalty: -0.3 per missing step
   - Example: If only 1 dance step is performed, -0.3 penalty is applied

5. **DYNAMIC CHANGES**
   - Requirement: Minimum 2 per routine
   - Penalty: -0.3 per missing change
   - Example: If only 1 dynamic change is performed, -0.3 penalty is applied

#### Additional Features
- **Real-time Deduction Display**: Shows current total deduction in large format
- **Action History**: Tracks all penalties and actions in chronological order
- **Undo Function**: Reverses the last action with proper state restoration
- **Finish Routine Button**: Transitions to Stage 2 evaluation

### Stage 2: After Routine Evaluation
Selection-based penalties for artistic elements evaluated after the routine completion.

#### Seven Penalty Categories

1. **Guiding Idea and Character**
   - Options: 0.3, 0.6, 1.0 points
   - Color: Purple
   - Multiple options for severity levels

2. **Body Expression**
   - Options: 0.3, 0.6 points
   - Color: Mint
   - Two severity levels

3. **Facial Expression**
   - Options: 0.3 points
   - Color: Orange
   - Single penalty value

4. **Floor Area (Space Usage)**
   - Options: 0.3 points
   - Color: Blue
   - Single penalty value

5. **Musical Introduction**
   - Options: 0.3 points
   - Color: Purple
   - Single penalty value

6. **Music Movement at End of Exercise**
   - Options: 0.3 points
   - Color: Mint
   - Single penalty value

7. **Music Norms**
   - Options: 0.3 points
   - Color: Blue
   - Single penalty value

#### Stage 2 Features
- **Toggle Selection**: Click to select/deselect penalties
- **Visual Feedback**: Selected buttons show different styling
- **Real-time Total**: Deduction updates as penalties are selected
- **Back Button**: Returns to Stage 1 for modifications
- **Undo Button**: Removes the most recently selected penalty
- **Finish Button**: Completes the evaluation

## Technical Implementation

### State Management
```javascript
const state = {
  mode: 'artistic',              // Current mode (db/da/artistic)
  artisticStage: 1,              // Current stage (1 or 2)
  connectionCount: 0,            // Connection penalties
  rhythmCount: 0,                // Rhythm penalties
  interruptionUsed: false,       // Interruption flag
  danceSteps: 0,                 // Dance steps counter
  dynamicChanges: 0,             // Dynamic changes counter
  artisticHistory: [],           // Action history
  artisticPenalties: {}          // Selected stage 2 penalties
}
```

### Deduction Calculation Algorithm
```
Total Deduction = 
  (connectionCount × 0.1) +
  (rhythmCount × 0.1) +
  (interruptionUsed ? 0.6 : 0) +
  max(0, (2 - danceSteps) × 0.3) +
  max(0, (2 - dynamicChanges) × 0.3) +
  sum(artisticPenalties)
  
Maximum Cap: 10.0 points
```

### Scoring Limits
- Connection: max 20 clicks (2.0 points)
- Rhythm: max 20 clicks (2.0 points)
- Interruption: 1 use (0.6 points)
- Missing dance steps: up to 0.6 points (2 required)
- Missing dynamic changes: up to 0.6 points (2 required)
- Stage 2 penalties: up to 4.6 points (cumulative)

## User Interface

### Design System
- **Color Scheme**:
  - Mint: #b9e5c2 (Connection, Dance Steps, Body Expression)
  - Yellow: #e4d887 (Interruption, Dance Steps)
  - Coral: #ef8a74 (Accents, selection highlights)
  - Blue: #9fcbd5 (Rhythm, Floor Area, Music Norms)
  - Purple: #c9b3e4 (Guiding Idea, Musical Introduction)
  - Orange: #f5a962 (Facial Expression)

- **Typography**:
  - Primary: Manrope (body text, labels)
  - Monospace: DM Mono (numbers, technical text)

### Layout
- **Sidebar**: Mode selection, navigation, information
- **Content**: Main judging interface
- **Score Display**: Prominent central display of current deduction
- **Buttons**: Large, color-coded, accessible targets
- **History Panel**: Scrollable action log with clear formatting

## Responsive Design
- Desktop (1024px+): 3-column penalty grid
- Tablet (760px-1024px): 2-column penalty grid
- Mobile (<760px): Single column layout with stacked buttons

## Functionality Tests

### Stage 1 Verified
✓ Connection penalty increments correctly
✓ Rhythm penalty increments correctly
✓ Interruption button disables after use
✓ Dance steps counter increments
✓ Dynamic changes counter increments
✓ Total deduction updates in real-time
✓ Missing element penalties apply correctly
✓ Undo button restores previous state
✓ Action history tracks all actions
✓ Finish Routine transitions to Stage 2

### Stage 2 Verified
✓ All 7 penalty categories visible
✓ Penalty buttons toggle on/off
✓ Visual feedback shows selected penalties
✓ Total deduction includes Stage 1 + Stage 2
✓ Back button returns to Stage 1
✓ Data persists between stage transitions
✓ Undo button removes last selection

## Usage Instructions

### For Judges
1. Click the "ART" button to enter Artistic Difficulty mode
2. **During Routine**:
   - Click penalty buttons as infractions occur
   - Click counter buttons for dance steps and dynamic changes
   - Use Undo to correct mistakes
   - Review action history for accuracy
   - Click Finish Routine when complete

3. **After Routine**:
   - Select appropriate penalties for each category
   - Click Finish to complete evaluation
   - Use Back to modify Stage 1 if needed

### For Administrators
- The interface integrates seamlessly with existing DB/DA modes
- All data is stored in the state object
- Scores can be saved/exported from the state
- Reset functionality available via mode switch

## Browser Compatibility
- Chrome/Chromium 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance
- Instant UI updates (no latency)
- Efficient rendering with minimal DOM manipulation
- Optimized CSS with CSS variables for theming
- No external dependencies beyond Vite (dev-only)

## Future Enhancements
- Data persistence (localStorage/IndexedDB)
- Export to PDF/CSV
- Multiple judge comparison
- Score history tracking
- Keyboard shortcuts
- Judge profile management
- Routine video integration
