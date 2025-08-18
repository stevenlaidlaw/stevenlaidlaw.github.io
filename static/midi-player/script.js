class MIDIPlayer {
    constructor() {
        this.midiAccess = null;
        this.selectedOutputs = new Map(); // Map of device ID to device object
        this.selectedInputs = new Map(); // Map of device ID to device object for MIDI inputs
        this.activeNotes = new Set();

        // Key and scale settings
        this.rootKey = 0; // C
        this.scaleType = 'major';
        this.baseOctave = 4;

        // Chord modifier states
        this.is7thPressed = false;
        this.is9thPressed = false;
        this.isInversion1Pressed = false;
        this.isInversion2Pressed = false;
        this.isOctaveUpPressed = false;
        this.isOctaveDownPressed = false;
        this.isHoldActive = false;
        this.heldChordNotes = new Set();

        // Scale definitions (semitone intervals from root)
        this.scales = {
            'major': [0, 2, 4, 5, 7, 9, 11],
            'minor': [0, 2, 3, 5, 7, 8, 10],
            'dorian': [0, 2, 3, 5, 7, 9, 10],
            'phrygian': [0, 1, 3, 5, 7, 8, 10],
            'lydian': [0, 2, 4, 6, 7, 9, 11],
            'mixolydian': [0, 2, 4, 5, 7, 9, 10],
            'locrian': [0, 1, 3, 5, 6, 8, 10],
            'harmonic-minor': [0, 2, 3, 5, 7, 8, 11],
            'melodic-minor': [0, 2, 3, 5, 7, 9, 11],
            'pentatonic-major': [0, 2, 4, 7, 9],
            'pentatonic-minor': [0, 3, 5, 7, 10]
        };

        this.loadSettings(); // Load saved settings before initializing MIDI
        this.initializeElements();
        this.initializeMIDI();
        this.createGridController();
        this.setupEventListeners();
    }

    loadSettings() {
        try {
            const settings = JSON.parse(localStorage.getItem('midiPlayerSettings')) || {};

            // Load key and scale settings
            this.rootKey = settings.rootKey !== undefined ? settings.rootKey : 0;
            this.scaleType = settings.scaleType || 'major';
            this.baseOctave = settings.baseOctave !== undefined ? settings.baseOctave : 4;

            // Store selected device IDs for later restoration
            this.savedSelectedDevices = settings.selectedDevices || [];
            this.savedSelectedInputDevices = settings.selectedInputDevices || [];

            // Store channel and velocity settings
            this.savedChannel = settings.channel !== undefined ? settings.channel : 0;
            this.savedVelocity = settings.velocity !== undefined ? settings.velocity : 64;
        } catch (error) {
            console.warn('Failed to load settings from localStorage:', error);
        }
    }

    saveSettings() {
        try {
            const settings = {
                rootKey: this.rootKey,
                scaleType: this.scaleType,
                baseOctave: this.baseOctave,
                selectedDevices: Array.from(this.selectedOutputs.keys()),
                selectedInputDevices: Array.from(this.selectedInputs.keys()),
                channel: parseInt(this.channelSelect.value),
                velocity: parseInt(this.velocityInput.value)
            };

            localStorage.setItem('midiPlayerSettings', JSON.stringify(settings));
        } catch (error) {
            console.warn('Failed to save settings to localStorage:', error);
        }
    }

    applyLoadedSettings() {
        // Apply settings to UI elements
        if (this.rootKeySelect) {
            this.rootKeySelect.value = this.rootKey;
        }
        if (this.scaleTypeSelect) {
            this.scaleTypeSelect.value = this.scaleType;
        }
        if (this.baseOctaveSelect) {
            this.baseOctaveSelect.value = this.baseOctave;
        }
        if (this.channelSelect && this.savedChannel !== undefined) {
            this.channelSelect.value = this.savedChannel;
        }
        if (this.velocityInput && this.savedVelocity !== undefined) {
            this.velocityInput.value = this.savedVelocity;
        }
    }

    initializeElements() {
        this.statusElement = document.getElementById('midi-status');
        this.statusDot = this.statusElement.querySelector('.status-dot');
        this.statusText = this.statusElement.querySelector('.status-text');
        this.devicesContainer = document.getElementById('midi-devices-container');
        this.inputDevicesContainer = document.getElementById('midi-input-devices-container');
        this.logContent = document.getElementById('midi-log-content');

        // Key and scale controls
        this.rootKeySelect = document.getElementById('root-key');
        this.scaleTypeSelect = document.getElementById('scale-type');
        this.baseOctaveSelect = document.getElementById('base-octave');

        // Control elements
        this.channelSelect = document.getElementById('channel');
        this.noteInput = document.getElementById('note');
        this.velocityInput = document.getElementById('velocity');
        this.programInput = document.getElementById('program');
        this.ccNumberInput = document.getElementById('cc-number');
        this.ccValueInput = document.getElementById('cc-value');

        this.mainContent = document.querySelector('.main-content');

        // Apply loaded settings to UI elements
        this.applyLoadedSettings();
    }

    async initializeMIDI() {
        try {
            if (!navigator.requestMIDIAccess) {
                throw new Error('Web MIDI API is not supported in this browser');
            }

            this.updateStatus('Requesting MIDI access...', 'connecting');
            this.midiAccess = await navigator.requestMIDIAccess({ sysex: false });

            this.updateStatus('MIDI access granted', 'connected');
            this.populateDevices();
            this.setupMIDIInputHandlers();

            // Listen for device changes
            this.midiAccess.onstatechange = () => {
                this.populateDevices();
                this.setupMIDIInputHandlers();
            };

        } catch (error) {
            this.updateStatus(`MIDI Error: ${error.message}`, 'error');
            this.logMIDI(`Error: ${error.message}`, 'error');
        }
    }

    updateStatus(text, status) {
        this.statusText.textContent = text;
        this.statusDot.className = `status-dot ${status}`;
    }

    populateDevices() {
        if (!this.devicesContainer) {
            // Fallback if container doesn't exist yet
            return;
        }

        // Store current selections before clearing, or use saved selections on first load
        let selectionsToRestore;
        if (this.selectedOutputs.size > 0) {
            selectionsToRestore = new Set(this.selectedOutputs.keys());
        } else if (this.savedSelectedDevices && this.savedSelectedDevices.length > 0) {
            selectionsToRestore = new Set(this.savedSelectedDevices);
            // Clear saved devices after first use
            this.savedSelectedDevices = null;
        } else {
            selectionsToRestore = new Set();
        }

        this.devicesContainer.innerHTML = '';

        if (!this.midiAccess) return;

        const outputs = Array.from(this.midiAccess.outputs.values());

        if (outputs.length === 0) {
            this.devicesContainer.innerHTML = '<p>No MIDI output devices found</p>';
        } else {
            // Clear selectedOutputs and rebuild with valid devices
            this.selectedOutputs.clear();

            outputs.forEach(output => {
                const deviceItem = document.createElement('div');
                deviceItem.className = 'device-item';

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = `device-${output.id}`;
                checkbox.value = output.id;

                // Restore previous selection if this device was selected
                if (selectionsToRestore.has(output.id)) {
                    checkbox.checked = true;
                    this.selectedOutputs.set(output.id, output);
                }

                const label = document.createElement('label');
                label.htmlFor = `device-${output.id}`;
                label.textContent = `${output.name} (${output.manufacturer || 'Unknown'})`;

                checkbox.addEventListener('change', (e) => {
                    if (e.target.checked) {
                        this.selectedOutputs.set(output.id, output);
                        this.logMIDI(`Added output device: ${output.name}`);
                    } else {
                        this.selectedOutputs.delete(output.id);
                        this.logMIDI(`Removed output device: ${output.name}`);
                    }
                    this.updateDeviceStatus();
                    this.saveSettings(); // Save settings when device selection changes
                });

                deviceItem.appendChild(checkbox);
                deviceItem.appendChild(label);
                this.devicesContainer.appendChild(deviceItem);
            });
        }

        // Populate MIDI input devices
        this.populateInputDevices();

        // Update status to reflect current selections
        this.updateDeviceStatus();
        this.sendAllNotesOff();
    }

    populateInputDevices() {
        if (!this.inputDevicesContainer) {
            return;
        }

        // Store current selections before clearing, or use saved selections on first load
        let inputSelectionsToRestore;
        if (this.selectedInputs.size > 0) {
            inputSelectionsToRestore = new Set(this.selectedInputs.keys());
        } else if (this.savedSelectedInputDevices && this.savedSelectedInputDevices.length > 0) {
            inputSelectionsToRestore = new Set(this.savedSelectedInputDevices);
            // Clear saved devices after first use
            this.savedSelectedInputDevices = null;
        } else {
            inputSelectionsToRestore = new Set();
        }

        this.inputDevicesContainer.innerHTML = '';

        if (!this.midiAccess) return;

        const inputs = Array.from(this.midiAccess.inputs.values());

        if (inputs.length === 0) {
            this.inputDevicesContainer.innerHTML = '<p>No MIDI input devices found</p>';
        } else {
            // Clear selectedInputs and rebuild with valid devices
            this.selectedInputs.clear();

            inputs.forEach(input => {
                const deviceItem = document.createElement('div');
                deviceItem.className = 'device-item input-device';

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                checkbox.id = `input-device-${input.id}`;
                checkbox.value = input.id;

                // Restore previous selection if this device was selected
                if (inputSelectionsToRestore.has(input.id)) {
                    checkbox.checked = true;
                    this.selectedInputs.set(input.id, input);
                }

                const label = document.createElement('label');
                label.htmlFor = `input-device-${input.id}`;
                label.textContent = `${input.name} (${input.manufacturer || 'Unknown'})`;

                checkbox.addEventListener('change', (e) => {
                    if (e.target.checked) {
                        this.selectedInputs.set(input.id, input);
                        this.logMIDI(`Added input device: ${input.name}`);
                    } else {
                        this.selectedInputs.delete(input.id);
                        this.logMIDI(`Removed input device: ${input.name}`);
                    }
                    this.updateDeviceStatus();
                    this.setupMIDIInputHandlers(); // Re-setup handlers when selection changes
                    this.saveSettings(); // Save settings when device selection changes
                });

                deviceItem.appendChild(checkbox);
                deviceItem.appendChild(label);
                this.inputDevicesContainer.appendChild(deviceItem);
            });

            this.logMIDI(`Found ${inputs.length} MIDI input device${inputs.length > 1 ? 's' : ''}`);
        }
    }

    setupMIDIInputHandlers() {
        if (!this.midiAccess) return;

        // Clear existing handlers from all devices first
        this.midiAccess.inputs.forEach((input) => {
            input.onmidimessage = null;
        });

        // Set up input handlers only for selected input devices
        this.selectedInputs.forEach((input, deviceId) => {
            input.onmidimessage = (event) => {
                this.handleMIDIInput(event, input);
            };
        });

        this.logMIDI(`MIDI input handlers set up for ${this.selectedInputs.size} device${this.selectedInputs.size !== 1 ? 's' : ''}`);
    }

    handleMIDIInput(event, inputDevice) {
        const [command, note, velocity] = event.data;
        const channel = command & 0x0F;
        const messageType = command & 0xF0;

        // Log the incoming MIDI message
        this.logMIDI(`MIDI In (${inputDevice.name}): ${this.getMIDIMessageDescription(command, note, velocity)}`, 'midi-in');

        // Handle Note On and Note Off messages
        if (messageType === 0x90 && velocity > 0) {
            // Note On
            this.handleMIDIInputNote(note, true, velocity);
        } else if (messageType === 0x80 || (messageType === 0x90 && velocity === 0)) {
            // Note Off
            this.handleMIDIInputNote(note, false, 0);
        }
    }

    handleMIDIInputNote(midiNote, isNoteOn, velocity = null) {
        // Map MIDI note to grid coordinates based on the specified mapping
        const gridCoords = this.midiNoteToGridCoords(midiNote);

        if (gridCoords) {
            const { row, col } = gridCoords;

            // Find the corresponding grid button
            const button = document.querySelector(`[data-row="${row}"][data-col="${col}"]`);

            if (button) {
                if (isNoteOn) {
                    // Simulate button press with MIDI velocity
                    this.triggerGridButton(button, true, velocity);
                    this.logMIDI(`Grid button triggered: Row ${row}, Col ${col} (MIDI note ${midiNote}, velocity ${velocity})`, 'info');
                } else {
                    // Simulate button release
                    this.triggerGridButton(button, false, velocity);
                }
            }
        }
    }

    midiNoteToGridCoords(midiNote) {
        // Map MIDI notes to 8x8 grid according to the specification:
        // Row 0: 84-91, Row 1: 72-79, ..., Row 7: 0-7
        // Each row has 8 columns (0-7)

        // Define the starting note for each row
        const rowStartNotes = [84, 72, 60, 48, 36, 24, 12, 0];

        for (let row = 0; row < 8; row++) {
            const startNote = rowStartNotes[row];
            const endNote = startNote + 7;

            if (midiNote >= startNote && midiNote <= endNote) {
                const col = midiNote - startNote;
                return { row, col };
            }
        }

        // Note not in the valid range for the grid
        return null;
    }

    triggerGridButton(button, isPressed, velocity = null) {
        const buttonType = button.dataset.type;

        if (buttonType === 'scale') {
            const note = parseInt(button.dataset.note);
            this.playGridNote(note, isPressed, velocity);
        } else if (buttonType === 'chord') {
            const rootNote = parseInt(button.dataset.chordRoot);
            const chordIndex = parseInt(button.dataset.chordIndex);
            this.playChord(rootNote, isPressed, chordIndex, velocity);
        } else if (buttonType === 'modifier') {
            const modifier = button.dataset.modifier;

            if (modifier === 'hold') {
                // Hold button is toggle-only, so only trigger on press
                if (isPressed) {
                    this.activateModifier(modifier, true);
                }
            } else {
                // For other modifiers, hold while MIDI note is held
                this.activateModifier(modifier, isPressed);
            }
        }
    }

    getMIDIMessageDescription(command, note, velocity) {
        const messageType = command & 0xF0;
        const channel = (command & 0x0F) + 1;

        switch (messageType) {
            case 0x90:
                return velocity > 0 ? `Note On: Ch${channel}, Note ${note}, Vel ${velocity}` : `Note Off: Ch${channel}, Note ${note}`;
            case 0x80:
                return `Note Off: Ch${channel}, Note ${note}`;
            case 0xB0:
                return `CC: Ch${channel}, CC${note}, Val ${velocity}`;
            default:
                return `Unknown: ${command.toString(16).toUpperCase()} ${note} ${velocity}`;
        }
    }

    updateDeviceStatus() {
        const outputCount = this.selectedOutputs.size;
        const inputCount = this.selectedInputs.size;
        const totalInputsAvailable = this.midiAccess ? this.midiAccess.inputs.size : 0;

        if (outputCount === 0 && inputCount === 0) {
            if (totalInputsAvailable > 0) {
                this.updateStatus(`${totalInputsAvailable} input${totalInputsAvailable > 1 ? 's' : ''} available (none selected)`, 'error');
            } else {
                this.updateStatus('No MIDI devices available', 'error');
            }
        } else if (outputCount === 0) {
            this.updateStatus(`${inputCount} input${inputCount > 1 ? 's' : ''} selected (no output selected)`, 'error');
        } else if (inputCount === 0) {
            const outputName = outputCount === 1 ? Array.from(this.selectedOutputs.values())[0].name : `${outputCount} output${outputCount > 1 ? 's' : ''}`;
            if (totalInputsAvailable > 0) {
                this.updateStatus(`Output: ${outputName} (${totalInputsAvailable} input${totalInputsAvailable > 1 ? 's' : ''} available)`, 'connected');
            } else {
                this.updateStatus(`Output: ${outputName} (no input devices)`, 'connected');
            }
        } else {
            const outputName = outputCount === 1 ? Array.from(this.selectedOutputs.values())[0].name : `${outputCount} output${outputCount > 1 ? 's' : ''}`;
            this.updateStatus(`${outputName} | ${inputCount} input${inputCount > 1 ? 's' : ''} selected`, 'connected');
        }
    } createGridController() {
        const gridContainer = document.getElementById('grid-controller');
        gridContainer.innerHTML = ''; // Clear existing buttons

        // Create 8x8 grid (64 buttons)
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const button = document.createElement('button');
                button.className = `grid-button`;

                if (row < 6) {
                    if (col === 0 || col === 7) {
                        button.className += ' root';
                    } else {
                        button.className += ' note';
                    }
                }

                if (row >= 6) {
                    if (col < 4) {
                        button.className += ' chord';
                        if ((row === 6 && col === 3) || (row === 7 && col === 0)) {
                            button.className += ' chord-root';
                        }
                    } else if (col === 4) {
                        button.className += ' modifier';
                    } else if (col === 5) {
                        button.className += ' inversion';
                    } else if (col === 6) {
                        button.className += ' octave';
                    } else if (col === 7) {
                        button.className += ' hold';
                    }
                }

                button.dataset.row = row;
                button.dataset.col = col;

                if (row < 6) {
                    // Top 6 rows: Scale notes
                    this.setupScaleButton(button, row, col);
                } else {
                    // Bottom 2 rows: Chord and modifier functions
                    this.setupFunctionButton(button, row, col);
                }

                gridContainer.appendChild(button);
            }
        }
    }

    setupScaleButton(button, row, col) {
        const scalePattern = this.scales[this.scaleType];
        const rootKey = parseInt(this.rootKey);
        const noteIndex = col % scalePattern.length;

        // Row 0 is highest octave, row 5 is lowest
        const octaveOffset = 5 - row;
        let octave = parseInt(this.baseOctave) + octaveOffset;
        if (col === 7) octave++;

        // Calculate MIDI note directly: base MIDI note + scale interval
        const baseMidiNote = rootKey + (octave * 12);
        const scaleInterval = scalePattern[noteIndex];
        const note = baseMidiNote + scaleInterval;

        button.dataset.note = note;
        button.dataset.type = 'scale';
        button.title = `${this.getNoteNameFromNumber(note)} (${note})`;
        button.innerHTML = this.getNoteNameFromNumber(note);

        // Add event listeners for scale buttons
        button.addEventListener('mousedown', (e) => {
            e.preventDefault();
            this.playGridNote(note, true);
        });

        button.addEventListener('mouseup', (e) => {
            e.preventDefault();
            this.playGridNote(note, false);
        });

        button.addEventListener('mouseleave', (e) => {
            this.playGridNote(note, false);
        });

        button.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }

    setupFunctionButton(button, row, col) {
        const isRow6 = row === 6;
        const isRow7 = row === 7;

        if (col < 4) {
            // Chord buttons (first 4 columns of rows 6 and 7)
            const chordIndex = isRow6 ? col + 4 : col;
            const scaleNotes = this.getScaleNotes();
            const rootNote = scaleNotes[chordIndex % scaleNotes.length];

            button.dataset.type = 'chord';
            button.dataset.chordRoot = rootNote;
            button.dataset.chordIndex = chordIndex;
            button.title = this.getChordName(rootNote);
            button.innerHTML = this.getChordName(rootNote);

            // Add chord-specific styling
            button.classList.add('chord-button');

            button.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.playChord(rootNote, true, chordIndex);
            });

            button.addEventListener('mouseup', (e) => {
                e.preventDefault();
                this.playChord(rootNote, false, chordIndex);
            });

            button.addEventListener('mouseleave', (e) => {
                this.playChord(rootNote, false, chordIndex);
            });

        } else {
            // Modifier buttons (last 4 columns)
            const modifierIndex = col - 4;
            const modifierType = this.getModifierType(row, modifierIndex);

            button.dataset.type = 'modifier';
            button.dataset.modifier = modifierType;
            button.title = this.getModifierTitle(modifierType);
            button.innerHTML = this.getModifierTitle(modifierType);

            // Add modifier-specific styling
            button.classList.add('modifier-button', `modifier-${modifierType}`);

            button.addEventListener('mousedown', (e) => {
                e.preventDefault();
                this.activateModifier(modifierType, true);
            });

            button.addEventListener('mouseup', (e) => {
                e.preventDefault();
                this.activateModifier(modifierType, false);
            });

            button.addEventListener('mouseleave', (e) => {
                this.activateModifier(modifierType, false);
            });
        }

        button.addEventListener('contextmenu', (e) => {
            e.preventDefault();
        });
    }

    getScaleNotes() {
        const scalePattern = this.scales[this.scaleType];
        const rootKey = parseInt(this.rootKey);

        return scalePattern.map(interval => (rootKey + interval) % 12);
    }

    getModifierType(row, index) {
        if (row === 6) {
            return ['7th', 'inv1', 'octUp', 'noteOff'][index];
        } else {
            return ['9th', 'inv2', 'octDown', 'hold'][index];
        }
    }

    getModifierTitle(type) {
        const titles = {
            '7th': 'Add 7th',
            '9th': 'Add 9th',
            'inv1': '1st Inversion',
            'inv2': '2nd Inversion',
            'octUp': 'Octave Up',
            'octDown': 'Octave Down',
            'hold': 'Hold Chord',
            'noteOff': 'Note Off'
        };
        return titles[type] || type;
    }

    getChordName(rootNote) {
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const rootName = noteNames[rootNote % 12];

        // Determine chord quality by analyzing the scale intervals
        const scalePattern = this.scales[this.scaleType];
        const rootKey = parseInt(this.rootKey);

        // Find the root note position in the scale
        const rootIndex = scalePattern.findIndex(note => (note + rootKey) % 12 === rootNote % 12);
        if (rootIndex === -1) return rootName; // Fallback if note not in scale

        // Get the third and fifth intervals from the root
        const thirdInterval = scalePattern[(rootIndex + 2) % scalePattern.length];
        const fifthInterval = scalePattern[(rootIndex + 4) % scalePattern.length];

        // Calculate the actual semitone distances
        const rootSemitone = (scalePattern[rootIndex] + rootKey) % 12;
        const thirdSemitone = (thirdInterval + rootKey) % 12;
        const fifthSemitone = (fifthInterval + rootKey) % 12;

        // Calculate intervals (handling wrap-around)
        let thirdDistance = (thirdSemitone - rootSemitone + 12) % 12;
        let fifthDistance = (fifthSemitone - rootSemitone + 12) % 12;

        // Determine chord quality based on intervals
        let chordQuality = '';
        if (thirdDistance === 4 && fifthDistance === 7) {
            chordQuality = ' maj'; // Major third (4 semitones) + Perfect fifth (7 semitones)
        } else if (thirdDistance === 3 && fifthDistance === 7) {
            chordQuality = ' min'; // Minor third (3 semitones) + Perfect fifth (7 semitones)
        } else if (thirdDistance === 3 && fifthDistance === 6) {
            chordQuality = ' dim'; // Minor third (3 semitones) + Diminished fifth (6 semitones)
        } else if (thirdDistance === 4 && fifthDistance === 8) {
            chordQuality = ' aug'; // Major third (4 semitones) + Augmented fifth (8 semitones)
        } else {
            chordQuality = ''; // Unknown or irregular chord
        }

        return chordQuality ? `${rootName}${chordQuality}` : rootName;
    }

    activateModifier(type, active) {
        const button = document.querySelector(`[data-modifier="${type}"]`);
        if (button) {
            if (type === 'hold') {
                // Hold button is a toggle - only change state on press (active = true)
                if (active) {
                    this.isHoldActive = !this.isHoldActive;
                    if (this.isHoldActive) {
                        button.classList.add('active');
                        this.logMIDI('Hold mode activated', 'info');
                    } else {
                        button.classList.remove('active');
                        this.logMIDI('Hold mode deactivated', 'info');
                        // Release all held chord notes when deactivating hold
                        this.releaseHeldChordNotes();
                    }
                }
                return; // Don't process hold button like other modifiers
            }

            if (active) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        }

        // Update modifier states
        switch (type) {
            case '7th':
                this.is7thPressed = active;
                break;
            case '9th':
                this.is9thPressed = active;
                break;
            case 'inv1':
                this.isInversion1Pressed = active;
                break;
            case 'inv2':
                this.isInversion2Pressed = active;
                break;
            case 'octUp':
                this.isOctaveUpPressed = active;
                break;
            case 'octDown':
                this.isOctaveDownPressed = active;
                break;
            case 'noteOff':
                this.sendAllNotesOff();
        }
    }

    playChord(rootNote, isOn, chordIndex = null, velocity = null) {
        const baseOctave = parseInt(this.baseOctave);
        // Check if this is the special case: row 6, column 3 (chord index 7)
        const octaveOffset = (chordIndex === 7) ? 1 : 0;
        let chordNotes = this.buildChord(rootNote, baseOctave + octaveOffset);

        if (isOn) {
            // If hold is active and we're pressing a new chord, release the previously held chord
            if (this.isHoldActive && this.heldChordNotes.size > 0) {
                this.releaseHeldChordNotes();
            }

            // Use MIDI input velocity if provided, otherwise fall back to UI velocity setting
            const chordVelocity = velocity !== null ? velocity : parseInt(this.velocityInput.value);

            chordNotes.forEach(note => {
                if (!this.activeNotes.has(note)) {
                    this.activeNotes.add(note);
                    this.sendNoteOn(note, chordVelocity);
                }
            });

            // If hold is active, store these notes as held
            if (this.isHoldActive) {
                chordNotes.forEach(note => this.heldChordNotes.add(note));
            }

            // Highlight chord button - use chord index to target the specific button
            const chordButton = document.querySelector(`[data-chord-root="${rootNote}"][data-chord-index="${chordIndex}"]`);
            if (chordButton) {
                chordButton.classList.add('active');
            }

        } else {
            // Only release notes if hold is not active, or if they're not held notes
            if (!this.isHoldActive) {
                chordNotes.forEach(note => {
                    if (this.activeNotes.has(note)) {
                        this.activeNotes.delete(note);
                        this.sendNoteOff(note);
                    }
                });

                // Remove highlight from chord button - use chord index to target the specific button
                const chordButton = document.querySelector(`[data-chord-root="${rootNote}"][data-chord-index="${chordIndex}"]`);
                if (chordButton) {
                    chordButton.classList.remove('active');
                }
            }
        }
    }

    releaseHeldChordNotes() {
        this.heldChordNotes.forEach(note => {
            if (this.activeNotes.has(note)) {
                this.activeNotes.delete(note);
                this.sendNoteOff(note);
            }
        });
        this.heldChordNotes.clear();

        // Remove active class from all chord buttons
        document.querySelectorAll('.chord-button.active').forEach(button => {
            button.classList.remove('active');
        });
    }

    buildChord(rootNote, octave) {
        const scalePattern = this.scales[this.scaleType];
        const rootKey = parseInt(this.rootKey);

        // Find the root note position in the scale
        const rootIndex = scalePattern.findIndex(note => (note + rootKey) % 12 === rootNote % 12);
        if (rootIndex === -1) return [rootNote + (octave * 12)];

        // Calculate base MIDI note for the root
        const baseMidiNote = rootKey + (octave * 12);

        // Build basic triad using direct MIDI note calculation
        let chordNotes = [
            baseMidiNote + scalePattern[rootIndex], // root
            baseMidiNote + scalePattern[(rootIndex + 2) % scalePattern.length], // third  
            baseMidiNote + scalePattern[(rootIndex + 4) % scalePattern.length]  // fifth
        ];

        // Handle scale wrapping for third and fifth
        if (chordNotes[1] < chordNotes[0]) chordNotes[1] += 12;
        if (chordNotes[2] < chordNotes[1]) chordNotes[2] += 12;

        // Add 7th if pressed
        if (this.is7thPressed) {
            let seventh = baseMidiNote + scalePattern[(rootIndex + 6) % scalePattern.length];
            if (seventh < chordNotes[chordNotes.length - 1]) seventh += 12;
            chordNotes.push(seventh);
        }

        // Add 9th if pressed  
        if (this.is9thPressed) {
            let ninth = baseMidiNote + scalePattern[(rootIndex + 1) % scalePattern.length];
            if (ninth < chordNotes[chordNotes.length - 1]) ninth += 12;
            chordNotes.push(ninth);
        }

        // Apply inversions
        if (this.isInversion1Pressed) {
            chordNotes[0] += 12; // Move root up an octave
        } else if (this.isInversion2Pressed) {
            chordNotes[0] += 12; // Move root up an octave
            chordNotes[1] += 12; // Move third up an octave
        }

        // Apply octave shifts
        if (this.isOctaveUpPressed) {
            chordNotes = chordNotes.map(note => note + 12);
        } else if (this.isOctaveDownPressed) {
            chordNotes = chordNotes.map(note => note - 12);
        }

        // Ensure all notes are in valid MIDI range
        chordNotes = chordNotes.filter(note => note >= 0 && note <= 127);

        return chordNotes;
    }

    getNoteNameFromNumber(noteNumber) {
        const noteNames = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
        const noteIndex = noteNumber % 12;
        const note = noteNames[noteIndex];

        // Calculate octave so that C is always the start of an octave
        // MIDI note 60 = C4, so we adjust the calculation
        let octave = Math.floor(noteNumber / 12) - 1;

        // In MIDI standard, C4 = 60, but we want C to start each octave
        // So we need to adjust: C4=60, but we want all notes C through B to be in the same octave
        // The MIDI standard already does this correctly, so no adjustment needed

        return `${note}${octave}`;
    }

    playGridNote(note, isOn, velocity = null) {
        if (isOn) {
            if (this.activeNotes.has(note)) return; // Prevent duplicate note-ons
            this.activeNotes.add(note);
            // Use MIDI input velocity if provided, otherwise fall back to UI velocity setting
            const noteVelocity = velocity !== null ? velocity : parseInt(this.velocityInput.value);
            this.sendNoteOn(note, noteVelocity);
            this.highlightGridButton(note, true);
        } else {
            if (!this.activeNotes.has(note)) return; // Note wasn't on
            this.activeNotes.delete(note);
            this.sendNoteOff(note);
            this.highlightGridButton(note, false);
        }
    }

    highlightGridButton(note, active) {
        const buttonElement = document.querySelector(`[data-note="${note}"]`);
        if (buttonElement) {
            if (active) {
                buttonElement.classList.add('active');
            } else {
                buttonElement.classList.remove('active');
            }
        }
    }

    setupEventListeners() {
        // Key and scale controls
        this.rootKeySelect.addEventListener('change', (e) => {
            this.rootKey = parseInt(e.target.value);
            this.createGridController();
            this.logMIDI(`Root key changed to: ${e.target.options[e.target.selectedIndex].text}`);
            this.saveSettings();
        });

        this.scaleTypeSelect.addEventListener('change', (e) => {
            this.scaleType = e.target.value;
            this.createGridController();
            this.logMIDI(`Scale changed to: ${e.target.options[e.target.selectedIndex].text}`);
            this.saveSettings();
        });

        this.baseOctaveSelect.addEventListener('change', (e) => {
            this.baseOctave = parseInt(e.target.value);
            this.createGridController();
            this.logMIDI(`Base octave changed to: ${e.target.value}`);
            this.saveSettings();
        });

        // Device selection is now handled in populateDevices method

        // Channel and velocity controls
        this.channelSelect.addEventListener('change', () => {
            this.saveSettings();
        });

        this.velocityInput.addEventListener('input', () => {
            this.saveSettings();
        });

        document.getElementById('all-notes-off').addEventListener('click', () => {
            this.sendAllNotesOff();
        });

        document.getElementById('clear-log').addEventListener('click', () => {
            this.logContent.innerHTML = '';
        });

        // Keyboard events for grid controller - simplified to just trigger scale notes
        document.addEventListener('keydown', (e) => {
            if (e.repeat) return;

            // Map keys to first row of scale buttons
            const keyMap = {
                'KeyQ': 0, 'KeyW': 1, 'KeyE': 2, 'KeyR': 3,
                'KeyT': 4, 'KeyY': 5, 'KeyU': 6, 'KeyI': 7
            };

            if (keyMap[e.code] !== undefined) {
                const col = keyMap[e.code];
                const scaleNotes = this.getScaleNotes();
                const noteIndex = col % scaleNotes.length;
                const octave = parseInt(this.baseOctave) + 5; // Top row
                const note = scaleNotes[noteIndex] + (octave * 12);
                this.playGridNote(note, true);
            }
        });

        document.addEventListener('keyup', (e) => {
            const keyMap = {
                'KeyQ': 0, 'KeyW': 1, 'KeyE': 2, 'KeyR': 3,
                'KeyT': 4, 'KeyY': 5, 'KeyU': 6, 'KeyI': 7
            };

            if (keyMap[e.code] !== undefined) {
                const col = keyMap[e.code];
                const scaleNotes = this.getScaleNotes();
                const noteIndex = col % scaleNotes.length;
                const octave = parseInt(this.baseOctave) + 5; // Top row
                const note = scaleNotes[noteIndex] + (octave * 12);
                this.playGridNote(note, false);
            }
        });
    }

    sendNoteOn(note, velocity = 64) {
        if (this.selectedOutputs.size === 0) {
            this.logMIDI('No MIDI devices selected', 'error');
            return;
        }

        const channel = parseInt(this.channelSelect.value);
        const message = [0x90 + channel, note, velocity];

        this.selectedOutputs.forEach((output, deviceId) => {
            try {
                output.send(message);
            } catch (error) {
                this.logMIDI(`Error sending Note On to ${output.name}: ${error.message}`, 'error');
            }
        });

        this.logMIDI(`Note On: Ch${channel + 1}, Note ${note}, Vel ${velocity} (${this.selectedOutputs.size} device${this.selectedOutputs.size > 1 ? 's' : ''})`, 'note-on');
    }

    sendNoteOff(note, velocity = 0) {
        if (this.selectedOutputs.size === 0) {
            this.logMIDI('No MIDI devices selected', 'error');
            return;
        }

        const channel = parseInt(this.channelSelect.value);
        const message = [0x80 + channel, note, velocity];

        this.selectedOutputs.forEach((output, deviceId) => {
            try {
                output.send(message);
            } catch (error) {
                this.logMIDI(`Error sending Note Off to ${output.name}: ${error.message}`, 'error');
            }
        });

        this.logMIDI(`Note Off: Ch${channel + 1}, Note ${note} (${this.selectedOutputs.size} device${this.selectedOutputs.size > 1 ? 's' : ''})`, 'note-off');
    }

    sendAllNotesOff() {
        if (this.selectedOutputs.size === 0) {
            this.logMIDI('No MIDI devices selected', 'error');
            return;
        }

        const channel = parseInt(this.channelSelect.value);
        const message = [0xB0 + channel, 123, 0];

        this.selectedOutputs.forEach((output, deviceId) => {
            try {
                output.send(message);
            } catch (error) {
                this.logMIDI(`Error sending All Notes Off to ${output.name}: ${error.message}`, 'error');
            }
        });

        this.logMIDI(`All Notes Off: Ch${channel + 1} (${this.selectedOutputs.size} device${this.selectedOutputs.size > 1 ? 's' : ''})`, 'cc');

        // Clear active notes and visual indicators
        this.activeNotes.clear();
        this.heldChordNotes.clear();
        document.querySelectorAll('.grid-button.active').forEach(button => {
            button.classList.remove('active');
        });
    }

    logMIDI(message, type = 'info') {
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        logEntry.className = `log-entry ${type}`;
        logEntry.textContent = `[${timestamp}] ${message}`;

        this.logContent.appendChild(logEntry);
        this.logContent.scrollTop = this.logContent.scrollHeight;
    }
}

// Initialize the MIDI player when the page loads
document.addEventListener('DOMContentLoaded', () => {
    new MIDIPlayer();
});

// Prevent context menu on grid buttons
document.addEventListener('contextmenu', (e) => {
    if (e.target.classList.contains('grid-button')) {
        e.preventDefault();
    }
});
