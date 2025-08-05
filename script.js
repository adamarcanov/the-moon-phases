// Globalne zmienne
let scene, camera, renderer;
let sun, earth, moon;
let planets = {}; // Obiekt do przechowywania wszystkich planet
let planetOrbitGroups = {}; // Grupy orbit dla każdej planety
let earthOrbitGroup, earthTiltGroup, moonOrbitGroup;
let sunLight;
let textureLoader; // Globalny loader tekstur
let animationRunning = true; // Uruchom animację od razu
let lastAnimationTime = 0;
let animationSpeed = 1; // 1 = normalna prędkość, 2 = 2x szybciej, 0.5 = 2x wolniej
let cameraMode = 'earth'; // Dodaj inicjalizację trybu kamery

// Kontrola kamery
let isMouseDown = false;
let mouseX = 0, mouseY = 0;
let targetRotationX = 0, targetRotationY = 0;
let currentRotationX = 0, currentRotationY = 0;
let cameraDistance = 25; // Dostosowane dla większej orbity Księżyca
let initialPinchDistance = 0;
let initialCameraDistance = 0;

// Parametry fizyczne i orbitalne (realistyczne proporcje!)
// Skala: 1 AU = 50 jednostek w symulacji (zwiększona dla lepszego rozłożenia)
const sunRadius = 15; // 109x większy od Ziemi byłby 109, ale to przysłoniłoby wszystko - kompromis na 15x

// Dane planet układu słonecznego (RZECZYWISTE PROPORCJE!)
const planetData = {
    mercury: {
        name: 'Merkury',
        radius: 0.38, // 0.38 × earthRadius (rzeczywista proporcja)
        orbitRadius: 19.5, // 0.39 AU × 50
        orbitPeriod: 88, // dni
        startAngle: 0, // Pozycja startowa w radianach
        color: 0x8c7853,
        textureUrls: [
            'https://upload.wikimedia.org/wikipedia/commons/4/4a/Mercury_in_true_color.jpg',
            'https://upload.wikimedia.org/wikipedia/commons/d/d9/Mercury_in_color_-_Prockter07-edit.jpg'
        ]
    },
    venus: {
        name: 'Wenus', 
        radius: 0.95, // 0.95 × earthRadius (rzeczywista proporcja)
        orbitRadius: 36, // 0.72 AU × 50
        orbitPeriod: 225,
        startAngle: Math.PI * 0.3, // 54° offset
        color: 0xffc649,
        textureUrls: [
            'https://upload.wikimedia.org/wikipedia/commons/e/e5/Venus-real_color.jpg',
            'https://upload.wikimedia.org/wikipedia/commons/8/85/Venus_globe.jpg'
        ]
    },
    earth: {
        name: 'Ziemia',
        radius: 1, // Referencja
        orbitRadius: 50, // 1.0 AU × 50  
        orbitPeriod: 365,
        startAngle: Math.PI * 0.6, // 108° offset
        color: 0x4fc3f7,
        textureUrls: [
            'https://upload.wikimedia.org/wikipedia/commons/5/56/Blue_Marble_Next_Generation_%2B_topography_%2B_bathymetry.jpg',
            'https://upload.wikimedia.org/wikipedia/commons/9/97/The_Earth_seen_from_Apollo_17.jpg'
        ]
    },
    mars: {
        name: 'Mars',
        radius: 0.53, // 0.53 × earthRadius (rzeczywista proporcja)
        orbitRadius: 76, // 1.52 AU × 50
        orbitPeriod: 687,
        startAngle: Math.PI * 0.9, // 162° offset
        color: 0xcd5c5c,
        textureUrls: [
            'https://upload.wikimedia.org/wikipedia/commons/0/02/OSIRIS_Mars_true_color.jpg',
            'https://upload.wikimedia.org/wikipedia/commons/5/58/Mars_23_aug_2003_hubble.jpg'
        ]
    },
    jupiter: {
        name: 'Jowisz',
        radius: 11.2, // 11.2 × earthRadius (rzeczywista proporcja - to będzie DUŻY!)
        orbitRadius: 260, // 5.2 AU × 50
        orbitPeriod: 4333, // 12 lat × 365 dni
        startAngle: Math.PI * 1.2, // 216° offset
        color: 0xd8ca9d,
        textureUrls: [
            'https://upload.wikimedia.org/wikipedia/commons/e/e1/Jupiter_by_Cassini-Huygens.jpg',
            'https://upload.wikimedia.org/wikipedia/commons/2/2b/Jupiter_and_its_shrunken_Great_Red_Spot.jpg'
        ]
    },
    saturn: {
        name: 'Saturn',
        radius: 9.4, // 9.4 × earthRadius (rzeczywista proporcja)
        orbitRadius: 475, // 9.5 AU × 50
        orbitPeriod: 10585, // 29 lat × 365 dni
        startAngle: Math.PI * 1.5, // 270° offset
        color: 0xfad5a5,
        textureUrls: [
            'https://upload.wikimedia.org/wikipedia/commons/c/c7/Saturn_during_Equinox.jpg',
            'https://upload.wikimedia.org/wikipedia/commons/c/c1/Saturn_from_Cassini_Orbiter_%282004-10-06%29.jpg'
        ]
    },
    uranus: {
        name: 'Uran',
        radius: 4.0, // 4.0 × earthRadius (rzeczywista proporcja)
        orbitRadius: 960, // 19.2 AU × 50
        orbitPeriod: 30660, // 84 lata × 365 dni
        startAngle: Math.PI * 1.8, // 324° offset
        color: 0x4fd0e3,
        textureUrls: [
            'https://upload.wikimedia.org/wikipedia/commons/3/3d/Uranus2.jpg',
            'https://upload.wikimedia.org/wikipedia/commons/4/48/Uranus_as_seen_by_NASA%27s_Voyager_2_%28remastered%29_-_JPEG_converted.jpg'
        ]
    },
    neptune: {
        name: 'Neptun', 
        radius: 3.9, // 3.9 × earthRadius (rzeczywista proporcja)
        orbitRadius: 1505, // 30.1 AU × 50
        orbitPeriod: 60225, // 165 lat × 365 dni
        startAngle: Math.PI * 0.1, // 18° offset
        color: 0x4b70dd,
        textureUrls: [
            'https://upload.wikimedia.org/wikipedia/commons/6/63/Neptune_-_Voyager_2_%2829347980845%29_flatten_crop.jpg',
            'https://upload.wikimedia.org/wikipedia/commons/5/56/Neptune_full.jpg'
        ]
    }
};

