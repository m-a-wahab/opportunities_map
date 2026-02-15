// Handle logo images - hide if not found
document.addEventListener('DOMContentLoaded', () => {
  const logos = document.querySelectorAll('.header-logo');
  logos.forEach(logo => {
    logo.addEventListener('error', function () {
      this.style.display = 'none';
    });
  });

  // Check if mainApp is visible, if so initialize map immediately
  const mainApp = document.getElementById('mainApp');
  if (mainApp && mainApp.style.display !== 'none') {
    // Map will initialize normally
  }
});

// Initialize map
(function () {
  /** Arar City center */
  const ARAR_CENTER = [30.9753, 41.0389];

  // Initialize Google Map
  const map = new google.maps.Map(document.getElementById("map"), {
    center: { lat: ARAR_CENTER[0], lng: ARAR_CENTER[1] },
    zoom: 13,
    minZoom: 8,
    maxZoom: 20,
    mapTypeControl: true,
    mapTypeControlOptions: {
      style: google.maps.MapTypeControlStyle.HORIZONTAL_BAR,
      position: google.maps.ControlPosition.TOP_LEFT,
      mapTypeIds: ['roadmap', 'satellite', 'hybrid']
    },
    zoomControl: true,
    streetViewControl: false,
    fullscreenControl: false,
    gestureHandling: 'greedy'  // Enable direct scroll zoom without Ctrl key
  });

  // Store map reference globally for splash screen
  window.investmentMap = map;
  window.ARAR_CENTER = ARAR_CENTER; // Store center globally

  // TEMP visual anchor to verify map renders
  // new google.maps.Marker({
  //   position: { lat: ARAR_CENTER[0], lng: ARAR_CENTER[1] },
  //   map: map,
  //   icon: {
  //     path: google.maps.SymbolPath.CIRCLE,
  //     scale: 4,
  //     fillColor: '#00a86b',
  //     fillOpacity: 0.9,
  //     strokeColor: '#006c35',
  //     strokeWeight: 2
  //   }
  // });

  // State
  let plotsLayer = null;
  let selectedMarker = null; // Track currently selected marker
  let currentFilters = {
    district: "all",
    activity: "all",
    projectType: "all",
    minArea: null,
    maxArea: null,
    within2026: false
  };

  // UI refs
  const districtSelect = document.getElementById("districtSelect");
  const activitySelect = document.getElementById("activitySelect");
  districtSelect.value = "all";
  activitySelect.value = "all";
  // const within2026Check = document.getElementById("within2026Check");
  // const statusSelect = document.getElementById("statusSelect");
  // const typeSelect = document.getElementById("typeSelect");
  // const statusSegContainer = document.querySelector('.segmented[aria-label="investment status"]');
  // const typeSegContainer = document.querySelector('.segmented[aria-label="project type"]');
  const minAreaInput = null;
  const maxAreaInput = null;
  const areaMinRange = document.getElementById("areaMinRange");
  const areaMaxRange = document.getElementById("areaMaxRange");
  const areaMinVal = document.getElementById("areaMinVal");
  const areaMaxVal = document.getElementById("areaMaxVal");
  const applyBtn = document.getElementById("applyFilters");
  const resetBtn = document.getElementById("resetFilters");
  const statsPanel = document.getElementById("statsPanel");
  // Quick stats refs
  // const statCount = document.getElementById("quickStatTotal");
  // const stat2026 = document.getElementById("quickStat2026");
  // const statLeasing = document.getElementById("quickStatLeasing");
  // const statSeasonal = document.getElementById("quickStatSeasonal");

  // Filtered stats refs
  const statFilteredCount = document.getElementById("statFilteredCount");
  // const statFilteredGrantProject = document.getElementById("statFilteredGrantProject");
  // const statFilteredMediumProject = document.getElementById("statFilteredMediumProject");

  // Info card refs
  const infoTitle = document.getElementById("infoTitle");
  const infoPlotNumber = document.getElementById("infoPlotNumber");
  const infoActivity = document.getElementById("infoActivity");
  const infoDistrict = document.getElementById("infoDistrict");
  const infoArea = document.getElementById("infoArea");
  const infoContractPeriod = document.getElementById("infoContractPeriod");
  const infoBucketPrice = document.getElementById("infoBucketPrice");
  const infoAdvertiseDate = document.getElementById("infoAdvertiseDate");
  const infoOpenEnvelopesDate = document.getElementById("infoOpenEnvelopesDate");
  // const infoSize = document.getElementById("infoStatus");
  // const infoInvest = document.getElementById("infoStatus");
  // const infoImages = document.getElementById("infoImages");
  // const imageViewer = document.getElementById('imageViewer');
  // const viewerImg = document.getElementById('viewerImg');

  // Populate districts from data
  const districts = Array.from(new Set(PLOTS_GEOJSON.features.map(f => f.properties.district))).sort();
  for (const d of districts) {
    const opt = document.createElement("option");
    opt.value = d;
    opt.textContent = d;
    districtSelect.appendChild(opt);
  }

  // Populate activities from data
  const activities = Array.from(new Set(PLOTS_GEOJSON.features.map(f => f.properties.activity))).sort();
  for (const a of activities) {
    const opt = document.createElement("option");
    opt.value = a;
    opt.textContent = a;
    activitySelect.appendChild(opt);
  }

  // Populate Temporary Leasing dropdowns
  // const leasingActivitySelect = document.getElementById("leasingActivitySelect");
  // const leasingDistrictSelect = document.getElementById("leasingDistrictSelect");

  // if (leasingActivitySelect && leasingDistrictSelect) {
  //   // Filter only Temporary_Leasing features
  //   const leasingFeatures = PLOTS_GEOJSON.features.filter(f => f.type === 'Temporary_Leasing');

  //   // Populate leasing activities
  //   // Populate leasing activities
  //   // Ensure we only take the 'activity' attribute
  //   const leasingActivities = Array.from(new Set(leasingFeatures.map(f => f.properties.activity))).filter(Boolean).sort();

  //   // Clear existing options (keep the first 'all')
  //   while (leasingActivitySelect.options.length > 1) {
  //     leasingActivitySelect.remove(1);
  //   }

  //   for (const a of leasingActivities) {
  //     const opt = document.createElement("option");
  //     opt.value = a;
  //     opt.textContent = a;
  //     leasingActivitySelect.appendChild(opt);
  //   }

  //   // Populate leasing districts
  //   const leasingDistricts = Array.from(new Set(leasingFeatures.map(f => f.properties.district))).sort();
  //   for (const d of leasingDistricts) {
  //     const opt = document.createElement("option");
  //     opt.value = d;
  //     opt.textContent = d;
  //     leasingDistrictSelect.appendChild(opt);
  //   }
  // }

  // Populate Seasonal Events dropdowns
  // const seasonalActivitySelect = document.getElementById("seasonalActivitySelect");
  // const seasonalDistrictSelect = document.getElementById("seasonalDistrictSelect");

  // if (seasonalActivitySelect && seasonalDistrictSelect) {
  //   // Filter only Seasonal_Event features
  //   const seasonalFeatures = PLOTS_GEOJSON.features.filter(f => f.type === 'Seasonal_Event');

  //   // Populate seasonal activities
  //   const seasonalActivities = Array.from(new Set(seasonalFeatures.map(f => f.properties.activity))).sort();
  //   for (const a of seasonalActivities) {
  //     const opt = document.createElement("option");
  //     opt.value = a;
  //     opt.textContent = a;
  //     seasonalActivitySelect.appendChild(opt);
  //   }

  //   // Populate seasonal districts
  //   const seasonalDistricts = Array.from(new Set(seasonalFeatures.map(f => f.properties.district))).sort();
  //   for (const d of seasonalDistricts) {
  //     const opt = document.createElement("option");
  //     opt.value = d;
  //     opt.textContent = d;
  //     seasonalDistrictSelect.appendChild(opt);
  //   }
  //}


  // Quick stats
  // updateQuickStats();

  function formatArea(value) {
    if (!Number.isFinite(value)) return "0 م²";
    return new Intl.NumberFormat("ar-SA").format(Math.round(value)) + " م²";
  }

  function computeStats(features) {
    const count = features.length;
    const totalArea = features.reduce((sum, f) => sum + (f.properties.area || 0), 0);
    const largeProjectCount = features.filter(f => f.properties.projectType === 'كبرى').length;
    const mProjectCount = features.filter(f => f.properties.projectType === 'متوسطة').length;
    return { count, totalArea, investmentCount: largeProjectCount, mediumProjectCount: mProjectCount };
  }

  function getFeatureStyle(feature) {
    // const type = feature.properties.projectType; // كبرى | متوسطة

    // Color based on project type
    let fillColor, borderColor;
    // if (type === 'كبرى') {
    //   fillColor = '#dc3545'; // Red for large projects
    //   borderColor = '#a71d2a';
    // } else if (type === 'متوسطة') {
    //   fillColor = '#ffc107'; // Yellow for medium projects
    //   borderColor = '#d39e00';
    // } else {
    //   fillColor = '#28a745'; // Green for others
    //   borderColor = '#1e7e34';
    // }

    // if (feature.properties.type === 'Seasonal_Event') {
    //   fillColor = '#9C27B0';
    //   borderColor = '#7B1FA2';
    // } else if (feature.properties.type === 'Temporary_Leasing') {
    //   fillColor = '#FF9800';
    //   borderColor = '#E65100';
    // }

    fillColor = '#28a745'; // Green for others
    borderColor = '#1e7e34';

    return {
      color: borderColor,
      weight: 2,
      dashArray: null,
      fillColor,
      fillOpacity: 0.6,
      className: `plot-shape small`
    };
  }

  function featurePopup(feature, layer) {
    const p = feature.properties;
    const html = `
      <div class="plot-tooltip">
        <div class="ttl">${p.name || "قطعة أرض"}</div>
        <div class="row">رقم القطعة: <strong>${p.plotNumber || '-'}</strong></div>
        <div class="row">رقم المخطط: <strong>${p.planNumber || '-'}</strong></div>
        <div class="row">الحي: <strong>${p.district}</strong></div>
        <div class="row">النشاط: <strong>${p.activity || '-'}</strong></div>
        <div class="row">المساحة: <strong>${formatArea(p.area)}</strong></div>
      </div>
    `;
    layer.bindTooltip(html, { direction: 'top', sticky: true, opacity: 1, className: 'plot-tooltip' });
    layer.on('mouseover', function () { this.bringToFront(); });

    // Hover and click interactions to update info card
    layer.on('mouseover', () => {
      infoTitle.textContent = p.name || 'قطعة أرض';
      infoPlotNumber.textContent = p.forsaNumber || '-';
      infoActivity.textContent = p.activity || '-';
      infoDistrict.textContent = p.district;
      infoArea.textContent = formatArea(p.area);
      infoContractPeriod.textContent = p.contractPeriod || '-';
      infoBucketPrice.textContent = p.buckletPrice || '-';
      infoAdvertiseDate.textContent = p.advertiseDate || '-';
      infoOpenEnvelopesDate.textContent = p.openEnvelopesDate || '-';
      // const status = p.investmentStatus || '-';
      // document.getElementById('infoStatus').textContent = status;
    });
    layer.on('click', () => {
      infoTitle.textContent = p.name || 'قطعة أرض';
      infoPlotNumber.textContent = p.forsaNumber || '-';
      infoActivity.textContent = p.activity || '-';
      infoDistrict.textContent = p.district;
      infoArea.textContent = formatArea(p.area);
      infoContractPeriod.textContent = p.contractPeriod || '-';
      infoBucketPrice.textContent = p.buckletPrice || '-';
      infoAdvertiseDate.textContent = p.advertiseDate || '-';
      infoOpenEnvelopesDate.textContent = p.openEnvelopesDate || '-';
      // render images
      // if (infoImages) {
      //   infoImages.innerHTML = '';
      //   (p.images || []).slice(0, 6).forEach(src => {
      //     const img = document.createElement('img');
      //     img.src = src;
      //     img.alt = p.name || 'صورة قطعة أرض';
      //     img.style.cursor = 'zoom-in';
      //     img.addEventListener('click', () => {
      //       // open viewer and shrink map
      //       if (viewerImg && imageViewer) {
      //         viewerImg.src = src;
      //         imageViewer.style.display = 'flex';
      //         document.getElementById('map').classList.add('map-mini');
      //       }
      //     });
      //     infoImages.appendChild(img);
      //   });
      // }
      // zoom to feature with smooth animation
      try {
        // Handle Point geometry
        if (feature.geometry.type === 'Point' && layer.getLatLng) {
          const latlng = layer.getLatLng();
          map.flyTo(latlng, 15, {
            duration: 1.2
          });
          console.log('Zooming to point:', p.name);
        }
        // Handle Polygon geometry (if any remain)
        else if (layer.getBounds) {
          const b = layer.getBounds();
          if (b && b.isValid()) {
            const padding = window.innerWidth < 900 ? [20, 20] : [120, 120];
            map.flyToBounds(b, {
              paddingTopLeft: padding,
              paddingBottomRight: padding,
              maxZoom: 16,
              duration: 1.2
            });
            console.log('Zooming to polygon:', p.name);
          }
        }
      } catch (e) {
        console.error('Error zooming to plot:', e);
      }
    });
  }

  // Close viewer by clicking map or overlay
  // if (imageViewer) {
  //   imageViewer.addEventListener('click', () => {
  //     imageViewer.style.display = 'none';
  //     document.getElementById('map').classList.remove('map-mini');
  //   });
  // }
  // document.getElementById('map').addEventListener('click', () => {
  //   if (imageViewer && imageViewer.style.display === 'flex') {
  //     imageViewer.style.display = 'none';
  //     document.getElementById('map').classList.remove('map-mini');
  //   }
  // });

  // WhatsApp share functionality
  // const whatsappShareBtn = document.getElementById('whatsappShareBtn');
  // if (whatsappShareBtn) {
  //   whatsappShareBtn.addEventListener('click', (e) => {
  //     e.stopPropagation(); // Prevent closing the image viewer

  //     const viewerImg = document.getElementById('viewerImg');
  //     const imageSrc = viewerImg.src;
  //     const currentPlot = selectedMarker ? selectedMarker._featureData.properties : null;

  //     if (imageSrc) {
  //       // Create share message
  //       let shareText = '🏗️ فرصة استثمارية في منطقة الحدود الشمالية \n\n';

  //       if (currentPlot) {
  //         shareText += `📍 ${currentPlot.name || 'قطعة أرض'}\n`;
  //         shareText += `🏢 النشاط: ${currentPlot.activity || '-'}\n`;
  //         shareText += `📍 الحي: ${currentPlot.district || '-'}\n`;
  //         shareText += `📏 المساحة: ${formatArea(currentPlot.area)}\n`;
  //         shareText += `🏗️ نوع المشروع: ${currentPlot.projectType || '-'}\n`;
  //         if (currentPlot.plotNumber) {
  //           shareText += `🔢 رقم الفرصة: ${currentPlot.plotNumber}\n`;
  //         }
  //       }

  //       shareText += `\n📸 صورة الفرصة: ${imageSrc}\n`;
  //       shareText += '\n🌐 للمزيد من التفاصيل والصور الكاملة: ';
  //       shareText += 'https://m-a-wahab.github.io/Investment-Map/';

  //       // Encode for WhatsApp
  //       const encodedText = encodeURIComponent(shareText);

  //       // Open WhatsApp with the message
  //       const whatsappUrl = `https://wa.me/?text=${encodedText}`;
  //       window.open(whatsappUrl, '_blank');
  //     }
  //   });
  // }

  function applyFiltersToData() {
    const filtered = PLOTS_GEOJSON.features.filter(f => {
      // Exclude Temporary_Leasing and Seasonal_Event features from investment section
      // if (f.type === 'Temporary_Leasing' || f.type === 'Seasonal_Event') return false;

      const p = f.properties;
      if (currentFilters.district !== "all" && p.district !== currentFilters.district) return false;
      if (currentFilters.activity !== "all" && p.activity !== currentFilters.activity) return false;
      // if (currentFilters.projectType !== "all" && p.projectType !== currentFilters.projectType) return false;
      const area = p.area || 0;
      if (currentFilters.minArea != null && area < currentFilters.minArea) return false;
      if (currentFilters.maxArea != null && area > currentFilters.maxArea) return false;
      // if (currentFilters.within2026 && !p.within2026Calender) return false;
      return true;
    });
    return { type: "FeatureCollection", features: filtered };
  }

  // Leasing filters state
  // let currentLeasingFilters = {
  //   district: "all",
  //   activity: "all"
  // };

  // function applyLeasingFiltersToData() {
  //   const filtered = PLOTS_GEOJSON.features.filter(f => {
  //     // Only include Temporary_Leasing features
  //     if (f.type !== 'Temporary_Leasing') return false;

  //     const p = f.properties;
  //     if (currentLeasingFilters.district !== "all" && p.district !== currentLeasingFilters.district) return false;
  //     if (currentLeasingFilters.activity !== "all" && p.activity !== currentLeasingFilters.activity) return false;
  //     return true;
  //   });
  //   return { type: "FeatureCollection", features: filtered };
  // }

  // Seasonal Events filters state
  // let currentSeasonalFilters = {
  //   district: "all",
  //   activity: "all"
  // };

  // function applySeasonalFiltersToData() {
  //   const filtered = PLOTS_GEOJSON.features.filter(f => {
  //     // Only include Seasonal_Event features
  //     if (f.type !== 'Seasonal_Event') return false;

  //     const p = f.properties;
  //     if (currentSeasonalFilters.district !== "all" && p.district !== currentSeasonalFilters.district) return false;
  //     if (currentSeasonalFilters.activity !== "all" && p.activity !== currentSeasonalFilters.activity) return false;
  //     return true;
  //   });
  //   return { type: "FeatureCollection", features: filtered };
  // }

  function renderPlots(filteredGeo) {
    // Clear existing markers/polygons
    if (plotsLayer && plotsLayer.length) {
      plotsLayer.forEach(item => item.setMap(null));
    }
    plotsLayer = [];

    // Reset info panel
    resetInfoPanel();

    const bounds = new google.maps.LatLngBounds();

    console.log('=== RENDER PLOTS DEBUG ===');
    console.log('Total features to render:', filteredGeo.features.length);
    console.log('Sample feature:', filteredGeo.features[0]);

    // Render each feature
    let itemCount = 0;
    filteredGeo.features.forEach((feature, index) => {
      if (!feature.geometry || !feature.geometry.coordinates) {
        console.warn('Feature missing geometry:', index);
        return;
      }

      const p = feature.properties;
      const style = getFeatureStyle(feature);

      // Handle Point geometry (markers)
      if (feature.geometry.type === 'Point') {
        const [lng, lat] = feature.geometry.coordinates;
        const position = { lat, lng };

        // Get custom icon based on project type or feature type
        let iconUrl;
        let iconSize = { width: 40, height: 50 };

        // if (feature.type === 'Temporary_Leasing') {
        //   // Custom SVG for Temporary Leasing with orange color (#FF9800)
        //   iconUrl = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDUiIGhlaWdodD0iNTUiIHZpZXdCb3g9IjAgMCA0NSA1NSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGRlZnM+CjxmaWx0ZXIgaWQ9Imdsb3ciIHg9Ii01MCUiIHk9Ii01MCUiIHdpZHRoPSIyMDAlIiBoZWlnaHQ9IjIwMCUiPgo8ZmVHYXVzc2lhbkJsdXIgaW49IlNvdXJjZUdyYXBoaWMiIHN0ZERldmlhdGlvbj0iMyIvPgo8ZmVDb21wb3NpdGUgaW49IlNvdXJjZUdyYXBoaWMiIGluMj0iQmx1ciIgb3BlcmF0b3I9ImluIi8+CjwvZmlsdGVyPgo8L2RlZnM+CjxwYXRoIGQ9Ik0yMi41IDQ1QzEzLjUgMzEuNSA0LjUgMjIuNSA0LjUgMTMuNUM0LjUgNS41IDEzLjUgMC41IDIyLjUgMC41QzMxLjUgMC41IDQwLjUgNS41IDQwLjUgMTMuNUM0MC41IDIyLjUgMzEuNSAzMS41IDIyLjUgNDVaIiBmaWxsPSIjRkY5ODAwIiBzdHJva2U9IiNFNjUxMDAiIHN0cm9rZS13aWR0aD0iMiIgZmlsdGVyPSJ1cmwoI2dsb3cpIi8+CjxjaXJjbGUgY3g9IjIyLjUiIGN5PSIxMy41IiByPSI3IiBmaWxsPSIjRTY1MTAwIi8+CjxjaXJjbGUgY3g9IjIyLjUiIGN5PSIxMy41IiByPSI0IiBmaWxsPSIjZmZmZmZmIi8+Cjwvc3ZnPg==';
        //   iconSize = { width: 45, height: 55 };
        // } else if (feature.type === 'Seasonal_Event') {
        //   // Custom SVG for Seasonal Event with purple color (#9C27B0)
        //   iconUrl = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDUiIGhlaWdodD0iNTUiIHZpZXdCb3g9IjAgMCA0NSA1NSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGRlZnM+CjxmaWx0ZXIgaWQ9Imdsb3ciIHg9Ii01MCUiIHk9Ii01MCUiIHdpZHRoPSIyMDAlIiBoZWlnaHQ9IjIwMCUiPgo8ZmVHYXVzc2lhbkJsdXIgaW49IlNvdXJjZUdyYXBoaWMiIHN0ZERldmlhdGlvbj0iMyIvPgo8ZmVDb21wb3NpdGUgaW49IlNvdXJjZUdyYXBoaWMiIGluMj0iQmx1ciIgb3BlcmF0b3I9ImluIi8+CjwvZmlsdGVyPgo8L2RlZnM+CjxwYXRoIGQ9Ik0yMi41IDQ1QzEzLjUgMzEuNSA0LjUgMjIuNSA0LjUgMTMuNUM0LjUgNS41IDEzLjUgMC41IDIyLjUgMC41QzMxLjUgMC41IDQwLjUgNS41IDQwLjUgMTMuNUM0MC41IDIyLjUgMzEuNSAzMS41IDIyLjUgNDVaIiBmaWxsPSIjOUMyN0IwIiBzdHJva2U9IiM3QjFGQTIiIHN0cm9rZS13aWR0aD0iMiIgZmlsdGVyPSJ1cmwoI2dsb3cpIi8+CjxjaXJjbGUgY3g9IjIyLjUiIGN5PSIxMy41IiByPSI3IiBmaWxsPSIjN0IxRkEyIi8+CjxjaXJjbGUgY3g9IjIyLjUiIGN5PSIxMy41IiByPSI0IiBmaWxsPSIjZmZmZmZmIi8+Cjwvc3ZnPg==';
        //   iconSize = { width: 45, height: 55 };
        // } else if (p.projectType === 'كبرى') {
        //   // Custom SVG for large projects with professional blue color
        //   iconUrl = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDUiIGhlaWdodD0iNTUiIHZpZXdCb3g9IjAgMCA0NSA1NSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGRlZnM+CjxmaWx0ZXIgaWQ9Imdsb3ciIHg9Ii01MCUiIHk9Ii01MCUiIHdpZHRoPSIyMDAlIiBoZWlnaHQ9IjIwMCUiPgo8ZmVHYXVzc2lhbkJsdXIgaW49IlNvdXJjZUdyYXBoaWMiIHN0ZERldmlhdGlvbj0iMyIvPgo8ZmVDb21wb3NpdGUgaW49IlNvdXJjZUdyYXBoaWMiIGluMj0iQmx1ciIgb3BlcmF0b3I9ImluIi8+CjwvZmlsdGVyPgo8L2RlZnM+CjxwYXRoIGQ9Ik0yMi41IDQ1QzEzLjUgMzEuNSA0LjUgMjIuNSA0LjUgMTMuNUM0LjUgNS41IDEzLjUgMC41IDIyLjUgMC41QzMxLjUgMC41IDQwLjUgNS41IDQwLjUgMTMuNUM0MC41IDIyLjUgMzEuNSAzMS41IDIyLjUgNDVaIiBmaWxsPSIjMkU4NkFCIiBzdHJva2U9IiMyMDY0QTgiIHN0cm9rZS13aWR0aD0iMiIgZmlsdGVyPSJ1cmwoI2dsb3cpIi8+CjxjaXJjbGUgY3g9IjIyLjUiIGN5PSIxMy41IiByPSI3IiBmaWxsPSIjMjA2NEE4Ii8+CjxjaXJjbGUgY3g9IjIyLjUiIGN5PSIxMy41IiByPSI0IiBmaWxsPSIjZmZmZmZmIi8+Cjwvc3ZnPg==';
        //   iconSize = { width: 45, height: 55 };
        // } else if (p.projectType === 'متوسطة') {
        //   // Custom SVG for medium projects with vibrant orange color
        //   iconUrl = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDUiIGhlaWdodD0iNTUiIHZpZXdCb3g9IjAgMCA0NSA1NSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGRlZnM+CjxmaWx0ZXIgaWQ9Imdsb3ciIHg9Ii01MCUiIHk9Ii01MCUiIHdpZHRoPSIyMDAlIiBoZWlnaHQ9IjIwMCUiPgo8ZmVHYXVzc2lhbkJsdXIgaW49IlNvdXJjZUdyYXBoaWMiIHN0ZERldmlhdGlvbj0iMyIvPgo8ZmVDb21wb3NpdGUgaW49IlNvdXJjZUdyYXBoaWMiIGluMj0iQmx1ciIgb3BlcmF0b3I9ImluIi8+CjwvZmlsdGVyPgo8L2RlZnM+CjxwYXRoIGQ9Ik0yMi41IDQ1QzEzLjUgMzEuNSA0LjUgMjIuNSA0LjUgMTMuNUM0LjUgNS41IDEzLjUgMC41IDIyLjUgMC41QzMxLjUgMC41IDQwLjUgNS41IDQwLjUgMTMuNUM0MC41IDIyLjUgMzEuNSAzMS41IDIyLjUgNDVaIiBmaWxsPSIjRjc3RjAwIiBzdHJva2U9IiNEMUQ1MDAiIHN0cm9rZS13aWR0aD0iMiIgZmlsdGVyPSJ1cmwoI2dsb3cpIi8+CjxjaXJjbGUgY3g9IjIyLjUiIGN5PSIxMy41IiByPSI3IiBmaWxsPSIjRDFENTAwIi8+CjxjaXJjbGUgY3g9IjIyLjUiIGN5PSIxMy41IiByPSI0IiBmaWxsPSIjZmZmZmZmIi8+Cjwvc3ZnPg==';
        //   iconSize = { width: 45, height: 55 };
        // } else {
        // Default marker
        iconUrl = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNDUiIGhlaWdodD0iNTUiIHZpZXdCb3g9IjAgMCA0NSA1NSIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGRlZnM+CjxmaWx0ZXIgaWQ9Imdsb3ciIHg9Ii01MCUiIHk9Ii01MCUiIHdpZHRoPSIyMDAlIiBoZWlnaHQ9IjIwMCUiPgo8ZmVHYXVzc2lhbkJsdXIgaW49IlNvdXJjZUdyYXBoaWMiIHN0ZERldmlhdGlvbj0iMyIvPgo8ZmVDb21wb3NpdGUgaW49IlNvdXJjZUdyYXBoaWMiIGluMj0iQmx1ciIgb3BlcmF0b3I9ImluIi8+CjwvZmlsdGVyPgo8L2RlZnM+CjxwYXRoIGQ9Ik0yMi41IDQ1QzEzLjUgMzEuNSA0LjUgMjIuNSA0LjUgMTMuNUM0LjUgNS41IDEzLjUgMC41IDIyLjUgMC41QzMxLjUgMC41IDQwLjUgNS41IDQwLjUgMTMuNUM0MC41IDIyLjUgMzEuNSAzMS41IDIyLjUgNDVaIiBmaWxsPSIjMjhhNzQ1IiBzdHJva2U9IiMxZTdlMzQiIHN0cm9rZS13aWR0aD0iMiIgZmlsdGVyPSJ1cmwoI2dsb3cpIi8+CjxjaXJjbGUgY3g9IjIyLjUiIGN5PSIxMy41IiByPSI3IiBmaWxsPSIjMWU3ZTM0Ii8+CjxjaXJjbGUgY3g9IjIyLjUiIGN5PSIxMy41IiByPSI0IiBmaWxsPSIjZmZmZmZmIi8+Cjwvc3ZnPg==';
        iconSize = { width: 45, height: 55 };
        // }

        const markerOptions = {
          position: position,
          map: map,
          title: p.name || 'قطعة أرض',
          animation: google.maps.Animation.DROP
        };

        // Add custom icon
        markerOptions.icon = {
          url: iconUrl,
          scaledSize: new google.maps.Size(iconSize.width, iconSize.height),
          anchor: new google.maps.Point(iconSize.width / 2, iconSize.height)
        };

        const marker = new google.maps.Marker(markerOptions);

        // Store feature data for later use
        marker._featureData = feature;

        // Extend bounds
        bounds.extend(position);

        // Add hover effect
        marker.addListener('mouseover', () => {
          if (selectedMarker !== marker) {
            marker.setAnimation(google.maps.Animation.BOUNCE);
            setTimeout(() => {
              if (selectedMarker !== marker) {
                marker.setAnimation(null);
              }
            }, 700);
          }
        });

        // Function to update info card based on feature type
        function updateInfoCard(properties) {
          const p = properties;
          const infoRouteLine = document.getElementById('infoRouteLine');
          const infoRoute = document.getElementById('infoRoute');

          // Check if this is a Temporary Leasing or Seasonal Event feature
          // if (p.type === 'Temporary_Leasing' || p.type === 'Seasonal_Event') {
          //   // Update for Temporary Leasing / Seasonal Event
          //   // Display: الاسم - الحي - المساحة - النشاط - الطريق - الملاحظات
          //   // Hide: رقم الفرصة, نوع المشروع

          //   const typeTitle = p.type === 'Seasonal_Event' ? 'فاعلية موسمية' : 'موقع تأجير مؤقت';
          //   infoTitle.textContent = p.name || typeTitle;

          //   // Hide رقم الفرصة for leasing/seasonal infoPlotNumber)
          //   infoPlotNumber.parentElement.querySelector('span').textContent = 'الاسم';
          //   infoPlotNumber.textContent = p.name || '-';

          //   // Field 2: الحي (using infoDistrict) - already has correct label
          //   infoDistrict.textContent = p.district || '-';

          //   // Field 3: المساحة (using infoArea) - already has correct label
          //   infoArea.textContent = formatArea(p.area);

          //   // Field 4: النشاط (using infoPlanNumber)
          //   infoPlanNumber.parentElement.querySelector('span').textContent = 'النشاط';
          //   infoPlanNumber.textContent = p.activity || '-';

          //   // Field 5: الطريق (using infoRoute) - show this field
          //   if (infoRouteLine) {
          //     infoRouteLine.style.display = '';
          //     if (infoRoute) infoRoute.textContent = p.routeName || '-';
          //   }

          //   // Field 6: الملاحظات (using infoStatus)
          //   const statusElement = document.getElementById('infoStatus');
          //   statusElement.parentElement.querySelector('span').textContent = 'الملاحظات';
          //   statusElement.textContent = p.notes || '-';
          //   statusElement.style.whiteSpace = 'pre-wrap';
          //   statusElement.style.fontSize = '11px';
          //   statusElement.style.lineHeight = '1.4';
          //  } else {
          // Update for Investment Opportunities (default)
          infoTitle.textContent = p.name || 'قطعة أرض';

          infoPlotNumber.parentElement.querySelector('span').textContent = 'رقم الفرصة';
          infoPlotNumber.textContent = p.forsaNumber || '-';

          infoActivity.parentElement.querySelector('span').textContent = 'النشاط';
          infoActivity.textContent = p.activity || '-';

          infoDistrict.textContent = p.district || '-';

          infoArea.parentElement.querySelector('span').textContent = 'المساحة';
          infoArea.textContent = formatArea(p.area);

          infoContractPeriod.parentElement.querySelector('span').textContent = 'مدة العقد';
          infoContractPeriod.textContent = p.contractPeriod || '-';

          infoBucketPrice.parentElement.querySelector('span').textContent = 'سعر كراسة الشروط';
          infoBucketPrice.textContent = p.buckletPrice || '-';

          infoAdvertiseDate.parentElement.querySelector('span').textContent = 'تاريخ الإعلان';
          infoAdvertiseDate.textContent = p.advertiseDate || '-';

          infoOpenEnvelopesDate.parentElement.querySelector('span').textContent = 'تاريخ فتح المظاريف';
          infoOpenEnvelopesDate.textContent = p.openEnvelopesDate || '-';

          // Update Buttons
          const cardActions = document.getElementById('cardActions');
          const btnForsa = document.getElementById('btnForsa');
          const btnDesCard = document.getElementById('btnDesCard');

          if (cardActions && btnForsa && btnDesCard) {
            let hasActions = false;

            if (p.forusLink) {
              btnForsa.href = p.forusLink;
              btnForsa.style.display = '';
              hasActions = true;
            } else {
              btnForsa.style.display = 'none';
            }

            if (p.desCard && (Array.isArray(p.desCard) ? p.desCard.length > 0 : p.desCard)) {
              // If desCard is an array, take the first one, or join them? Usually PDF link is one. 
              // Looking at data: desCard: ["desCards/1/1.pdf"]
              const link = Array.isArray(p.desCard) ? p.desCard[0] : p.desCard;
              btnDesCard.href = link;
              btnDesCard.style.display = '';
              hasActions = true;
            } else {
              btnDesCard.style.display = 'none';
            }

            if (hasActions) {
              cardActions.style.display = 'flex';
            } else {
              cardActions.style.display = 'none';
            }
          }
          //  }
        }

        // Add click listener
        marker.addListener('click', () => {
          // Reset previous marker if exists
          if (selectedMarker && selectedMarker !== marker) {
            resetMarkerStyle(selectedMarker);
          }

          // Set new selected marker
          selectedMarker = marker;
          highlightMarker(marker);

          // Update info card using the helper function
          updateInfoCard(p);

          // Render images
          if (infoImages) {
            infoImages.innerHTML = '';
            (p.images || []).slice(0, 6).forEach(src => {
              const img = document.createElement('img');
              img.src = src;
              img.alt = p.name || 'صورة قطعة أرض';
              img.style.cursor = 'zoom-in';
              img.addEventListener('click', () => {
                if (viewerImg && imageViewer) {
                  viewerImg.src = src;
                  imageViewer.style.display = 'flex';
                  document.getElementById('map').classList.add('map-mini');
                }
              });
              infoImages.appendChild(img);
            });
          }

          // Zoom to marker with bounce animation
          map.setCenter(position);
          map.setZoom(15);
          marker.setAnimation(google.maps.Animation.BOUNCE);

          // Animate info card from marker position
          animateInfoCardFromMarker(marker, () => {
            // Stop marker bounce after card animation completes
            setTimeout(() => {
              if (selectedMarker === marker) {
                marker.setAnimation(null);
              }
            }, 1000);
          });
        });

        plotsLayer.push(marker);
        itemCount++;
      }
      // Handle Polygon geometry (if any remain)
      else if (feature.geometry.type === 'Polygon' || feature.geometry.type === 'MultiPolygon') {
        let coordinatesList = [];
        if (feature.geometry.type === 'Polygon') {
          coordinatesList = [feature.geometry.coordinates[0]];
        } else {
          coordinatesList = feature.geometry.coordinates.map(poly => poly[0]);
        }

        coordinatesList.forEach(coordinates => {
          const coords = coordinates.map(coord => ({
            lat: coord[1],
            lng: coord[0]
          }));

          if (coords.length < 3) return;

          const polygon = new google.maps.Polygon({
            paths: coords,
            strokeColor: style.color,
            strokeOpacity: 1,
            strokeWeight: style.weight,
            fillColor: style.fillColor,
            fillOpacity: style.fillOpacity,
            map: map
          });

          coords.forEach(coord => bounds.extend(coord));

          // polygon.addListener('click', () => {
          //   infoTitle.textContent = p.name || 'قطعة أرض';
          //   infoPlotNumber.textContent = p.plotNumber || '-';
          //   infoPlanNumber.textContent = p.activity || '-';
          //   infoDistrict.textContent = p.district || '-';
          //   infoArea.textContent = formatArea(p.area);
          //   document.getElementById('infoStatus').textContent = p.projectType || '-';

          //   // Render images
          //   if (infoImages) {
          //     infoImages.innerHTML = '';
          //     (p.images || []).slice(0, 6).forEach(src => {
          //       const img = document.createElement('img');
          //       img.src = src;
          //       img.alt = p.name || 'صورة قطعة أرض';
          //       img.style.cursor = 'zoom-in';
          //       img.addEventListener('click', () => {
          //         if (viewerImg && imageViewer) {
          //           viewerImg.src = src;
          //           imageViewer.style.display = 'flex';
          //           document.getElementById('map').classList.add('map-mini');
          //         }
          //       });
          //       infoImages.appendChild(img);
          //     });
          //   }

          //   const polyBounds = new google.maps.LatLngBounds();
          //   coords.forEach(coord => polyBounds.extend(coord));
          //   map.fitBounds(polyBounds);
          // });

          plotsLayer.push(polygon);
          itemCount++;
        });
      }
    });

    console.log('Total items created:', itemCount);
    console.log('Bounds:', bounds.isEmpty() ? 'EMPTY' : bounds.toString());

    // Fit map to all markers/polygons
    if (filteredGeo.features.length > 0 && !bounds.isEmpty()) {
      map.fitBounds(bounds);
      console.log('Map fitted to bounds');
    } else {
      console.warn('No bounds to fit or no features');
    }


  }

  function applyFiltersFromUI() {
    const minArea = areaMinRange ? Number(areaMinRange.value) : null;
    const maxArea = areaMaxRange ? Number(areaMaxRange.value) : null;
    statsPanel.style.display = 'block';
    currentFilters = {
      district: districtSelect.value,
      activity: activitySelect.value,
      // projectType: typeSelect.value,
      minArea: Number.isFinite(minArea) ? minArea : null,
      maxArea: Number.isFinite(maxArea) ? maxArea : null,
      // within2026: within2026Check ? within2026Check.checked : false
    };

    const filteredGeo = applyFiltersToData();
    // Update stats
    const { count, totalArea, investmentCount, mediumProjectCount } = computeStats(filteredGeo.features);
    // if (filteredGeo.features.length === PLOTS_GEOJSON.features.length) {
    // statFilteredCount.textContent = "0";
    // statFilteredGrantProject.textContent = "0";
    // statFilteredMediumProject.textContent = "0";
    // } else {
    statFilteredCount.textContent = new Intl.NumberFormat("ar-SA").format(count);
    // statFilteredGrantProject.textContent = new Intl.NumberFormat("ar-SA").format(investmentCount);
    // statFilteredMediumProject.textContent = new Intl.NumberFormat("ar-SA").format(mediumProjectCount);
    // }
    renderPlots(filteredGeo);
  }

  function resetFilters() {
    statsPanel.style.display = 'none';
    districtSelect.value = "all";
    activitySelect.value = "all";
    // typeSelect.value = "all";
    // if (within2026Check) within2026Check.checked = false;

    // typeSegContainer.querySelectorAll('.seg').forEach(b => b.classList.remove('active'));

    areaMinRange.value = "0";
    areaMaxRange.value = "5000000";

    // Clear search input
    if (searchInput) {
      searchInput.value = '';
    }

    // Hide charts when reset is clicked
    // if (districtChartsPanel) {
    //   districtChartsPanel.style.display = 'none';
    // }

    // // Set map center to ARAR_CENTER
    // map.setCenter({ lat: ARAR_CENTER[0], lng: ARAR_CENTER[1] });
    // map.setZoom(20);

    // range sliders already at defaults
    applyFiltersFromUI();

    // Then zoom in with animation
    setTimeout(() => {
      map.panTo({ lat: window.ARAR_CENTER[0], lng: window.ARAR_CENTER[1] });
      map.setZoom(13);
      console.log('Zooming to Arar city');
    }, 300);
  }

  function resetInfoPanel() {

    infoTitle.textContent = 'قطعة أرض';
    infoPlotNumber.textContent = '-';
    infoActivity.textContent = '-';
    infoDistrict.textContent = '-';
    infoArea.textContent = formatArea(0);
    infoContractPeriod.textContent = '-';
    infoBucketPrice.textContent = '-';
    infoAdvertiseDate.textContent = '-';
    infoOpenEnvelopesDate.textContent = '-';

    const cardActions = document.getElementById('cardActions');
    if (cardActions) cardActions.style.display = 'none';
  }

  function animateInfoCardFromMarker(marker, callback) {
    const infoCard = document.getElementById('infoCard');

    // Reset any previous animations
    infoCard.classList.remove('card-appear', 'card-glow', 'card-attention');

    // Set final position immediately
    infoCard.style.position = 'absolute';
    infoCard.style.left = 'auto';
    infoCard.style.top = '16px';
    infoCard.style.right = '16px';
    infoCard.style.opacity = '1';
    infoCard.style.transform = 'scale(1)';
    infoCard.style.filter = 'blur(0px)';
    infoCard.style.transition = 'none';

    // Show the card instantly
    infoCard.style.display = 'block';

    // Force reflow
    infoCard.offsetHeight;

    // Add bounce animation immediately
    infoCard.classList.add('card-attention');

    // Remove animation class after bounce completes
    setTimeout(() => {
      infoCard.classList.remove('card-attention');
      if (callback) callback();
    }, 800);
  }

  applyBtn.addEventListener("click", applyFiltersFromUI);
  resetBtn.addEventListener("click", resetFilters);
  // if (within2026Check) {
  //   within2026Check.addEventListener("change", applyFiltersFromUI);
  // }

  // Leasing section button handlers
  // const applyLeasingBtn = document.getElementById("applyLeasingFilters");
  // const resetLeasingBtn = document.getElementById("resetLeasingFilters");
  // const statLeasingCount = document.getElementById("statLeasingCount");
  // const statLeasingArea = document.getElementById("statLeasingArea");
  // const statLeasingActivities = document.getElementById("statLeasingActivities");

  // function applyLeasingFiltersFromUI() {
  //   currentLeasingFilters = {
  //     district: leasingDistrictSelect ? leasingDistrictSelect.value : "all",
  //     activity: leasingActivitySelect ? leasingActivitySelect.value : "all"
  //   };

  //   const filteredGeo = applyLeasingFiltersToData();

  //   // Update leasing stats
  //   const count = filteredGeo.features.length;
  //   const totalArea = filteredGeo.features.reduce((sum, f) => sum + (f.properties.area || 0), 0);
  //   const uniqueActivities = new Set(filteredGeo.features.map(f => f.properties.activity)).size;

  //   if (statLeasingCount) statLeasingCount.textContent = new Intl.NumberFormat("ar-SA").format(count);
  //   if (statLeasingArea) statLeasingArea.textContent = formatArea(totalArea);
  //   if (statLeasingActivities) statLeasingActivities.textContent = new Intl.NumberFormat("ar-SA").format(uniqueActivities);

  //   // Render only leasing plots (clears investment plots)
  //   renderPlots(filteredGeo);
  // }

  // function resetLeasingFilters() {
  //   if (leasingDistrictSelect) leasingDistrictSelect.value = "all";
  //   if (leasingActivitySelect) leasingActivitySelect.value = "all";

  //   applyLeasingFiltersFromUI();

  //   // Recenter map
  //   setTimeout(() => {
  //     map.panTo({ lat: window.ARAR_CENTER[0], lng: window.ARAR_CENTER[1] });
  //     map.setZoom(13);
  //   }, 300);
  // }

  // if (applyLeasingBtn) {
  //   applyLeasingBtn.addEventListener("click", applyLeasingFiltersFromUI);
  // }
  // if (resetLeasingBtn) {
  //   resetLeasingBtn.addEventListener("click", resetLeasingFilters);
  // }

  // Seasonal section button handlers
  // const applySeasonalBtn = document.getElementById("applySeasonalFilters");
  // const resetSeasonalBtn = document.getElementById("resetSeasonalFilters");
  // const statSeasonalCount = document.getElementById("statSeasonalCount");
  // const statSeasonalArea = document.getElementById("statSeasonalArea");
  // const statSeasonalActivities = document.getElementById("statSeasonalActivities");

  // function applySeasonalFiltersFromUI() {
  //   currentSeasonalFilters = {
  //     district: seasonalDistrictSelect ? seasonalDistrictSelect.value : "all",
  //     activity: seasonalActivitySelect ? seasonalActivitySelect.value : "all"
  //   };

  //   const filteredGeo = applySeasonalFiltersToData();

  //   // Update seasonal stats
  //   const count = filteredGeo.features.length;
  //   const totalArea = filteredGeo.features.reduce((sum, f) => sum + (f.properties.area || 0), 0);
  //   const uniqueActivities = new Set(filteredGeo.features.map(f => f.properties.activity)).size;

  //   if (statSeasonalCount) statSeasonalCount.textContent = new Intl.NumberFormat("ar-SA").format(count);
  //   if (statSeasonalArea) statSeasonalArea.textContent = formatArea(totalArea);
  //   if (statSeasonalActivities) statSeasonalActivities.textContent = new Intl.NumberFormat("ar-SA").format(uniqueActivities);

  //   // Render only seasonal plots (clears investment plots)
  //   renderPlots(filteredGeo);
  // }

  // function resetSeasonalFilters() {
  //   if (seasonalDistrictSelect) seasonalDistrictSelect.value = "all";
  //   if (seasonalActivitySelect) seasonalActivitySelect.value = "all";

  //   applySeasonalFiltersFromUI();

  //   // Recenter map
  //   setTimeout(() => {
  //     map.panTo({ lat: window.ARAR_CENTER[0], lng: window.ARAR_CENTER[1] });
  //     map.setZoom(13);
  //   }, 300);
  // }

  // if (applySeasonalBtn) {
  //   applySeasonalBtn.addEventListener("click", applySeasonalFiltersFromUI);
  // }
  // if (resetSeasonalBtn) {
  //   resetSeasonalBtn.addEventListener("click", resetSeasonalFilters);
  // }

  // Segmented controls behavior
  // statusSegContainer.addEventListener('click', (e) => {
  //   const btn = e.target.closest('.seg');
  //   if (!btn) return;
  //   statusSegContainer.querySelectorAll('.seg').forEach(b => b.classList.remove('active'));
  //   btn.classList.add('active');
  //   const val = btn.getAttribute('data-status');
  //   if (val) statusSelect.value = val;
  // });

  // typeSegContainer.addEventListener('click', (e) => {
  //   const btn = e.target.closest('.seg');
  //   if (!btn) return;
  //   typeSegContainer.querySelectorAll('.seg').forEach(b => b.classList.remove('active'));
  //   btn.classList.add('active');
  //   const val = btn.getAttribute('data-type');
  //   if (val) typeSelect.value = val;
  // });

  // Range UI syncing
  function updateRangeLabels() {
    if (areaMinVal) areaMinVal.textContent = new Intl.NumberFormat('ar-SA').format(Number(areaMinRange.value));
    if (areaMaxVal) areaMaxVal.textContent = new Intl.NumberFormat('ar-SA').format(Number(areaMaxRange.value));
  }
  if (areaMinRange && areaMaxRange) {
    areaMinRange.addEventListener('input', () => { if (Number(areaMinRange.value) > Number(areaMaxRange.value)) areaMaxRange.value = areaMinRange.value; updateRangeLabels(); });
    areaMaxRange.addEventListener('input', () => { if (Number(areaMaxRange.value) < Number(areaMinRange.value)) areaMinRange.value = areaMaxRange.value; updateRangeLabels(); });
    updateRangeLabels();
  }

  // Charts functionality
  // let investmentChart = null;
  // let projectTypeChart = null;
  // const districtChartsPanel = document.getElementById('districtCharts');

  // function updateDistrictCharts(districtName) {
  //   if (districtName === 'all') {
  //     // Hide charts when "all" is selected
  //     districtChartsPanel.style.display = 'none';
  //     return;
  //   }

  //   // Show charts panel
  //   districtChartsPanel.style.display = 'block';

  //   // Filter data for selected district
  //   const districtPlots = PLOTS_GEOJSON.features.filter(f => f.properties.district === districtName);

  //   console.log('District charts for:', districtName, 'Found plots:', districtPlots.length);

  //   // Calculate project type data (for first chart)
  //   const projectTypeData = {};
  //   districtPlots.forEach(f => {
  //     const type = f.properties.projectType || 'غير محدد';
  //     projectTypeData[type] = (projectTypeData[type] || 0) + 1;
  //   });

  //   // Calculate activity data (for second chart)
  //   const activityData = {};
  //   districtPlots.forEach(f => {
  //     const activity = f.properties.activity || 'غير محدد';
  //     activityData[activity] = (activityData[activity] || 0) + 1;
  //   });

  //   // Destroy existing charts
  //   if (investmentChart) {
  //     investmentChart.destroy();
  //   }
  //   if (projectTypeChart) {
  //     projectTypeChart.destroy();
  //   }

  //   // Create project type chart (first chart)
  //   const investmentCtx = document.getElementById('investmentChart');
  //   if (investmentCtx) {
  //     const projectTypeLabels = Object.keys(projectTypeData);
  //     const projectTypeValues = Object.values(projectTypeData);

  //     investmentChart = new Chart(investmentCtx, {
  //       type: 'doughnut',
  //       data: {
  //         labels: projectTypeLabels,
  //         datasets: [{
  //           data: projectTypeValues,
  //           backgroundColor: [
  //             'rgba(0, 168, 107, 0.8)',  // Green for كبرى
  //             'rgba(215, 183, 122, 0.8)', // Gold for متوسطة
  //             'rgba(167, 184, 177, 0.8)'  // Gray for other
  //           ],
  //           borderColor: [
  //             '#00a86b',
  //             '#d7b77a',
  //             '#a7b8b1'
  //           ],
  //           borderWidth: 2
  //         }]
  //       },
  //       options: {
  //         responsive: true,
  //         maintainAspectRatio: true,
  //         plugins: {
  //           legend: {
  //             position: 'bottom',
  //             labels: {
  //               color: '#e8f1ed',
  //               font: {
  //                 family: 'Tajawal',
  //                 size: 12
  //               },
  //               padding: 10
  //             }
  //           },
  //           tooltip: {
  //             backgroundColor: 'rgba(12, 20, 18, 0.95)',
  //             titleColor: '#e8f1ed',
  //             bodyColor: '#e8f1ed',
  //             borderColor: 'rgba(255, 255, 255, 0.12)',
  //             borderWidth: 1,
  //             padding: 12,
  //             titleFont: {
  //               family: 'Tajawal',
  //               size: 14
  //             },
  //             bodyFont: {
  //               family: 'Tajawal',
  //               size: 13
  //             }
  //           }
  //         }
  //       }
  //     });
  //   }

  //   // Create activity chart (second chart)
  //   const projectTypeCtx = document.getElementById('projectTypeChart');
  //   if (projectTypeCtx) {
  //     const activityLabels = Object.keys(activityData);
  //     const activityValues = Object.values(activityData);

  //     projectTypeChart = new Chart(projectTypeCtx, {
  //       type: 'bar',
  //       data: {
  //         labels: activityLabels,
  //         datasets: [{
  //           label: 'عدد القطع',
  //           data: activityValues,
  //           backgroundColor: 'rgba(215, 183, 122, 0.7)',
  //           borderColor: '#d7b77a',
  //           borderWidth: 2,
  //           borderRadius: 8
  //         }]
  //       },
  //       options: {
  //         responsive: true,
  //         maintainAspectRatio: true,
  //         scales: {
  //           y: {
  //             beginAtZero: true,
  //             ticks: {
  //               color: '#a7b8b1',
  //               font: {
  //                 family: 'Tajawal',
  //                 size: 11
  //               },
  //               stepSize: 1
  //             },
  //             grid: {
  //               color: 'rgba(255, 255, 255, 0.06)'
  //             }
  //           },
  //           x: {
  //             ticks: {
  //               color: '#a7b8b1',
  //               font: {
  //                 family: 'Tajawal',
  //                 size: 11
  //               }
  //             },
  //             grid: {
  //               display: false
  //             }
  //           }
  //         },
  //         plugins: {
  //           legend: {
  //             display: false
  //           },
  //           tooltip: {
  //             backgroundColor: 'rgba(12, 20, 18, 0.95)',
  //             titleColor: '#e8f1ed',
  //             bodyColor: '#e8f1ed',
  //             borderColor: 'rgba(255, 255, 255, 0.12)',
  //             borderWidth: 1,
  //             padding: 12,
  //             titleFont: {
  //               family: 'Tajawal',
  //               size: 14
  //             },
  //             bodyFont: {
  //               family: 'Tajawal',
  //               size: 13
  //             }
  //           }
  //         }
  //       }
  //     });
  //   }
  // }

  // // Listen to district selection changes
  // districtSelect.addEventListener('change', (e) => {
  //   updateDistrictCharts(e.target.value);
  // });

  // Remove map click listener for charts (charts should only hide on reset)

  // Update quick stats bar
  // Update quick stats bar
  // function updateQuickStats() {
  //   const allFeatures = PLOTS_GEOJSON.features;

  //   // 1. Total Plots: Count all features
  //   const totalCount = allFeatures.length;

  //   // 2. 2026 Calendar: type "Feature" AND within2026Calender is true
  //   const count2026 = allFeatures.filter(f => (f.type === 'Feature' || !f.type) && f.properties.within2026Calender === true).length;

  //   // 3. Temporary Leasing: type "Temporary_Leasing"
  //   const countLeasing = allFeatures.filter(f => f.type === 'Temporary_Leasing').length;

  //   // 4. Seasonal Events: type "Seasonal_Event"
  //   const countSeasonal = allFeatures.filter(f => f.type === 'Seasonal_Event').length;

  //   // if (statCount) statCount.textContent = new Intl.NumberFormat("ar-SA").format(totalCount);
  //   // if (stat2026) stat2026.textContent = new Intl.NumberFormat("ar-SA").format(count2026);
  //   // if (statLeasing) statLeasing.textContent = new Intl.NumberFormat("ar-SA").format(countLeasing);
  //   // if (statSeasonal) statSeasonal.textContent = new Intl.NumberFormat("ar-SA").format(countSeasonal);
  // }

  // Recenter button
  const recenterBtn = document.getElementById('recenterBtn');
  if (recenterBtn) {
    recenterBtn.addEventListener('click', () => {
      map.panTo({ lat: ARAR_CENTER[0], lng: ARAR_CENTER[1] });
      map.setZoom(13);
    });
  }

  // Fullscreen button
  const fullscreenBtn = document.getElementById('fullscreenBtn');
  if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', () => {
      const mapElement = document.getElementById('map');
      if (!document.fullscreenElement) {
        mapElement.requestFullscreen().then(() => {
          setTimeout(() => map.invalidateSize(), 100);
        });
      } else {
        document.exitFullscreen().then(() => {
          setTimeout(() => map.invalidateSize(), 100);
        });
      }
    });
  }

  // Marker styling functions
  function highlightMarker(marker) {
    // Store original icon if not already stored
    if (!marker._originalIcon) {
      marker._originalIcon = marker.getIcon();
    }

    // Create highlighted icon (larger and with enhanced glow effect)
    const highlightedIcon = {
      url: 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNzAiIHZpZXdCb3g9IjAgMCA2MCA3MCIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGRlZnM+CjxmaWx0ZXIgaWQ9InNlbGVjdGVkR2xvdyIgeD0iLTUwJSIgeT0iLTUwJSIgd2lkdGg9IjIwMCUiIGhlaWdodD0iMjAwJSI+CjxmZUdhdXNzaWFuQmx1ciBpbj0iU291cmNlR3JhcGhpYyIgc3RkRGV2aWF0aW9uPSI0Ii8+CjxmZUNvbXBvc2l0ZSBpbj0iU291cmNlR3JhcGhpYyIgaW4yPSJCbHVyIiBvcGVyYXRvcj0iaW4iLz4KPC9maWx0ZXI+CjxsaW5lYXJHcmFkaWVudCBpZD0ic2VsZWN0ZWRHcmFkaWVudCIgeDE9IjAlIiB5MT0iMCUiIHgyPSIxMDAlIiB5Mj0iMTAwJSI+CjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9IiNmZjZiNmIiLz4KPHN0b3Agb2Zmc2V0PSIxMDAlIiBzdG9wLWNvbG9yPSIjZmYzMzMzIi8+CjwvbGluZWFyR3JhZGllbnQ+CjwvZGVmcz4KPHBhdGggZD0iTTMwIDU1QzE4IDQzIDYgMzAgNiAxOC41QzYgOC41IDE4IDIgMzAgMkM0MiAyIDU0IDguNSA1NCAxOC41QzU0IDMwIDQyIDQzIDMwIDU1WiIgZmlsbD0idXJsKCNzZWxlY3RlZEdyYWRpZW50KSIgc3Ryb2tlPSIjZmYzMzMzIiBzdHJva2Utd2lkdGg9IjMiIGZpbHRlcj0idXJsKCNzZWxlY3RlZEdsb3cpIi8+CjxjaXJjbGUgY3g9IjMwIiBjeT0iMTcuNSIgcj0iOCIgZmlsbD0iI2ZmMzMzMyIvPgo8Y2lyY2xlIGN4PSIzMCIgY3k9IjE3LjUiIHI9IjQiIGZpbGw9IiNmZmZmZmYiLz4KPGNpcmNsZSBjeD0iMzAiIGN5PSIxNy41IiByPSIxLjUiIGZpbGw9IiNmZjMzMzMiLz4KPC9zdmc+',
      scaledSize: new google.maps.Size(60, 70), // Much larger size
      anchor: new google.maps.Point(30, 70)
    };

    marker.setIcon(highlightedIcon);
    marker.setZIndex(google.maps.Marker.MAX_ZINDEX + 1); // Bring to front
  }

  function resetMarkerStyle(marker) {
    if (marker._originalIcon) {
      marker.setIcon(marker._originalIcon);
      marker.setZIndex(null); // Reset z-index
    }
  }

  // Search functionality
  const searchInput = document.getElementById('searchInput');
  const searchBtn = document.getElementById('searchBtn');

  function searchPlots(query) {
    if (!query) return;

    // Get currently filtered data
    const filteredGeo = applyFiltersToData();
    const currentFeatures = filteredGeo.features;

    console.log('Searching in', currentFeatures.length, 'filtered plots for:', query);

    const lowerQuery = query.toLowerCase();
    const foundFeature = currentFeatures.find(f => {
      const p = f.properties;
      return (
        (p.name && p.name.toLowerCase().includes(lowerQuery)) ||
        (p.plotNumber && p.plotNumber.toLowerCase().includes(lowerQuery)) ||
        (p.district && p.district.toLowerCase().includes(lowerQuery)) ||
        (p.activity && p.activity.toLowerCase().includes(lowerQuery))
      );
    });

    if (!foundFeature) {
      alert('لم يتم العثور على نتائج');
      return;
    }

    // Find the index in the original PLOTS_GEOJSON to get the correct marker
    const originalIndex = PLOTS_GEOJSON.features.findIndex(f =>
      f.properties.name === foundFeature.properties.name &&
      f.properties.plotNumber === foundFeature.properties.plotNumber &&
      f.properties.district === foundFeature.properties.district
    );

    if (originalIndex !== -1 && plotsLayer && plotsLayer[originalIndex]) {
      const mapItem = plotsLayer[originalIndex];
      const feature = foundFeature;

      // Reset previous marker if exists
      if (selectedMarker && selectedMarker !== mapItem) {
        resetMarkerStyle(selectedMarker);
      }

      // Set new selected marker
      selectedMarker = mapItem;
      highlightMarker(mapItem);

      // Set info card content
      const p = feature.properties;
      infoTitle.textContent = p.name || 'قطعة أرض';
      infoPlotNumber.textContent = p.forsaNumber || '-';
      infoActivity.textContent = p.activity || '-';
      infoDistrict.textContent = p.district;
      infoArea.textContent = formatArea(p.area);
      infoContractPeriod.textContent = p.contractPeriod || '-';
      infoBucketPrice.textContent = p.buckletPrice || '-';
      infoAdvertiseDate.textContent = p.advertiseDate || '-';
      infoOpenEnvelopesDate.textContent = p.openEnvelopesDate || '-';

      // Render images
      // if (infoImages) {
      //   infoImages.innerHTML = '';
      //   (p.images || []).slice(0, 6).forEach(src => {
      //     const img = document.createElement('img');
      //     img.src = src;
      //     img.alt = p.name || 'صورة قطعة أرض';
      //     img.style.cursor = 'zoom-in';
      //     img.addEventListener('click', () => {
      //       if (viewerImg && imageViewer) {
      //         viewerImg.src = src;
      //         imageViewer.style.display = 'flex';
      //         document.getElementById('map').classList.add('map-mini');
      //       }
      //     });
      //     infoImages.appendChild(img);
      //   });
      // }

      // Handle both markers (Point) and polygons
      if (feature.geometry.type === 'Point') {
        // For markers, get position and zoom
        const position = mapItem.getPosition();
        map.setCenter(position);
        map.setZoom(16);

        // Add bounce animation
        mapItem.setAnimation(google.maps.Animation.BOUNCE);

        // Animate info card from marker position
        animateInfoCardFromMarker(mapItem, () => {
          // Stop marker bounce after card animation completes
          setTimeout(() => {
            if (selectedMarker === mapItem) {
              mapItem.setAnimation(null);
            }
          }, 1000);
        });
      } else {
        // For polygons, get bounds and show info card normally
        const bounds = new google.maps.LatLngBounds();
        mapItem.getPath().forEach(coord => bounds.extend(coord));
        map.fitBounds(bounds);
        map.setZoom(Math.min(map.getZoom(), 16));

        // Show info card without animation for polygons
        document.getElementById('infoCard').style.display = 'block';
      }
    } else {
      alert('لم يتم العثور على نتائج');
    }
  }

  if (searchBtn) {
    searchBtn.addEventListener('click', () => {
      searchPlots(searchInput.value);
    });
  }

  if (searchInput) {
    searchInput.addEventListener('keypress', (e) => {
      if (e.key === 'Enter') {
        searchPlots(searchInput.value);
      }
    });
  }

  // Share button
  // const shareBtn = document.getElementById('shareBtn');
  // if (shareBtn) {
  //   shareBtn.addEventListener('click', () => {
  //     const plotName = document.getElementById('infoTitle').textContent;
  //     const plotNumber = document.getElementById('infoPlotNumber').textContent;
  //     const district = document.getElementById('infoDistrict').textContent;

  //     const shareText = `قطعة أرض: ${plotName}\nرقم القطعة: ${plotNumber}\nالحي: ${district}\n\nخريطة الاستثمارات - أمانة منطقة الحدود الشمالية`;

  //     if (navigator.share) {
  //       navigator.share({
  //         title: plotName,
  //         text: shareText,
  //         url: window.location.href
  //       }).catch(() => {});
  //     } else {
  //       // Fallback: copy to clipboard
  //       navigator.clipboard.writeText(shareText).then(() => {
  //         alert('تم نسخ المعلومات إلى الحافظة');
  //       });
  //     }
  //   });
  // }
  const filteredGeo = applyFiltersToData();
  // Initial render
  renderPlots(filteredGeo);
})();
