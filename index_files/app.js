// Initialize Lucide Icons on Page Load
document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();
    loadApiKey();
    setupCoreFeatures();
    setupEventListeners();
});

// UI Reference Elements
const recipeForm = document.getElementById('recipe-form');
const cookBtn = document.getElementById('cook-magic-btn');
const clearAllBtn = document.getElementById('clear-all-btn');
const toggleSettingsBtn = document.getElementById('toggle-settings-btn');
const settingsPanel = document.getElementById('settings-panel');
const apiKeyInput = document.getElementById('api-key-input');
const saveApiKeyBtn = document.getElementById('save-api-key-btn');
const statusIndicator = document.getElementById('status-indicator');
const statusText = document.getElementById('status-text');

// State Panels
const emptyState = document.getElementById('empty-state');
const loadingState = document.getElementById('loading-state');
const loadingMessage = document.getElementById('loading-message');
const progressBar = document.getElementById('progress-bar');
const recipeCard = document.getElementById('recipe-card');
const recipeCardInner = document.getElementById('recipe-card-inner-content');

// Interactive Overlays
const scanOverlay = document.getElementById('scan-overlay');
const voiceToast = document.getElementById('voice-toast');
const voiceStatusText = document.getElementById('voice-status-text');
const cancelVoiceBtn = document.getElementById('cancel-voice-btn');
const fridgeFileInput = document.getElementById('fridge-file-input');
const autoScanBtn = document.getElementById('auto-scan-btn');

// App state
let activeMode = 'ai-chef';
const activeFeatures = new Set();
let geminiApiKey = '';
let speechRecognitionObj = null;

// Initialize Core Setup
function setupCoreFeatures() {
    // 1. Setup Cooking Modes Selectors
    const modePills = document.querySelectorAll('.mode-pill');
    modePills.forEach(pill => {
        pill.addEventListener('click', () => {
            modePills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            activeMode = pill.getAttribute('data-mode');
            triggerSubtleHaptic();
        });
    });

    // 2. Setup Unique Features Toggles
    const featureCards = document.querySelectorAll('.feature-card');
    featureCards.forEach(card => {
        card.addEventListener('click', () => {
            const feature = card.getAttribute('data-feature');
            card.classList.toggle('active');
            triggerSubtleHaptic();

            if (card.classList.contains('active')) {
                activeFeatures.add(feature);
                handleFeatureActivation(feature, card);
            } else {
                activeFeatures.delete(feature);
                handleFeatureDeactivation(feature);
            }
        });
    });

    // 3. Auto-Scan Fast Click Trigger
    autoScanBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        triggerFridgeScanSequence();
    });

    // 4. Setup Inline Speech Dictation triggers
    const inlineMicBtns = document.querySelectorAll('.mic-inline-btn');
    inlineMicBtns.forEach((btn, index) => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const matchingInput = btn.previousElementSibling;
            startVoiceCapture(matchingInput, btn);
        });
    });
}

// Setup Event Listeners
function setupEventListeners() {
    // Toggle Settings Panel
    toggleSettingsBtn.addEventListener('click', () => {
        settingsPanel.classList.toggle('hidden');
        if (!settingsPanel.classList.contains('hidden')) {
            apiKeyInput.focus();
        }
    });

    // Save API key
    saveApiKeyBtn.addEventListener('click', () => {
        const inputKey = apiKeyInput.value.trim();
        if (inputKey) {
            localStorage.setItem('zuvai_gemini_api_key', inputKey);
            geminiApiKey = inputKey;
            updateApiStatus(true, 'Live Gemini Connection Active');
            settingsPanel.classList.add('hidden');
        } else {
            localStorage.removeItem('zuvai_gemini_api_key');
            geminiApiKey = '';
            updateApiStatus(false, 'Mock Mode Active (Instant Preview)');
        }
    });

    // Clear all inputs
    clearAllBtn.addEventListener('click', () => {
        const inputs = document.querySelectorAll('.ingredient-input');
        inputs.forEach(input => {
            input.value = '';
            input.parentElement.classList.remove('has-error');
        });
        inputs[0].focus();
        triggerSubtleHaptic();
    });

    // Form submission (Cook Magic)
    recipeForm.addEventListener('submit', async (e) => {
        e.preventDefault();

        // Collect entered ingredients
        const ingredients = [];
        const inputs = document.querySelectorAll('.ingredient-input');
        inputs.forEach(input => {
            const val = input.value.trim();
            if (val) ingredients.push(val);
        });

        // Validation
        if (ingredients.length === 0) {
            triggerInputHighlightWarning(inputs);
            return;
        }

        // Fire the culinary pipeline
        await startCookingPipeline(ingredients);
    });
}

