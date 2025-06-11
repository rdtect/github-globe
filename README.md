# Zyeta Globe - Modern Edition

> Modern interactive 3D globe for Zyeta's global workspace design engagements

## 🚀 Features

### ✨ **Core Features**
- **Interactive 3D Globe** - Latest Three.js with smooth animations
- **Real-time Engagement Data** - Country-specific project details
- **Modular Notepad System** - Rich note-taking with auto-save
- **Advanced Search** - Find countries, projects, and clients instantly
- **Responsive Design** - Perfect on desktop, tablet, and mobile

### 🔧 **Modern Architecture**
- **Vite 6.3.5** - Lightning-fast builds and HMR
- **Three.js 0.177.0** - Latest 3D engine capabilities
- **ES6+ Modules** - Clean, maintainable code structure
- **Event-Driven** - Decoupled components with custom EventEmitter
- **Performance Optimized** - Code splitting and lazy loading ready

### 📝 **Note-Taking System**
- **Country Notes** - Add observations per region
- **Project Notes** - Track project-specific details
- **Auto-save** - Never lose your work
- **Export/Import** - Backup and restore notes
- **Rich Text** - Markdown-style formatting support

## 🏗️ Architecture

```
src/
├── main.js              # Application entry point
├── core/                # Core engine modules
│   ├── App.js          # Main orchestrator
│   ├── Scene.js        # Three.js scene management
│   ├── Globe.js        # 3D globe visualization
│   └── Controls.js     # Camera and interaction controls
├── data/               # Data management
│   ├── DataManager.js  # CRUD operations and storage
│   └── files/          # JSON data files
├── ui/                 # User interface components
│   ├── UI.js           # Main UI controller
│   ├── EngagementPanel.js # Country details panel
│   ├── Notepad.js      # Note-taking system
│   ├── Modal.js        # Modal dialogs
│   └── Toolbar.js      # Navigation toolbar
├── utils/              # Utilities
│   └── EventEmitter.js # Custom event system
└── styles/
    └── main.css        # Modern CSS with variables
```

## 🎮 Usage

### **Development**
```bash
npm run dev     # Start development server (http://localhost:5174)
npm run build   # Build for production
npm run preview # Preview production build
```

### **Interactions**
- **🖱️ Mouse**: Rotate and zoom the globe
- **📱 Touch**: Pinch to zoom, swipe to rotate
- **⌨️ Keyboard Shortcuts**:
  - `H` - Reset view to home
  - `/` - Open search
  - `Ctrl+N` - Create new note
  - `Ctrl+S` - Save current note
  - `R` - Reset camera view
  - `Space` - Toggle auto-rotate

### **Country Engagement**
1. **Click** any highlighted country (India, Singapore, UAE, etc.)
2. **View** detailed project information in the side panel
3. **Add Notes** using the notepad system
4. **Export** engagement data as JSON

## 📊 Data Structure

### **Countries Data**
- GeoJSON format with country boundaries
- ISO codes for identification
- Visual highlighting for Zyeta presence

### **Engagements Data**
```json
{
  "SGP": {
    "countryName": "Singapore",
    "totalProjects": 8,
    "engagements": [
      {
        "title": "TechCorp APAC Headquarters",
        "client": "TechCorp Singapore",
        "date": "March 2024",
        "type": "Workspace Design",
        "description": "Complete office redesign for 500+ employees",
        "status": "Completed"
      }
    ]
  }
}
```

### **User Notes Storage**
- **Local Storage** - Persistent across sessions
- **Auto-backup** - Prevents data loss
- **Export/Import** - JSON format for portability

## 🎨 Customization

### **Colors**
Edit CSS variables in `src/styles/main.css`:
```css
:root {
  --primary-blue: #00d4ff;    /* Zyeta brand blue */
  --primary-gold: #ffd700;    /* India highlight */
  --bg-dark: #040d21;         /* Background */
}
```

### **Globe Configuration**
Modify `src/core/Globe.js`:
```javascript
this.config = {
  globeRadius: 100,
  atmosphereAltitude: 0.25,
  arcAltitude: 0.3,
  animationDuration: 1000
};
```

## 🚀 Performance

- **First Paint**: < 1s on modern browsers
- **Interactive**: < 2s full load time
- **Memory**: Optimized Three.js object disposal
- **Mobile**: 60fps on modern devices

## 🔧 Browser Support

- **Chrome/Edge**: 90+ ✅
- **Firefox**: 88+ ✅
- **Safari**: 14+ ✅
- **Mobile**: iOS 14+, Android 10+ ✅

## 📈 Future Enhancements

- [ ] **Real-time Collaboration** - Multi-user editing
- [ ] **Voice Notes** - Audio annotations
- [ ] **Timeline View** - Project progression tracking
- [ ] **Analytics Dashboard** - Engagement metrics
- [ ] **API Integration** - Live data updates
- [ ] **VR/AR Support** - Immersive experiences

## 🤝 Contributing

1. **Clone** the repository
2. **Install** dependencies: `npm install`
3. **Start** development: `npm run dev`
4. **Make** your changes
5. **Test** thoroughly
6. **Submit** a pull request

## 📄 License

MIT License - see LICENSE file for details

---

**Built with ❤️ for Zyeta by Rick De**

*Modern architecture • Latest libraries • Best practices*