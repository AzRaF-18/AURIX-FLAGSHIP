/**
 * AURIX-X — Precision Audio & English Showcase Application
 * Features:
 * - Real-Time Web Audio API Synthesizer & Canvas Visualizer
 * - Dynamic QR Code Generator Studio
 * - Interactive Poster Breakdown & Hotspot Inspector
 * - English Copywriting & Rhetorical Analysis Sandbox
 * - Simulated GitHub Project Integration
 * - Pre-Order Drawer & Notification System
 */

document.addEventListener('DOMContentLoaded', () => {
    initNavigation();
    initAudioEngine();
    initPosterBreakdown();
    initCopywritingSandbox();
    initQRStudio();
    initGitHubIntegration();
    initPreOrderModal();
});

/* ==========================================================================
   1. NAVIGATION & TOAST SYSTEM
   ========================================================================== */
function initNavigation() {
    const navbar = document.querySelector('.navbar');
    window.addEventListener('scroll', () => {
        if (window.scrollY > 40) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });

    // Smooth anchor navigation
    document.querySelectorAll('a[href^="#"]').forEach(anchor => {
        anchor.addEventListener('click', function(e) {
            const targetId = this.getAttribute('href');
            if (targetId === '#' || !targetId) return;
            const targetElem = document.querySelector(targetId);
            if (targetElem) {
                e.preventDefault();
                targetElem.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        });
    });
}

function showToast(message, type = 'info') {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.className = 'toast-container';
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast-item toast-${type}`;
    toast.innerHTML = `
        <span class="toast-indicator"></span>
        <span class="toast-message">${message}</span>
    `;
    container.appendChild(toast);

    setTimeout(() => {
        toast.classList.add('visible');
    }, 10);

    setTimeout(() => {
        toast.classList.remove('visible');
        setTimeout(() => toast.remove(), 300);
    }, 3200);
}

/* ==========================================================================
   2. WEB AUDIO API SYNTHESIZER & REAL-TIME VISUALIZER
   ========================================================================== */
function initAudioEngine() {
    const canvas = document.getElementById('visualizer-canvas');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const playBtn = document.getElementById('audio-play-btn');
    const playBtnText = document.getElementById('audio-btn-text');
    const playBtnIcon = document.getElementById('audio-btn-icon');
    const volumeSlider = document.getElementById('volume-slider');
    const volumeValueText = document.getElementById('volume-val');
    const presetButtons = document.querySelectorAll('.soundscape-tab');

    // Telemetry display elements
    const freqDisplay = document.getElementById('telemetry-freq');
    const gainDisplay = document.getElementById('telemetry-gain');
    const thdDisplay = document.getElementById('telemetry-thd');
    const modeDisplay = document.getElementById('telemetry-mode');

    let audioCtx = null;
    let isPlaying = false;
    let masterGain = null;
    let analyser = null;
    let osc1 = null;
    let osc2 = null;
    let biquadFilter = null;
    let lfo = null;
    let lfoGain = null;
    let noiseNode = null;
    let animId = null;

    let currentPreset = 'binaural'; // 'binaural', 'subbass', 'sweep', 'anc'

    const presetConfigs = {
        binaural: {
            title: 'Binaural Harmonics (432 Hz)',
            baseFreq: 432,
            type: 'sine',
            detune: 8,
            filterFreq: 1800,
            thd: '0.004%',
            desc: 'Harmonic 432 Hz carrier frequency with dual-ear binaural offset designed for spatial focus.'
        },
        subbass: {
            title: 'Sub-Bass Resonance (40 Hz)',
            baseFreq: 40,
            type: 'triangle',
            detune: 2,
            filterFreq: 120,
            thd: '0.007%',
            desc: 'Acoustic 40 Hz low-frequency vibration demonstrating linear beryllium sub-bass response.'
        },
        sweep: {
            title: 'Acoustic Sweep (20Hz - 20kHz)',
            baseFreq: 220,
            type: 'sawtooth',
            detune: 0,
            filterFreq: 4000,
            thd: '0.006%',
            desc: 'Dynamic logarithmic frequency sweep verifying acoustic transducer linearity and balance.'
        },
        anc: {
            title: 'ANC Inversion Phase (180° Anti-Noise)',
            baseFreq: 160,
            type: 'sine',
            detune: 0,
            filterFreq: 800,
            thd: '0.002%',
            desc: 'Simulated ambient noise cancellation with dual-microphone inverse phase filtering.'
        }
    };

    function resizeCanvas() {
        const rect = canvas.getBoundingClientRect();
        canvas.width = rect.width * window.devicePixelRatio;
        canvas.height = rect.height * window.devicePixelRatio;
        ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    }
    window.addEventListener('resize', resizeCanvas);
    resizeCanvas();

    function createAudioContext() {
        if (!audioCtx) {
            const AudioContextClass = window.AudioContext || window.webkitAudioContext;
            audioCtx = new AudioContextClass();
        }
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
    }

    function setupSoundGenerators() {
        const config = presetConfigs[currentPreset];
        const now = audioCtx.currentTime;

        // Master Gain
        masterGain = audioCtx.createGain();
        const vol = parseFloat(volumeSlider.value) / 100;
        masterGain.gain.setValueAtTime(0, now);
        masterGain.gain.linearRampToValueAtTime(vol * 0.4, now + 0.15);

        // Analyser Node
        analyser = audioCtx.createAnalyser();
        analyser.fftSize = 256;
        analyser.smoothingTimeConstant = 0.85;

        // Filter Node
        biquadFilter = audioCtx.createBiquadFilter();
        biquadFilter.type = 'lowpass';
        biquadFilter.frequency.setValueAtTime(config.filterFreq, now);
        biquadFilter.Q.setValueAtTime(3.5, now);

        // Primary Oscillator
        osc1 = audioCtx.createOscillator();
        osc1.type = config.type;
        osc1.frequency.setValueAtTime(config.baseFreq, now);

        // Secondary Harmonic Oscillator
        osc2 = audioCtx.createOscillator();
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(config.baseFreq * 1.5, now);
        osc2.detune.setValueAtTime(config.detune, now);

        const osc2Gain = audioCtx.createGain();
        osc2Gain.gain.setValueAtTime(0.25, now);

        // LFO for subtle breathing movement
        lfo = audioCtx.createOscillator();
        lfo.frequency.setValueAtTime(0.25, now); // 0.25 Hz
        lfoGain = audioCtx.createGain();
        lfoGain.gain.setValueAtTime(config.baseFreq * 0.05, now);

        lfo.connect(lfoGain);
        lfoGain.connect(osc1.frequency);

        // Routing
        osc1.connect(biquadFilter);
        osc2.connect(osc2Gain);
        osc2Gain.connect(biquadFilter);

        biquadFilter.connect(masterGain);
        masterGain.connect(analyser);
        analyser.connect(audioCtx.destination);

        osc1.start(now);
        osc2.start(now);
        lfo.start(now);

        // If sweep preset, sweep frequency
        if (currentPreset === 'sweep') {
            osc1.frequency.exponentialRampToValueAtTime(3500, now + 8);
            setTimeout(() => {
                if (isPlaying && currentPreset === 'sweep') {
                    osc1.frequency.setValueAtTime(40, audioCtx.currentTime);
                    osc1.frequency.exponentialRampToValueAtTime(3500, audioCtx.currentTime + 8);
                }
            }, 8200);
        }
    }

    function stopSoundGenerators() {
        if (!audioCtx || !masterGain) return;
        const now = audioCtx.currentTime;
        masterGain.gain.linearRampToValueAtTime(0.0001, now + 0.15);
        setTimeout(() => {
            try {
                if (osc1) { osc1.stop(); osc1.disconnect(); }
                if (osc2) { osc2.stop(); osc2.disconnect(); }
                if (lfo) { lfo.stop(); lfo.disconnect(); }
                if (masterGain) { masterGain.disconnect(); }
            } catch (err) {
                // Ignore disconnect warnings
            }
        }, 180);
    }

    function togglePlayback() {
        createAudioContext();
        if (isPlaying) {
            stopSoundGenerators();
            isPlaying = false;
            playBtn.classList.remove('active');
            playBtnText.textContent = 'Start Audio Engine';
            playBtnIcon.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M8 5v14l11-7z"/></svg>`;
            showToast('Audio Engine paused', 'info');
        } else {
            setupSoundGenerators();
            isPlaying = true;
            playBtn.classList.add('active');
            playBtnText.textContent = 'Stop Audio Engine';
            playBtnIcon.innerHTML = `<svg viewBox="0 0 24 24" fill="currentColor" width="16" height="16"><path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/></svg>`;
            showToast(`Now playing: ${presetConfigs[currentPreset].title}`, 'success');
        }
        updateTelemetry();
    }

    playBtn.addEventListener('click', togglePlayback);

    volumeSlider.addEventListener('input', (e) => {
        const val = e.target.value;
        volumeValueText.textContent = `${val}%`;
        if (masterGain && audioCtx) {
            masterGain.gain.linearRampToValueAtTime((val / 100) * 0.4, audioCtx.currentTime + 0.05);
        }
        updateTelemetry();
    });

    presetButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const preset = btn.dataset.preset;
            if (preset === currentPreset) return;

            presetButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            currentPreset = preset;
            const descElem = document.getElementById('preset-description');
            if (descElem) {
                descElem.textContent = presetConfigs[currentPreset].desc;
            }

            if (isPlaying) {
                stopSoundGenerators();
                setTimeout(() => {
                    if (isPlaying) {
                        setupSoundGenerators();
                    }
                }, 200);
            }
            updateTelemetry();
            showToast(`Loaded preset: ${presetConfigs[currentPreset].title}`);
        });
    });

    function updateTelemetry() {
        const config = presetConfigs[currentPreset];
        if (freqDisplay) freqDisplay.textContent = isPlaying ? `${config.baseFreq} Hz` : '-- Hz';
        if (gainDisplay) {
            const db = isPlaying ? `${(-36 + (volumeSlider.value * 0.3)).toFixed(1)} dB` : '-∞ dB';
            gainDisplay.textContent = db;
        }
        if (thdDisplay) thdDisplay.textContent = config.thd;
        if (modeDisplay) modeDisplay.textContent = isPlaying ? 'ACTIVE / 60FPS' : 'STANDBY';
    }

    // 60FPS Canvas Drawing Loop
    let phase = 0;
    function draw() {
        animId = requestAnimationFrame(draw);
        const width = canvas.getBoundingClientRect().width;
        const height = canvas.getBoundingClientRect().height;

        ctx.clearRect(0, 0, width, height);

        // Dark background with subtle gradient
        const bgGrad = ctx.createLinearGradient(0, 0, width, height);
        bgGrad.addColorStop(0, '#0c0d12');
        bgGrad.addColorStop(1, '#070709');
        ctx.fillStyle = bgGrad;
        ctx.fillRect(0, 0, width, height);

        // Draw frequency grid lines
        ctx.strokeStyle = 'rgba(255, 43, 78, 0.07)';
        ctx.lineWidth = 1;
        const gridCols = 8;
        for (let i = 1; i < gridCols; i++) {
            const x = (width / gridCols) * i;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.stroke();
        }
        for (let i = 1; i < 4; i++) {
            const y = (height / 4) * i;
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(width, y);
            ctx.stroke();
        }

        if (isPlaying && analyser) {
            const bufferLength = analyser.frequencyBinCount;
            const dataArray = new Uint8Array(bufferLength);
            analyser.getByteFrequencyData(dataArray);

            const timeData = new Uint8Array(bufferLength);
            analyser.getByteTimeDomainData(timeData);

            // 1. Draw Spectrum Bars (Crimson to Scarlet gradient)
            const barCount = 36;
            const barWidth = (width / barCount) * 0.65;
            const gap = (width / barCount) * 0.35;

            for (let i = 0; i < barCount; i++) {
                const dataIndex = Math.floor((i / barCount) * bufferLength * 0.75);
                const val = dataArray[dataIndex] || 0;
                const barHeight = (val / 255) * (height * 0.75);
                const x = i * (barWidth + gap) + gap / 2;
                const y = height - barHeight;

                const barGrad = ctx.createLinearGradient(x, y, x, height);
                barGrad.addColorStop(0, '#ff2a4b');
                barGrad.addColorStop(0.4, '#e61937');
                barGrad.addColorStop(1, '#660b18');

                ctx.fillStyle = barGrad;
                ctx.fillRect(x, y, barWidth, barHeight);

                // Subtle reflective peak dot
                if (barHeight > 6) {
                    ctx.fillStyle = '#ffffff';
                    ctx.fillRect(x, y - 2, barWidth, 2);
                }
            }

            // 2. Draw Smooth Oscillating Waveform Ribbon
            ctx.lineWidth = 2.5;
            ctx.strokeStyle = '#ffffff';
            ctx.shadowColor = '#ff2a4b';
            ctx.shadowBlur = 12;

            ctx.beginPath();
            const sliceWidth = width / bufferLength;
            let wx = 0;

            for (let i = 0; i < bufferLength; i++) {
                const v = timeData[i] / 128.0;
                const wy = (v * height) / 2;

                if (i === 0) {
                    ctx.moveTo(wx, wy);
                } else {
                    ctx.lineTo(wx, wy);
                }
                wx += sliceWidth;
            }
            ctx.stroke();
            ctx.shadowBlur = 0; // reset

        } else {
            // Resting subtle ambient breathing wave
            phase += 0.035;
            ctx.lineWidth = 1.5;
            ctx.strokeStyle = 'rgba(230, 25, 55, 0.4)';

            ctx.beginPath();
            for (let x = 0; x < width; x += 3) {
                const y = (height / 2) + Math.sin(x * 0.015 + phase) * 16 * Math.sin(phase * 0.5);
                if (x === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            }
            ctx.stroke();

            // Center instruction prompt
            ctx.fillStyle = '#64748b';
            ctx.font = '12px "Plus Jakarta Sans", sans-serif';
            ctx.textAlign = 'center';
            ctx.fillText('Click "Start Audio Engine" to synthesize real-time soundscape', width / 2, height / 2 + 38);
        }
    }

    draw();
}

