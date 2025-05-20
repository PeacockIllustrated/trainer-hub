// assets/js/mvp-app.js

import { initializeThemeSwitcher } from './theme-switcher.js'; // Assuming theme-switcher.js is generic now

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
let currentTemplateExercises = []; // For building/editing a template

// --- UI Elements ---
const bodyElement = document.body;
const viewSections = document.querySelectorAll('.view-section');
const navLinks = document.querySelectorAll('.pt-sidebar__nav-link');
const mvpThemeSwitcherElement = document.getElementById('mvpThemeSwitcher');
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

// Modals
const addEditClientModal = document.getElementById('addEditClientModal');
const confirmModal = document.getElementById('confirmModal');
const createEditTemplateModal = document.getElementById('createEditTemplateModal');

// Client Management
const clientListContainer = document.getElementById('clientListContainer');
const noClientsMessage = document.getElementById('noClientsMessage');
const clientModalTitle = document.getElementById('clientModalTitle');
const clientForm = document.getElementById('clientForm'); // Ensure this ID is on the form in the client modal
const openAddClientModalBtn = document.getElementById('openAddClientModalBtn');
const clientIdInput = document.getElementById('clientId');
const clientNameInput = document.getElementById('clientName');
const clientEmailInput = document.getElementById('clientEmail');
const clientPhoneInput = document.getElementById('clientPhone');
const clientDobInput = document.getElementById('clientDob');
const clientGoalInput = document.getElementById('clientGoal');
const clientMedicalNotesInput = document.getElementById('clientMedicalNotes');

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
const templateExerciseListDiv = document.getElementById('templateExerciseList');
const selectedExercisesForTemplateContainer = document.getElementById('selectedExercisesForTemplateContainer');
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

// Confirmation Modal elements
const confirmModalTitle = document.getElementById('confirmModalTitle');
const confirmModalMessage = document.getElementById('confirmModalMessage');
const confirmModalConfirmBtn = document.getElementById('confirmModalConfirmBtn');


// --- THEME SWITCHER LOGIC ---
if (mvpThemeSwitcherElement) {
    initializeThemeSwitcher(themesForMvp, mvpThemeSwitcherElement, bodyElement, (newThemeValue) => {
        const modalsToTheme = [addEditClientModal, confirmModal, createEditTemplateModal];
        modalsToTheme.forEach(modal => {
            if (modal) {
                themesForMvp.forEach(t => modal.classList.remove(t.value));
                modal.classList.add(newThemeValue);
            }
        });
    });
} else if (themesForMvp.length > 0) { // Fallback if no switcher
    bodyElement.className = ''; bodyElement.classList.add(themesForMvp[0].value);
    bodyElement.style.backgroundColor = 'var(--background-color)'; bodyElement.style.color = 'var(--text-color)';
}

// --- VIEW SWITCHING & MODAL HANDLING ---
function switchView(viewId) {
    viewSections.forEach(section => section.classList.toggle('is-active', section.id === viewId));
    navLinks.forEach(link => link.classList.toggle('is-active', link.dataset.view === viewId));
    window.location.hash = viewId.replace('View', '').toLowerCase();
}
navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const viewId = link.dataset.view;
        if (viewId && document.getElementById(viewId)) switchView(viewId);
        else { console.warn(`View with ID "${viewId}" not found.`); switchView('dashboardView');}
    });
});
function openModal(modalElement) { if (modalElement) modalElement.classList.add('is-active'); }
function closeModal(modalElement) { if (modalElement) modalElement.classList.remove('is-active'); }
[addEditClientModal, confirmModal, createEditTemplateModal].forEach(modal => {
    if (modal) {
        modal.querySelectorAll('.pt-modal__close').forEach(btn => btn.addEventListener('click', () => closeModal(modal)));
        modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(modal); });
    }
});