// Handle feature activations dynamically
function handleFeatureActivation(feature, element) {
    if (feature === 'voice-in') {
        // Trigger voice on first empty input box
        const inputs = document.querySelectorAll('.ingredient-input');
        let firstEmpty = Array.from(inputs).find(i => !i.value.trim());
        if (!firstEmpty) firstEmpty = inputs[0];
        
        const matchingMic = firstEmpty.nextElementSibling;
        startVoiceCapture(firstEmpty, matchingMic);
    } else if (feature === 'fridge-scan') {
        // Trigger file/camera select
        fridgeFileInput.click();
    }
}

// Handle feature deactivations
function handleFeatureDeactivation(feature) {
    if (feature === 'voice-in' && speechRecognitionObj) {
        speechRecognitionObj.stop();
    }
}

// Simulated/Real Fridge scanning sequence
function triggerFridgeScanSequence() {
    // Active scan card visually
    const scanCard = document.getElementById('fridge-feature-card');
    if (scanCard) {
        scanCard.classList.add('active');
        activeFeatures.add('fridge-scan');
    }

    scanOverlay.classList.remove('hidden');
    triggerSubtleHaptic();

    // Visual scanning sweeps for 2.4 seconds
    setTimeout(() => {
        scanOverlay.classList.add('hidden');
        
        // Populate random rich fresh ingredients
        const mockPantryItems = [
            "Fresh Paneer", "Capsicum", "Cherry Tomatoes", 
            "Organic Honey", "Avocado", "Basmati Rice", 
            "Greek Yogurt", "Fresh Mint", "Garlic Cloves", "Olive Oil"
        ];
        
        const inputs = document.querySelectorAll('.ingredient-input');
        
        // Randomly choose 5-6 items and inject
        let count = 0;
        const chosen = mockPantryItems.sort(() => 0.5 - Math.random()).slice(0, 6);
        
        inputs.forEach((input, index) => {
            if (index < chosen.length) {
                input.value = chosen[index];
                input.style.borderColor = 'var(--olive-light)';
                setTimeout(() => {
                    input.style.borderColor = 'rgba(128, 128, 0, 0.15)';
                }, 1000);
            }
        });

        // Trigger success notification
        alert("Fridge Scan Successful! Detected: " + chosen.join(", "));
    }, 2400);
}

// Set up image upload handler for Fridge Scan
fridgeFileInput.addEventListener('change', () => {
    if (fridgeFileInput.files.length > 0) {
        triggerFridgeScanSequence();
    }
});

// HTML5 Web Speech Voice Input Recognition
function startVoiceCapture(inputField, micBtn) {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    
    if (!SpeechRecognition) {
        // Fallback simulation if browser does not support Web Speech
        voiceStatusText.textContent = "Voice input is not supported in this browser. Mocking...";
        voiceToast.classList.remove('hidden');
        micBtn.classList.add('listening');

        setTimeout(() => {
            const mockDictation = ["Saffron", "Rosemary", "Almonds", "Chicken Breast", "Cottage Cheese"];
            const randomIng = mockDictation[Math.floor(Math.random() * mockDictation.length)];
            inputField.value = randomIng;
            voiceToast.classList.add('hidden');
            micBtn.classList.remove('listening');
        }, 1500);
        return;
    }

    if (speechRecognitionObj) {
        speechRecognitionObj.stop();
    }

    const recognition = new SpeechRecognition();
    speechRecognitionObj = recognition;
    recognition.continuous = false;
    recognition.lang = activeFeatures.has('tamil-lang') ? 'ta-IN' : 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    micBtn.classList.add('listening');
    voiceStatusText.textContent = activeFeatures.has('tamil-lang') 
        ? "தமிழ் மூலப்பொருளைக் கூறவும்..." 
        : "Speak your ingredient clearly...";
    voiceToast.classList.remove('hidden');

    recognition.start();

    recognition.onresult = (event) => {
        const transcript = event.results[0][0].transcript;
        // Strip trailing periods and format
        inputField.value = transcript.replace(/\.$/g, '');
        inputField.focus();
        triggerSubtleHaptic();
    };

    recognition.onspeechend = () => {
        recognition.stop();
    };

    recognition.onend = () => {
        micBtn.classList.remove('listening');
        voiceToast.classList.add('hidden');
    };

    recognition.onerror = (event) => {
        console.error('Speech error:', event.error);
        micBtn.classList.remove('listening');
        voiceToast.classList.add('hidden');
    };

    cancelVoiceBtn.onclick = () => {
        recognition.stop();
    };
}