/* ==========================================================================
   3. INTERACTIVE POSTER BREAKDOWN & HOTSPOT INSPECTOR
   ========================================================================== */
function initPosterBreakdown() {
    const hotspots = document.querySelectorAll('.poster-hotspot');
    const inspectorTitle = document.getElementById('inspector-title');
    const inspectorTag = document.getElementById('inspector-tag');
    const inspectorDesc = document.getElementById('inspector-desc');
    const inspectorRationale = document.getElementById('inspector-rationale');
    const inspectorSpec = document.getElementById('inspector-spec');
    const layerButtons = document.querySelectorAll('.layer-btn');
    const lightboxModal = document.getElementById('poster-lightbox');
    const openLightboxBtn = document.getElementById('open-lightbox-btn');
    const closeLightboxBtn = document.getElementById('close-lightbox-btn');

    const hotspotData = {
        1: {
            title: 'Slogan & Headline Typography',
            tag: 'Rhetorical Hook · Copywriting',
            desc: '"Hear Beyond Silence." Anchored at optical top-center in customized high-contrast grotesque typography. It immediately subverts expectations through cognitive contrast.',
            rationale: 'Juxtaposing hearing against absolute silence positions the AURIX-X active noise cancellation not as sound erasure, but as acoustic illumination.',
            spec: 'Tracking: -0.02em · Contrast: 18.2:1 against Obsidian · Type: High-Legibility Display'
        },
        2: {
            title: '40mm Beryllium Transducers',
            tag: 'Acoustic Architecture · Hardware',
            desc: 'Ultra-thin vapor-deposited Beryllium diaphragms provide unmatched stiffness-to-mass ratio, completely eliminating driver cone distortion.',
            rationale: 'Depicting the driver cross-section reinforces engineering credibility (Logos appeal) and elevates the product above mass-market lifestyle accessories.',
            spec: 'Frequency Range: 5 Hz – 48,000 Hz · Distortion: < 0.008% THD · Sensitivity: 104 dB SPL'
        },
        3: {
            title: 'Dual-Chamber ANC Inversion Vents',
            tag: 'Sensory Isolation · Hardware',
            desc: 'Precision laser-machined acoustic vents paired with inward/outward MEMS microphones capturing ambient wave frequencies 48,000 times per second.',
            rationale: 'Visually highlights physical craftsmanship and the tactile interplay of crimson micro-mesh venting against satin anodized aluminum.',
            spec: 'Noise Reduction Depth: -42 dB · Bandwidth: 20 Hz – 2.5 kHz · Latency: 0.8 ms DSP Loop'
        },
        4: {
            title: 'Tactile Ergonomic Arch',
            tag: 'Industrial Form · Aesthetics',
            desc: 'Suspended carbon-composite headband wrapped in perforated breathable protein leather with memory foam pressure-distribution padding.',
            rationale: 'Balances the aggressive crimson-and-black industrial aura with assurances of all-day listening comfort for audiophiles and students.',
            spec: 'Clamping Force: 4.2 N · Weight: 268 g · Contact Pressure: 18 g/cm² evenly balanced'
        },
        5: {
            title: 'Dynamic Campaign QR Anchor',
            tag: 'Conversion Action · Call-to-Action',
            desc: 'High-contrast scannable vector matrix linking viewers straight to the project repository, audio suite, and digital analysis page.',
            rationale: 'Transforms an offline physical promotional poster into an interactive multi-sensory digital experience with zero friction.',
            spec: 'Error Correction: Level H (30% redundancy) · URL Target: AzRaF-18/aurix-get-yours-now'
        }
    };

    function activateHotspot(id) {
        hotspots.forEach(hs => {
            if (hs.dataset.id === String(id)) {
                hs.classList.add('active');
            } else {
                hs.classList.remove('active');
            }
        });

        const data = hotspotData[id];
        if (data) {
            inspectorTitle.textContent = data.title;
            inspectorTag.textContent = data.tag;
            inspectorDesc.textContent = data.desc;
            inspectorRationale.textContent = data.rationale;
            inspectorSpec.textContent = data.spec;
        }
    }

    hotspots.forEach(hs => {
        hs.addEventListener('click', () => {
            const id = hs.dataset.id;
            activateHotspot(id);
        });
    });

    // Layer Filter Buttons
    layerButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            layerButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const layer = btn.dataset.layer;
            hotspots.forEach(hs => {
                if (layer === 'all') {
                    hs.style.display = 'flex';
                } else if (layer === 'copy' && (hs.dataset.id === '1' || hs.dataset.id === '5')) {
                    hs.style.display = 'flex';
                } else if (layer === 'hardware' && (hs.dataset.id === '2' || hs.dataset.id === '3' || hs.dataset.id === '4')) {
                    hs.style.display = 'flex';
                } else if (layer === 'design' && (hs.dataset.id === '1' || hs.dataset.id === '4')) {
                    hs.style.display = 'flex';
                } else {
                    hs.style.display = 'none';
                }
            });
            showToast(`Filter active: ${btn.textContent.trim()}`);
        });
    });

    // Lightbox modal handlers
    if (openLightboxBtn && lightboxModal) {
        openLightboxBtn.addEventListener('click', () => {
            lightboxModal.classList.add('open');
            document.body.style.overflow = 'hidden';
        });
    }

    if (closeLightboxBtn && lightboxModal) {
        closeLightboxBtn.addEventListener('click', () => {
            lightboxModal.classList.remove('open');
            document.body.style.overflow = '';
        });

        lightboxModal.addEventListener('click', (e) => {
            if (e.target === lightboxModal) {
                lightboxModal.classList.remove('open');
                document.body.style.overflow = '';
            }
        });
    }
}

