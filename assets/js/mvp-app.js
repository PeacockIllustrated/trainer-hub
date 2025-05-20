// assets/js/mvp-app.js

// --- Local Storage Database Helper ---
const DB_PREFIX = 'fitflow_mvp_';
const db = {
    read: (key) => { const data = localStorage.getItem(DB_PREFIX + key); return data ? JSON.parse(data) : []; },
    write: (key, data) => { localStorage.setItem(DB_PREFIX + key, JSON.stringify(data)); },
    generateId: () => '_' + Math.random().toString(36).substr(2, 9)
};

// --- State & Initial Data ---
let clients = db.read('clients');
let exercises = db.read('exercises');
let workoutTemplates = db.read('workoutTemplates');
let assignedWorkouts = db.read('assignedWorkouts');

// --- UI Elements (Grouped for clarity) ---
const bodyElement = document.body;
const viewSections = document.querySelectorAll('.view-section');
const navLinks = document.querySelectorAll('.pt-sidebar__nav-link');

// Theme Switcher
const mvpThemeSwitcher = document.getElementById('mvpThemeSwitcher');
const themesForMvp = [ /* ... same themes array as before ... */
    { value: 'theme-modern-professional', name: 'Modern & Professional' }, { value: 'theme-friendly-supportive', name: 'Friendly & Supportive' },
    { value: 'theme-energetic-motivating', name: 'Energetic & Motivating' }, { value: 'theme-natural-grounded', name: 'Natural & Grounded' },
    { value: 'theme-urban-grit', name: 'Urban Grit & Steel' }, { value: 'theme-playful-pop', name: 'Playful & Vibrant Pop' },
    { value: 'theme-tech-data', name: 'Tech & Data Driven' }, { value: 'theme-feminine-elegance', name: 'Feminine Elegance' },
    { value: 'theme-luxe-minimalist', name: 'Luxe Minimalist' }, { value: 'theme-retro-funk', name: 'Retro Funk' }
];

// Modals
const addEditClientModal = document.getElementById('addEditClientModal');
const confirmModal = document.getElementById('confirmModal');
const createEditTemplateModal = document.getElementById('createEditTemplateModal');

// Client Management
const clientListContainer = document.getElementById('clientListContainer');
const noClientsMessage = document.getElementById('noClientsMessage');
const clientModalTitle = document.getElementById('clientModalTitle');
const clientForm = document.getElementById('clientForm');
const openAddClientModalBtn = document.getElementById('openAddClientModalBtn');
// Client form inputs (clientIdInput, clientNameInput, etc.) will be obtained inside functions

// Exercise Management
const exerciseForm = document.getElementById('exerciseForm');
const exerciseIdInput = document.getElementById('exerciseId');
const exerciseNameInput = document.getElementById('exerciseName');
const exerciseDescriptionInput = document.getElementById('exerciseDescription');
const exerciseMuscleGroupInput = document.getElementById('exerciseMuscleGroup');
const exerciseListContainer = document.getElementById('exerciseListContainer');
const noExercisesMessage = document.getElementById('noExercisesMessage');
const cancelEditExerciseBtn = document.getElementById('cancelEditExerciseBtn');

// Workout Template Management
const openCreateTemplateModalBtn = document.getElementById('openCreateTemplateModalBtn');
const templateModalTitle = document.getElementById('templateModalTitle');
const workoutTemplateForm = document.getElementById('workoutTemplateForm');
const workoutTemplateIdInput = document.getElementById('workoutTemplateId');
const templateNameInput = document.getElementById('templateName');
const templateExerciseListDiv = document.getElementById('templateExerciseList'); // Checklist of available exercises
const selectedExercisesForTemplateContainer = document.getElementById('selectedExercisesForTemplateContainer'); // Exercises added to current template
const workoutTemplateListContainer = document.getElementById('workoutTemplateListContainer');
const noWorkoutTemplatesMessage = document.getElementById('noWorkoutTemplatesMessage');

// Assign Workout Management
const assignWorkoutForm = document.getElementById('assignWorkoutForm');
const assignClientSelect = document.getElementById('assignClientSelect');
const assignTemplateSelect = document.getElementById('assignTemplateSelect');
const assignDateInput = document.getElementById('assignDate');
const assignedWorkoutsLogContainer = document.getElementById('assignedWorkoutsLogContainer');