// --- CLIENT MANAGEMENT ---
function renderClients() {
    if (!clientListContainer) return;
    clientListContainer.innerHTML = '';
    noClientsMessage.style.display = clients.length === 0 ? 'block' : 'none';
    clients.forEach(client => {
        const clientItem = document.createElement('div');
        clientItem.className = 'pt-client-list-item';
        clientItem.innerHTML = `
            <div class="pt-client-list-item__avatar">${client.name ? client.name.match(/\b(\w)/g)?.join('').substr(0,2).toUpperCase() || 'N/A' : 'N/A'}</div>
            <div class="pt-client-list-item__info">
                <h4 class="pt-client-list-item__name">${client.name || 'Unnamed Client'}</h4>
                <p class="pt-client-list-item__meta text-small">${client.goal || 'No goal set'}</p>
            </div>
            <div class="pt-client-list-item__actions">
                <button class="pt-button pt-button--secondary pt-button--small edit-client-btn" data-id="${client.id}">Edit</button>
                <button class="pt-button pt-button--destructive pt-button--small delete-client-btn" data-id="${client.id}">Delete</button>
            </div>`;
        clientListContainer.appendChild(clientItem);
    });
    updateDashboardStats();
    populateAssignWorkoutSelects(); // Update client dropdown for assignments
}
function handleClientFormSubmit(e) {
    e.preventDefault();
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
function openClientModalForEdit(clientId) {
    const client = clients.find(c => c.id === clientId);
    if (client) {
        clientModalTitle.textContent = 'Edit Client';
        clientIdInput.value = client.id; clientNameInput.value = client.name || '';
        clientEmailInput.value = client.email || ''; clientPhoneInput.value = client.phone || '';
        clientDobInput.value = client.dob || ''; clientGoalInput.value = client.goal || '';
        clientMedicalNotesInput.value = client.medicalNotes || '';
        openModal(addEditClientModal);
    }
}
function handleDeleteClient(clientId) {
    const client = clients.find(c => c.id === clientId);
    if (!client || !confirmModal) return;
    confirmModalTitle.textContent = 'Delete Client';
    confirmModalMessage.textContent = `Are you sure you want to delete ${client.name}?`;
    openModal(confirmModal);
    const newConfirmBtn = confirmModalConfirmBtn.cloneNode(true);
    confirmModalConfirmBtn.parentNode.replaceChild(newConfirmBtn, confirmModalConfirmBtn);
    document.getElementById('confirmModalConfirmBtn').onclick = () => {
        clients = clients.filter(c => c.id !== clientId);
        db.write('clients', clients);
        renderClients();
        closeModal(confirmModal);
    };
}
if (openAddClientModalBtn) {
    openAddClientModalBtn.addEventListener('click', () => {
        clientModalTitle.textContent = 'Add New Client'; clientForm.reset(); clientIdInput.value = '';
        openModal(addEditClientModal);
    });
}
if (clientForm) clientForm.addEventListener('submit', handleClientFormSubmit);
if (clientListContainer) {
    clientListContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('edit-client-btn')) openClientModalForEdit(e.target.dataset.id);
        if (e.target.classList.contains('delete-client-btn')) handleDeleteClient(e.target.dataset.id);
    });
}