/* ==========================================================================
   4. ENGLISH COPYWRITING & RHETORICAL ANALYSIS SANDBOX
   ========================================================================== */
function initCopywritingSandbox() {
    const input = document.getElementById('copy-input');
    const analyzeBtn = document.getElementById('copy-analyze-btn');
    const presetButtons = document.querySelectorAll('.copy-preset-btn');
    const scoreVal = document.getElementById('copy-score-val');
    const devicesList = document.getElementById('copy-devices-list');
    const critiqueText = document.getElementById('copy-critique-text');
    const syllablesVal = document.getElementById('copy-syllables-val');
    const toneVal = document.getElementById('copy-tone-val');

    const techniquePills = document.querySelectorAll('.technique-tab');
    const techniqueCards = document.querySelectorAll('.rhetorical-card');

    // Filter rhetorical technique cards
    techniquePills.forEach(pill => {
        pill.addEventListener('click', () => {
            techniquePills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');

            const filter = pill.dataset.filter;
            techniqueCards.forEach(card => {
                if (filter === 'all' || card.dataset.category === filter) {
                    card.style.display = 'block';
                } else {
                    card.style.display = 'none';
                }
            });
        });
    });

    // Preset copy variations
    const presets = {
        preset1: "Hear Beyond Silence.",
        preset2: "Precision-tuned drivers engineered to isolate every layer of your soundscape.",
        preset3: "Experience True Immersion.",
        preset4: "Silence the world. Awaken the acoustic storm."
    };

    presetButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            const key = btn.dataset.preset;
            if (presets[key]) {
                input.value = presets[key];
                analyzeCopy(input.value);
            }
        });
    });

    if (analyzeBtn && input) {
        analyzeBtn.addEventListener('click', () => {
            analyzeCopy(input.value);
        });

        input.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') analyzeCopy(input.value);
        });
    }

    function countSyllables(word) {
        word = word.toLowerCase();
        if (word.length <= 3) return 1;
        word = word.replace(/(?:[^laeiouy]|ed|es|e)$/, '');
        word = word.replace(/^y/, '');
        const syl = word.match(/[aeiouy]{1,2}/g);
        return syl ? syl.length : 1;
    }

    function analyzeCopy(text) {
        if (!text || text.trim() === '') {
            showToast('Please type a headline to analyze', 'error');
            return;
        }

        const trimmed = text.trim();
        const words = trimmed.split(/\s+/);
        let totalSyllables = 0;
        words.forEach(w => totalSyllables += countSyllables(w));

        const lower = trimmed.toLowerCase();

        // Rhetorical pattern detection
        const detectedDevices = [];
        let score = 55;

        // Paradox detection
        if ((lower.includes('silence') && (lower.includes('hear') || lower.includes('sound') || lower.includes('noise'))) ||
            (lower.includes('still') && lower.includes('storm')) ||
            (lower.includes('dark') && lower.includes('light'))) {
            detectedDevices.push({
                name: 'Paradox & Juxtaposition',
                desc: 'Couples conceptual opposites to spark cognitive curiosity.'
            });
            score += 20;
        }

        // Sensory / Acoustic Diction
        const sensoryWords = ['soundscape', 'precision', 'drivers', 'engineered', 'acoustic', 'isolate', 'layer', 'resonate', 'immersion', 'hear', 'sound', 'vibration'];
        const matchedSensory = sensoryWords.filter(sw => lower.includes(sw));
        if (matchedSensory.length > 0) {
            detectedDevices.push({
                name: `Sensory Diction (${matchedSensory.join(', ')})`,
                desc: 'Engages auditory imagination and technical prestige.'
            });
            score += matchedSensory.length * 5;
        }

        // Imperative Command
        const imperativeStarters = ['hear', 'experience', 'silence', 'awaken', 'discover', 'step', 'listen', 'unleash', 'command'];
        const firstWord = words[0].toLowerCase().replace(/[^a-z]/g, '');
        if (imperativeStarters.includes(firstWord)) {
            detectedDevices.push({
                name: `Imperative Command ("${firstWord}")`,
                desc: 'Commands audience action with assertive, confident authority.'
            });
            score += 15;
        }

        // Parallelism or Antithesis
        if (trimmed.includes('.') && words.length >= 4) {
            detectedDevices.push({
                name: 'Staccato Cadence & Parallelism',
                desc: 'Punchy sentence rhythm maximizing memorability and billboard retention.'
            });
            score += 8;
        }

        // Brevity bonus for slogans (3 - 8 words)
        if (words.length >= 3 && words.length <= 8) {
            score += 10;
        }

        score = Math.min(Math.max(score, 40), 98);

        // Update UI
        scoreVal.textContent = `${score}/100`;
        syllablesVal.textContent = `${totalSyllables} syllables · ${words.length} words`;

        let tone = 'Conversational Commercial';
        if (score >= 85) tone = 'High-Impact Rhetorical / Luxury';
        else if (score >= 70) tone = 'Persuasive Technical Premium';
        toneVal.textContent = tone;

        devicesList.innerHTML = '';
        if (detectedDevices.length === 0) {
            devicesList.innerHTML = `<li class="device-item text-muted">Direct literal statement. Consider adding sensory diction or contrast.</li>`;
        } else {
            detectedDevices.forEach(d => {
                const li = document.createElement('li');
                li.className = 'device-item';
                li.innerHTML = `<strong>${d.name}:</strong> <span>${d.desc}</span>`;
                devicesList.appendChild(li);
            });
        }

        // Critique generator
        if (score >= 85) {
            critiqueText.textContent = `Exceptional campaign copy. The phrasing leverages strong phonological cadence and rhetorical juxtaposition. It frames the product not merely as hardware, but as an active sensory transformation.`;
        } else if (score >= 65) {
            critiqueText.textContent = `Strong commercial statement with solid persuasive elements. To enhance impact, tighten the word count and intensify sensory verbs.`;
        } else {
            critiqueText.textContent = `Readable and functional, but leans towards passive description. Introduce active verbs and evocative auditory imagery to elevate persuasive pull.`;
        }

        showToast(`Analyzed copy: Persuasion Index ${score}/100`, 'info');
    }

    // Run initial analysis
    analyzeCopy(input.value);
}