// Highlight empty inputs with subtle pulsing red alert if none are filled
function triggerInputHighlightWarning(inputs) {
    inputs.forEach(input => {
        input.placeholder = "Please enter an ingredient here!";
        input.style.borderColor = "#ef4444";
        input.focus();
    });
    setTimeout(() => {
        inputs.forEach(input => {
            input.style.borderColor = 'rgba(128, 128, 0, 0.15)';
        });
    }, 1500);
}

// Load Secure API Key from LocalStorage
function loadApiKey() {
    const savedKey = localStorage.getItem('zuvai_gemini_api_key');
    if (savedKey) {
        geminiApiKey = savedKey;
        apiKeyInput.value = savedKey;
        updateApiStatus(true, 'Live Gemini Connection Active');
    } else {
        updateApiStatus(false, 'Mock Mode Active (Instant Preview)');
    }
}

// Update API Status Banner
function updateApiStatus(isActive, message) {
    if (isActive) {
        statusIndicator.classList.add('active');
        statusText.textContent = message;
        toggleSettingsBtn.innerHTML = `<i data-lucide="key-round" style="color: #10b981;"></i> <span>API Connected</span>`;
    } else {
        statusIndicator.classList.remove('active');
        statusText.textContent = message;
        toggleSettingsBtn.innerHTML = `<i data-lucide="key"></i> <span>Configure Key</span>`;
    }
    lucide.createIcons();
}

