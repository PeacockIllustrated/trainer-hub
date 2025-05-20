// assets/js/mvp-app.js

import { initializeThemeSwitcher } from './theme-switcher.js'; // Assuming theme-switcher.js is generic

// --- Local Storage Database Helper ---
const DB_PREFIX = 'fitflow_mvp_';
const db = {
    read: (key) => { const data = localStorage.getItem(DB_PREFIX + key); return data ? JSON.parse(data) : []; },
    write: (key, data) => { localStorage.setItem(DB_PREFIX + key, JSON.stringify(data)); },
    generateId: () => '_' + Math.random().toString(36).substr(2, 9)
};

// --- Initial Default Data ---
const DEFAULT_EXERCISES = [
    { id: db.generateId(), name: "Squat", description: "Compound lower body exercise.", muscleGroup: "Legs, Glutes" },
    { id: db.generateId(), name: "Bench Press", description: "Compound upper body pushing exercise.", muscleGroup: "Chest, Triceps, Shoulders" },
    { id: db.generateId(), name: "Deadlift", description: "Full body compound exercise.", muscleGroup: "Back, Legs, Glutes, Core" },
    { id: db.generateId(), name: "Overhead Press", description: "Compound shoulder exercise.", muscleGroup: "Shoulders, Triceps" },
    { id: db.generateId(), name: "Barbell Row", description: "Compound upper body pulling exercise.", muscleGroup: "Back, Biceps" },
    { id: db.generateId(), name: "Pull-up", description: "Bodyweight upper body pulling exercise.", muscleGroup: "Back, Biceps" },
    { id: db.generateId(), name: "Push-up", description: "Bodyweight upper body pushing exercise.", muscleGroup: "Chest, Triceps, Shoulders" },
    { id: db.generateId(), name: "Lunge", description: "Unilateral lower body exercise.", muscleGroup: "Legs, Glutes" },
    { id: db.generateId(), name: "Plank", description: "Core stability exercise.", muscleGroup: "Core" },
    { id: db.generateId(), name: "Bicep Curl", description: "Isolation exercise for biceps.", muscleGroup: "Biceps" },
    { id: db.generateId(), name: "Tricep Extension", description: "Isolation exercise for triceps.", muscleGroup: "Triceps" },
    { id: db.generateId(), name: "Leg Press", description: "Machine-based lower body exercise.", muscleGroup: "Legs, Glutes" },
    { id: db.generateId(), name: "Lat Pulldown", description: "Machine-based upper body pulling exercise.", muscleGroup: "Back, Biceps" },
    { id: db.generateId(), name: "Calf Raise", description: "Isolation exercise for calves.", muscleGroup: "Calves" },
    { id: db.generateId(), name: "Russian Twist", description: "Core rotational exercise.", muscleGroup: "Core, Obliques" },
    { id: db.generateId(), name: "Burpee", description: "Full body conditioning exercise.", muscleGroup: "Full Body" },
    { id: db.generateId(), name: "Kettlebell Swing", description: "Full body explosive exercise.", muscleGroup: "Glutes, Hamstrings, Back, Core" },
    { id: db.generateId(), name: "Dumbbell Shoulder Press", description: "Shoulder exercise with dumbbells.", muscleGroup: "Shoulders, Triceps" },
    { id: db.generateId(), name: "Leg Curl", description: "Isolation exercise for hamstrings.", muscleGroup: "Hamstrings" },
    { id: db.generateId(), name: "Leg Extension", description: "Isolation exercise for quadriceps.", muscleGroup: "Quadriceps" }
];

// --- State & Initial Data Loading ---
let clients = db.read('clients');
let exercises = db.read('exercises');
if (exercises.length === 0) {
    exercises = DEFAULT_EXERCISES.map(ex => ({...ex, id: db.generateId()}));
    db.write('exercises', exercises);
}
let workoutTemplates = db.read('workoutTemplates');
let assignedWorkouts = db.read('assignedWorkouts');
let currentTemplateExercises = []; // For building/editing a template