// --- EXERCISE MANAGEMENT ---
function renderExercises() {
    if (!exerciseListContainer || !templateExerciseListDiv) return;
    exerciseListContainer.innerHTML = '';
    templateExerciseListDiv.innerHTML = '';
    noExercisesMessage.style.display = exercises.length === 0 ? 'block' : 'none';
    if (exercises.length === 0) templateExerciseListDiv.innerHTML = '<p class="text-muted">No exercises in library. Add some above.</p>';
    else {
        exercises.forEach(ex => {
            const exItemHTML = `
                <div class="pt-client-list-item__info">
                    <h5 class="pt-client-list-item__name" style="font-size:1em;">${ex.name}</h5>
                    ${ex.muscleGroup ? `<p class="pt-client-list-item__meta text-small">Group: ${ex.muscleGroup}</p>` : ''}
                    ${ex.description ? `<p class="pt-client-list-item__meta text-small">${ex.description.substring(0,50)}...</p>` : ''}
                </div>
                <div class="pt-client-list-item__actions">
                    <button class="pt-button pt-button--secondary pt-button--small edit-exercise-btn" data-id="${ex.id}">Edit</button>
                    <button class="pt-button pt-button--destructive pt-button--small delete-exercise-btn" data-id="${ex.id}">Del</button>
                </div>`;
            const exItem = document.createElement('div'); exItem.className = 'pt-client-list-item'; exItem.innerHTML = exItemHTML;
            exerciseListContainer.appendChild(exItem);

            const checkItem = document.createElement('div'); checkItem.className = 'pt-input-group';
            checkItem.innerHTML = `<label><input type="checkbox" class="template-exercise-checkbox" data-exercise-id="${ex.id}" data-exercise-name="${ex.name}"> ${ex.name}</label>`;
            templateExerciseListDiv.appendChild(checkItem);
        });
    }
    populateAssignWorkoutSelects();
}
if (exerciseForm) {
    exerciseForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const id = exerciseIdInput.value;
        const exerciseData = { name: exerciseNameInput.value, description: exerciseDescriptionInput.value, muscleGroup: exerciseMuscleGroupInput.value };
        if (id) exercises = exercises.map(ex => ex.id === id ? { ...ex, ...exerciseData } : ex);
        else { exerciseData.id = db.generateId(); exercises.push(exerciseData); }
        db.write('exercises', exercises); renderExercises(); exerciseForm.reset(); exerciseIdInput.value = '';
        if(cancelEditExerciseBtn) cancelEditExerciseBtn.style.display = 'none';
    });
}
if (cancelEditExerciseBtn) cancelEditExerciseBtn.addEventListener('click', () => { exerciseForm.reset(); exerciseIdInput.value = ''; cancelEditExerciseBtn.style.display = 'none'; });
if (exerciseListContainer) {
    exerciseListContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('edit-exercise-btn')) {
            const ex = exercises.find(ex => ex.id === e.target.dataset.id);
            if (ex) {
                exerciseIdInput.value = ex.id; exerciseNameInput.value = ex.name;
                exerciseDescriptionInput.value = ex.description || ''; exerciseMuscleGroupInput.value = ex.muscleGroup || '';
                if(cancelEditExerciseBtn) cancelEditExerciseBtn.style.display = 'inline-block'; exerciseNameInput.focus();
            }
        }
        if (e.target.classList.contains('delete-exercise-btn')) {
            if (confirm(`Delete "${exercises.find(ex => ex.id === e.target.dataset.id)?.name || 'this exercise'}"? This may affect templates.`)) {
                exercises = exercises.filter(ex => ex.id !== e.target.dataset.id);
                db.write('exercises', exercises); renderExercises();
            }
        }
    });
}

