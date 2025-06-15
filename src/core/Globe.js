/**
 * Globe Manager - 3D globe visualization with data
 */

import * as THREE from 'three';
import ThreeGlobe from 'three-globe';
import BaseComponent from '../utils/BaseComponent.js';
import { GLOBE_CONFIG, ZYETA_COLORS, ANIMATION_TIMINGS } from '../utils/Constants.js';

export class Globe extends BaseComponent {
  constructor(scene, dataManager) {
    super('Globe');
    
    this.scene = scene;
    this.dataManager = dataManager;
    
    // Three-globe instance
    this.globe = null;
    this.globeGroup = new THREE.Group();
    
    // Configuration using constants
    this.config = GLOBE_CONFIG;
    
    // Visual state
    this.hoveredCountry = null;
    this.selectedCountry = null;
    this.visibleArcs = new Set();
    
    // Animation
    this.rotationSpeed = 0.001;
    this.autoRotate = false;
    
    // Colors using constants
    this.colors = {
      india: ZYETA_COLORS.GOLD,
      zyetaBlue: ZYETA_COLORS.PRIMARY_BLUE,
      defaultCountry: 'rgba(255, 255, 255, 0.5)',
      atmosphere: ZYETA_COLORS.ATMOSPHERE,
      arcActive: ZYETA_COLORS.ARC_ACTIVE,
      arcInactive: ZYETA_COLORS.ARC_INACTIVE,
      globeSurface: ZYETA_COLORS.GLOBE_SURFACE,
      globeEmissive: ZYETA_COLORS.GLOBE_EMISSIVE
    };
    
    // Country codes with Zyeta presence
    this.activeCountries = ['SGP', 'ARE', 'MYS', 'THA', 'IDN', 'PHL', 'HKG'];
  }

  /**
   * Initialize the globe
   */
  async initialize() {
    if (this.isInitialized) return;

    try {
      console.log('🌍 Initializing globe...');
      
      this.setupGlobe();
      this.loadGlobeData();
      this.setupEventListeners();
      this.addToScene();
      
      // Delayed arc and label loading for performance
      setTimeout(() => {
        this.loadArcsAndLabels();
      }, 1000);
      
      this.isInitialized = true;
      this.emit('globe:initialized');
      
      console.log('✅ Globe initialized');
      
    } catch (error) {
      console.error('❌ Globe initialization failed:', error);
      throw error;
    }
  }

  /**
   * Setup the three-globe instance
   */
  setupGlobe() {
    this.globe = new ThreeGlobe({
      waitForGlobeReady: true,
      animateIn: true
    });

    // Configure basic globe appearance with texture
    this.globe
      .globeImageUrl('/src/data/files/earth-dark.jpg') // Use dark earth texture
      .showAtmosphere(true)
      .atmosphereColor(this.colors.atmosphere)
      .atmosphereAltitude(this.config.atmosphereAltitude);

    // Set globe material properties - brighter emission for better visibility
    const globeMaterial = this.globe.globeMaterial();
    globeMaterial.color = new THREE.Color(this.colors.globeSurface);
    globeMaterial.emissive = new THREE.Color(this.colors.globeEmissive);
    globeMaterial.emissiveIntensity = 0.3; // Increased from 0.1 to 0.3
    globeMaterial.shininess = 0.7;

    // Set initial rotation to match legacy positioning exactly
    // Legacy uses: Globe.rotateY(-Math.PI * (5 / 9)); Globe.rotateZ(-Math.PI / 6);
    this.globe.rotateY(-Math.PI * (5 / 9));
    this.globe.rotateZ(-Math.PI / 6);

    // Add to group for easier manipulation
    this.globeGroup.add(this.globe);
    
    // Log globe utilities for debugging
    console.log('🌍 Globe radius:', this.globe.getGlobeRadius());
  }