// --- UI Elements (Declared here, assigned in DOMContentLoaded) ---
let bodyElement, viewSections, navLinks, mvpThemeSwitcherElement;
let addEditClientModal, confirmModal, createEditTemplateModal, viewClientPlanModal;
let clientListContainer, noClientsMessage, clientModalTitle, clientForm, openAddClientModalBtn;
let clientIdInput, clientNameInput, clientEmailInput, clientPhoneInput, clientDobInput, clientGoalInput, clientMedicalNotesInput;
let exerciseForm, exerciseIdInput, exerciseNameInput, exerciseDescriptionInput, exerciseMuscleGroupInput;
let exerciseListContainer, noExercisesMessage, cancelEditExerciseBtn;
let openCreateTemplateModalBtn, templateModalTitle, workoutTemplateForm, workoutTemplateIdInput, templateNameInput;
let templateExerciseSelect, addExerciseToTemplateBtn, selectedExercisesForTemplateContainer;
let workoutTemplateListContainer, noWorkoutTemplatesMessage;
let assignWorkoutForm, assignClientSelect, assignTemplateSelect, assignDateInput, assignedWorkoutsLogContainer;
let totalClientsStat, totalWorkoutTemplatesStat;
let confirmModalTitleElem, confirmModalMessageElem, confirmModalConfirmBtnElem;
let clientPlanModalTitle, clientPlanModalContent;

const themesForMvp = [
    { value: 'theme-modern-professional', name: 'Modern & Professional', sidebarLogo: 'FitFlow MVP', sidebarUser: 'PT Admin' },
    { value: 'theme-friendly-supportive', name: 'Friendly & Supportive', sidebarLogo: 'FitFlow MVP', sidebarUser: 'PT Admin' },
    { value: 'theme-energetic-motivating', name: 'Energetic & Motivating', sidebarLogo: 'FitFlow MVP', sidebarUser: 'PT Admin' },
    { value: 'theme-natural-grounded', name: 'Natural & Grounded', sidebarLogo: 'FitFlow MVP', sidebarUser: 'PT Admin' },
    { value: 'theme-urban-grit', name: 'Urban Grit & Steel', sidebarLogo: 'FitFlow MVP', sidebarUser: 'PT Admin' },
    { value: 'theme-playful-pop', name: 'Playful & Vibrant Pop', sidebarLogo: 'FitFlow MVP', sidebarUser: 'PT Admin' },
    { value: 'theme-tech-data', name: 'Tech & Data Driven', sidebarLogo: 'FitFlow MVP', sidebarUser: 'PT Admin' },
    { value: 'theme-feminine-elegance', name: 'Feminine Elegance', sidebarLogo: 'FitFlow MVP', sidebarUser: 'PT Admin' },
    { value: 'theme-luxe-minimalist', name: 'Luxe Minimalist', sidebarLogo: 'FitFlow MVP', sidebarUser: 'PT Admin' },
    { value: 'theme-retro-funk', name: 'Retro Funk', sidebarLogo: 'FitFlow MVP', sidebarUser: 'PT Admin' }
];


// --- MODAL HANDLING ---
function openModal(modalElement) {
    if (modalElement) modalElement.classList.add('is-active');
}
function closeModal(modalElement) {
    if (modalElement) modalElement.classList.remove('is-active');
}

// --- VIEW SWITCHING ---
function switchView(viewId) {
    if (!viewSections) return;
    viewSections.forEach(section => section.classList.toggle('is-active', section.id === viewId));
    if(navLinks) navLinks.forEach(link => link.classList.toggle('is-active', link.dataset.view === viewId));
    window.location.hash = viewId.replace('View', '').toLowerCase();
}