/* ==========================================================================
   5. DYNAMIC QR CODE GENERATOR STUDIO
   ========================================================================== */
function initQRStudio() {
    const urlInput = document.getElementById('qr-url-input');
    const generateBtn = document.getElementById('qr-generate-btn');
    const downloadBtn = document.getElementById('qr-download-btn');
    const copyLinkBtn = document.getElementById('qr-copy-btn');
    const qrImage = document.getElementById('qr-preview-img');
    const qrFallbackCanvas = document.getElementById('qr-fallback-canvas');
    const qrThemeRadios = document.querySelectorAll('input[name="qr-theme"]');
    const presetButtons = document.querySelectorAll('.qr-preset-chip');
    const qrTargetDisplay = document.getElementById('qr-target-display');

    let currentDataUrl = '';

    const presets = {
        repo: "https://github.com/AzRaF-18/aurix-get-yours-now",
        poster: "https://github.com/AzRaF-18/aurix-get-yours-now/blob/main/poster.png",
        english: "https://github.com/AzRaF-18/aurix-get-yours-now#copywriting-analysis",
        preorder: "https://ais-dev-4xyauaf6lniksiygbylnxs-884967614042.asia-southeast1.run.app#preorder"
    };

    presetButtons.forEach(btn => {
        btn.addEventListener('click', () => {
            presetButtons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');

            const key = btn.dataset.preset;
            if (presets[key]) {
                urlInput.value = presets[key];
                generateQRCode();
            }
        });
    });

    qrThemeRadios.forEach(radio => {
        radio.addEventListener('change', () => {
            generateQRCode();
        });
    });

    if (generateBtn) {
        generateBtn.addEventListener('click', generateQRCode);
    }

    if (urlInput) {
        urlInput.addEventListener('keyup', (e) => {
            if (e.key === 'Enter') generateQRCode();
        });
    }

    async function generateQRCode() {
        const text = urlInput.value.trim() || 'https://github.com/AzRaF-18/aurix-get-yours-now';
        const selectedTheme = document.querySelector('input[name="qr-theme"]:checked')?.value || 'crimson-dark';

        let darkColor = '#e61937';
        let lightColor = '#0d0d12';

        if (selectedTheme === 'white-dark') {
            darkColor = '#08080a';
            lightColor = '#ffffff';
        } else if (selectedTheme === 'crimson-light') {
            darkColor = '#e61937';
            lightColor = '#ffffff';
        }

        if (qrTargetDisplay) {
            qrTargetDisplay.textContent = text;
        }

        try {
            // Call server API route /api/qr
            const res = await fetch(`/api/qr?text=${encodeURIComponent(text)}&dark=${encodeURIComponent(darkColor)}&light=${encodeURIComponent(lightColor)}&width=360`);
            const data = await res.json();

            if (data.success && data.dataUrl) {
                currentDataUrl = data.dataUrl;
                qrImage.src = currentDataUrl;
                qrImage.style.display = 'block';
                qrFallbackCanvas.style.display = 'none';
            } else {
                throw new Error('Server QR generation failed');
            }
        } catch (err) {
            console.warn('Falling back to client canvas QR renderer:', err);
            renderClientQR(text, darkColor, lightColor);
        }
    }

    // Client-side fallback renderer
    function renderClientQR(text, darkColor, lightColor) {
        const canvas = qrFallbackCanvas;
        const ctx = canvas.getContext('2d');
        const size = 320;
        canvas.width = size;
        canvas.height = size;

        ctx.fillStyle = lightColor;
        ctx.fillRect(0, 0, size, size);

        // Deterministic pseudo matrix pattern based on text hash
        let hash = 0;
        for (let i = 0; i < text.length; i++) {
            hash = (hash << 5) - hash + text.charCodeAt(i);
            hash |= 0;
        }

        const modules = 29;
        const cellSize = size / modules;
        ctx.fillStyle = darkColor;

        // Position detection patterns (corners)
        function drawFinder(startX, startY) {
            for (let r = 0; r < 7; r++) {
                for (let c = 0; c < 7; c++) {
                    if (r === 0 || r === 6 || c === 0 || c === 6 || (r >= 2 && r <= 4 && c >= 2 && c <= 4)) {
                        ctx.fillRect((startX + c) * cellSize, (startY + r) * cellSize, cellSize, cellSize);
                    }
                }
            }
        }
        drawFinder(1, 1);
        drawFinder(modules - 8, 1);
        drawFinder(1, modules - 8);

        // Body matrix
        for (let r = 1; r < modules - 1; r++) {
            for (let c = 1; c < modules - 1; c++) {
                if ((r < 8 && c < 8) || (r < 8 && c >= modules - 8) || (r >= modules - 8 && c < 8)) continue;
                const seed = Math.sin(hash + r * 13 + c * 37) * 10000;
                if ((seed - Math.floor(seed)) > 0.5) {
                    ctx.fillRect(c * cellSize, r * cellSize, cellSize - 0.5, cellSize - 0.5);
                }
            }
        }

        // Center badge
        ctx.fillStyle = '#0a0a0f';
        const centerSize = cellSize * 5;
        const centerPos = (size - centerSize) / 2;
        ctx.fillRect(centerPos, centerPos, centerSize, centerSize);
        ctx.strokeStyle = darkColor;
        ctx.lineWidth = 2;
        ctx.strokeRect(centerPos, centerPos, centerSize, centerSize);

        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 10px "Syne", sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('AURIX', size / 2, size / 2 + 3);

        currentDataUrl = canvas.toDataURL('image/png');
        qrImage.src = currentDataUrl;
        qrImage.style.display = 'block';
    }

    if (downloadBtn) {
        downloadBtn.addEventListener('click', () => {
            if (!currentDataUrl) return;
            const a = document.createElement('a');
            a.href = currentDataUrl;
            a.download = `aurix-x-qr-campaign.png`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            showToast('QR Code image downloaded (PNG)', 'success');
        });
    }

    if (copyLinkBtn) {
        copyLinkBtn.addEventListener('click', () => {
            const url = urlInput.value.trim();
            navigator.clipboard.writeText(url).then(() => {
                showToast('Target URL copied to clipboard!', 'success');
            }).catch(() => {
                showToast('Could not copy link to clipboard', 'error');
            });
        });
    }

    // Initial QR render
    generateQRCode();
}