const earthRadius = planetData.earth.radius;
const moonRadius = 0.27; // 0.27 × earthRadius (rzeczywista proporcja)

// Orbita Ziemi wokół Słońca
const earthOrbitRadius = planetData.earth.orbitRadius; // 50 jednostek
const earthEccentricity = 0.0167; // ekscentryczność orbity Ziemi
const earthAxialTilt = -23.5 * (Math.PI / 180); // nachylenie osi Ziemi (-23.5° dla prawidłowych pór roku)

// Orbita Księżyca wokół Ziemi (RZECZYWISTE PROPORCJE!)
const moonOrbitRadius = 15; // 384,400 km = ~60 promieni Ziemi, ale kompromis wizualny na 15 jednostek
const moonEccentricity = 0.055; // ekscentryczność orbity Księżyca
const moonOrbitalTilt = 5.1 * (Math.PI / 180); // nachylenie orbity Księżyca (5.1°)
const moonTiltMultiplier = 3; // Zwiększmy wizualny efekt nachylenia dla lepszej widoczności

const lunarCycleLength = 29.53;

function init() {
    // Scena
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x000011);
    
    // Kamera
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(8, 4, 8); // Bliżej dla obserwacji Ziemia-Księżyc
    camera.lookAt(0, 0, 0);
    
    // Renderer
    renderer = new THREE.WebGLRenderer({ 
        canvas: document.getElementById('canvas3d'),
        antialias: true
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    
    // LOADER TEKSTUR - GLOBALNY
    textureLoader = new THREE.TextureLoader();
    
    // Światło otoczenia (bardzo słabe)
    const ambientLight = new THREE.AmbientLight(0x202040, 0.05);
    scene.add(ambientLight);
    
    // Słońce z teksturą
    const sunGeometry = new THREE.SphereGeometry(sunRadius, 32, 32);
    const sunMaterial = new THREE.MeshLambertMaterial({ 
        color: 0xffeb3b,
        emissive: 0xffaa00
    });
    sun = new THREE.Mesh(sunGeometry, sunMaterial);
    sun.position.set(0, 0, 0);
    scene.add(sun);
    
    // Próba załadowania tekstury Słońca z fallbackiem
    const sunTextureUrls = [
        'https://upload.wikimedia.org/wikipedia/commons/b/b4/The_Sun_by_the_Atmospheric_Imaging_Assembly_of_NASA%27s_Solar_Dynamics_Observatory_-_20100819.jpg',
        'https://upload.wikimedia.org/wikipedia/commons/9/99/Map_of_the_full_sun.jpg'
    ];
    
    function loadSunTexture(urls, index = 0) {
        if (!urls || index >= urls.length) {
            console.log('❌ Wszystkie tekstury Słońca nieudane - używam koloru żółto-pomarańczowego');
            return;
        }
        
        textureLoader.load(
            urls[index],
            function(texture) {
                console.log(`✅ Tekstura Słońca załadowana (${index + 1}/${urls.length})`);
                sun.material.map = texture;
                sun.material.color.setHex(0xffffff);
                sun.material.needsUpdate = true;
            },
            undefined,
            function(error) {
                console.log(`❌ Błąd tekstury Słońca (${index + 1}/${urls.length}), próbuję następną...`);
                loadSunTexture(urls, index + 1);
            }
        );
    }
    
    loadSunTexture(sunTextureUrls);
    
    // Efekt świecenia wokół Słońca
    const sunGlowGeometry = new THREE.SphereGeometry(sunRadius * 1.5, 32, 32);
    const sunGlowMaterial = new THREE.MeshBasicMaterial({ 
        color: 0xffaa00,
        transparent: true,
        opacity: 0.3
    });
    const sunGlow = new THREE.Mesh(sunGlowGeometry, sunGlowMaterial);
    sunGlow.position.set(0, 0, 0);
    scene.add(sunGlow);
    
    // Główne światło słoneczne - PointLight (punktowe)
    const sunPointLight = new THREE.PointLight(0xffffff, 3, 100); // Zwiększona intensywność
    sunPointLight.position.set(0, 0, 0);
    sunPointLight.castShadow = true;
    sunPointLight.shadow.camera.near = 1;
    sunPointLight.shadow.camera.far = 50;
    sunPointLight.shadow.mapSize.width = 2048;
    sunPointLight.shadow.mapSize.height = 2048;
    scene.add(sunPointLight);
    
    // Dodatkowe światło kierunkowe dla lepszego oświetlenia
    sunLight = new THREE.DirectionalLight(0xffffff, 0.8); // Zmniejszona intensywność kierunkowego
    sunLight.position.set(1, 0.5, 0.5);
    sunLight.target.position.set(0, 0, 0);
    sunLight.castShadow = true;
    sunLight.shadow.camera.near = 1;
    sunLight.shadow.camera.far = 100;
    sunLight.shadow.camera.left = -30;
    sunLight.shadow.camera.right = 30;
    sunLight.shadow.camera.top = 30;
    sunLight.shadow.camera.bottom = -30;
    sunLight.shadow.mapSize.width = 2048;
    sunLight.shadow.mapSize.height = 2048;
    scene.add(sunLight);
    scene.add(sunLight.target);
    
    // Orbita Ziemi wokół Słońca
    earthOrbitGroup = new THREE.Group();
    scene.add(earthOrbitGroup);
    
    // Grupa dla nachylenia osi Ziemi (stałe w przestrzeni)
    earthTiltGroup = new THREE.Group();
    earthTiltGroup.rotation.z = earthAxialTilt; // Nachylenie 23.5° - stałe w przestrzeni
    earthOrbitGroup.add(earthTiltGroup);
    
    // Ziemia z teksturą mapy świata
    const earthGeometry = new THREE.SphereGeometry(earthRadius, 64, 64);
    
    // Domyślny materiał Ziemi
    const earthMaterial = new THREE.MeshLambertMaterial({ 
        color: 0x4fc3f7, // Domyślny kolor jeśli tekstura się nie załaduje
        emissive: 0x000022
    });
    
    earth = new THREE.Mesh(earthGeometry, earthMaterial);
    earth.position.set(0, 0, 0); // Ziemia w centrum swojej grupy
    earth.castShadow = true;
    earth.receiveShadow = true;
    earthTiltGroup.add(earth); // Dodaj do grupy z nachyleniem
    
    // Próba załadowania tekstury Ziemi z fallbackiem
    const earthTextureUrls = planetData.earth.textureUrls;
    function loadEarthTexture(urls, index = 0) {
        if (!urls || index >= urls.length) {
            console.log('❌ Wszystkie tekstury Ziemi nieudane - używam koloru niebieskiego oceanu');
            return;
        }
        
        textureLoader.load(
            urls[index],
            function(texture) {
                console.log(`✅ Tekstura Ziemi załadowana (${index + 1}/${urls.length})`);
                earth.material.map = texture;
                earth.material.color.setHex(0xffffff); // Białe oświetlenie dla naturalnych kolorów
                earth.material.needsUpdate = true;
            },
            function(progress) {
                console.log('Ładowanie tekstury Ziemi:', Math.round(progress.loaded / progress.total * 100) + '%');
            },
            function(error) {
                console.log(`❌ Błąd tekstury Ziemi (${index + 1}/${urls.length}), próbuję następną...`);
                loadEarthTexture(urls, index + 1);
            }
        );
    }
    
    loadEarthTexture(earthTextureUrls);
    
    // Orbita Księżyca wokół Ziemi
    moonOrbitGroup = new THREE.Group();
    moonOrbitGroup.position.set(0, 0, 0); // Centruj na Ziemi
    earthTiltGroup.add(moonOrbitGroup); // Księżyc podąża za nachyloną Ziemią
    
    // Księżyc z teksturą
    const moonGeometry = new THREE.SphereGeometry(moonRadius, 32, 32);
    
    // Domyślny materiał Księżyca
    const moonMaterial = new THREE.MeshLambertMaterial({ 
        color: 0xe0e0e0, // Domyślny szary kolor
        emissive: 0x111111
    });
    
    moon = new THREE.Mesh(moonGeometry, moonMaterial);
    moon.position.set(moonOrbitRadius, 0, 0);
    moon.castShadow = true;
    moon.receiveShadow = true;
    moonOrbitGroup.add(moon);
    
    // Nie ładujemy tekstury Księżyca - zostawiamy czysty szary materiał
    // dla lepszej edukacyjnej wizualizacji faz (bez mylących ciemnych plam)
    console.log('💡 Księżyc bez tekstury - czyste fazy świetlne od Słońca!');
    
    // Linie orbit
    createOrbitLines();
    
    // Stwórz wszystkie planety
    createPlanets();
    
    // Gwiazdy
    createStars();
    
    // Event listeners
    setupEventListeners();
}

function createOrbitLines() {
    // Orbity wszystkich planet
    Object.keys(planetData).forEach(planetKey => {
        const planet = planetData[planetKey];
        const orbitPoints = [];
        
        for (let i = 0; i <= 128; i++) {
            const angle = (i / 128) * Math.PI * 2;
            // Używamy małej ekscentryczności dla wszystkich orbit (uproszczenie)
            const eccentricity = planetKey === 'earth' ? earthEccentricity : 0.01;
            const distance = planet.orbitRadius * (1 - eccentricity * Math.cos(angle));
            orbitPoints.push(new THREE.Vector3(
                Math.cos(angle) * distance,
                0,
                Math.sin(angle) * distance
            ));
        }
        
        const orbitGeometry = new THREE.BufferGeometry().setFromPoints(orbitPoints);
        const orbitMaterial = new THREE.LineBasicMaterial({ 
            color: planetKey === 'earth' ? 0x888888 : 0x444444,
            transparent: true,
            opacity: planetKey === 'earth' ? 0.6 : 0.3
        });
        const orbitLine = new THREE.Line(orbitGeometry, orbitMaterial);
        scene.add(orbitLine);
    });
    
    // ORBITA KSIĘŻYCA (specjalna - nachylona) - MUSI ZGADZAĆ SIĘ Z updatePositions()
    // const moonOrbitPoints = [];
    // for (let i = 0; i <= 128; i++) {
    //     const angle = (i / 128) * Math.PI * 2;
    //     const distance = moonOrbitRadius * (1 - moonEccentricity * Math.cos(angle));
        
    //     // Zastosuj nachylenie orbity IDENTYCZNIE jak w updatePositions()
    //     const x = Math.cos(angle) * distance;
    //     const y = Math.sin(angle) * distance * Math.sin(moonOrbitalTilt) * moonTiltMultiplier; // DODAJ moonTiltMultiplier!
    //     const z = Math.sin(angle) * distance * Math.cos(moonOrbitalTilt);
        
    //     moonOrbitPoints.push(new THREE.Vector3(x, y, z));
    // }
    // const moonOrbitGeometry = new THREE.BufferGeometry().setFromPoints(moonOrbitPoints);
    // const moonOrbitMaterial = new THREE.LineBasicMaterial({ 
    //     color: 0x666666,
    //     transparent: true,
    //     opacity: 0.5
    // });
    // const moonOrbitLine = new THREE.Line(moonOrbitGeometry, moonOrbitMaterial);
    // earthOrbitGroup.add(moonOrbitLine); // Orbita księżyca podąża za Ziemią (ale bez nachylenia)
}

function createPlanets() {
    // Funkcja pomocnicza do ładowania tekstur z fallbackiem
    function loadTextureWithFallback(planet, planetInfo, urls, index = 0) {
        if (!urls || index >= urls.length) {
            console.log(`❌ Wszystkie tekstury ${planetInfo.name} nieudane - używam koloru`);
            return;
        }
        
        textureLoader.load(
            urls[index],
            function(texture) {
                console.log(`✅ Tekstura ${planetInfo.name} załadowana (${index + 1}/${urls.length})`);
                planet.material.map = texture;
                planet.material.color.setHex(0xffffff);
                planet.material.needsUpdate = true;
            },
            function(progress) {
                console.log(`Ładowanie tekstury ${planetInfo.name}...`, Math.round(progress.loaded / progress.total * 100) + '%');
            },
            function(error) {
                console.log(`❌ Błąd tekstury ${planetInfo.name} (${index + 1}/${urls.length}), próbuję następną...`);
                loadTextureWithFallback(planet, planetInfo, urls, index + 1);
            }
        );
    }
    
    Object.keys(planetData).forEach(planetKey => {
        if (planetKey === 'earth') return; // Ziemia już istnieje
        
        const planetInfo = planetData[planetKey];
        
        // Grupa orbity dla planety
        const orbitGroup = new THREE.Group();
        scene.add(orbitGroup);
        planetOrbitGroups[planetKey] = orbitGroup;
        
        // Geometria i materiał planety
        const geometry = new THREE.SphereGeometry(planetInfo.radius, 32, 32);
        const material = new THREE.MeshLambertMaterial({ 
            color: planetInfo.color,
            emissive: 0x111111
        });
        
        const planet = new THREE.Mesh(geometry, material);
        // Ustaw pozycję startową z offsetem kątowym
        const startX = Math.cos(planetInfo.startAngle) * planetInfo.orbitRadius;
        const startZ = Math.sin(planetInfo.startAngle) * planetInfo.orbitRadius;
        planet.position.set(startX, 0, startZ);
        planet.castShadow = true;
        planet.receiveShadow = true;
        orbitGroup.add(planet);
        
        planets[planetKey] = planet;
        
        // Ładowanie tekstury z systemem fallback
        if (planetInfo.textureUrls) {
            loadTextureWithFallback(planet, planetInfo, planetInfo.textureUrls);
        }
    });
}

function createStars() {
    const starGeometry = new THREE.BufferGeometry();
    const starCount = 800;
    const positions = new Float32Array(starCount * 3);
    
    for (let i = 0; i < starCount * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 200;
        positions[i + 1] = (Math.random() - 0.5) * 200;
        positions[i + 2] = (Math.random() - 0.5) * 200;
    }
    
    starGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    const starMaterial = new THREE.PointsMaterial({ 
        color: 0xffffff,
        size: 1.5,
        sizeAttenuation: false
    });
    const stars = new THREE.Points(starGeometry, starMaterial);
    scene.add(stars);
}

function updateSpeedDisplay() {
    const speedDisplay = document.getElementById('speedDisplay');
    const dayDuration = document.getElementById('dayDuration');
    
    if (speedDisplay) {
        speedDisplay.textContent = animationSpeed.toFixed(1) + 'x';
    }
    if (dayDuration) {
        const duration = (3 / animationSpeed).toFixed(1);
        dayDuration.textContent = duration + 's';
    }
}

function resetCamera() {
    targetRotationX = 0;
    targetRotationY = 0;
    if (cameraMode === 'earth') {
        cameraDistance = 15; // Zwiększone dla większej Ziemi
    } else {
        cameraDistance = 400; // Znacznie większa odległość dla całego układu
    }
}

function toggleCameraMode() {
    if (cameraMode === 'earth') {
        cameraMode = 'space';
        cameraDistance = 400; // Większa odległość dla całego układu
        targetRotationX = 0.3;
        targetRotationY = 0;
    } else {
        cameraMode = 'earth';
        cameraDistance = 15; // Bliżej dla systemu Ziemia-Księżyc
        targetRotationX = 0;
        targetRotationY = 0;
    }
    updateCameraModeUI();
}

function updateCameraModeUI() {
    const cameraToggleButton = document.getElementById('cameraToggleButton');
    const cameraModeElement = document.getElementById('cameraMode');
    const cameraModeText = document.getElementById('cameraModeText');
    
    if (cameraToggleButton) {
        cameraToggleButton.innerHTML = cameraMode === 'earth' ? '🌌 Kosmos' : '🌍 Ziemia';
    }
    if (cameraModeElement) {
        cameraModeElement.textContent = cameraMode === 'earth' ? 'Ziemia' : 'Kosmos';
    }
    if (cameraModeText) {
        cameraModeText.textContent = cameraMode === 'earth' ? 'Widok z Ziemi' : 'Widok z Kosmosu';
    }
}

function setupEventListeners() {
    const canvas = document.getElementById('canvas3d');
    const timeSlider = document.getElementById('timeSlider');
    const speedSlider = document.getElementById('speedSlider');
    const playButton = document.getElementById('playButton');
    const resetButton = document.getElementById('resetButton');
    const resetCameraButton = document.getElementById('resetCameraButton');
    const cameraToggleButton = document.getElementById('cameraToggleButton');
    const mobileToggle = document.getElementById('mobileToggle');
    const controlPanel = document.getElementById('controlPanel');
    const moonTextureUrl = document.getElementById('moonTextureUrl');
    
    // Mobile toggle
    mobileToggle.addEventListener('click', function() {
        const isCollapsed = controlPanel.classList.contains('mobile-collapsed');
        if (isCollapsed) {
            controlPanel.classList.remove('mobile-collapsed');
            mobileToggle.innerHTML = '<div>✕ Zamknij</div><div class="toggle-info" id="toggleInfo"></div>';
        } else {
            controlPanel.classList.add('mobile-collapsed');
            mobileToggle.innerHTML = '<div>⚙️ Options</div><div class="toggle-info" id="toggleInfo"></div>';
        }
        updateToggleInfo();
    });
    
    // Kontrola myszą
    canvas.addEventListener('mousedown', onMouseDown);
    canvas.addEventListener('mousemove', onMouseMove);
    canvas.addEventListener('mouseup', onMouseUp);
    canvas.addEventListener('wheel', onMouseWheel);
    
    // Kontrola dotykiem
    canvas.addEventListener('touchstart', onTouchStart);
    canvas.addEventListener('touchmove', onTouchMove);
    canvas.addEventListener('touchend', onTouchEnd);
    
    // Suwak czasu
    timeSlider.addEventListener('input', function(e) {
        const totalDays = parseFloat(e.target.value);
        updatePositions(totalDays);
        updateUIOnly(totalDays);
    });
    
    // Suwak prędkości
    speedSlider.addEventListener('input', function(e) {
        animationSpeed = parseFloat(e.target.value);
        updateSpeedDisplay();
    });
    
    // Przyciski
    playButton.addEventListener('click', toggleAnimation);
    resetButton.addEventListener('click', resetAnimation);
    resetCameraButton.addEventListener('click', resetCamera);
    cameraToggleButton.addEventListener('click', toggleCameraMode);
    
    // Responsywność
    window.addEventListener('resize', onWindowResize);
    
    // Inicjalizacja mobile UI
    initializeMobileUI();
}

function initializeMobileUI() {
    const controlPanel = document.getElementById('controlPanel');
    const mobileToggle = document.getElementById('mobileToggle');
    const isMobile = window.innerWidth <= 768;
    
    if (isMobile) {
        controlPanel.classList.add('mobile-collapsed');
        mobileToggle.style.display = 'block';
    } else {
        controlPanel.classList.remove('mobile-collapsed');
        mobileToggle.style.display = 'none';
    }
    updateToggleInfo();
}

// Kontrola kamery
function onMouseDown(event) {
    isMouseDown = true;
    mouseX = event.clientX;
    mouseY = event.clientY;
}

function onMouseMove(event) {
    if (!isMouseDown) return;
    
    const deltaX = event.clientX - mouseX;
    const deltaY = event.clientY - mouseY;
    
    targetRotationY += deltaX * 0.01;
    targetRotationX += deltaY * 0.01;
    targetRotationX = Math.max(-Math.PI/2, Math.min(Math.PI/2, targetRotationX));
    
    mouseX = event.clientX;
    mouseY = event.clientY;
}

function onMouseUp() {
    isMouseDown = false;
}

function onMouseWheel(event) {
    cameraDistance += event.deltaY * 0.05; // Zwiększony krok dla znacznie większych odległości
    if (cameraMode === 'earth') {
        cameraDistance = Math.max(8, Math.min(80, cameraDistance)); // Zwiększone dla większej orbity Księżyca
    } else {
        cameraDistance = Math.max(100, Math.min(2000, cameraDistance)); // Znacznie zwiększone dla całego układu
    }
}

// Dotyk
let touchStartX = 0, touchStartY = 0;

function getPinchDistance(touches) {
    const dx = touches[0].clientX - touches[1].clientX;
    const dy = touches[0].clientY - touches[1].clientY;
    return Math.sqrt(dx * dx + dy * dy);
}

function onTouchStart(event) {
    if (event.touches.length === 1) {
        // Pojedynczy dotyk - obracanie
        touchStartX = event.touches[0].clientX;
        touchStartY = event.touches[0].clientY;
        isMouseDown = true;
    } else if (event.touches.length === 2) {
        // Pinch to zoom
        initialPinchDistance = getPinchDistance(event.touches);
        initialCameraDistance = cameraDistance;
        isMouseDown = false;
    }
}

function onTouchMove(event) {
    event.preventDefault();
    
    if (event.touches.length === 1 && isMouseDown) {
        // Obracanie
        const deltaX = event.touches[0].clientX - touchStartX;
        const deltaY = event.touches[0].clientY - touchStartY;
        
        targetRotationY += deltaX * 0.01;
        targetRotationX += deltaY * 0.01;
        targetRotationX = Math.max(-Math.PI/2, Math.min(Math.PI/2, targetRotationX));
        
        touchStartX = event.touches[0].clientX;
        touchStartY = event.touches[0].clientY;
    } else if (event.touches.length === 2) {
        // Pinch to zoom
        const currentPinchDistance = getPinchDistance(event.touches);
        const pinchRatio = currentPinchDistance / initialPinchDistance;
        cameraDistance = initialCameraDistance / pinchRatio;
        
        if (cameraMode === 'earth') {
            cameraDistance = Math.max(8, Math.min(80, cameraDistance)); // Zwiększone dla większej orbity Księżyca
        } else {
            cameraDistance = Math.max(100, Math.min(2000, cameraDistance)); // Znacznie zwiększone limity
        }
    }
}

function onTouchEnd(event) {
    if (event.touches.length === 0) {
        isMouseDown = false;
    }
}

function updateCameraPosition() {
    currentRotationX += (targetRotationX - currentRotationX) * 0.1;
    currentRotationY += (targetRotationY - currentRotationY) * 0.1;
    
    if (cameraMode === 'earth') {
        // Kamera podąża za Ziemią (uwzględniając nachylenie)
        const earthPos = earthOrbitGroup.position;
        
        const x = earthPos.x + Math.cos(currentRotationX) * Math.sin(currentRotationY) * cameraDistance;
        const y = earthPos.y + Math.sin(currentRotationX) * cameraDistance;
        const z = earthPos.z + Math.cos(currentRotationX) * Math.cos(currentRotationY) * cameraDistance;
        
        camera.position.set(x, y, z);
        camera.lookAt(earthPos.x, earthPos.y, earthPos.z);
    } else {
        // Widok z kosmosu (centrum układu) - zwiększone odległości
        const x = Math.cos(currentRotationX) * Math.sin(currentRotationY) * cameraDistance;
        const y = Math.sin(currentRotationX) * cameraDistance;
        const z = Math.cos(currentRotationX) * Math.cos(currentRotationY) * cameraDistance;
        
        camera.position.set(x, y, z);
        camera.lookAt(0, 0, 0);
    }
}

function updatePositions(totalDays) {
    // AKTUALIZUJ WSZYSTKIE PLANETY - użyj totalDays zamiast dayOfYear
    Object.keys(planetData).forEach(planetKey => {
        const planetInfo = planetData[planetKey];
        
        if (planetKey === 'earth') {
            // ORBITA ZIEMI WOKÓŁ SŁOŃCA (eliptyczna)
            const earthOrbitAngle = (totalDays / planetInfo.orbitPeriod) * 2 * Math.PI + planetInfo.startAngle;
            
            // Oblicz eliptyczną odległość od Słońca
            const earthDistance = earthOrbitRadius * (1 - earthEccentricity * Math.cos(earthOrbitAngle));
            
            // Pozycja całej grupy Ziemi na eliptycznej orbicie
            const earthX = Math.cos(earthOrbitAngle) * earthDistance;
            const earthZ = Math.sin(earthOrbitAngle) * earthDistance;
            earthOrbitGroup.position.set(earthX, 0, earthZ);
            
            // ROTACJA ZIEMI WOKÓŁ OSI (doba) - nachylenie jest już ustawione w earthTiltGroup
            const dayProgress = totalDays % 1;
            earth.rotation.y = dayProgress * 2 * Math.PI;
        } else {
            // INNE PLANETY
            const orbitAngle = (totalDays / planetInfo.orbitPeriod) * 2 * Math.PI + planetInfo.startAngle;
            const eccentricity = 0.01; // Uproszczona ekscentryczność
            const distance = planetInfo.orbitRadius * (1 - eccentricity * Math.cos(orbitAngle));
            
            const x = Math.cos(orbitAngle) * distance;
            const z = Math.sin(orbitAngle) * distance;
            
            if (planets[planetKey]) {
                planets[planetKey].position.set(x, 0, z);
            }
            
            // Rotacja planety wokół własnej osi (uproszczona - 1 obrót na dobę ziemską)
            if (planets[planetKey]) {
                const dayProgress = totalDays % 1;
                planets[planetKey].rotation.y = dayProgress * 2 * Math.PI;
            }
        }
    });
    
    // ORBITA KSIĘŻYCA WOKÓŁ ZIEMI - CIĄGŁA PRZEZ LATA (bez resetów!)
    const moonOrbitAngle = (totalDays / lunarCycleLength) * 2 * Math.PI;
    
    // Oblicz eliptyczną odległość Księżyca od Ziemi
    const moonDistance = moonOrbitRadius * (1 - moonEccentricity * Math.cos(moonOrbitAngle));
    
    // Pozycja Księżyca z nachyleniem orbity (5.1° x3 dla lepszej widoczności) względem Ziemi
    const moonX = Math.cos(moonOrbitAngle) * moonDistance;
    const moonY = Math.sin(moonOrbitAngle) * moonDistance * Math.sin(moonOrbitalTilt) * moonTiltMultiplier;
    const moonZ = Math.sin(moonOrbitAngle) * moonDistance * Math.cos(moonOrbitalTilt);
    
    moon.position.set(moonX, moonY, moonZ);
    
    // Synchroniczna rotacja Księżyca (zawsze ta sama strona do Ziemi)
    moon.rotation.y = moonOrbitAngle;
    
    return { 
        earthOrbitAngle: (totalDays / planetData.earth.orbitPeriod) * 2 * Math.PI + planetData.earth.startAngle, 
        moonOrbitAngle, 
        earthDistance: earthOrbitRadius * (1 - earthEccentricity * Math.cos((totalDays / planetData.earth.orbitPeriod) * 2 * Math.PI + planetData.earth.startAngle)), 
        moonDistance 
    };
}

function getMoonPhase(totalDays) {
    // Oblicz rzeczywiste pozycje w 3D dla prawidłowych faz - używaj ciągłego czasu!
    const earthOrbitAngle = (totalDays / planetData.earth.orbitPeriod) * 2 * Math.PI + planetData.earth.startAngle;
    const moonOrbitAngle = (totalDays / lunarCycleLength) * 2 * Math.PI; // CIĄGŁY CZAS
    
    // Pozycja Ziemi względem Słońca (używaj aktualnych wartości)
    const earthDistance = earthOrbitRadius * (1 - earthEccentricity * Math.cos(earthOrbitAngle));
    const earthX = Math.cos(earthOrbitAngle) * earthDistance;
    const earthZ = Math.sin(earthOrbitAngle) * earthDistance;
    
    // Pozycja Księżyca względem Ziemi (używaj aktualnych wartości moonOrbitRadius = 15)
    const moonDistance = moonOrbitRadius * (1 - moonEccentricity * Math.cos(moonOrbitAngle));
    const moonLocalX = Math.cos(moonOrbitAngle) * moonDistance;
    const moonLocalZ = Math.sin(moonOrbitAngle) * moonDistance * Math.cos(moonOrbitalTilt);
    
    // Pozycja Księżyca względem Słońca (globalna)
    const moonGlobalX = earthX + moonLocalX;
    const moonGlobalZ = earthZ + moonLocalZ;
    
    // Wektor od Słońca do Ziemi
    const sunToEarth = { x: earthX, z: earthZ };
    
    // Wektor od Ziemi do Księżyca  
    const earthToMoon = { x: moonLocalX, z: moonLocalZ };
    
    // Kąt fazowy (kąt między wektorami)
    const dotProduct = sunToEarth.x * earthToMoon.x + sunToEarth.z * earthToMoon.z;
    const sunEarthMag = Math.sqrt(sunToEarth.x * sunToEarth.x + sunToEarth.z * sunToEarth.z);
    const earthMoonMag = Math.sqrt(earthToMoon.x * earthToMoon.x + earthToMoon.z * earthToMoon.z);
    
    const cosAngle = dotProduct / (sunEarthMag * earthMoonMag);
    const phaseAngle = Math.acos(Math.max(-1, Math.min(1, cosAngle))) * (180 / Math.PI);
    
    // Określ fazę na podstawie kąta fazowego
    // 0° = Pełnia (Księżyc za Ziemią od Słońca)
    // 180° = Nów (Księżyc między Ziemią a Słońcem)
    if (phaseAngle < 22.5 || phaseAngle >= 337.5) return { name: 'Pełnia', illumination: 100 };
    if (phaseAngle < 67.5) return { name: 'Ubywający garb', illumination: 75 };
    if (phaseAngle < 112.5) return { name: 'Ostatnia kwadra', illumination: 50 };
    if (phaseAngle < 157.5) return { name: 'Stary sierp', illumination: 25 };
    if (phaseAngle < 202.5) return { name: 'Nów', illumination: 0 };
    if (phaseAngle < 247.5) return { name: 'Młody sierp', illumination: 25 };
    if (phaseAngle < 292.5) return { name: 'Pierwsza kwadra', illumination: 50 };
    return { name: 'Przybywający garb', illumination: 75 };
}

function updateUI(dayOfYear) {
    const angles = updatePositions(dayOfYear);
    const phase = getMoonPhase(dayOfYear); // Używaj nowej funkcji
    
    const date = new Date(2025, 0, dayOfYear + 1);
    const dateStr = date.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long' });
    
    document.getElementById('currentDate').textContent = dateStr;
    document.getElementById('moonPhase').textContent = phase.name;
    document.getElementById('illumination').textContent = phase.illumination + '%';
    document.getElementById('currentYear').textContent = currentYear;
    document.getElementById('dayOfYear').textContent = Math.floor(dayOfYear) + 1;
    
    updateToggleInfo();
}

function updateToggleInfo() {
    const toggleInfo = document.getElementById('toggleInfo');
    if (toggleInfo) {
        const totalDays = parseFloat(document.getElementById('timeSlider').value);
        const phase = getMoonPhase(totalDays); // Użyj totalDays
        const currentYear = Math.floor(totalDays / 365.25) + 2025;
        const dayOfYear = totalDays % 365.25;
        const date = new Date(currentYear, 0, Math.floor(dayOfYear) + 1);
        const shortDate = date.toLocaleDateString('pl-PL', { day: 'numeric', month: 'short', year: '2-digit' });
        const season = getSeason(dayOfYear);
        toggleInfo.textContent = shortDate + ' • ' + season + ' • ' + phase.name;
    }
}

function toggleAnimation() {
    const playButton = document.getElementById('playButton');
    
    if (!animationRunning) {
        animationRunning = true;
        playButton.textContent = '⏸ Pauza';
        lastAnimationTime = performance.now();
    } else {
        animationRunning = false;
        playButton.textContent = '▶ Play';
    }
}

function resetAnimation() {
    animationRunning = false;
    document.getElementById('playButton').textContent = '▶ Play';
    document.getElementById('timeSlider').value = 0;
    document.getElementById('speedSlider').value = 1;
    animationSpeed = 1;
    updatePositions(0);
    updateUIOnly(0);
    updateSpeedDisplay();
}

function onWindowResize() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
    
    // UI responsywność
    const controlPanel = document.getElementById('controlPanel');
    const mobileToggle = document.getElementById('mobileToggle');
    const isMobile = width <= 768;
    
    if (isMobile) {
        mobileToggle.style.display = 'block';
    } else {
        mobileToggle.style.display = 'none';
        controlPanel.classList.remove('mobile-collapsed');
    }
    
    // Zapisz tryb kamery podczas resize
    updateCameraModeUI();
}