// Dashboard Stats
const totalClientsStat = document.getElementById('totalClientsStat');
const totalWorkoutTemplatesStat = document.getElementById('totalWorkoutTemplatesStat');


// --- THEME SWITCHER LOGIC ---
function applyMvpTheme(themeValue) { /* ... same as before ... */ }
if (mvpThemeSwitcher) { /* ... same as before ... */ }
// ... (Full theme switcher logic from previous response) ...
if (mvpThemeSwitcher) {
    themesForMvp.forEach(theme => {
        const option = document.createElement('option');
        option.value = theme.value;
        option.textContent = theme.name;
        mvpThemeSwitcher.appendChild(option);
    });
    if (themesForMvp.length > 0) { 
        applyMvpTheme(themesForMvp[0].value);
        mvpThemeSwitcher.value = themesForMvp[0].value;
    }
    mvpThemeSwitcher.addEventListener('change', (event) => {
        applyMvpTheme(event.target.value);
    });
} else if (themesForMvp.length > 0) { 
    applyMvpTheme(themesForMvp[0].value);
}


// --- VIEW SWITCHING & MODAL HANDLING ---
function switchView(viewId) { /* ... same ... */ }
navLinks.forEach(link => { /* ... same ... */ });
function openModal(modalElement) { if (modalElement) modalElement.classList.add('is-active'); }
function closeModal(modalElement) { if (modalElement) modalElement.classList.remove('is-active'); }
[addEditClientModal, confirmModal, createEditTemplateModal].forEach(modal => { /* ... same ... */ });


// --- CLIENT MANAGEMENT ---
function renderClients() { /* ... same as previous full version ... */ }
function handleClientFormSubmit(e) { /* ... same as previous full version ... */ }
function openClientModalForEdit(clientId) { /* ... same as previous full version ... */ }
function handleDeleteClient(clientId) { /* ... same as previous full version ... */ }
if (openAddClientModalBtn) { /* ... same ... */ }
if (clientForm) { /* ... same ... */ }
if (clientListContainer) { /* ... same ... */ }


// --- EXERCISE MANAGEMENT ---
function renderExercises() { /* ... same as previous full version, ensure it calls populateAssignWorkoutSelects if that relies on up-to-date exercise list */ 
    if (!exerciseListContainer || !templateExerciseListDiv) return;
    exerciseListContainer.innerHTML = '';
    templateExerciseListDiv.innerHTML = ''; 

    if (exercises.length === 0) {
        if(noExercisesMessage) noExercisesMessage.style.display = 'block';
        templateExerciseListDiv.innerHTML = '<p class="text-muted">No exercises in library. Add some above.</p>';
    } else {
        if(noExercisesMessage) noExercisesMessage.style.display = 'none';
        exercises.forEach(ex => {
            const exItem = document.createElement('div');
            exItem.className = 'pt-client-list-item'; 
            exItem.innerHTML = `
                <div class="pt-client-list-item__info">
                    <h5 class="pt-client-list-item__name" style="font-size:1em;">${ex.name}</h5>
                    ${ex.muscleGroup ? `<p class="pt-client-list-item__meta text-small">Group: ${ex.muscleGroup}</p>` : ''}
                    ${ex.description ? `<p class="pt-client-list-item__meta text-small">${ex.description.substring(0,50)}...</p>` : ''}
                </div>
                <div class="pt-client-list-item__actions">
                    <button class="pt-button pt-button--secondary pt-button--small edit-exercise-btn" data-id="${ex.id}">Edit</button>
                    <button class="pt-button pt-button--destructive pt-button--small delete-exercise-btn" data-id="${ex.id}">Del</button>
                </div>
            `;
            exerciseListContainer.appendChild(exItem);

            const checkItem = document.createElement('div');
            checkItem.className = 'pt-input-group'; 
            checkItem.innerHTML = `<label><input type="checkbox" class="template-exercise-checkbox" data-exercise-id="${ex.id}" data-exercise-name="${ex.name}"> ${ex.name}</label>`;
            templateExerciseListDiv.appendChild(checkItem);
        });
    }
    // No need to call populateAssignWorkoutSelects here directly, it's called by initializeApp and renderWorkoutTemplates
}
if (exerciseForm) { /* ... same submit handler ... */ }
if (exerciseListContainer) { /* ... same edit/delete handlers ... */ }
if(cancelEditExerciseBtn) { /* ... same cancel edit handler ... */ }