// --- WORKOUT TEMPLATE MANAGEMENT ---
function renderWorkoutTemplates() {
    if (!workoutTemplateListContainer) return;
    workoutTemplateListContainer.innerHTML = '';
    noWorkoutTemplatesMessage.style.display = workoutTemplates.length === 0 ? 'block' : 'none';
    workoutTemplates.forEach(template => {
        const item = document.createElement('div'); item.className = 'pt-client-list-item';
        item.innerHTML = `
            <div class="pt-client-list-item__info">
                <h5 class="pt-client-list-item__name">${template.name}</h5>
                <p class="pt-client-list-item__meta text-small">${template.exercises.length} exercises</p>
            </div>
            <div class="pt-client-list-item__actions">
                <button class="pt-button pt-button--secondary pt-button--small edit-template-btn" data-id="${template.id}">Edit</button>
                <button class="pt-button pt-button--destructive pt-button--small delete-template-btn" data-id="${template.id}">Del</button>
            </div>`;
        workoutTemplateListContainer.appendChild(item);
    });
    updateDashboardStats(); populateAssignWorkoutSelects();
}
function renderSelectedExercisesForTemplate() {
    if (!selectedExercisesForTemplateContainer) return;
    selectedExercisesForTemplateContainer.innerHTML = currentTemplateExercises.length === 0 ? '<p class="text-muted">No exercises added yet.</p>' : '';
    currentTemplateExercises.forEach((exData, index) => {
        const exercise = exercises.find(e => e.id === exData.exerciseId); if (!exercise) return;
        const itemDiv = document.createElement('div'); itemDiv.className = 'pt-card pt-card-content'; itemDiv.style.marginBottom = 'var(--spacing-sm)';
        itemDiv.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--spacing-xs);">
                <strong>${exercise.name}</strong>
                <button type="button" class="pt-button pt-button--destructive pt-button--small remove-exercise-from-template-btn" data-index="${index}" title="Remove exercise from template">×</button>
            </div>
            <div class="component-grid" style="grid-template-columns: repeat(auto-fit, minmax(80px, 1fr)); gap: var(--spacing-sm);">
                <div class="pt-input-group"><label for="sets-${index}" class="text-small">Sets:</label><input type="number" id="sets-${index}" class="pt-input pt-input--small template-exercise-detail" data-index="${index}" data-prop="sets" value="${exData.sets || ''}" min="1"></div>
                <div class="pt-input-group"><label for="reps-${index}" class="text-small">Reps:</label><input type="text" id="reps-${index}" class="pt-input pt-input--small template-exercise-detail" data-index="${index}" data-prop="reps" value="${exData.reps || ''}" placeholder="e.g. 8-12"></div>
                <div class="pt-input-group"><label for="rest-${index}" class="text-small">Rest(s):</label><input type="number" id="rest-${index}" class="pt-input pt-input--small template-exercise-detail" data-index="${index}" data-prop="rest" value="${exData.rest || ''}" min="0"></div>
            </div>`;
        selectedExercisesForTemplateContainer.appendChild(itemDiv);
    });
}
if (templateExerciseListDiv) {
    templateExerciseListDiv.addEventListener('change', (e) => {
        if (e.target.matches('.template-exercise-checkbox')) {
            const exerciseId = e.target.dataset.exerciseId;
            if (e.target.checked) { if (!currentTemplateExercises.find(ex => ex.exerciseId === exerciseId)) currentTemplateExercises.push({ exerciseId, sets: '', reps: '', rest: '' });}
            else { currentTemplateExercises = currentTemplateExercises.filter(ex => ex.exerciseId !== exerciseId); }
            renderSelectedExercisesForTemplate();
        }
    });
}
if (selectedExercisesForTemplateContainer) {
    selectedExercisesForTemplateContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('remove-exercise-from-template-btn')) {
            const indexToRemove = parseInt(e.target.dataset.index);
            const removedExId = currentTemplateExercises[indexToRemove].exerciseId;
            currentTemplateExercises.splice(indexToRemove, 1);
            const checkbox = templateExerciseListDiv.querySelector(`.template-exercise-checkbox[data-exercise-id="${removedExId}"]`);
            if (checkbox) checkbox.checked = false;
            renderSelectedExercisesForTemplate();
        }
    });
    selectedExercisesForTemplateContainer.addEventListener('input', (e) => {
        if(e.target.matches('.template-exercise-detail')) {
            const index = parseInt(e.target.dataset.index);
            const prop = e.target.dataset.prop;
            if(currentTemplateExercises[index]) currentTemplateExercises[index][prop] = e.target.value;
        }
    });
}
if (openCreateTemplateModalBtn) {
    openCreateTemplateModalBtn.addEventListener('click', () => {
        templateModalTitle.textContent = 'Create Workout Template'; workoutTemplateForm.reset(); workoutTemplateIdInput.value = '';
        currentTemplateExercises = []; renderExercises(); renderSelectedExercisesForTemplate();
        openModal(createEditTemplateModal);
    });
}
if (workoutTemplateForm) {
    workoutTemplateForm.addEventListener('submit', (e) => {
        e.preventDefault(); const id = workoutTemplateIdInput.value;
        const templateData = { name: templateNameInput.value, exercises: [...currentTemplateExercises] };
        if (templateData.exercises.length === 0) { alert("Add exercises to the template."); return; }
        if (id) workoutTemplates = workoutTemplates.map(wt => wt.id === id ? { ...wt, ...templateData } : wt);
        else { templateData.id = db.generateId(); workoutTemplates.push(templateData); }
        db.write('workoutTemplates', workoutTemplates); renderWorkoutTemplates(); closeModal(createEditTemplateModal);
    });
}
if (workoutTemplateListContainer) {
    workoutTemplateListContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('edit-template-btn')) {
            const template = workoutTemplates.find(wt => wt.id === e.target.dataset.id);
            if (template) {
                templateModalTitle.textContent = 'Edit Workout Template'; workoutTemplateIdInput.value = template.id;
                templateNameInput.value = template.name; currentTemplateExercises = JSON.parse(JSON.stringify(template.exercises));
                renderExercises(); 
                templateExerciseListDiv.querySelectorAll('.template-exercise-checkbox').forEach(cb => { cb.checked = currentTemplateExercises.some(ex => ex.exerciseId === cb.dataset.exerciseId);});
                renderSelectedExercisesForTemplate(); openModal(createEditTemplateModal);
            }
        }
        if (e.target.classList.contains('delete-template-btn')) {
            if (confirm("Delete this workout template?")) {
                workoutTemplates = workoutTemplates.filter(wt => wt.id !== e.target.dataset.id);
                db.write('workoutTemplates', workoutTemplates); renderWorkoutTemplates();
            }
        }
    });
}

// --- ASSIGN WORKOUT MANAGEMENT ---
function populateAssignWorkoutSelects() {
    if (!assignClientSelect || !assignTemplateSelect) return;
    assignClientSelect.innerHTML = '<option value="">-- Select Client --</option>';
    clients.forEach(c => assignClientSelect.innerHTML += `<option value="${c.id}">${c.name}</option>`);
    assignTemplateSelect.innerHTML = '<option value="">-- Select Template --</option>';
    workoutTemplates.forEach(t => assignTemplateSelect.innerHTML += `<option value="${t.id}">${t.name}</option>`);
}
function renderAssignedWorkouts() {
    if (!assignedWorkoutsLogContainer) return;
    assignedWorkoutsLogContainer.innerHTML = assignedWorkouts.length === 0 ? '<p class="text-muted">No workouts assigned yet.</p>' : '';
    if (assignedWorkouts.length > 0) {
        const ul = document.createElement('ul'); ul.style.cssText = 'list-style:none; padding-left:0;';
        const sortedAssignments = [...assignedWorkouts].sort((a,b) => new Date(b.dateAssigned) - new Date(a.dateAssigned));
        sortedAssignments.forEach(aw => {
            const client = clients.find(c => c.id === aw.clientId); const template = workoutTemplates.find(wt => wt.id === aw.workoutTemplateId);
            const li = document.createElement('li'); li.className = 'pt-card-content text-small';
            li.style.cssText = 'margin-bottom:var(--spacing-xs); padding:var(--spacing-xs); border:1px solid var(--border-color-light); border-radius:var(--border-radius-sm); display:flex; justify-content:space-between; align-items:center;';
            li.innerHTML = `
                <div>
                    <strong>${template ? template.name : 'Unknown Template'}</strong> to 
                    <strong>${client ? client.name : 'Unknown Client'}</strong> for 
                    <em>${new Date(aw.dateAssigned + 'T00:00:00').toLocaleDateString()}</em> <!-- Ensure date is treated as local -->
                </div>
                <button class="pt-button pt-button--destructive pt-button--small delete-assignment-btn" data-id="${aw.id}" style="padding: 2px 5px; font-size:0.8em;">Del</button>`;
            ul.appendChild(li);
        });
        assignedWorkoutsLogContainer.appendChild(ul);
    }
}
if (assignWorkoutForm) {
    assignWorkoutForm.addEventListener('submit', (e) => {
        e.preventDefault();
        if(!assignClientSelect.value || !assignTemplateSelect.value || !assignDateInput.value) {
            alert("Please select a client, a template, and a date."); return;
        }
        const assignment = { id: db.generateId(), clientId: assignClientSelect.value, workoutTemplateId: assignTemplateSelect.value, dateAssigned: assignDateInput.value, status: 'pending' };
        assignedWorkouts.push(assignment); db.write('assignedWorkouts', assignedWorkouts);
        renderAssignedWorkouts(); assignWorkoutForm.reset();
    });
}
if (assignedWorkoutsLogContainer) {
    assignedWorkoutsLogContainer.addEventListener('click', (e) => {
        if (e.target.classList.contains('delete-assignment-btn')) {
            if (confirm("Remove this assignment?")) {
                assignedWorkouts = assignedWorkouts.filter(aw => aw.id !== e.target.dataset.id);
                db.write('assignedWorkouts', assignedWorkouts); renderAssignedWorkouts();
            }
        }
    });
}

// --- DASHBOARD STATS ---
function updateDashboardStats() {
    if(totalClientsStat) totalClientsStat.textContent = clients.length;
    if(totalWorkoutTemplatesStat) totalWorkoutTemplatesStat.textContent = workoutTemplates.length;
}

// --- INITIALIZE APP ---
function initializeApp() {
    const initialViewId = window.location.hash ? window.location.hash.substring(1).toLowerCase() + 'View' : 'dashboardView';
    const validView = document.getElementById(initialViewId) ? initialViewId : 'dashboardView';
    if (document.getElementById(validView)) switchView(validView); else switchView('dashboardView');
    
    renderClients(); renderExercises(); renderWorkoutTemplates(); renderAssignedWorkouts();
}

document.addEventListener('DOMContentLoaded', initializeApp);