  /**
   * Load country polygon data with enhanced visualization
   */
  loadGlobeData() {
    const countries = this.dataManager.data.countries;
    if (!countries || !countries.features) {
      console.warn('⚠️ No country data available');
      return;
    }

    // Get processed country data for enhanced visualization
    const countryVisualizationData = this.dataManager.getCountryVisualizationData();
    this.countryDataMap = new Map();
    
    // Create lookup map for quick access
    countryVisualizationData.forEach(countryData => {
      this.countryDataMap.set(countryData.countryCode, countryData);
    });

    this.globe
      .hexPolygonsData(countries.features)
      .hexPolygonResolution(this.config.hexPolygonResolution)
      .hexPolygonMargin(this.config.hexPolygonMargin)
      .hexPolygonColor(this.getEnhancedCountryColor.bind(this))
      .hexPolygonAltitude(this.getEnhancedCountryAltitude.bind(this));

    console.log('🗺️ Country polygons loaded with enhanced visualization');
  }

  /**
   * Load arcs and labels with delay for performance
   */
  loadArcsAndLabels() {
    this.loadProjectArcs();
    this.loadOfficeLabels();
  }

  /**
   * Load project arcs using legacy format to prevent NaN errors
   */
  loadProjectArcs() {
    // Use legacy project data directly to avoid conversion issues
    const legacyProjects = this.dataManager.getProjects();
    
    if (!legacyProjects || legacyProjects.length === 0) {
      console.warn('⚠️ No legacy project data available');
      return;
    }

    // Filter and validate legacy project data
    const validArcs = legacyProjects.filter(arc => {
      const startLat = parseFloat(arc.startLat);
      const startLng = parseFloat(arc.startLng);
      const endLat = parseFloat(arc.endLat);
      const endLng = parseFloat(arc.endLng);
      
      const isValid = !isNaN(startLat) && !isNaN(startLng) && !isNaN(endLat) && !isNaN(endLng) &&
                     startLat >= -90 && startLat <= 90 &&
                     endLat >= -90 && endLat <= 90 &&
                     startLng >= -180 && startLng <= 180 &&
                     endLng >= -180 && endLng <= 180;
      
      if (!isValid) {
        console.warn('Invalid legacy arc data filtered out:', arc);
      }
      return isValid;
    });
    
    console.log(`🔗 Setting legacy arc data: ${validArcs.length} of ${legacyProjects.length} total`);

    // Configure arcs with exact legacy format (matching src/index.js:139-153)
    this.globe
      .arcsData(validArcs)
      .arcColor((e) => {
        return e.status ? "#00d4ff" : "#ff6b6b"; // Exact legacy logic
      })
      .arcAltitude((e) => {
        return e.arcAlt; // Use exact legacy property
      })
      .arcStroke((e) => {
        return e.status ? 0.5 : 0.3; // Exact legacy logic
      })
      .arcDashLength(0.9)
      .arcDashGap(4)
      .arcDashAnimateTime(1000)
      .arcsTransitionDuration(1000)
      .arcDashInitialGap((e) => e.order * 1); // Exact legacy logic
  }

  /**
   * Load office location labels
   */
  loadOfficeLabels() {
    const offices = this.dataManager.data.offices;
    if (!offices) return;

    this.globe
      .labelsData(offices)
      .labelColor(this.getLabelColor.bind(this))
      .labelDotOrientation(() => 'bottom')
      .labelDotRadius(0.5) // Increased from 0.4 for better visibility
      .labelSize((office) => (office.size || 1) * 1.4) // Increased from 1.2
      .labelText('city')
      .labelResolution(8) // Increased from 6 for better quality
      .labelAltitude(this.config.labelAltitude)
      .pointsData(offices)
      .pointColor(this.getPointColor.bind(this))
      .pointsMerge(true)
      .pointAltitude(this.config.pointAltitude)
      .pointRadius(this.getPointRadius.bind(this));

    console.log('🏢 Office labels loaded');
  }

  /**
   * Enhanced country color based on engagement data
   */
  getEnhancedCountryColor(country) {
    const isoCode = country.properties.ISO_A3;
    const countryData = this.countryDataMap?.get(isoCode);
    
    if (isoCode === 'IND') {
      return this.colors.india; // Gold for India (HQ)
    } else if (countryData) {
      // Simple color interpolation based on project count
      const intensity = Math.min(countryData.projectCount / 10, 1); // Cap at 10 projects
      return this.interpolateColor(this.colors.defaultCountry, this.colors.zyetaBlue, intensity);
    } else {
      return this.colors.defaultCountry; // Default for other countries
    }
  }