// --- WORKOUT TEMPLATE MANAGEMENT ---
let currentTemplateExercises = []; // To hold exercises being added to a template

function renderWorkoutTemplates() {
    if (!workoutTemplateListContainer) return;
    workoutTemplateListContainer.innerHTML = '';
    if (workoutTemplates.length === 0) {
        if(noWorkoutTemplatesMessage) noWorkoutTemplatesMessage.style.display = 'block';
    } else {
        if(noWorkoutTemplatesMessage) noWorkoutTemplatesMessage.style.display = 'none';
        workoutTemplates.forEach(template => {
            const item = document.createElement('div');
            item.className = 'pt-client-list-item'; // Reuse style
            item.innerHTML = `
                <div class="pt-client-list-item__info">
                    <h5 class="pt-client-list-item__name">${template.name}</h5>
                    <p class="pt-client-list-item__meta text-small">${template.exercises.length} exercises</p>
                </div>
                <div class="pt-client-list-item__actions">
                    <button class="pt-button pt-button--secondary pt-button--small edit-template-btn" data-id="${template.id}">Edit</button>
                    <button class="pt-button pt-button--destructive pt-button--small delete-template-btn" data-id="${template.id}">Del</button>
                </div>
            `;
            workoutTemplateListContainer.appendChild(item);
        });
    }
    updateDashboardStats();
    populateAssignWorkoutSelects(); // Update assignment dropdown
}