// Master Cooking Pipeline Manager
async function startCookingPipeline(ingredients) {
    // Visual reset
    emptyState.classList.add('hidden');
    recipeCard.classList.add('hidden');
    loadingState.classList.remove('hidden');
    progressBar.style.width = '0%';

    // Visual phase updates
    const isTamil = activeFeatures.has('tamil-lang') || activeMode === 'tamil-style';
    const phases = isTamil ? [
        { percentage: 25, message: "மாஸ் ஏஐ சமையல் கலைஞர் இணைகிறது..." },
        { percentage: 50, message: "சுவை மேட்ரிக்ஸ் மற்றும் மூலப்பொருள் ஆராய்ச்சி..." },
        { percentage: 75, message: "வடிவமைப்பு மற்றும் செய்முறை உருவாக்குதல்..." },
        { percentage: 95, message: "இறுதி அலங்காரப் படைப்பு தயாராகிறது..." }
    ] : [
        { percentage: 25, message: "Aligning Molecular AI Culinary matrix..." },
        { percentage: 50, message: "Structuring ingredient synergy & pairing scores..." },
        { percentage: 75, message: "Drafting epicurean step-by-step instructions..." },
        { percentage: 95, message: "Fusing five-star secret chef techniques..." }
    ];

    let currentPhase = 0;
    const progressInterval = setInterval(() => {
        if (currentPhase < phases.length) {
            progressBar.style.width = `${phases[currentPhase].percentage}%`;
            loadingMessage.textContent = phases[currentPhase].message;
            currentPhase++;
        }
    }, 700);

    try {
        let recipeData;
        if (geminiApiKey) {
            recipeData = await fetchRealGeminiRecipe(ingredients);
        } else {
            recipeData = await getMockRecipe(ingredients);
        }

        clearInterval(progressInterval);
        progressBar.style.width = '100%';
        loadingMessage.textContent = isTamil ? "சமையல் முடிந்தது!" : "Culinary Masterpiece Completed!";

        setTimeout(() => {
            loadingState.classList.add('hidden');
            renderRecipeCard(recipeData);
            recipeCard.classList.remove('hidden');
            // Trigger scrolling to the card
            recipeCard.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 500);

    } catch (error) {
        clearInterval(progressInterval);
        console.error("Pipeline disruption:", error);
        showCulinaryFailure(error);
    }
}

// Fetch structured response from Live Gemini API using correct structured schema
async function fetchRealGeminiRecipe(ingredients) {
    const isTamil = activeFeatures.has('tamil-lang') || activeMode === 'tamil-style';
    
    // Construct active settings string
    let modeText = "AI Chef Mode (Premium Molecular Cuisines)";
    if (activeMode === 'weight-loss') modeText = "Weight Loss (Highly nutritional, low carb, low calorie, high fiber)";
    if (activeMode === 'gym-diet') modeText = "Gym Diet (Bodybuilding clean food, extremely high protein, detailed macros)";
    if (activeMode === 'tamil-style') modeText = "Traditional aromatic Tamil cuisines (South Indian excellence)";
    if (activeMode === 'five-minute') modeText = "5-Minute super express quick cooking";
    if (activeMode === 'hotel-tips') modeText = "5-Star Hotel luxury cooking style (Gourmet tips & elegant presentations)";

    let featuresText = [];
    if (activeFeatures.has('budget')) featuresText.push("Under extremely cheap budget constraints");
    if (activeFeatures.has('student-meals')) featuresText.push("Student meal target: super easy, quick, and costing under ₹50");
    if (activeFeatures.has('village-style')) featuresText.push("Traditional, wood-fired clay-pot rustic village style");
    if (activeFeatures.has('healthy')) featuresText.push("Strict healthy diet focus, high vitamins & clean ingredients");

    const prompt = `You are Zuvai AI, a premium Michelin-star chef.
Design a highly detailed, professional, and visually stunning recipe using these ingredients: ${ingredients.join(', ')}.

Active Cooking Mode: ${modeText}
Active Constraints: ${featuresText.join(', ') || 'Standard Gourmet'}

INSTRUCTIONS FOR WRITING:
${isTamil ? `
1. Write the entire recipe in beautiful, classical Tamil (தமிழ்).
2. The "recipeName", "badge", "ingredients" (with measurements), "instructions", and "chefTips" MUST be fully written in Tamil script.
3. You can put English transliterations in parentheses next to the Tamil words if helpful.
` : `
1. Write the recipe in elegant English.
2. Ensure high-end molecular gastronomy terms or elite hotel tips are integrated.
`}

Provide the response in the exact JSON schema requested.`;

    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${geminiApiKey}`;

    const response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({
            contents: [{
                parts: [{ text: prompt }]
            }],
            generationConfig: {
                responseMimeType: "application/json",
                responseSchema: {
                    type: "OBJECT",
                    properties: {
                        recipeName: { type: "STRING" },
                        cookingTime: { type: "STRING" },
                        difficulty: { type: "STRING" },
                        servings: { type: "STRING" },
                        badge: { type: "STRING", description: "Category/Badge (e.g. Molecular Gastronomy, Tamil Village Special, High-Protein)" },
                        ingredients: {
                            type: "ARRAY",
                            items: { type: "STRING" }
                        },
                        instructions: {
                            type: "ARRAY",
                            items: { type: "STRING" }
                        },
                        chefTips: { type: "STRING", description: "Pro plating, texture, or flavor advice" }
                    },
                    required: ["recipeName", "cookingTime", "difficulty", "servings", "badge", "ingredients", "instructions", "chefTips"]
                }
            }
        })
    });

    if (!response.ok) {
        const errJson = await response.json().catch(() => ({}));
        const errMsg = errJson?.error?.message || `HTTP status ${response.status}`;
        throw new Error(errMsg);
    }

    const resJson = await response.json();
    const recipeText = resJson.candidates[0].content.parts[0].text;
    return JSON.parse(recipeText);
}

// Premium dynamic simulated recipe engine (adapts to Tamil translate and modes perfectly!)
function getMockRecipe(ingredients) {
    return new Promise((resolve) => {
        setTimeout(() => {
            const isTamil = activeFeatures.has('tamil-lang') || activeMode === 'tamil-style';
            const primaryIng = ingredients[0].charAt(0).toUpperCase() + ingredients[0].slice(1);
            
            let recipe = {};

            // Dynamic setup based on modes
            if (isTamil) {
                // Generates extremely professional, beautiful Tamil responses
                let title = `அதிநவீன ${primaryIng} காரசார மசாலா`;
                let badge = "பாரம்பரிய தமிழ் சுவை 🌶️";
                let prepTime = "25 நிமிடங்கள்";
                let diff = "எளிதான சமையல்";
                let portions = "2 நபர்களுக்கு";
                let tips = "உணவை மண் சட்டியில் சமைத்தால் கூடுதல் வாசனையும் சுவையும் கிடைக்கும்!";
                
                if (activeMode === 'weight-loss') {
                    title = `${primaryIng} உடல் எடை குறைப்பு சாலட்`;
                    badge = "உடல்நலம் & டயட் 🥗";
                    prepTime = "10 நிமிடங்கள்";
                    diff = "மிக எளிது";
                } else if (activeMode === 'gym-diet') {
                    title = `${primaryIng} ஹை-புரோட்டீன் சுண்டல்`;
                    badge = "உடற்பயிற்சி டயட் 🏋️‍♂️";
                    prepTime = "15 நிமிடங்கள்";
                    diff = "சாதாரண முறை";
                } else if (activeMode === 'five-minute') {
                    title = `5-நிமிட ${primaryIng} சட்னி ரெசிபி`;
                    badge = "அதிவேக சமையல் ⏱️";
                    prepTime = "5 நிமிடங்கள்";
                } else if (activeMode === 'hotel-tips') {
                    title = `ஐந்து நட்சத்திர ஹோட்டல் ${primaryIng} குருமா`;
                    badge = "5-Star சொகுசு சமையல் 🏨";
                    tips = "குருமா இறக்கும் முன் சில சொட்டுக்கள் எலுமிச்சை சாறு மற்றும் நறுக்கிய கொத்தமல்லி தூவினால் ஹோட்டல் போன்ற மணம் வீசும்!";
                }

                recipe = {
                    recipeName: title,
                    cookingTime: prepTime,
                    difficulty: diff,
                    servings: portions,
                    badge: badge,
                    ingredients: [
                        `200 கிராம் நறுக்கிய ${primaryIng}`,
                        "1 நறுக்கிய வெங்காயம் & தக்காளி",
                        "2 பச்சை மிளகாய்",
                        "1 தேக்கரண்டி கடுகு & சீரகம்",
                        "2 தேக்கரண்டி நல்லெண்ணெய் அல்லது தேங்காய் எண்ணெய்",
                        "சிறிது கருவேப்பிலை & கொத்தமல்லி தழை"
                    ],
                    instructions: [
                        `முதலில் ${primaryIng} மற்றும் வெங்காயம், தக்காளியை சிறு துண்டுகளாக நறுக்கி தனியாக வைக்கவும்.`,
                        "ஒரு பாத்திரத்தில் நல்லெண்ணெய் ஊற்றி காய்ந்ததும் கடுகு, சீரகம், கருவேப்பிலை சேர்த்து தாளிக்கவும்.",
                        "பின் வெங்காயம், மிளகாய் சேர்த்து பொன்னிறமாக வதக்கவும். அதன்பின் தக்காளி சேர்த்து குழைய வதக்கவும்.",
                        `வதக்கிய கலவையுடன் நறுக்கிய ${primaryIng} மற்றும் தேவையான அளவு உப்பு சேர்த்து மிதமான தீயில் வேக வைக்கவும்.`,
                        "இறுதியாக நறுக்கிய கொத்தமல்லி தழையைத் தூவி, சுடச்சுட சாதம் அல்லது சப்பாத்தியுடன் பரிமாறவும்."
                    ],
                    chefTips: tips
                };
            } else {
                // English Custom Cuisines
                let title = `Crisp Roasted ${primaryIng} Medley`;
                let badge = "Michelin Standard Chef Choice 🔮";
                let prepTime = "30 mins";
                let diff = "Gourmet";
                let portions = "2 Servings";
                let tips = "Gently finish with fresh micro-basil and cold-pressed extra virgin olive oil to lift aroma profiles.";

                if (activeMode === 'weight-loss') {
                    title = `Thermostatic ${primaryIng} Diet Bowl`;
                    badge = "Low Calorie High Fiber 🥗";
                    prepTime = "15 mins";
                    diff = "Light Prep";
                } else if (activeMode === 'gym-diet') {
                    title = `High Protein Power ${primaryIng} Scramble`;
                    badge = "High Protein Macros 🏋️‍♂️";
                    prepTime = "20 mins";
                    diff = "Standard Macros";
                } else if (activeMode === 'five-minute') {
                    title = `Instant 5-Minute Express ${primaryIng} Toss`;
                    badge = "Express Magic ⏱️";
                    prepTime = "5 mins";
                    diff = "Super Easy";
                } else if (activeMode === 'hotel-tips') {
                    title = `Deconstructed Luxury ${primaryIng} Gastrique`;
                    badge = "Gourmet Elite 🏨";
                    tips = "Plate this dish using a round silicon mold, forming clean architectural layers. Smoke with applewood particles.";
                }

                if (activeFeatures.has('student-meals')) {
                    badge = "Student Budget Under ₹50 🎓";
                    tips = "Use generic store-brand spices to keep total cost well under ₹50 while keeping flavor high!";
                } else if (activeFeatures.has('village-style')) {
                    badge = "Rustic Claypot Special 🌾";
                }

                recipe = {
                    recipeName: title,
                    cookingTime: prepTime,
                    difficulty: diff,
                    servings: portions,
                    badge: badge,
                    ingredients: [
                        `200g Core fresh ${primaryIng}`,
                        ...ingredients.slice(1).map(i => `120g Handpicked organic ${i}`),
                        "2 tbsp Cold-pressed olive oil",
                        "1 tsp Hand-roasted Himalayan spices",
                        "Fresh sprigs of thyme for plating finish"
                    ],
                    instructions: [
                        `Prepare the core ${primaryIng} base with dry-heat slow roasting methods to protect biological cellular structure.`,
                        `Carefully aerate with the additional ingredients: ${ingredients.slice(1).join(', ') || 'aromatics'} under standard heat.`,
                        "Toss in cold-pressed olive oil and season with micro-granulated Himalayan sea salt.",
                        "Layer elegantly in a porcelain bowl, garnishing with fresh thyme sprigs.",
                        "Serve immediately to capture maximum temperature variance and peak flavor molecules."
                    ],
                    chefTips: tips
                };
            }

            resolve(recipe);
        }, 2200);
    });
}

// Custom Interactive Recipe Card Rendering
function renderRecipeCard(recipe) {
    const isTamil = activeFeatures.has('tamil-lang') || activeMode === 'tamil-style';
    
    // Dynamically select the premium cooking visual based on the active mode
    let recipeImageSrc = "gourmet_dish.png"; 
    if (activeMode === 'weight-loss') recipeImageSrc = "weight_loss_bowl.png";
    else if (activeMode === 'gym-diet') recipeImageSrc = "gym_protein_plate.png";
    else if (activeMode === 'tamil-style') recipeImageSrc = "tamil_style_meal.png";
    else if (activeMode === 'five-minute') recipeImageSrc = "express_snack.png";
    else if (activeMode === 'hotel-tips') recipeImageSrc = "hotel_special.png";

    recipeCardInner.innerHTML = `
        <div class="recipe-image-container">
            <img src="${recipeImageSrc}" alt="${recipe.recipeName}" class="recipe-img-premium">
            <div class="recipe-image-overlay"></div>
            <div class="recipe-image-badge">${isTamil ? 'உணவு புகைப்படம் 📸' : 'AI Culinary Visual 📸'}</div>
        </div>

        <div class="recipe-header">
            <span class="recipe-badge">
                <i data-lucide="award"></i> ${recipe.badge || 'Zuvai Choice'}
            </span>
            <h2 class="recipe-title">${recipe.recipeName}</h2>
            
            <div class="recipe-meta-row">
                <div class="meta-pill">
                    <i data-lucide="clock"></i>
                    <span>${recipe.cookingTime}</span>
                </div>
                <div class="meta-pill">
                    <i data-lucide="gauge"></i>
                    <span>${isTamil ? 'சிரமம்' : 'Difficulty'}: ${recipe.difficulty}</span>
                </div>
                <div class="meta-pill">
                    <i data-lucide="users"></i>
                    <span>${recipe.servings}</span>
                </div>
            </div>
        </div>

        <h3 class="recipe-section-title">
            <i data-lucide="shopping-basket"></i> ${isTamil ? 'தேவையான பொருட்கள்' : 'Core Ingredients'}
        </h3>
        <p style="color: var(--text-muted); font-size: 0.8rem; margin-top: -0.5rem; margin-bottom: 0.75rem;">
            ${isTamil ? 'பயன்படுத்திய மூலப்பொருட்களை டிக் செய்யவும்:' : 'Click ingredients to check them off as you prepare:'}
        </p>
        <ul class="recipe-ingredients-checklist">
            ${recipe.ingredients.map(ing => `
                <li onclick="toggleIngredientItemCheck(this)">
                    <span class="checkbox-custom"></span>
                    <span>${ing}</span>
                </li>
            `).join('')}
        </ul>

        <h3 class="recipe-section-title">
            <i data-lucide="compass"></i> ${isTamil ? 'சமையல் செய்முறை' : 'Preparation Steps'}
        </h3>
        <ul class="recipe-instructions-list">
            ${recipe.instructions.map((step, idx) => `
                <li class="instruction-step-item">
                    <div class="step-badge">${idx + 1}</div>
                    <div class="step-text">${step}</div>
                </li>
            `).join('')}
        </ul>

        <div class="tips-container">
            <div class="tips-title">
                <i data-lucide="lightbulb"></i> ${isTamil ? 'சமையல் ரகசியம்' : 'Chef’s Premium Secret Tip'}
            </div>
            <div class="tips-text">${recipe.chefTips}</div>
        </div>

        <div class="recipe-actions">
            <button class="action-btn-secondary" onclick="window.print()">
                <i data-lucide="printer"></i> ${isTamil ? 'பிரிண்ட் செய்க' : 'Print'}
            </button>
            <button class="action-btn-secondary" onclick="toggleRecipeFavorite(this)">
                <i data-lucide="star"></i> <span>${isTamil ? 'பிடித்தவை' : 'Favorite'}</span>
            </button>
            <button id="speak-recipe-btn" class="action-btn-secondary" style="background: rgba(168, 85, 247, 0.1); border-color: rgba(168, 85, 247, 0.25); color: #c084fc;" onclick="speakRecipeActive()">
                <i data-lucide="volume-2"></i> <span>${isTamil ? 'கேட்க' : 'Speak'}</span>
            </button>
            <button class="action-btn-secondary" style="background: rgba(6, 182, 212, 0.1); border-color: rgba(6, 182, 212, 0.25); color: #22d3ee;" onclick="shareActiveRecipe('${recipe.recipeName}')">
                <i data-lucide="share-2"></i> ${isTamil ? 'பகிர்' : 'Share'}
            </button>
        </div>
    `;

    // Re-trigger Lucide icons inside injected HTML content
    lucide.createIcons();
}

// HTML5 Web Speech Synthesis API Voice Reader
let speechUtterance = null;
window.speakRecipeActive = function() {
    const isTamil = activeFeatures.has('tamil-lang') || activeMode === 'tamil-style';
    
    // Toggle speaking if already running
    if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
        updateSpeakButtonState(false);
        return;
    }
    
    // Get text details for synthesis
    const recipeTitle = document.querySelector('.recipe-title').innerText;
    const ingredients = Array.from(document.querySelectorAll('.recipe-ingredients-checklist li span:nth-child(2)'))
        .map(el => el.innerText).join(', ');
    const instructions = Array.from(document.querySelectorAll('.instruction-step-item .step-text'))
        .map((el, i) => `${isTamil ? 'படி' : 'Step'} ${i + 1}: ${el.innerText}`).join('. ');
    
    let textToSpeak = "";
    if (isTamil) {
        textToSpeak = `செய்முறையின் பெயர்: ${recipeTitle}. தேவையான பொருட்கள்: ${ingredients}. செய்முறை விளக்கம்: ${instructions}`;
    } else {
        textToSpeak = `Recipe Name: ${recipeTitle}. Core Ingredients: ${ingredients}. Preparation steps: ${instructions}`;
    }
    
    speechUtterance = new SpeechSynthesisUtterance(textToSpeak);
    
    // Set appropriate voice
    const voices = window.speechSynthesis.getVoices();
    let preferredVoice = null;
    
    if (isTamil) {
        preferredVoice = voices.find(v => v.lang.includes('ta') || v.lang.includes('TA'));
        speechUtterance.lang = 'ta-IN';
    } else {
        preferredVoice = voices.find(v => v.lang.includes('en') || v.lang.includes('EN'));
        speechUtterance.lang = 'en-US';
    }
    
    if (preferredVoice) {
        speechUtterance.voice = preferredVoice;
    }
    
    speechUtterance.rate = 0.92; // Slightly natural slow rate for clarity
    
    speechUtterance.onstart = () => {
        updateSpeakButtonState(true);
    };
    
    speechUtterance.onend = () => {
        updateSpeakButtonState(false);
    };
    
    speechUtterance.onerror = () => {
        updateSpeakButtonState(false);
    };
    
    window.speechSynthesis.speak(speechUtterance);
};

function updateSpeakButtonState(isSpeaking) {
    const speakBtn = document.getElementById('speak-recipe-btn');
    if (!speakBtn) return;
    const span = speakBtn.querySelector('span');
    const icon = speakBtn.querySelector('i');
    
    const isTamil = activeFeatures.has('tamil-lang') || activeMode === 'tamil-style';
    
    if (isSpeaking) {
        speakBtn.classList.add('speaking-active');
        speakBtn.style.borderColor = '#ef4444';
        speakBtn.style.color = '#ef4444';
        speakBtn.style.background = 'rgba(239, 68, 68, 0.1)';
        span.textContent = isTamil ? 'நிறுத்துக' : 'Stop';
        if (icon) icon.setAttribute('data-lucide', 'square');
    } else {
        speakBtn.classList.remove('speaking-active');
        speakBtn.style.borderColor = 'rgba(168, 85, 247, 0.25)';
        speakBtn.style.color = '#c084fc';
        speakBtn.style.background = 'rgba(168, 85, 247, 0.1)';
        span.textContent = isTamil ? 'கேட்க' : 'Speak';
        if (icon) icon.setAttribute('data-lucide', 'volume-2');
    }
    lucide.createIcons();
}

// Ingredient tick checkbox handler
window.toggleIngredientItemCheck = function(element) {
    element.classList.toggle('checked');
    triggerSubtleHaptic();
};

// Toggle Favorite state with gorgeous glitter
window.toggleRecipeFavorite = function(btn) {
    const isTamil = activeFeatures.has('tamil-lang') || activeMode === 'tamil-style';
    const span = btn.querySelector('span');
    btn.classList.toggle('favorited');
    triggerSubtleHaptic();

    if (btn.classList.contains('favorited')) {
        btn.style.borderColor = '#eab308';
        btn.style.color = '#eab308';
        span.textContent = isTamil ? 'சேமிக்கப்பட்டது!' : 'Favorited!';
        btn.style.boxShadow = '0 0 15px rgba(234, 179, 8, 0.35)';
        setTimeout(() => btn.style.boxShadow = 'none', 1000);
    } else {
        btn.style.borderColor = 'rgba(255, 255, 255, 0.08)';
        btn.style.color = 'var(--text-secondary)';
        span.textContent = isTamil ? 'பிடித்தவை' : 'Favorite';
    }
};

// Clipboard share card generator
window.shareActiveRecipe = function(name) {
    const text = `Created a beautiful premium culinary masterpiece: "${name}" using Zuvai AI! 🧑‍🍳✨🍱`;
    if (navigator.clipboard) {
        navigator.clipboard.writeText(text);
        alert('Copied chef share-text to clipboard! Share the love.');
    } else {
        alert(text);
    }
};

// Visual UI Failure State Manager
function showCulinaryFailure(error) {
    loadingState.classList.add('hidden');
    recipeCardInner.innerHTML = `
        <div class="error-card" style="border: 2px solid #ef4444; background: rgba(239, 68, 68, 0.04); padding: 2rem; border-radius: 20px; text-align: center;">
            <i data-lucide="alert-circle" style="width: 48px; height: 48px; color: #f87171; margin-bottom: 1rem; display: inline-block;"></i>
            <h3 style="font-family: 'Plus Jakarta Sans', sans-serif; font-size: 1.25rem; margin-bottom: 0.5rem; color: #f87171;">Gastronomy Sync Failed</h3>
            <p style="color: var(--text-muted); font-size: 0.9rem; margin-bottom: 1.5rem;">${error.message || "Could not complete handshake with Gemini AI culinary servers."}</p>
            <div style="display: flex; gap: 0.75rem; justify-content: center;">
                <button class="clear-btn" onclick="retryCookingPipeline()" style="background: rgba(255,255,255,0.05);">Retry Connection</button>
                <button class="settings-btn" onclick="toggleSettingsBtn.click()" style="background: var(--purple-primary); border: none;">Configure Key</button>
            </div>
        </div>
    `;
    recipeCard.classList.remove('hidden');
    lucide.createIcons();
}

window.retryCookingPipeline = function() {
    recipeForm.dispatchEvent(new Event('submit'));
};

// Subtle Browser UI haptics (vibrations on supported mobile devices)
function triggerSubtleHaptic() {
    if (navigator.vibrate) {
        navigator.vibrate(8);
    }
}