/* ==========================================================================
   6. SIMULATED GITHUB PROJECT INTEGRATION
   ========================================================================== */
function initGitHubIntegration() {
    const starBtn = document.getElementById('github-star-btn');
    const starCountText = document.getElementById('github-star-count');
    const forkBtn = document.getElementById('github-fork-btn');
    const forkCountText = document.getElementById('github-fork-count');
    const copyCloneBtn = document.getElementById('copy-clone-btn');
    const cloneCommandText = document.getElementById('clone-command-text');
    const fileItems = document.querySelectorAll('.github-file-item');
    const codeFilename = document.getElementById('code-view-filename');
    const codeViewContent = document.getElementById('code-view-content');

    // Star counter state in localStorage
    const STORAGE_KEY = 'aurix_github_starred';
    let isStarred = localStorage.getItem(STORAGE_KEY) === 'true';
    let baseStars = 48;
    if (isStarred) baseStars += 1;

    function renderStarState() {
        if (isStarred) {
            starBtn.classList.add('starred');
            starBtn.querySelector('.star-label').textContent = 'Starred';
            starCountText.textContent = baseStars;
        } else {
            starBtn.classList.remove('starred');
            starBtn.querySelector('.star-label').textContent = 'Star';
            starCountText.textContent = baseStars;
        }
    }
    renderStarState();

    if (starBtn) {
        starBtn.addEventListener('click', () => {
            isStarred = !isStarred;
            if (isStarred) {
                baseStars += 1;
                localStorage.setItem(STORAGE_KEY, 'true');
                showToast('Starred repository AzRaF-18/aurix-get-yours-now! Thank you for the support.', 'success');
            } else {
                baseStars -= 1;
                localStorage.setItem(STORAGE_KEY, 'false');
                showToast('Unstarred repository', 'info');
            }
            renderStarState();
        });
    }

    if (forkBtn) {
        forkBtn.addEventListener('click', () => {
            let forks = parseInt(forkCountText.textContent, 10) || 12;
            forks += 1;
            forkCountText.textContent = forks;
            showToast('Simulated fork created! Repository cloned to your workspace.', 'success');
        });
    }

    if (copyCloneBtn && cloneCommandText) {
        copyCloneBtn.addEventListener('click', () => {
            const cmd = cloneCommandText.textContent.trim();
            navigator.clipboard.writeText(cmd).then(() => {
                showToast('Clone command copied: git clone ...', 'success');
            });
        });
    }

    // Repository File Previews
    const fileContents = {
        'index.html': `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <title>AURIX-X | Precision Audio & English Showcase</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <!-- AURIX-X Flagship Interactive Architecture -->
    <header class="navbar">
        <div class="logo">AURIX<span>-X</span></div>
    </header>
    <main>
        <section id="hero">
            <h1>Sound, Redefined. Hear Beyond Silence.</h1>
        </section>
    </main>
</body>
</html>`,
        'style.css': `:root {
    --bg-obsidian: #08080a;
    --card-surface: #121217;
    --accent-crimson: #e61937;
    --accent-glow: #ff2a4b;
    --border-hairline: rgba(255, 43, 78, 0.15);
}

body {
    background-color: var(--bg-obsidian);
    color: #e2e8f0;
    font-family: 'Plus Jakarta Sans', sans-serif;
}

.hero h1 {
    font-family: 'Syne', sans-serif;
    color: #ffffff;
}`,
        'audio-engine.js': `// Real-Time Web Audio API Synthesis Pipeline
export class AurixAudioEngine {
    constructor() {
        this.ctx = new (window.AudioContext || window.webkitAudioContext)();
        this.analyser = this.ctx.createAnalyser();
        this.analyser.fftSize = 256;
    }

    synthesizeHarmonics(frequency = 432) {
        const osc = this.ctx.createOscillator();
        osc.frequency.setValueAtTime(frequency, this.ctx.currentTime);
        osc.connect(this.analyser);
        this.analyser.connect(this.ctx.destination);
        osc.start();
    }
}`,
        'english-analysis.md': `# AURIX-X English Language & Rhetorical Framework

## 1. Slogan Paradox
- **Text**: "Hear Beyond Silence."
- **Technique**: Paradox & Auditory Juxtaposition.
- **Cognitive Purpose**: Juxtaposes hearing with silence to emphasize active acoustic isolation.

## 2. Technical & Sensory Diction
- **Text**: "Precision-tuned drivers engineered to isolate every layer of your soundscape."
- **Purpose**: Creates an aura of scientific craftsmanship and acoustic mastery.`,
        'README.md': `# AURIX-X: Get Yours Now
An interactive, high-precision single-page presentation of the AURIX-X Wireless Headset.

## Key Features
- Web Audio API real-time sound visualizer (432Hz & 40Hz)
- Dynamic QR code generation with custom color matrices
- Interactive hotspot poster breakdown
- Academic English copywriting & persuasion sandbox
- Built for GitHub Pages deployment`
    };

    fileItems.forEach(item => {
        item.addEventListener('click', () => {
            fileItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');

            const filename = item.dataset.file;
            if (codeFilename) codeFilename.textContent = filename;
            if (codeViewContent) {
                codeViewContent.textContent = fileContents[filename] || '// File empty';
            }
        });
    });
}