function renderSelectedExercisesForTemplate() {
    if (!selectedExercisesForTemplateContainer) return;
    selectedExercisesForTemplateContainer.innerHTML = '';
    if (currentTemplateExercises.length === 0) {
        selectedExercisesForTemplateContainer.innerHTML = '<p class="text-muted">No exercises added to template yet.</p>';
        return;
    }
    currentTemplateExercises.forEach((exData, index) => {
        const exercise = exercises.find(e => e.id === exData.exerciseId);
        if (!exercise) return;

        const itemDiv = document.createElement('div');
        itemDiv.className = 'pt-card pt-card-content'; // Simple card style for each exercise in template
        itemDiv.style.marginBottom = 'var(--spacing-sm)';
        itemDiv.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--spacing-xs);">
                <strong>${exercise.name}</strong>
                <button type="button" class="pt-button pt-button--destructive pt-button--small remove-exercise-from-template-btn" data-index="${index}">×</button>
            </div>
            <div class="component-grid" style="grid-template-columns: repeat(3, 1fr); gap: var(--spacing-sm);">
                <div class="pt-input-group"><label for="sets-${exData.exerciseId}-${index}" class="text-small">Sets:</label><input type="number" id="sets-${exData.exerciseId}-${index}" class="pt-input pt-input--small template-exercise-detail" data-exercise-id="${exData.exerciseId}" data-prop="sets" value="${exData.sets || ''}" min="1"></div>
                <div class="pt-input-group"><label for="reps-${exData.exerciseId}-${index}" class="text-small">Reps:</label><input type="text" id="reps-${exData.exerciseId}-${index}" class="pt-input pt-input--small template-exercise-detail" data-exercise-id="${exData.exerciseId}" data-prop="reps" value="${exData.reps || ''}" placeholder="e.g., 8-12"></div>
                <div class="pt-input-group"><label for="rest-${exData.exerciseId}-${index}" class="text-small">Rest (s):</label><input type="number" id="rest-${exData.exerciseId}-${index}" class="pt-input pt-input--small template-exercise-detail" data-exercise-id="${exData.exerciseId}" data-prop="rest" value="${exData.rest || ''}" min="0"></div>
            </div>
        `;
        selectedExercisesForTemplateContainer.appendChild(itemDiv);
    });
}

if (templateExerciseListDiv) { // Handles adding/removing exercises from the current template being built
    templateExerciseListDiv.addEventListener('change', (e) => {
        if (e.target.matches('.template-exercise-checkbox')) {
            const exerciseId = e.target.dataset.exerciseId;
            if (e.target.checked) {
                if (!currentTemplateExercises.find(ex => ex.exerciseId === exerciseId)) {
                    currentTemplateExercises.push({ exerciseId: exerciseId, sets: '', reps: '', rest: '' });
                }
            } else {
                currentTemplateExercises = currentTemplateExercises.filter(ex => ex.exerciseId !== exerciseId);
            }
            renderSelectedExercisesForTemplate();
        }
    });
}

if (selectedExercisesForTemplateContainer) {
    selectedExercisesForTemplateContainer.addEventListener('click', (e) => { // Remove exercise from template
        if (e.target.classList.contains('remove-exercise-from-template-btn')) {
            const indexToRemove = parseInt(e.target.dataset.index);
            const exerciseIdToRemove = currentTemplateExercises[indexToRemove].exerciseId;
            currentTemplateExercises.splice(indexToRemove, 1);
            // Uncheck it in the library list
            const checkbox = templateExerciseListDiv.querySelector(`.template-exercise-checkbox[data-exercise-id="${exerciseIdToRemove}"]`);
            if (checkbox) checkbox.checked = false;
            renderSelectedExercisesForTemplate();
        }
    });
    selectedExercisesForTemplateContainer.addEventListener('input', (e) => { // Update sets/reps/rest in currentTemplateExercises
        if(e.target.matches('.template-exercise-detail')) {
            const exerciseId = e.target.dataset.exerciseId;
            const prop = e.target.dataset.prop;
            const value = e.target.value;
            const exerciseInTemplate = currentTemplateExercises.find(ex => ex.exerciseId === exerciseId);
            if(exerciseInTemplate) {
                exerciseInTemplate[prop] = value;
            }
        }
    });
}


if (openCreateTemplateModalBtn) {
    openCreateTemplateModalBtn.addEventListener('click', () => {
        templateModalTitle.textContent = 'Create Workout Template';
        workoutTemplateForm.reset();
        workoutTemplateIdInput.value = '';
        currentTemplateExercises = [];
        renderExercises(); // To refresh checkboxes in the modal
        renderSelectedExercisesForTemplate();
        openModal(createEditTemplateModal);
    });
}

if (workoutTemplateForm) {
    workoutTemplateForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = workoutTemplateIdInput.value;
        const templateData = {
            name: templateNameInput.value,
            exercises: [...currentTemplateExercises] // Save a copy
        };
        if (templateData.exercises.length === 0) {
            alert("Please add at least one exercise to the template.");
            return;
        }

        if (id) { // Editing
            workoutTemplates = workoutTemplates.map(wt => wt.id === id ? { ...wt, ...templateData } : wt);
        } else { // Adding
            templateData.id = db.generateId();
            workoutTemplates.push(templateData);
        }
        db.write('workoutTemplates', workoutTemplates);
        renderWorkoutTemplates();
        closeModal(createEditTemplateModal);
    });
}

if (workoutTemplateListContainer) {
    workoutTemplateListContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('edit-template-btn')) {
            const templateId = e.target.dataset.id;
            const template = workoutTemplates.find(wt => wt.id === templateId);
            if (template) {
                templateModalTitle.textContent = 'Edit Workout Template';
                workoutTemplateIdInput.value = template.id;
                templateNameInput.value = template.name;
                currentTemplateExercises = JSON.parse(JSON.stringify(template.exercises)); // Deep copy
                
                renderExercises(); // Refresh checkboxes
                // Check the boxes for exercises already in the template
                templateExerciseListDiv.querySelectorAll('.template-exercise-checkbox').forEach(cb => {
                    cb.checked = currentTemplateExercises.some(ex => ex.exerciseId === cb.dataset.exerciseId);
                });
                renderSelectedExercisesForTemplate(); // Show selected with details
                openModal(createEditTemplateModal);
            }
        }
        if (e.target.classList.contains('delete-template-btn')) {
            if (confirm("Are you sure you want to delete this workout template?")) {
                workoutTemplates = workoutTemplates.filter(wt => wt.id !== e.target.dataset.id);
                db.write('workoutTemplates', workoutTemplates);
                renderWorkoutTemplates();
            }
        }
    });
}


// --- ASSIGN WORKOUT MANAGEMENT ---
function populateAssignWorkoutSelects() {
    if (!assignClientSelect || !assignTemplateSelect) return;
    
    // Populate Clients
    assignClientSelect.innerHTML = '<option value="">-- Select Client --</option>';
    clients.forEach(client => {
        assignClientSelect.innerHTML += `<option value="${client.id}">${client.name}</option>`;
    });

    // Populate Workout Templates
    assignTemplateSelect.innerHTML = '<option value="">-- Select Template --</option>';
    workoutTemplates.forEach(template => {
        assignTemplateSelect.innerHTML += `<option value="${template.id}">${template.name}</option>`;
    });
}

function renderAssignedWorkouts() {
    if (!assignedWorkoutsLogContainer) return;
    assignedWorkoutsLogContainer.innerHTML = '';
    if (assignedWorkouts.length === 0) {
        assignedWorkoutsLogContainer.innerHTML = '<p class="text-muted">No workouts assigned yet.</p>';
    } else {
        const ul = document.createElement('ul');
        ul.style.listStyle = 'none';
        ul.style.paddingLeft = '0';
        // Sort by date, newest first for display
        const sortedAssignments = [...assignedWorkouts].sort((a,b) => new Date(b.dateAssigned) - new Date(a.dateAssigned));

        sortedAssignments.forEach(aw => {
            const client = clients.find(c => c.id === aw.clientId);
            const template = workoutTemplates.find(wt => wt.id === aw.workoutTemplateId);
            const li = document.createElement('li');
            li.className = 'pt-card-content text-small'; // Simple styling
            li.style.marginBottom = 'var(--spacing-xs)';
            li.style.padding = 'var(--spacing-xs)';
            li.style.border = '1px solid var(--border-color-light)';
            li.style.borderRadius = 'var(--border-radius-sm)';
            li.innerHTML = `
                <strong>${template ? template.name : 'Unknown Template'}</strong> assigned to 
                <strong>${client ? client.name : 'Unknown Client'}</strong> for 
                <em>${new Date(aw.dateAssigned).toLocaleDateString()}</em>.
                <button class="pt-button pt-button--destructive pt-button--small delete-assignment-btn" data-id="${aw.id}" style="float:right; padding: 2px 5px; font-size:0.8em;">Del</button>
            `;
            ul.appendChild(li);
        });
        assignedWorkoutsLogContainer.appendChild(ul);
    }
}


if (assignWorkoutForm) {
    assignWorkoutForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const assignment = {
            id: db.generateId(),
            clientId: assignClientSelect.value,
            workoutTemplateId: assignTemplateSelect.value,
            dateAssigned: assignDateInput.value,
            status: 'pending' // Or 'upcoming'
        };
        assignedWorkouts.push(assignment);
        db.write('assignedWorkouts', assignedWorkouts);
        renderAssignedWorkouts();
        assignWorkoutForm.reset();
        // Maybe show a success alert
    });
}

if (assignedWorkoutsLogContainer) {
    assignedWorkoutsLogContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-assignment-btn')) {
            if (confirm("Are you sure you want to remove this assignment?")) {
                assignedWorkouts = assignedWorkouts.filter(aw => aw.id !== e.target.dataset.id);
                db.write('assignedWorkouts', assignedWorkouts);
                renderAssignedWorkouts();
            }
        }
    });
}

// --- DASHBOARD STATS UPDATE ---
function updateDashboardStats() { /* ... same as before ... */ }


// --- INITIAL APP SETUP ---
function initializeApp() {
    const initialViewId = window.location.hash ? window.location.hash.substring(1) + 'View' : 'dashboardView';
    const validView = document.getElementById(initialViewId) ? initialViewId : 'dashboardView';
    switchView(validView);
    
    renderClients(); // Renders clients and updates client stat
    renderExercises(); // Renders exercises and populates template exercise list
    renderWorkoutTemplates(); // Renders templates and updates template stat, also populates assign select
    renderAssignedWorkouts(); // Renders assigned workouts log
    // populateAssignWorkoutSelects(); // Called by renderWorkoutTemplates and renderClients if needed
}

document.addEventListener('DOMContentLoaded', initializeApp);