// --- CLIENT MANAGEMENT ---
function renderClients() {
    if (!clientListContainer || !noClientsMessage) return;
    clientListContainer.innerHTML = '';
    noClientsMessage.style.display = clients.length === 0 ? 'block' : 'none';

    clients.forEach(client => {
        const clientItem = document.createElement('div');
        clientItem.className = 'pt-client-list-item';
        const initials = client.name ? client.name.match(/\b(\w)/g)?.join('').substr(0,2).toUpperCase() || 'N/A' : 'N/A';
        clientItem.innerHTML = `
            <div class="pt-client-list-item__avatar">${initials}</div>
            <div class="pt-client-list-item__info">
                <h4 class="pt-client-list-item__name">${client.name || 'Unnamed Client'}</h4>
                <p class="pt-client-list-item__meta text-small">${client.goal || 'No goal set'}</p>
            </div>
            <div class="pt-client-list-item__actions">
                <button class="pt-button pt-button--accent pt-button--small view-client-plan-btn" data-id="${client.id}">View Plan</button> 
                <button class="pt-button pt-button--secondary pt-button--small edit-client-btn" data-id="${client.id}">Edit</button>
                <button class="pt-button pt-button--destructive pt-button--small delete-client-btn" data-id="${client.id}">Delete</button>
            </div>`;
        clientListContainer.appendChild(clientItem);
    });
    updateDashboardStats();
    populateAssignWorkoutSelects();
}
function handleClientFormSubmit(e) {
    e.preventDefault();
    if (!clientIdInput || !clientNameInput || !clientEmailInput || !clientPhoneInput || !clientDobInput || !clientGoalInput || !clientMedicalNotesInput || !addEditClientModal || !clientForm) return;
    const id = clientIdInput.value;
    const clientData = {
        name: clientNameInput.value, email: clientEmailInput.value, phone: clientPhoneInput.value,
        dob: clientDobInput.value, goal: clientGoalInput.value, medicalNotes: clientMedicalNotesInput.value,
    };
    if (id) { clients = clients.map(c => c.id === id ? { ...c, ...clientData } : c); }
    else { clientData.id = db.generateId(); clients.push(clientData); }
    db.write('clients', clients);
    renderClients();
    closeModal(addEditClientModal);
    clientForm.reset();
}
function openClientModalForEdit(clientIdToEdit) {
    const client = clients.find(c => c.id === clientIdToEdit);
    if (client && clientModalTitle && clientForm && clientIdInput && clientNameInput && clientEmailInput && clientPhoneInput && clientDobInput && clientGoalInput && clientMedicalNotesInput && addEditClientModal) {
        clientModalTitle.textContent = 'Edit Client';
        clientIdInput.value = client.id; clientNameInput.value = client.name || '';
        clientEmailInput.value = client.email || ''; clientPhoneInput.value = client.phone || '';
        clientDobInput.value = client.dob || ''; clientGoalInput.value = client.goal || '';
        clientMedicalNotesInput.value = client.medicalNotes || '';
        openModal(addEditClientModal);
    } else {
        console.error("Error opening client modal for edit: Missing client data or DOM elements.");
    }
}
function handleDeleteClient(clientIdToDelete) {
    const client = clients.find(c => c.id === clientIdToDelete);
    if (!client || !confirmModal || !confirmModalTitleElem || !confirmModalMessageElem || !confirmModalConfirmBtnElem) return;
    
    confirmModalTitleElem.textContent = 'Delete Client';
    confirmModalMessageElem.textContent = `Are you sure you want to delete ${client.name}? This action cannot be undone.`;
    openModal(confirmModal);

    const newConfirmBtn = confirmModalConfirmBtnElem.cloneNode(true);
    confirmModalConfirmBtnElem.parentNode.replaceChild(newConfirmBtn, confirmModalConfirmBtnElem);
    confirmModalConfirmBtnElem = newConfirmBtn; // Re-assign to the new button

    confirmModalConfirmBtnElem.onclick = () => {
        clients = clients.filter(c => c.id !== clientIdToDelete);
        db.write('clients', clients);
        renderClients();
        closeModal(confirmModal);
    };
}

