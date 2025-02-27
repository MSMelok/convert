document.addEventListener('DOMContentLoaded', function() {
    // Theme handling
    const html = document.documentElement;
    const themeToggle = document.getElementById('themeToggle');

    // Load theme from localStorage
    const savedTheme = localStorage.getItem('theme') || 'dark';
    html.classList.toggle('dark', savedTheme === 'dark');

    themeToggle.addEventListener('click', () => {
        html.classList.toggle('dark');
        localStorage.setItem('theme', html.classList.contains('dark') ? 'dark' : 'light');
    });

    // Get all input elements
    const timeInputs = document.querySelectorAll('input[type="time"]');
    const sourceTimezone = document.getElementById('sourceTimezone');
    const otBreaksContainer = document.getElementById('otBreaksContainer');
    const otBreaksResults = document.getElementById('otBreaksResults');
    const addOtBreakBtn = document.getElementById('addOtBreak');
    const clearAllBtn = document.getElementById('clearAll');
    let otBreakCount = 0;

    // Input-output mapping for regular inputs
    const regularMappings = [
        { input: 'shiftStartTime', output: 'cairoShiftStart' },
        { input: 'shiftEndTime', output: 'cairoShiftEnd' },
        { input: 'firstBreakTime', output: 'cairoFirstBreak' },
        { input: 'secondBreakTime', output: 'cairoSecondBreak' },
        { input: 'thirdBreakTime', output: 'cairoThirdBreak' }
    ];

    // Convert source timezone time to Cairo time
    function convertToCairoTime(sourceTime, sourceTz) {
        if (!sourceTime) return '--:-- AM';

        try {
            const [hours, minutes] = sourceTime.split(':');
            const now = new Date();
            const sourceDate = new Date(
                now.getFullYear(),
                now.getMonth(),
                now.getDate(),
                parseInt(hours),
                parseInt(minutes)
            );

            const sourceTimezoneDate = new Date(sourceDate.toLocaleString('en-US', {
                timeZone: sourceTz
            }));

            const cairoDate = new Date(sourceDate.toLocaleString('en-US', {
                timeZone: 'Africa/Cairo'
            }));

            const timeDiff = cairoDate - sourceTimezoneDate;
            const finalDate = new Date(sourceDate.getTime() + timeDiff);

            return finalDate.toLocaleString('en-US', {
                hour: 'numeric',
                minute: '2-digit',
                hour12: true
            });
        } catch (error) {
            console.error('Error converting time:', error);
            return '--:-- AM';
        }
    }

    // Create OT break input group
    function createOtBreakInput(index) {
        const group = document.createElement('div');
        group.className = 'ot-break-group';
        group.dataset.index = index;

        const inputGroup = document.createElement('div');
        inputGroup.className = 'input-group';

        const label = document.createElement('label');
        label.htmlFor = `otBreak${index}`;
        label.textContent = `OT Break ${String(index).padStart(3, '0')}`;

        const input = document.createElement('input');
        input.type = 'time';
        input.id = `otBreak${index}`;
        input.name = `otBreak${index}`;

        const removeBtn = document.createElement('button');
        removeBtn.type = 'button';
        removeBtn.className = 'remove-break-btn';
        removeBtn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>';
        removeBtn.addEventListener('click', () => removeOtBreak(index));

        inputGroup.appendChild(label);
        inputGroup.appendChild(input);
        group.appendChild(inputGroup);
        group.appendChild(removeBtn);

        return { group, input };
    }

    // Create OT break result item
    function createOtBreakResult(index) {
        const resultItem = document.createElement('div');
        resultItem.className = 'result-item';
        resultItem.dataset.index = index;

        const label = document.createElement('span');
        label.className = 'label';
        label.textContent = `OT Break ${String(index).padStart(3, '0')}:`;

        const value = document.createElement('span');
        value.className = 'value';
        value.id = `cairoOtBreak${index}`;
        value.textContent = '--:-- AM';

        resultItem.appendChild(label);
        resultItem.appendChild(value);

        return resultItem;
    }

    // Add new OT break
    function addOtBreak() {
        otBreakCount++;
        const { group, input } = createOtBreakInput(otBreakCount);
        const resultItem = createOtBreakResult(otBreakCount);

        otBreaksContainer.appendChild(group);
        otBreaksResults.appendChild(resultItem);

        input.addEventListener('change', updateAllTimes);
        input.addEventListener('input', updateAllTimes);

        saveToLocalStorage();
    }

    // Remove OT break
    function removeOtBreak(index) {
        const inputGroup = otBreaksContainer.querySelector(`[data-index="${index}"]`);
        const resultItem = otBreaksResults.querySelector(`[data-index="${index}"]`);

        if (inputGroup) inputGroup.remove();
        if (resultItem) resultItem.remove();

        saveToLocalStorage();
    }

    // Update all output times
    function updateAllTimes() {
        const selectedTimezone = sourceTimezone.value;

        // Update regular mappings
        regularMappings.forEach(mapping => {
            const input = document.getElementById(mapping.input);
            const output = document.getElementById(mapping.output);
            if (input && output) {
                output.textContent = convertToCairoTime(input.value, selectedTimezone);
            }
        });

        // Update OT break times
        const otInputs = otBreaksContainer.querySelectorAll('input[type="time"]');
        otInputs.forEach(input => {
            const index = input.id.replace('otBreak', '');
            const output = document.getElementById(`cairoOtBreak${index}`);
            if (output) {
                output.textContent = convertToCairoTime(input.value, selectedTimezone);
            }
        });

        saveToLocalStorage();
    }

    // Save form data to localStorage
    function saveToLocalStorage() {
        const formData = {
            theme: html.classList.contains('dark') ? 'dark' : 'light',
            sourceTimezone: sourceTimezone.value,
            regularInputs: {},
            otBreaks: []
        };

        // Save regular inputs
        regularMappings.forEach(mapping => {
            const input = document.getElementById(mapping.input);
            if (input) {
                formData.regularInputs[mapping.input] = input.value;
            }
        });

        // Save OT breaks
        const otInputs = otBreaksContainer.querySelectorAll('input[type="time"]');
        otInputs.forEach(input => {
            formData.otBreaks.push({
                id: input.id,
                value: input.value
            });
        });

        localStorage.setItem('timeConverterData', JSON.stringify(formData));
    }

    // Load form data from localStorage
    function loadFromLocalStorage() {
        const savedData = localStorage.getItem('timeConverterData');
        if (!savedData) return;

        const formData = JSON.parse(savedData);

        // Load timezone
        if (formData.sourceTimezone) {
            sourceTimezone.value = formData.sourceTimezone;
        }

        // Load regular inputs
        for (const [inputId, value] of Object.entries(formData.regularInputs)) {
            const input = document.getElementById(inputId);
            if (input && value) {
                input.value = value;
            }
        }

        // Load OT breaks
        formData.otBreaks.forEach(breakData => {
            addOtBreak();
            const input = document.getElementById(breakData.id);
            if (input && breakData.value) {
                input.value = breakData.value;
            }
        });

        updateAllTimes();
    }

    // Clear all data
    function clearAll() {
        // Clear regular inputs
        regularMappings.forEach(mapping => {
            const input = document.getElementById(mapping.input);
            if (input) input.value = '';
        });

        // Clear OT breaks
        otBreaksContainer.innerHTML = '';
        otBreaksResults.innerHTML = '';
        otBreakCount = 0;

        // Clear localStorage
        localStorage.removeItem('timeConverterData');

        // Reset outputs
        updateAllTimes();
    }

    // Event listeners
    addOtBreakBtn.addEventListener('click', addOtBreak);
    clearAllBtn.addEventListener('click', clearAll);

    timeInputs.forEach(input => {
        input.addEventListener('change', updateAllTimes);
        input.addEventListener('input', updateAllTimes);
    });

    sourceTimezone.addEventListener('change', updateAllTimes);

    // Initial load
    loadFromLocalStorage();
});