/* ==========================================================================
   7. PRE-ORDER DRAWER & LEAD CAPTURE
   ========================================================================== */
function initPreOrderModal() {
    const modal = document.getElementById('preorder-modal');
    const openBtns = document.querySelectorAll('.open-preorder-trigger');
    const closeBtn = document.getElementById('close-preorder-btn');
    const form = document.getElementById('preorder-form');
    const qtyMinus = document.getElementById('qty-minus');
    const qtyPlus = document.getElementById('qty-plus');
    const qtyInput = document.getElementById('qty-input');
    const subtotalText = document.getElementById('order-subtotal');
    const totalText = document.getElementById('order-total');
    const successScreen = document.getElementById('preorder-success');
    const orderRefText = document.getElementById('order-ref-num');
    const finishPills = document.querySelectorAll('.finish-option');

    const BASE_PRICE = 299;

    function openModal() {
        if (!modal) return;
        modal.classList.add('open');
        document.body.style.overflow = 'hidden';
    }

    function closeModal() {
        if (!modal) return;
        modal.classList.remove('open');
        document.body.style.overflow = '';
    }

    openBtns.forEach(btn => btn.addEventListener('click', openModal));
    if (closeBtn) closeBtn.addEventListener('click', closeModal);

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) closeModal();
        });
    }

    // Finish selector
    finishPills.forEach(pill => {
        pill.addEventListener('click', () => {
            finishPills.forEach(p => p.classList.remove('active'));
            pill.classList.add('active');
            const finishName = pill.dataset.finish;
            showToast(`Selected finish: ${finishName}`);
        });
    });

    // Quantity steppers
    function updatePricing() {
        const qty = Math.max(1, parseInt(qtyInput.value, 10) || 1);
        qtyInput.value = qty;
        const total = qty * BASE_PRICE;
        if (subtotalText) subtotalText.textContent = `$${total.toLocaleString()}`;
        if (totalText) totalText.textContent = `$${total.toLocaleString()}`;
    }

    if (qtyMinus && qtyPlus && qtyInput) {
        qtyMinus.addEventListener('click', () => {
            let val = parseInt(qtyInput.value, 10) || 1;
            if (val > 1) {
                qtyInput.value = val - 1;
                updatePricing();
            }
        });

        qtyPlus.addEventListener('click', () => {
            let val = parseInt(qtyInput.value, 10) || 1;
            if (val < 10) {
                qtyInput.value = val + 1;
                updatePricing();
            }
        });

        qtyInput.addEventListener('change', updatePricing);
    }

    // Submit handler
    if (form) {
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const emailInput = document.getElementById('order-email');
            const nameInput = document.getElementById('order-name');

            if (!emailInput.value || !emailInput.value.includes('@')) {
                showToast('Please provide a valid email address', 'error');
                return;
            }

            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Processing Allocation...';

            setTimeout(() => {
                const randomId = 'ARX-' + Math.floor(100000 + Math.random() * 900000);
                if (orderRefText) orderRefText.textContent = randomId;
                form.style.display = 'none';
                if (successScreen) successScreen.style.display = 'block';
                showToast('Pre-order secured! Confirmation sent to your inbox.', 'success');
            }, 1200);
        });
    }
}