// --- EXERCISE MANAGEMENT ---
function renderExercises() {
    if (!exerciseListContainer || !noExercisesMessage || !templateExerciseSelect) return;
    exerciseListContainer.innerHTML = '';
    templateExerciseSelect.innerHTML = '<option value="">-- Select Exercise --</option>';
    noExercisesMessage.style.display = exercises.length === 0 ? 'block' : 'none';

    exercises.forEach(ex => {
        const exItem = document.createElement('div'); exItem.className = 'pt-client-list-item';
        exItem.innerHTML = `
            <div class="pt-client-list-item__info">
                <h5 class="pt-client-list-item__name" style="font-size:1em;">${ex.name}</h5>
                ${ex.muscleGroup ? `<p class="pt-client-list-item__meta text-small">Group: ${ex.muscleGroup}</p>` : ''}
                ${ex.description ? `<p class="pt-client-list-item__meta text-small">${ex.description.substring(0,50)}...</p>` : ''}
            </div>
            <div class="pt-client-list-item__actions">
                <button class="pt-button pt-button--secondary pt-button--small edit-exercise-btn" data-id="${ex.id}">Edit</button>
                <button class="pt-button pt-button--destructive pt-button--small delete-exercise-btn" data-id="${ex.id}">Del</button>
            </div>`;
        exerciseListContainer.appendChild(exItem);
        templateExerciseSelect.innerHTML += `<option value="${ex.id}">${ex.name}</option>`;
    });
}
// ... (Rest of Exercise Management functions: submit, edit, delete - same as before but ensure all element vars are defined) ...
// Ensure all element variables like exerciseIdInput, exerciseNameInput, etc. are checked for existence before use in their respective functions.

// --- WORKOUT TEMPLATE MANAGEMENT ---
function renderWorkoutTemplates() { /* ... same as before, ensure element vars are checked ... */ }
function renderSelectedExercisesForTemplate() { /* ... same as before, ensure element vars are checked ... */ }
// ... (All event listeners and handlers for template CRUD - same as before, check element vars) ...

// --- ASSIGN WORKOUT MANAGEMENT ---
function populateAssignWorkoutSelects() { /* ... same as before, ensure element vars are checked ... */ }
function renderAssignedWorkouts() { /* ... same as before, ensure element vars are checked ... */ }
// ... (assignWorkoutForm submit, delete assignment - same as before, check element vars) ...

// --- VIEW CLIENT'S PLAN ---
function openViewClientPlanModal(clientId) { /* ... same as before, ensure element vars are checked ... */ }

// --- DASHBOARD STATS ---
function updateDashboardStats() {
    if(totalClientsStat) totalClientsStat.textContent = clients.length;
    if(totalWorkoutTemplatesStat) totalWorkoutTemplatesStat.textContent = workoutTemplates.length;
}