function animate() {
    requestAnimationFrame(animate);
    
    updateCameraPosition();
    
    // Animacja świecenia Słońca
    if (sun && sun.material && sun.material.emissive) {
        const time = performance.now() * 0.001;
        const intensity = 0.8 + Math.sin(time) * 0.2;
        sun.material.emissive.setRGB(1.0 * intensity, 0.5 * intensity, 0.0);
    }
    
    // Animacja - prędkość zależna od suwaka (domyślnie 1 dzień co 3 sekundy)
    if (animationRunning) {
        const currentTime = performance.now();
        const deltaTime = currentTime - lastAnimationTime;
        const adjustedDuration = 3000 / animationSpeed; // Prędkość wpływa na czas doby
        
        if (deltaTime >= adjustedDuration) {
            // Przejdź do następnego dnia
            const timeSlider = document.getElementById('timeSlider');
            let currentDay = parseFloat(timeSlider.value);
            currentDay += 1;
            
            if (currentDay > 10950) { // 30 lat
                currentDay = 0;
            }
            
            timeSlider.value = currentDay;
            updateUIOnly(currentDay);
            lastAnimationTime = currentTime;
        } else {
            // Płynna interpolacja wszystkich ruchów
            const dayProgress = deltaTime / adjustedDuration; // 0-1 przez dostosowany czas
            const currentDay = parseFloat(document.getElementById('timeSlider').value);
            const interpolatedDay = currentDay + dayProgress;
            
            // Aktualizuj pozycje wszystkich planet używając totalDays
            Object.keys(planetData).forEach(planetKey => {
                const planetInfo = planetData[planetKey];
                
                if (planetKey === 'earth') {
                    // Płynny ruch Ziemi wokół Słońca
                    const earthOrbitAngle = (interpolatedDay / planetInfo.orbitPeriod) * 2 * Math.PI + planetInfo.startAngle;
                    const earthDistance = earthOrbitRadius * (1 - earthEccentricity * Math.cos(earthOrbitAngle));
                    const earthX = Math.cos(earthOrbitAngle) * earthDistance;
                    const earthZ = Math.sin(earthOrbitAngle) * earthDistance;
                    earthOrbitGroup.position.set(earthX, 0, earthZ);
                    
                    // Płynna rotacja Ziemi wokół osi
                    const dayRotationProgress = interpolatedDay % 1;
                    earth.rotation.y = dayRotationProgress * 2 * Math.PI;
                } else {
                    // Płynny ruch innych planet
                    const orbitAngle = (interpolatedDay / planetInfo.orbitPeriod) * 2 * Math.PI + planetInfo.startAngle;
                    const eccentricity = 0.01;
                    const distance = planetInfo.orbitRadius * (1 - eccentricity * Math.cos(orbitAngle));
                    
                    const x = Math.cos(orbitAngle) * distance;
                    const z = Math.sin(orbitAngle) * distance;
                    
                    if (planets[planetKey]) {
                        planets[planetKey].position.set(x, 0, z);
                    }
                    
                    // Rotacja planety
                    if (planets[planetKey]) {
                        const dayRotationProgress = interpolatedDay % 1;
                        planets[planetKey].rotation.y = dayRotationProgress * 2 * Math.PI;
                    }
                }
            });
            
            // Płynny ruch Księżyca - CIĄGŁY PRZEZ LATA
            const moonOrbitAngle = (interpolatedDay / lunarCycleLength) * 2 * Math.PI;
            const moonDistance = moonOrbitRadius * (1 - moonEccentricity * Math.cos(moonOrbitAngle));
            
            const moonX = Math.cos(moonOrbitAngle) * moonDistance;
            const moonY = Math.sin(moonOrbitAngle) * moonDistance * Math.sin(moonOrbitalTilt) * moonTiltMultiplier;
            const moonZ = Math.sin(moonOrbitAngle) * moonDistance * Math.cos(moonOrbitalTilt);
            
            moon.position.set(moonX, moonY, moonZ);
            moon.rotation.y = moonOrbitAngle;
        }
    }
    
    renderer.render(scene, camera);
}