  /**
   * Enhanced country altitude based on engagement intensity
   */
  getEnhancedCountryAltitude(country) {
    const isoCode = country.properties.ISO_A3;
    const countryData = this.countryDataMap?.get(isoCode);
    
    if (isoCode === 'IND') {
      return 0.025; // Highest elevation for India (HQ)
    } else if (countryData) {
      // Scale altitude based on total engagements
      return 0.01 + (countryData.totalEngagements * 0.002);
    } else {
      return 0.005; // Minimal elevation for countries without engagements
    }
  }


  /**
   * Enhanced arc color based on category with validation
   */
  getEnhancedArcColor(arc) {
    return arc.color || this.colors.arcActive;
  }

  /**
   * Enhanced arc altitude with validation to prevent NaN
   */
  getEnhancedArcAltitude(arc) {
    let altitude = this.config.arcAltitude;
    
    if (arc.arcAlt !== undefined) {
      altitude = parseFloat(arc.arcAlt);
    } else if (arc.category === 'office-connection') {
      altitude = 0.4;
    } else if (arc.category === 'project') {
      altitude = 0.3;
    } else if (arc.category === 'talk') {
      altitude = 0.25;
    } else if (arc.category === 'contact') {
      altitude = 0.2;
    }
    
    return isNaN(altitude) ? this.config.arcAltitude : Math.max(0.1, Math.min(1.0, altitude));
  }

  /**
   * Enhanced arc stroke with validation
   */
  getEnhancedArcStroke(arc) {
    const stroke = parseFloat(arc.thickness) || 1;
    return isNaN(stroke) ? 1 : Math.max(0.1, Math.min(3.0, stroke));
  }


  /**
   * Get label color
   */
  getLabelColor(office) {
    return office.type === 'headquarters' ? this.colors.india : this.colors.zyetaBlue;
  }

  /**
   * Get point color - enhanced brightness
   */
  getPointColor(office) {
    // Return brighter colors for better visibility
    return office.type === 'headquarters' ? '#ffed4e' : '#00ffff'; // Brighter gold and cyan
  }

  /**
   * Get point radius
   */
  getPointRadius(office) {
    return office.type === 'headquarters' ? 0.08 : 0.06;
  }

  /**
   * Handle country hover
   */
  handleCountryHover(country, prevCountry) {
    this.hoveredCountry = country;
    
    if (country) {
      // Handle both country objects and engagement data
      let isoCode, engagement;
      
      if (country.properties && country.properties.ISO_A3) {
        // Traditional country object from polygon
        isoCode = country.properties.ISO_A3;
        engagement = this.dataManager.getEngagements(isoCode);
      } else if (country.countryCode) {
        // Engagement data object
        isoCode = country.countryCode;
        engagement = country;
      }
      
      if (engagement && isoCode) {
        this.emit('country:hovered', {
          country,
          engagement,
          isoCode
        });
      }
    } else {
      this.emit('country:hover-end', { prevCountry });
    }
  }

  /**
   * Handle country click
   */
  handleCountryClick(country) {
    if (!country) return;
    
    this.selectedCountry = country;
    const isoCode = country.properties.ISO_A3;
    const engagement = this.dataManager.getEngagements(isoCode);
    
    if (engagement) {
      this.emit('country:clicked', {
        country,
        engagement,
        isoCode
      });
      
      // Focus on the country
      this.focusCountry(isoCode);
    } else {
      this.emit('country:no-data', { country, isoCode });
    }
  }

  /**
   * Focus camera on a specific country using three-globe utilities
   */
  focusCountry(countryCode) {
    // Use predefined country centers or try to get from data
    const countryCenters = {
      'IND': { lat: 20.5937, lng: 78.9629 },
      'SGP': { lat: 1.3521, lng: 103.8198 },
      'ARE': { lat: 23.4241, lng: 53.8478 },
      'MYS': { lat: 4.2105, lng: 101.9758 },
      'THA': { lat: 15.8700, lng: 100.9925 },
      'IDN': { lat: -0.7893, lng: 113.9213 },
      'PHL': { lat: 12.8797, lng: 121.7740 },
      'HKG': { lat: 22.3193, lng: 114.1694 }
    };
    
    const coords = countryCenters[countryCode];
    if (!coords) {
      console.warn('No coordinates found for country:', countryCode);
      return;
    }

    // Use three-globe's utility to get 3D position
    const globeRadius = this.globe.getGlobeRadius();
    const distance = globeRadius * 2.5; // Position camera at 2.5x globe radius
    const targetPosition = this.globe.getCoords(coords.lat, coords.lng, distance / globeRadius);

    // Animate camera to position
    this.animateCameraTo(targetPosition, { x: 0, y: 0, z: 0 });
    
    this.emit('country:focused', { countryCode, coords, position: targetPosition });
  }