// --- INITIALIZE APP ---
function initializeApp() {
    // Assign all global DOM element variables (moved from top level)
    bodyElement = document.body;
    viewSections = document.querySelectorAll('.view-section');
    navLinks = document.querySelectorAll('.pt-sidebar__nav-link');
    mvpThemeSwitcherElement = document.getElementById('mvpThemeSwitcher');
    addEditClientModal = document.getElementById('addEditClientModal');
    confirmModal = document.getElementById('confirmModal');
    createEditTemplateModal = document.getElementById('createEditTemplateModal');
    viewClientPlanModal = document.getElementById('viewClientPlanModal');
    clientListContainer = document.getElementById('clientListContainer');
    noClientsMessage = document.getElementById('noClientsMessage');
    clientModalTitle = document.getElementById('clientModalTitle');
    clientForm = document.getElementById('clientForm');
    openAddClientModalBtn = document.getElementById('openAddClientModalBtn');
    clientIdInput = document.getElementById('clientId');
    clientNameInput = document.getElementById('clientName');
    clientEmailInput = document.getElementById('clientEmail');
    clientPhoneInput = document.getElementById('clientPhone');
    clientDobInput = document.getElementById('clientDob');
    clientGoalInput = document.getElementById('clientGoal');
    clientMedicalNotesInput = document.getElementById('clientMedicalNotes');
    exerciseForm = document.getElementById('exerciseForm');
    exerciseIdInput = document.getElementById('exerciseId');
    exerciseNameInput = document.getElementById('exerciseName');
    exerciseDescriptionInput = document.getElementById('exerciseDescription');
    exerciseMuscleGroupInput = document.getElementById('exerciseMuscleGroup');
    exerciseListContainer = document.getElementById('exerciseListContainer');
    noExercisesMessage = document.getElementById('noExercisesMessage');
    cancelEditExerciseBtn = document.getElementById('cancelEditExerciseBtn');
    openCreateTemplateModalBtn = document.getElementById('openCreateTemplateModalBtn');
    templateModalTitle = document.getElementById('templateModalTitle');
    workoutTemplateForm = document.getElementById('workoutTemplateForm');
    workoutTemplateIdInput = document.getElementById('workoutTemplateId');
    templateNameInput = document.getElementById('templateName');
    templateExerciseSelect = document.getElementById('templateExerciseSelect');
    addExerciseToTemplateBtn = document.getElementById('addExerciseToTemplateBtn');
    selectedExercisesForTemplateContainer = document.getElementById('selectedExercisesForTemplateContainer');
    workoutTemplateListContainer = document.getElementById('workoutTemplateListContainer');
    noWorkoutTemplatesMessage = document.getElementById('noWorkoutTemplatesMessage');
    assignWorkoutForm = document.getElementById('assignWorkoutForm');
    assignClientSelect = document.getElementById('assignClientSelect');
    assignTemplateSelect = document.getElementById('assignTemplateSelect');
    assignDateInput = document.getElementById('assignDate');
    assignedWorkoutsLogContainer = document.getElementById('assignedWorkoutsLogContainer');
    totalClientsStat = document.getElementById('totalClientsStat');
    totalWorkoutTemplatesStat = document.getElementById('totalWorkoutTemplatesStat');
    confirmModalTitleElem = document.getElementById('confirmModalTitle');
    confirmModalMessageElem = document.getElementById('confirmModalMessage');
    confirmModalConfirmBtnElem = document.getElementById('confirmModalConfirmBtn');
    clientPlanModalTitle = document.getElementById('clientPlanModalTitle');
    clientPlanModalContent = document.getElementById('clientPlanModalContent');

    // Initialize Theme Switcher
    if (mvpThemeSwitcherElement && bodyElement) {
        initializeThemeSwitcher(themesForMvp, mvpThemeSwitcherElement, bodyElement, (newThemeValue) => {
            const modalsToTheme = [addEditClientModal, confirmModal, createEditTemplateModal, viewClientPlanModal];
            modalsToTheme.forEach(modal => {
                if (modal) {
                    themesForMvp.forEach(t => modal.classList.remove(t.value));
                    modal.classList.add(newThemeValue);
                }
            });
        });
    } else if (themesForMvp.length > 0 && bodyElement) {
        bodyElement.className = ''; bodyElement.classList.add(themesForMvp[0].value);
        bodyElement.style.backgroundColor = 'var(--background-color)'; bodyElement.style.color = 'var(--text-color)';
    }

    // Setup Modal Close Listeners (moved here to ensure elements are defined)
    [addEditClientModal, confirmModal, createEditTemplateModal, viewClientPlanModal].forEach(modal => {
        if (modal) {
            modal.querySelectorAll('.pt-modal__close').forEach(btn => {
                btn.addEventListener('click', () => closeModal(modal));
            });
            modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(modal); });
        }
    });
    
    // Attach event listeners for client management
    if (openAddClientModalBtn) openAddClientModalBtn.addEventListener('click', () => {
        if(clientModalTitle) clientModalTitle.textContent = 'Add New Client'; 
        if(clientForm) clientForm.reset(); 
        if(clientIdInput) clientIdInput.value = '';
        openModal(addEditClientModal);
    });
    if (clientForm) clientForm.addEventListener('submit', handleClientFormSubmit);
    if (clientListContainer) clientListContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('edit-client-btn')) openClientModalForEdit(e.target.dataset.id);
        if (e.target.classList.contains('delete-client-btn')) handleDeleteClient(e.target.dataset.id);
        if (e.target.classList.contains('view-client-plan-btn')) openViewClientPlanModal(e.target.dataset.id);
    });

    // Attach event listeners for exercise management
    if (exerciseForm) exerciseForm.addEventListener('submit', (e) => {
        e.preventDefault(); const id = exerciseIdInput.value;
        const exerciseData = { name: exerciseNameInput.value, description: exerciseDescriptionInput.value, muscleGroup: exerciseMuscleGroupInput.value };
        if (id) exercises = exercises.map(ex => ex.id === id ? { ...ex, ...exerciseData } : ex);
        else { exerciseData.id = db.generateId(); exercises.push(exerciseData); }
        db.write('exercises', exercises); renderExercises(); exerciseForm.reset(); exerciseIdInput.value = '';
        if(cancelEditExerciseBtn) cancelEditExerciseBtn.style.display = 'none';
    });
    if (cancelEditExerciseBtn) cancelEditExerciseBtn.addEventListener('click', () => { exerciseForm.reset(); exerciseIdInput.value = ''; cancelEditExerciseBtn.style.display = 'none'; });
    if (exerciseListContainer) exerciseListContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('edit-exercise-btn')) {
            const ex = exercises.find(ex => ex.id === e.target.dataset.id);
            if (ex) {
                exerciseIdInput.value = ex.id; exerciseNameInput.value = ex.name;
                exerciseDescriptionInput.value = ex.description || ''; exerciseMuscleGroupInput.value = ex.muscleGroup || '';
                if(cancelEditExerciseBtn) cancelEditExerciseBtn.style.display = 'inline-block'; exerciseNameInput.focus();
            }
        }
        if (e.target.classList.contains('delete-exercise-btn')) {
            const exToDelete = exercises.find(ex => ex.id === e.target.dataset.id);
            if (exToDelete && confirm(`Delete "${exToDelete.name}"? This may affect templates.`)) {
                exercises = exercises.filter(ex => ex.id !== e.target.dataset.id);
                db.write('exercises', exercises); renderExercises();
            }
        }
    });

    // Attach event listeners for workout template management
    if (addExerciseToTemplateBtn) addExerciseToTemplateBtn.addEventListener('click', () => {
        const exerciseId = templateExerciseSelect.value;
        if (exerciseId && !currentTemplateExercises.find(ex => ex.exerciseId === exerciseId)) { currentTemplateExercises.push({ exerciseId, sets: '', reps: '', rest: '' }); renderSelectedExercisesForTemplate();}
        else if (exerciseId) alert("This exercise is already in the template.");
        if(templateExerciseSelect) templateExerciseSelect.value = "";
    });
    if (selectedExercisesForTemplateContainer) {
        selectedExercisesForTemplateContainer.addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-exercise-from-template-btn')) {
                const indexToRemove = parseInt(e.target.dataset.index);
                const removedExId = currentTemplateExercises[indexToRemove].exerciseId;
                currentTemplateExercises.splice(indexToRemove, 1);
                if(templateExerciseSelect) { // Uncheck in the conceptual checklist if it were one
                    const checkbox = templateExerciseSelect.querySelector(`option[value="${removedExId}"]`); // This won't work directly for select, but idea is to reset if needed
                }
                renderSelectedExercisesForTemplate();
            }
        });
        selectedExercisesForTemplateContainer.addEventListener('input', (e) => {
            if(e.target.matches('.template-exercise-detail')) {
                const index = parseInt(e.target.dataset.index); const prop = e.target.dataset.prop;
                if(currentTemplateExercises[index]) currentTemplateExercises[index][prop] = e.target.value;
            }
        });
    }
    if (openCreateTemplateModalBtn) openCreateTemplateModalBtn.addEventListener('click', () => {
        if(templateModalTitle) templateModalTitle.textContent = 'Create Workout Template'; 
        if(workoutTemplateForm) workoutTemplateForm.reset(); 
        if(workoutTemplateIdInput) workoutTemplateIdInput.value = '';
        currentTemplateExercises = []; renderExercises(); renderSelectedExercisesForTemplate();
        openModal(createEditTemplateModal);
    });
    if (workoutTemplateForm) workoutTemplateForm.addEventListener('submit', (e) => {
        e.preventDefault(); const id = workoutTemplateIdInput.value;
        const templateData = { name: templateNameInput.value, exercises: [...currentTemplateExercises] };
        if (templateData.exercises.length === 0) { alert("Add exercises to the template."); return; }
        if (id) workoutTemplates = workoutTemplates.map(wt => wt.id === id ? { ...wt, ...templateData } : wt);
        else { templateData.id = db.generateId(); workoutTemplates.push(templateData); }
        db.write('workoutTemplates', workoutTemplates); renderWorkoutTemplates(); closeModal(createEditTemplateModal);
    });
    if (workoutTemplateListContainer) workoutTemplateListContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('edit-template-btn')) {
            const template = workoutTemplates.find(wt => wt.id === e.target.dataset.id);
            if (template) {
                if(templateModalTitle) templateModalTitle.textContent = 'Edit Workout Template'; 
                if(workoutTemplateIdInput) workoutTemplateIdInput.value = template.id;
                if(templateNameInput) templateNameInput.value = template.name; 
                currentTemplateExercises = JSON.parse(JSON.stringify(template.exercises));
                renderExercises(); 
                // For select dropdown, we don't "check" options, but selectedExercisesForTemplateContainer will render them
                renderSelectedExercisesForTemplate(); openModal(createEditTemplateModal);
            }
        }
        if (e.target.classList.contains('delete-template-btn')) {
            const templateToDelete = workoutTemplates.find(wt => wt.id === e.target.dataset.id);
            if (templateToDelete && confirm(`Delete template "${templateToDelete.name}"?`)) {
                workoutTemplates = workoutTemplates.filter(wt => wt.id !== e.target.dataset.id);
                db.write('workoutTemplates', workoutTemplates); renderWorkoutTemplates();
            }
        }
    });
    
    // Attach event listeners for assign workout
    if (assignWorkoutForm) assignWorkoutForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if(!assignClientSelect.value || !assignTemplateSelect.value || !assignDateInput.value) { alert("Please select a client, a template, and a date."); return; }
        const assignment = { id: db.generateId(), clientId: assignClientSelect.value, workoutTemplateId: assignTemplateSelect.value, dateAssigned: assignDateInput.value, status: 'pending' };
        assignedWorkouts.push(assignment); db.write('assignedWorkouts', assignedWorkouts);
        renderAssignedWorkouts(); assignWorkoutForm.reset();
    });
    if (assignedWorkoutsLogContainer) assignedWorkoutsLogContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-assignment-btn')) {
            if (confirm("Remove this assignment?")) {
                assignedWorkouts = assignedWorkouts.filter(aw => aw.id !== e.target.dataset.id);
                db.write('assignedWorkouts', assignedWorkouts); renderAssignedWorkouts();
            }
        }
    });

    // Initial Renders
    const initialViewId = window.location.hash ? window.location.hash.substring(1).toLowerCase() + 'View' : 'dashboardView';
    const validView = document.getElementById(initialViewId) ? initialViewId : 'dashboardView';
    if (document.getElementById(validView)) switchView(validView); else switchView('dashboardView');
    
    renderClients(); renderExercises(); renderWorkoutTemplates(); renderAssignedWorkouts();
    console.log("MVP App Initialized.");
}

// --- DOMContentLoaded ---
document.addEventListener('DOMContentLoaded', initializeApp);
