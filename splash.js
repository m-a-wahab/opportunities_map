// Splash Screen Functionality

// Animate numbers counting up
function animateNumber(element) {
  const target = parseInt(element.getAttribute('data-target'));
  const duration = 2000; // 2 seconds
  const start = 0;
  const increment = target / (duration / 16); // 60fps
  let current = start;

  const timer = setInterval(() => {
    current += increment;
    if (current >= target) {
      element.textContent = target.toLocaleString('ar-SA');
      clearInterval(timer);
    } else {
      element.textContent = Math.floor(current).toLocaleString('ar-SA');
    }
  }, 16);
}

// Start number animations when page loads
window.addEventListener('DOMContentLoaded', () => {
  // Calculate stats if PLOTS_GEOJSON is available
  if (typeof PLOTS_GEOJSON !== 'undefined' && PLOTS_GEOJSON.features) {
    const allFeatures = PLOTS_GEOJSON.features;
    const totalCount = allFeatures.length;
    const count2026 = allFeatures.filter(f => (f.type === 'Feature' || !f.type) && f.properties.within2026Calender === true).length;
    const countLeasing = allFeatures.filter(f => f.type === 'Temporary_Leasing').length;
    const countSeasonal = allFeatures.filter(f => f.type === 'Seasonal_Event').length;

    const elTotal = document.getElementById('splashStatTotal');
    // const el2026 = document.getElementById('splashStat2026');
    // const elLeasing = document.getElementById('splashStatLeasing');
    // const elSeasonal = document.getElementById('splashStatSeasonal');

    if (elTotal) elTotal.setAttribute('data-target', totalCount);
    // if (el2026) el2026.setAttribute('data-target', count2026);
    // if (elLeasing) elLeasing.setAttribute('data-target', countLeasing);
    // if (elSeasonal) elSeasonal.setAttribute('data-target', countSeasonal);
  }

  setTimeout(() => {
    const numbers = document.querySelectorAll('.stat-number');
    numbers.forEach(num => animateNumber(num));
  }, 1000);
});

// Enter app function
function enterApp() {
  const splash = document.getElementById('splashScreen');
  const mainApp = document.getElementById('mainApp');

  // Add fade out animation
  splash.classList.add('fade-out');

  // Wait for animation to complete
  setTimeout(() => {
    splash.style.display = 'none';
    mainApp.style.display = 'block';

    // Trigger map resize and zoom animation
    setTimeout(() => {
      if (window.investmentMap && window.ARAR_CENTER && typeof google !== 'undefined') {
        // Trigger resize event for Google Maps
        google.maps.event.trigger(window.investmentMap, 'resize');
        console.log('Map resized');

        // Set initial zoom out
        window.investmentMap.setZoom(11);

        // Then zoom in with animation
        setTimeout(() => {
          window.investmentMap.panTo({ lat: window.ARAR_CENTER[0], lng: window.ARAR_CENTER[1] });
          window.investmentMap.setZoom(13);
          console.log('Zooming to Arar city');
        }, 100);
      }
    }, 200);

    // Additional resize attempts to ensure map displays correctly
    setTimeout(() => {
      if (window.investmentMap && typeof google !== 'undefined') {
        google.maps.event.trigger(window.investmentMap, 'resize');
      }
    }, 500);

    setTimeout(() => {
      if (window.investmentMap && typeof google !== 'undefined') {
        google.maps.event.trigger(window.investmentMap, 'resize');
      }
    }, 1000);
  }, 500);
}

// Skip splash screen if URL has ?skip parameter (for testing)
if (window.location.search.includes('skip')) {
  document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
      enterApp();
    }, 100);
  });
}

// Auto-enter after 5 seconds (optional)
// Uncomment the following lines if you want auto-entry
/*
setTimeout(() => {
  enterApp();
}, 5000);
*/