function getSeason(dayOfYear) {
    // Pory roku na półkuli północnej (w oparciu o rzeczywiste daty)
    // 1 stycznia = dzień 0 (zima), przesilenie zimowe ~21 grudnia (dzień 355)
    if (dayOfYear >= 355 || dayOfYear < 79) return 'Zima'; // 21 gru - 20 mar
    if (dayOfYear >= 79 && dayOfYear < 172) return 'Wiosna'; // 20 mar - 21 cze  
    if (dayOfYear >= 172 && dayOfYear < 266) return 'Lato'; // 21 cze - 23 wrz
    return 'Jesień'; // 23 wrz - 21 gru
}

function updateUIOnly(totalDays) {
    const phase = getMoonPhase(totalDays); // Używaj totalDays!
    
    // Przelicz totalDays na rok i dzień roku dla wyświetlania
    const currentYear = Math.floor(totalDays / 365.25) + 2025;
    const dayOfYear = totalDays % 365.25;
    
    // Oblicz realistyczne odległości
    const earthOrbitAngle = (totalDays / planetData.earth.orbitPeriod) * 2 * Math.PI + planetData.earth.startAngle;
    const moonOrbitAngle = (totalDays / lunarCycleLength) * 2 * Math.PI;
    
    const earthDistanceAU = earthOrbitRadius * (1 - earthEccentricity * Math.cos(earthOrbitAngle));
    const earthDistanceKm = Math.round(earthDistanceAU * 3); // Przeliczenie na rzeczywiste miliony km
    
    const moonDistanceScale = moonOrbitRadius * (1 - moonEccentricity * Math.cos(moonOrbitAngle));
    const moonDistanceKm = Math.round(moonDistanceScale * 25.6); // Przeliczenie: 15 jednostek = ~384 tys km
    
    // Oblicz datę na podstawie dnia roku
    const date = new Date(currentYear, 0, Math.floor(dayOfYear) + 1);
    const dateStr = date.toLocaleDateString('pl-PL', { day: 'numeric', month: 'long', year: 'numeric' });
    
    document.getElementById('currentDate').textContent = dateStr;
    document.getElementById('moonPhase').textContent = phase.name;
    document.getElementById('illumination').textContent = phase.illumination + '%';
    document.getElementById('dayOfYear').textContent = Math.floor(dayOfYear) + 1;
    
    // Nowe informacje
    document.getElementById('season').textContent = getSeason(dayOfYear);
    document.getElementById('earthDistance').textContent = earthDistanceKm + ' mln km';
    document.getElementById('moonDistance').textContent = moonDistanceKm + ' tys km';
    document.getElementById('moonPhaseShort').textContent = phase.name;
    document.getElementById('cameraMode').textContent = cameraMode === 'earth' ? 'Ziemia' : 'Kosmos';
    document.getElementById('earthTilt').textContent = '23.5°'; // Stałe nachylenie osi Ziemi
    
    // Informacja o nachyleniu orbity Księżyca (nie osi Ziemi)
    const moonHeight = Math.sin(moonOrbitAngle) * Math.sin(moonOrbitalTilt) * moonTiltMultiplier;
    const moonTiltInfo = moonHeight > 0 ? '↗ +5.1°' : moonHeight < 0 ? '↘ -5.1°' : '→ 0°';
    document.getElementById('orbitalTilt').textContent = moonTiltInfo;
    
    updateToggleInfo();
}

// Start
init();
updatePositions(0);
updateUIOnly(0);
updateCameraModeUI();
updateSpeedDisplay();

// Ustaw animację jako uruchomioną i zaktualizuj przycisk
lastAnimationTime = performance.now();
document.getElementById('playButton').textContent = '⏸ Pauza';

animate();