  /**
   * Get country center coordinates
   */
  getCountryCenter(country) {
    // Simple centroid calculation for demonstration
    // In production, you might want to use a more sophisticated method
    const coordinates = country.geometry?.coordinates;
    if (!coordinates) return null;

    // This is a simplified approach - proper centroid calculation
    // would depend on the geometry type (Polygon, MultiPolygon, etc.)
    const bounds = {
      north: -90, south: 90, east: -180, west: 180
    };

    const updateBounds = (coord) => {
      const [lng, lat] = coord;
      bounds.north = Math.max(bounds.north, lat);
      bounds.south = Math.min(bounds.south, lat);
      bounds.east = Math.max(bounds.east, lng);
      bounds.west = Math.min(bounds.west, lng);
    };

    const processCoordinates = (coords) => {
      if (Array.isArray(coords[0])) {
        coords.forEach(processCoordinates);
      } else {
        updateBounds(coords);
      }
    };

    processCoordinates(coordinates);

    return {
      lat: (bounds.north + bounds.south) / 2,
      lng: (bounds.east + bounds.west) / 2
    };
  }

  /**
   * Animate camera to position
   */
  animateCameraTo(position, target, duration = 2000) {
    if (!this.scene.camera) return;

    const camera = this.scene.camera;
    const startPosition = camera.position.clone();
    const startTarget = new THREE.Vector3(0, 0, 0); // Current look-at target
    
    const targetPosition = new THREE.Vector3(position.x, position.y, position.z);
    const targetLookAt = new THREE.Vector3(target.x, target.y, target.z);

    const startTime = performance.now();

    const animate = (currentTime) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      
      // Easing function (ease-out)
      const eased = 1 - Math.pow(1 - progress, 3);

      // Interpolate position
      camera.position.lerpVectors(startPosition, targetPosition, eased);
      
      // Look at target
      camera.lookAt(targetLookAt);

      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        this.emit('camera:animation-complete');
      }
    };

    requestAnimationFrame(animate);
  }

  /**
   * Reset view to initial position focused on India
   */
  resetView() {
    // Reset to position that shows India prominently
    this.animateCameraTo(
      { x: 0, y: 50, z: 500 },  // Adjusted for larger globe
      { x: 0, y: 0, z: 0 }
    );
    
    this.selectedCountry = null;
    this.hoveredCountry = null;
    
    this.emit('view:reset');
  }

  /**
   * Search for countries, offices, or projects
   */
  search(query) {
    const results = this.dataManager.search(query);
    this.emit('search:results', { query, results });
    return results;
  }

  /**
   * Update data (e.g., when user adds notes)
   */
  updateData(dataType) {
    switch (dataType) {
      case 'projects':
        this.loadProjectArcs();
        break;
      case 'offices':
        this.loadOfficeLabels();
        break;
      case 'countries':
        this.loadGlobeData();
        break;
    }
    
    this.emit('data:updated', dataType);
  }

  /**
   * Toggle auto-rotation
   */
  setAutoRotate(enabled) {
    this.autoRotate = enabled;
    this.emit('globe:auto-rotate', enabled);
  }

  /**
   * Setup event listeners
   */
  setupEventListeners() {
    // Listen to scene animation frames for auto-rotation
    this.scene.on('scene:animate', (data) => {
      if (this.autoRotate && this.globe) {
        this.globe.rotateY(this.rotationSpeed * data.deltaTime * 1000);
      }
    });

    // Listen for scene clicks to handle globe interactions
    this.scene.on('scene:click', (data) => {
      const intersections = this.scene.getIntersections([this.globe]);
      if (intersections.length > 0) {
        // Clicked on globe - try to detect country
        this.handleGlobeClick(data.originalEvent, intersections[0]);
      } else {
        // Clicked outside globe - deselect
        this.selectedCountry = null;
        this.emit('globe:deselected');
      }
    });

    // Listen for mouse move for hover effects
    this.scene.on('scene:mousemove', (data) => {
      const intersections = this.scene.getIntersections([this.globe]);
      if (intersections.length > 0) {
        this.handleGlobeHover(data.originalEvent, intersections[0]);
      } else {
        // Mouse left globe
        if (this.hoveredCountry) {
          this.handleCountryHover(null, this.hoveredCountry);
        }
      }
    });
  }

  /**
   * Handle clicks on the globe with enhanced country detection
   */
  handleGlobeClick(event, intersection) {
    // Convert 3D point to lat/lng coordinates
    const coords = this.pointToLatLng(intersection.point);
    
    if (coords) {
      // Look up engagement data using enhanced coordinate detection
      const engagementData = this.dataManager.getEngagementByCoords(coords.lat, coords.lng);
      
      if (engagementData) {
        this.selectedCountry = engagementData;
        this.emit('country:clicked', {
          country: engagementData,
          coordinates: coords,
          intersection,
          event
        });
      } else {
        // No engagement data found, but still emit globe click
        this.emit('globe:clicked', {
          coordinates: coords,
          point: intersection.point,
          face: intersection.face,
          event
        });
      }
    }
  }

  /**
   * Handle mouse hover on the globe
   */
  handleGlobeHover(event, intersection) {
    const coords = this.pointToLatLng(intersection.point);
    
    if (coords) {
      const engagementData = this.dataManager.getEngagementByCoords(coords.lat, coords.lng);
      
      if (engagementData && engagementData !== this.hoveredCountry) {
        this.handleCountryHover(engagementData, this.hoveredCountry);
      } else if (!engagementData && this.hoveredCountry) {
        this.handleCountryHover(null, this.hoveredCountry);
      }
    }
  }

  /**
   * Convert 3D point to lat/lng coordinates using three-globe utilities
   */
  pointToLatLng(point) {
    try {
      // Use three-globe's built-in utility method for accurate conversion
      const geoCoords = this.globe.toGeoCoords(point);
      return {
        lat: geoCoords.lat,
        lng: geoCoords.lng
      };
    } catch (error) {
      console.warn('Failed to convert point to lat/lng:', error);
      return null;
    }
  }

  /**
   * Simple color interpolation (replaces D3)
   */
  interpolateColor(color1, color2, factor) {
    const c1 = new THREE.Color(color1);
    const c2 = new THREE.Color(color2);
    return c1.lerp(c2, factor);
  }

  /**
   * Get 3D coordinates for a location using three-globe utilities
   */
  getLocationCoords(lat, lng, altitude = 0) {
    return this.globe.getCoords(lat, lng, altitude);
  }

  /**
   * Get globe radius
   */
  getGlobeRadius() {
    return this.globe.getGlobeRadius();
  }

  /**
   * Add globe to scene
   */
  addToScene() {
    this.scene.add(this.globeGroup);
    this.emit('globe:added-to-scene');
  }

  /**
   * Remove globe from scene
   */
  removeFromScene() {
    this.scene.remove(this.globeGroup);
    this.emit('globe:removed-from-scene');
  }

  /**
   * Get globe statistics
   */
  getStats() {
    return {
      countries: this.activeCountries.length,
      hoveredCountry: this.hoveredCountry?.properties?.NAME || null,
      selectedCountry: this.selectedCountry?.properties?.NAME || null,
      autoRotate: this.autoRotate,
      visibleArcs: this.visibleArcs.size
    };
  }

  /**
   * Cleanup and destroy
   */
  destroy() {
    this.removeFromScene();
    
    // Dispose of Three.js objects
    if (this.globe) {
      this.globe.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
        if (object.material) {
          if (Array.isArray(object.material)) {
            object.material.forEach(material => material.dispose());
          } else {
            object.material.dispose();
          }
        }
      });
    }

    // Clear references
    this.globe = null;
    this.globeGroup = null;
    this.hoveredCountry = null;
    this.selectedCountry = null;
    this.visibleArcs.clear();

    this.removeAllListeners();
    this.emit('globe:destroyed');
  }
}