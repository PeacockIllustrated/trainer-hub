// assets/js/mvp-app.js

import { initializeThemeSwitcher } from './theme-switcher.js';
import { initializeAccordions } from './components/accordion.js';

// --- Local Storage Database Helper (Robust Read) ---
const DB_PREFIX = 'fitflow_mvp_';
const db = {
    read: (key) => {
        const data = localStorage.getItem(DB_PREFIX + key);
        if (!data) {
            // console.log(`db.read: No data found for key "${DB_PREFIX + key}". Returning empty array.`);
            return [];
        }
        try {
            const parsedData = JSON.parse(data);
            if (Array.isArray(parsedData)) {
                // console.log(`db.read: Successfully parsed data for key "${DB_PREFIX + key}".`);
                return parsedData;
            } else {
                console.warn(`db.read: Data for key "${DB_PREFIX + key}" is not an array after parsing. Clearing malformed entry.`);
                localStorage.removeItem(DB_PREFIX + key);
                return [];
            }
        } catch (error) {
            console.error(`db.read: Error parsing localStorage for key "${DB_PREFIX + key}":`, error);
            console.warn(`db.read: Removing corrupted localStorage item for key "${DB_PREFIX + key}".`);
            localStorage.removeItem(DB_PREFIX + key);
            return [];
        }
    },
    write: (key, data) => {
        try {
            localStorage.setItem(DB_PREFIX + key, JSON.stringify(data));
            // console.log(`db.write: Successfully wrote data for key "${DB_PREFIX + key}".`);
        } catch (error) {
            console.error(`db.write: Error writing to localStorage for key "${DB_PREFIX + key}":`, error, "Data was:", data);
        }
    },
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
    console.log("No exercises found in localStorage or data was corrupted/invalid. Loading default exercises.");
    exercises = DEFAULT_EXERCISES.map(ex => ({...ex, id: db.generateId()})); // Ensure fresh IDs
    db.write('exercises', exercises);
    console.log("Default exercises loaded and written to localStorage:", exercises);
} else {
    // console.log("Exercises successfully loaded from localStorage. Count:", exercises.length);
}

let workoutTemplates = db.read('workoutTemplates');
let assignedWorkouts = db.read('assignedWorkouts');
let currentTemplateExercises = [];

// --- UI Elements (Declarations) ---
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
let confirmModalTitleElem, confirmModalMessageElem, confirmModalConfirmBtnElem, confirmModalCancelBtnElem;
let clientPlanModalTitleElem, clientPlanModalContentElem;
// Sidebar specific elements for theme updates
let sidebarLogoElem, sidebarUserElem, sidebarAvatarElem;


const themesForMvp = [ 
    { value: 'theme-modern-professional', name: 'Modern & Professional', sidebarLogo: 'FitFlow MVP', sidebarUser: 'PT Admin' },
    { value: 'theme-friendly-supportive', name: 'Friendly & Supportive', sidebarLogo: 'WellFit MVP', sidebarUser: 'Coach Sam' },
    { value: 'theme-energetic-motivating', name: 'Energetic & Motivating', sidebarLogo: 'IGNITE MVP', sidebarUser: 'Max Power' },
    { value: 'theme-natural-grounded', name: 'Natural & Grounded', sidebarLogo: 'TerraFit MVP', sidebarUser: 'Willow G.' },
    { value: 'theme-urban-grit', name: 'Urban Grit & Steel', sidebarLogo: 'GRIT MVP', sidebarUser: 'R. Boulder' },
    { value: 'theme-playful-pop', name: 'Playful & Vibrant Pop', sidebarLogo: 'POP MVP', sidebarUser: 'Zippy' },
    { value: 'theme-tech-data', name: 'Tech & Data Driven', sidebarLogo: 'D4TA MVP', sidebarUser: 'Dr. Byte' },
    { value: 'theme-feminine-elegance', name: 'Feminine Elegance', sidebarLogo: 'Elegance MVP', sidebarUser: 'Coach Ella' },
    { value: 'theme-luxe-minimalist', name: 'Luxe Minimalist', sidebarLogo: 'ELEVATE MVP', sidebarUser: 'K. Sterling' },
    { value: 'theme-retro-funk', name: 'Retro Funk', sidebarLogo: 'GrooveFit MVP', sidebarUser: 'DJ Flex' }
];

// --- MODAL HANDLING ---
function openModal(modalElement) {
    if (modalElement) modalElement.classList.add('is-active');
    else console.warn("Attempted to open a null modal element.");
}
function closeModal(modalElement) {
    if (modalElement) modalElement.classList.remove('is-active');
    else console.warn("Attempted to close a null modal element.");
}

// --- VIEW SWITCHING ---
function switchView(viewId) {
    if (!viewSections) { console.error("switchView: viewSections not initialized."); return; }
    viewSections.forEach(section => section.classList.toggle('is-active', section.id === viewId));
    if(navLinks) {
        navLinks.forEach(link => link.classList.toggle('is-active', link.dataset.view === viewId));
    }
    window.location.hash = viewId.replace('View', '').toLowerCase();
}

// --- CLIENT MANAGEMENT ---
function renderClients() {
    if (!clientListContainer || !noClientsMessage) {
        console.error("renderClients: clientListContainer or noClientsMessage not initialized."); return;
    }
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
    if (!clientIdInput || !clientNameInput || !clientEmailInput || !clientPhoneInput || 
        !clientDobInput || !clientGoalInput || !clientMedicalNotesInput || 
        !addEditClientModal || !clientForm) {
        console.error("handleClientFormSubmit: One or more required form elements not initialized."); return;
    }
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
    clientIdInput.value = ''; 
}

function openClientModalForEdit(clientIdToEdit) {
    const client = clients.find(c => c.id === clientIdToEdit);
    if (!client) { console.error(`openClientModalForEdit: Client with ID ${clientIdToEdit} not found.`); return; }
    
    if (!clientModalTitle || !clientForm || !clientIdInput || !clientNameInput || 
        !clientEmailInput || !clientPhoneInput || !clientDobInput || 
        !clientGoalInput || !clientMedicalNotesInput || !addEditClientModal) {
        console.error("openClientModalForEdit: Modal form elements not initialized. Cannot proceed."); return;
    }

    clientModalTitle.textContent = 'Edit Client';
    clientIdInput.value = client.id; 
    clientNameInput.value = client.name || '';
    clientEmailInput.value = client.email || ''; 
    clientPhoneInput.value = client.phone || '';
    clientDobInput.value = client.dob || ''; 
    clientGoalInput.value = client.goal || '';
    clientMedicalNotesInput.value = client.medicalNotes || '';
    openModal(addEditClientModal);
}

function handleDeleteClient(clientIdToDelete) {
    const client = clients.find(c => c.id === clientIdToDelete);
    if (!client) { console.error(`handleDeleteClient: Client with ID ${clientIdToDelete} not found.`); return; }
    
    if (!confirmModal || !confirmModalTitleElem || !confirmModalMessageElem || !confirmModalConfirmBtnElem || !confirmModalCancelBtnElem) {
        console.error("handleDeleteClient: Confirm modal elements not initialized."); return;
    }
    
    confirmModalTitleElem.textContent = 'Delete Client';
    confirmModalMessageElem.textContent = `Are you sure you want to delete ${client.name}? This action cannot be undone.`;
    
    const newConfirmBtn = confirmModalConfirmBtnElem.cloneNode(true);
    confirmModalConfirmBtnElem.parentNode.replaceChild(newConfirmBtn, confirmModalConfirmBtnElem);
    confirmModalConfirmBtnElem = newConfirmBtn; 

    confirmModalConfirmBtnElem.onclick = () => {
        clients = clients.filter(c => c.id !== clientIdToDelete);
        db.write('clients', clients);
        assignedWorkouts = assignedWorkouts.filter(aw => aw.clientId !== clientIdToDelete);
        db.write('assignedWorkouts', assignedWorkouts);
        renderClients();
        renderAssignedWorkouts(); 
        closeModal(confirmModal);
    };
    openModal(confirmModal);
}

// --- EXERCISE MANAGEMENT ---
function renderExercises() {
    if (!exerciseListContainer) { exerciseListContainer = document.getElementById('exerciseListContainer'); if (!exerciseListContainer) {console.error("renderExercises: exerciseListContainer not found."); return;}}
    if (!noExercisesMessage) { noExercisesMessage = document.getElementById('noExercisesMessage'); if (!noExercisesMessage) {console.error("renderExercises: noExercisesMessage not found."); return;}}
     if (!templateExerciseSelect) { templateExerciseSelect = document.getElementById('templateExerciseSelect'); if (!templateExerciseSelect) {console.error("renderExercises: templateExerciseSelect not found."); return;}}

    exerciseListContainer.innerHTML = ''; 
    templateExerciseSelect.innerHTML = '<option value="">-- Select Exercise --</option>';
    noExercisesMessage.style.display = exercises.length === 0 ? 'block' : 'none';

    if (exercises.length === 0) {
        // console.warn("renderExercises: No exercises in the 'exercises' array to render.");
    }

    exercises.forEach((ex, index) => {
        const accordionItemId = `ex-accordion-content-${ex.id}`; 
        const isInitiallyExpanded = false; 
        const exItemWrapper = document.createElement('div'); 
        exItemWrapper.className = 'pt-accordion__item';
        exItemWrapper.innerHTML = `
            <button class="pt-accordion__button" aria-expanded="${isInitiallyExpanded}" aria-controls="${accordionItemId}">
                ${ex.name}
            </button>
            <div class="pt-accordion__content" id="${accordionItemId}" ${isInitiallyExpanded ? '' : 'hidden'}>
                ${ex.muscleGroup ? `<p><strong>Group:</strong> ${ex.muscleGroup}</p>` : ''}
                ${ex.description ? `<p><strong>Description:</strong> ${ex.description}</p>` : ''}
                <div class="pt-client-list-item__actions" style="margin-top: var(--spacing-sm); display:flex; gap: var(--spacing-sm);">
                    <button class="pt-button pt-button--secondary pt-button--small edit-exercise-btn" data-id="${ex.id}">Edit</button>
                    <button class="pt-button pt-button--destructive pt-button--small delete-exercise-btn" data-id="${ex.id}">Del</button>
                </div>
            </div>`;
        exerciseListContainer.appendChild(exItemWrapper);
        const option = document.createElement('option'); option.value = ex.id; option.textContent = ex.name; templateExerciseSelect.appendChild(option);
    });
    initializeAccordions(); 
    updateDashboardStats();
}

function handleExerciseFormSubmit(e) { 
    e.preventDefault(); if (!exerciseForm || !exerciseIdInput || !exerciseNameInput || !exerciseDescriptionInput || !exerciseMuscleGroupInput || !cancelEditExerciseBtn) {console.error("handleExerciseFormSubmit: Form elements not initialized.");return;}
    const id = exerciseIdInput.value; const exerciseData = { name: exerciseNameInput.value, description: exerciseDescriptionInput.value, muscleGroup: exerciseMuscleGroupInput.value };
    if (id) { exercises = exercises.map(ex => ex.id === id ? { ...ex, ...exerciseData } : ex); } else { exerciseData.id = db.generateId(); exercises.push(exerciseData); }
    db.write('exercises', exercises); renderExercises(); exerciseForm.reset(); exerciseIdInput.value = ''; cancelEditExerciseBtn.style.display = 'none';
}

function openExerciseFormForEdit(exerciseIdToEdit) { 
    const exercise = exercises.find(ex => ex.id === exerciseIdToEdit); if (!exercise) { console.error(`openExerciseFormForEdit: Exercise ID ${exerciseIdToEdit} not found.`); return; }
    if (!exerciseIdInput || !exerciseNameInput || !exerciseDescriptionInput || !exerciseMuscleGroupInput || !cancelEditExerciseBtn || !exerciseNameInput) { console.error("openExerciseFormForEdit: Form elements not initialized."); return; }
    exerciseIdInput.value = exercise.id; exerciseNameInput.value = exercise.name; exerciseDescriptionInput.value = exercise.description || ''; exerciseMuscleGroupInput.value = exercise.muscleGroup || '';
    cancelEditExerciseBtn.style.display = 'inline-block'; exerciseNameInput.focus();
    if(exerciseForm) exerciseForm.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
}

function handleDeleteExercise(exerciseIdToDelete) { 
    const exercise = exercises.find(ex => ex.id === exerciseIdToDelete); if (!exercise) { console.error(`handleDeleteExercise: Exercise ID ${exerciseIdToDelete} not found.`); return; }
    const isUsedInTemplate = workoutTemplates.some(template => template.exercises.some(exInTpl => exInTpl.exerciseId === exerciseIdToDelete));
    let confirmMessage = `Are you sure you want to delete the exercise "${exercise.name}"?`; if (isUsedInTemplate) { confirmMessage += `\n\nWARNING: This exercise is currently used in one or more workout templates. Deleting it will remove it from those templates.`;}
    if (!confirmModal || !confirmModalTitleElem || !confirmModalMessageElem || !confirmModalConfirmBtnElem || !confirmModalCancelBtnElem) { console.error("handleDeleteExercise: Confirm modal elements not initialized."); return; }
    confirmModalTitleElem.textContent = 'Delete Exercise'; confirmModalMessageElem.innerHTML = confirmMessage.replace(/\n/g, '<br>');
    const newConfirmBtn = confirmModalConfirmBtnElem.cloneNode(true); confirmModalConfirmBtnElem.parentNode.replaceChild(newConfirmBtn, confirmModalConfirmBtnElem); confirmModalConfirmBtnElem = newConfirmBtn;
    confirmModalConfirmBtnElem.onclick = () => {
        exercises = exercises.filter(ex => ex.id !== exerciseIdToDelete); db.write('exercises', exercises);
        workoutTemplates = workoutTemplates.map(template => ({ ...template, exercises: template.exercises.filter(exInTpl => exInTpl.exerciseId !== exerciseIdToDelete) })); db.write('workoutTemplates', workoutTemplates);
        renderExercises(); renderWorkoutTemplates(); closeModal(confirmModal);
    };
    openModal(confirmModal);
}

// --- WORKOUT TEMPLATE MANAGEMENT ---
function renderWorkoutTemplates() {
    if (!workoutTemplateListContainer || !noWorkoutTemplatesMessage || !assignTemplateSelect) {console.error("renderWorkoutTemplates: Core elements not initialized.");return;}
    workoutTemplateListContainer.innerHTML = ''; assignTemplateSelect.innerHTML = '<option value="">-- Select Template --</option>';
    noWorkoutTemplatesMessage.style.display = workoutTemplates.length === 0 ? 'block' : 'none';
    workoutTemplates.forEach(template => {
        const templateItem = document.createElement('div'); templateItem.className = 'pt-client-list-item'; 
        templateItem.innerHTML = `<div class="pt-client-list-item__info"><h5 class="pt-client-list-item__name" style="font-size:1em;">${template.name}</h5><p class="pt-client-list-item__meta text-small">${template.exercises.length} exercise(s)</p></div>
            <div class="pt-client-list-item__actions"><button class="pt-button pt-button--secondary pt-button--small edit-template-btn" data-id="${template.id}">Edit</button><button class="pt-button pt-button--destructive pt-button--small delete-template-btn" data-id="${template.id}">Del</button></div>`;
        workoutTemplateListContainer.appendChild(templateItem);
        const option = document.createElement('option'); option.value = template.id; option.textContent = template.name; assignTemplateSelect.appendChild(option);
    });
    updateDashboardStats();
}

function renderSelectedExercisesForTemplate() {
    if (!selectedExercisesForTemplateContainer) {console.error("renderSelectedExercisesForTemplate: Container not initialized.");return;}
    selectedExercisesForTemplateContainer.innerHTML = ''; if (currentTemplateExercises.length === 0) { selectedExercisesForTemplateContainer.innerHTML = '<p class="text-muted">No exercises added to template yet.</p>'; return; }
    const list = document.createElement('ul'); list.style.listStyle = 'none'; list.style.paddingLeft = '0';
    currentTemplateExercises.forEach((exDetails, index) => {
        const exercise = exercises.find(e => e.id === exDetails.exerciseId); if (!exercise) { console.warn(`renderSelectedExercisesForTemplate: Exercise with ID ${exDetails.exerciseId} not found in main exercises list.`); return; }
        const listItem = document.createElement('li'); listItem.style.padding = 'var(--spacing-sm) 0'; listItem.style.borderBottom = '1px solid var(--border-color-light)';
        listItem.innerHTML = `<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:var(--spacing-xs);"><strong>${exercise.name}</strong><button type="button" class="pt-button pt-button--destructive pt-button--small remove-exercise-from-template-btn" data-index="${index}" style="padding:2px 6px; font-size:0.8em;">Remove</button></div>
            <div style="display:grid; grid-template-columns: repeat(auto-fit, minmax(100px, 1fr)); gap:var(--spacing-sm);">
            <div class="pt-input-group"><label for="sets-${index}" class="text-small">Sets:</label><input type="text" id="sets-${index}" class="pt-input pt-input--small template-exercise-detail" data-index="${index}" data-prop="sets" value="${exDetails.sets || ''}"></div>
            <div class="pt-input-group"><label for="reps-${index}" class="text-small">Reps:</label><input type="text" id="reps-${index}" class="pt-input pt-input--small template-exercise-detail" data-index="${index}" data-prop="reps" value="${exDetails.reps || ''}"></div>
            <div class="pt-input-group"><label for="rest-${index}" class="text-small">Rest (sec):</label><input type="text" id="rest-${index}" class="pt-input pt-input--small template-exercise-detail" data-index="${index}" data-prop="rest" value="${exDetails.rest || ''}"></div></div>`;
        list.appendChild(listItem);
    });
    selectedExercisesForTemplateContainer.appendChild(list);
}

function handleWorkoutTemplateFormSubmit(e) {
    e.preventDefault(); if (!workoutTemplateForm || !workoutTemplateIdInput || !templateNameInput || !createEditTemplateModal) {console.error("handleWorkoutTemplateFormSubmit: Form elements not initialized.");return;}
    const id = workoutTemplateIdInput.value; const templateData = { name: templateNameInput.value, exercises: [...currentTemplateExercises] };
    if (templateData.exercises.length === 0) { alert("A workout template must contain at least one exercise."); return; }
    if (id) { workoutTemplates = workoutTemplates.map(wt => wt.id === id ? { ...wt, ...templateData } : wt); } else { templateData.id = db.generateId(); workoutTemplates.push(templateData); }
    db.write('workoutTemplates', workoutTemplates); renderWorkoutTemplates(); closeModal(createEditTemplateModal); workoutTemplateForm.reset(); workoutTemplateIdInput.value = ''; currentTemplateExercises = []; 
}

function openTemplateModalForEdit(templateIdToEdit) {
    const template = workoutTemplates.find(wt => wt.id === templateIdToEdit); if (!template) { console.error(`openTemplateModalForEdit: Template ID ${templateIdToEdit} not found.`); return; }
    if (!templateModalTitle || !workoutTemplateForm || !workoutTemplateIdInput || !templateNameInput || !createEditTemplateModal || !templateExerciseSelect) {console.error("openTemplateModalForEdit: Modal/form elements not initialized.");return;}
    templateModalTitle.textContent = 'Edit Workout Template'; workoutTemplateIdInput.value = template.id; templateNameInput.value = template.name; currentTemplateExercises = JSON.parse(JSON.stringify(template.exercises)); 
    renderExercises(); renderSelectedExercisesForTemplate(); openModal(createEditTemplateModal);
}

function handleDeleteTemplate(templateIdToEdit) {
    const template = workoutTemplates.find(wt => wt.id === templateIdToEdit); if (!template) { console.error(`handleDeleteTemplate: Template ID ${templateIdToEdit} not found.`); return; }
    if (!confirmModal || !confirmModalTitleElem || !confirmModalMessageElem || !confirmModalConfirmBtnElem || !confirmModalCancelBtnElem) {console.error("handleDeleteTemplate: Confirm modal elements not initialized.");return;}
    confirmModalTitleElem.textContent = 'Delete Workout Template'; confirmModalMessageElem.textContent = `Are you sure you want to delete the template "${template.name}"? This will also remove any assignments of this template to clients.`;
    const newConfirmBtn = confirmModalConfirmBtnElem.cloneNode(true); confirmModalConfirmBtnElem.parentNode.replaceChild(newConfirmBtn, confirmModalConfirmBtnElem); confirmModalConfirmBtnElem = newConfirmBtn;
    confirmModalConfirmBtnElem.onclick = () => {
        workoutTemplates = workoutTemplates.filter(wt => wt.id !== templateIdToEdit); db.write('workoutTemplates', workoutTemplates);
        assignedWorkouts = assignedWorkouts.filter(aw => aw.workoutTemplateId !== templateIdToEdit); db.write('assignedWorkouts', assignedWorkouts);
        renderWorkoutTemplates(); renderAssignedWorkouts(); closeModal(confirmModal);
    };
    openModal(confirmModal);
}

// --- ASSIGN WORKOUT MANAGEMENT ---
function populateAssignWorkoutSelects() {
    if (!assignClientSelect || !assignTemplateSelect) {console.error("populateAssignWorkoutSelects: Select elements not initialized.");return;}
    assignClientSelect.innerHTML = '<option value="">-- Select Client --</option>';
    clients.forEach(client => { const option = document.createElement('option'); option.value = client.id; option.textContent = client.name; assignClientSelect.appendChild(option); });
}

function renderAssignedWorkouts() {
    if (!assignedWorkoutsLogContainer) {console.error("renderAssignedWorkouts: Container not initialized.");return;}
    assignedWorkoutsLogContainer.innerHTML = ''; if (assignedWorkouts.length === 0) { assignedWorkoutsLogContainer.innerHTML = '<p class="text-muted">No workouts assigned yet.</p>'; return; }
    const list = document.createElement('ul'); list.style.listStyle = 'none'; list.style.paddingLeft = '0';
    assignedWorkouts.slice().reverse().forEach(aw => { 
        const client = clients.find(c => c.id === aw.clientId); const template = workoutTemplates.find(wt => wt.id === aw.workoutTemplateId); if (!client || !template) { console.warn("renderAssignedWorkouts: Could not find client or template for assignment ID:", aw.id); return; }
        const listItem = document.createElement('li'); listItem.className = 'pt-client-list-item'; 
        listItem.innerHTML = `<div class="pt-client-list-item__info"><h5 class="pt-client-list-item__name" style="font-size:1em;">${client.name} - ${template.name}</h5><p class="pt-client-list-item__meta text-small">Assigned for: ${new Date(aw.dateAssigned).toLocaleDateString()} (Status: ${aw.status})</p></div>
            <div class="pt-client-list-item__actions"><button class="pt-button pt-button--destructive pt-button--small delete-assignment-btn" data-id="${aw.id}">Remove</button></div>`;
        list.appendChild(listItem);
    });
    assignedWorkoutsLogContainer.appendChild(list);
}

function handleAssignWorkoutFormSubmit(e) {
    e.preventDefault(); if (!assignWorkoutForm || !assignClientSelect || !assignTemplateSelect || !assignDateInput) { console.error("handleAssignWorkoutFormSubmit: Form elements not initialized."); return; }
    if(!assignClientSelect.value || !assignTemplateSelect.value || !assignDateInput.value) { alert("Please select a client, a workout template, and a date to assign."); return; }
    const assignment = { id: db.generateId(), clientId: assignClientSelect.value, workoutTemplateId: assignTemplateSelect.value, dateAssigned: assignDateInput.value, status: 'pending' };
    assignedWorkouts.push(assignment); db.write('assignedWorkouts', assignedWorkouts); renderAssignedWorkouts(); assignWorkoutForm.reset();
}

function handleDeleteAssignment(assignmentIdToDelete) {
    if (!confirm("Are you sure you want to remove this workout assignment?")) return;
    assignedWorkouts = assignedWorkouts.filter(aw => aw.id !== assignmentIdToDelete); db.write('assignedWorkouts', assignedWorkouts); renderAssignedWorkouts();
}

// --- VIEW CLIENT'S PLAN ---
function openViewClientPlanModal(clientId) {
    const client = clients.find(c => c.id === clientId); if (!client) {console.error(`openViewClientPlanModal: Client ID ${clientId} not found.`);return; }
    if (!viewClientPlanModal || !clientPlanModalTitleElem || !clientPlanModalContentElem) { console.error("openViewClientPlanModal: Modal elements not initialized."); return; }
    clientPlanModalTitleElem.textContent = `${client.name}'s Workout Plan`; clientPlanModalContentElem.innerHTML = '<p class="text-muted">Loading plan...</p>'; 
    const clientAssignments = assignedWorkouts.filter(aw => aw.clientId === clientId).sort((a, b) => new Date(a.dateAssigned) - new Date(b.dateAssigned)); 
    if (clientAssignments.length === 0) { clientPlanModalContentElem.innerHTML = '<p class="text-muted">This client has no workouts assigned yet.</p>'; openModal(viewClientPlanModal); return; }
    let planHTML = '';
    clientAssignments.forEach(aw => {
        const template = workoutTemplates.find(wt => wt.id === aw.workoutTemplateId);
        if (template) {
            planHTML += `<div class="pt-card" style="margin-bottom: var(--spacing-md);"><h4 class="pt-card-title">${template.name} - Assigned: ${new Date(aw.dateAssigned).toLocaleDateString()}</h4><ul style="list-style:none; padding-left:0;">`;
            template.exercises.forEach(exDetail => {
                const exerciseInfo = exercises.find(ex => ex.id === exDetail.exerciseId);
                if (exerciseInfo) { planHTML += `<li style="padding: var(--spacing-xs) 0; border-bottom: 1px dashed var(--border-color-light);"><strong>${exerciseInfo.name}</strong>: ${exDetail.sets || 'N/A'} sets, ${exDetail.reps || 'N/A'} reps, ${exDetail.rest || 'N/A'}s rest</li>`;}
            });
            planHTML += `</ul></div>`;
        }
    });
    clientPlanModalContentElem.innerHTML = planHTML || '<p class="text-muted">No workout details found for assignments.</p>'; openModal(viewClientPlanModal);
}

// --- DASHBOARD STATS ---
function updateDashboardStats() {
    if(totalClientsStat) totalClientsStat.textContent = clients.length;
    if(totalWorkoutTemplatesStat) totalWorkoutTemplatesStat.textContent = workoutTemplates.length;
}

// --- INITIALIZE APP ---
function initializeApp() {
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
    confirmModalCancelBtnElem = document.getElementById('confirmModalCancelBtn'); 
    clientPlanModalTitleElem = document.getElementById('clientPlanModalTitle');
    clientPlanModalContentElem = document.getElementById('clientPlanModalContent');
    sidebarLogoElem = document.querySelector('.pt-sidebar__logo');
    sidebarUserElem = document.querySelector('.pt-sidebar__user-name');
    sidebarAvatarElem = document.querySelector('.pt-sidebar__user-avatar');

    if (mvpThemeSwitcherElement && bodyElement) {
        initializeThemeSwitcher(
            themesForMvp, 
            mvpThemeSwitcherElement, 
            bodyElement,
            (newThemeValue, currentThemeObject) => {
                const modalsToTheme = [addEditClientModal, confirmModal, createEditTemplateModal, viewClientPlanModal];
                modalsToTheme.forEach(modal => {
                    if (modal) {
                        themesForMvp.forEach(t => { if (modal.classList.contains(t.value)) { modal.classList.remove(t.value); }});
                        modal.classList.add(newThemeValue);
                    }
                });
                if (currentThemeObject) {
                    if(sidebarLogoElem && currentThemeObject.sidebarLogo) { sidebarLogoElem.textContent = currentThemeObject.sidebarLogo; }
                    if(sidebarUserElem && currentThemeObject.sidebarUser) { sidebarUserElem.textContent = currentThemeObject.sidebarUser; }
                    if(sidebarAvatarElem && currentThemeObject.sidebarUser) { const initials = currentThemeObject.sidebarUser.match(/\b(\w)/g)?.join('').substr(0,2).toUpperCase() || 'PT'; sidebarAvatarElem.textContent = initials; }
                }
            }
        );
    } else if (themesForMvp.length > 0 && bodyElement) { 
        bodyElement.className = ''; bodyElement.classList.add(themesForMvp[0].value);
        bodyElement.style.backgroundColor = 'var(--background-color)'; bodyElement.style.color = 'var(--text-color)';
        const defaultThemeObject = themesForMvp[0];
        if (defaultThemeObject && sidebarLogoElem && defaultThemeObject.sidebarLogo) sidebarLogoElem.textContent = defaultThemeObject.sidebarLogo;
        if (defaultThemeObject && sidebarUserElem && defaultThemeObject.sidebarUser) sidebarUserElem.textContent = defaultThemeObject.sidebarUser;
        if (defaultThemeObject && sidebarAvatarElem && defaultThemeObject.sidebarUser) sidebarAvatarElem.textContent = defaultThemeObject.sidebarUser.match(/\b(\w)/g)?.join('').substr(0,2).toUpperCase() || 'PT';
        const modalsToTheme = [addEditClientModal, confirmModal, createEditTemplateModal, viewClientPlanModal];
        modalsToTheme.forEach(modal => { if (modal) modal.classList.add(defaultThemeObject.value); });
    }

    [addEditClientModal, confirmModal, createEditTemplateModal, viewClientPlanModal].forEach(modal => {
        if (modal) {
            modal.querySelectorAll('.pt-modal__close').forEach(btn => { btn.addEventListener('click', () => closeModal(modal)); });
            modal.addEventListener('click', (e) => { if (e.target === modal) closeModal(modal); }); 
        }
    });
    if(confirmModalCancelBtnElem) { confirmModalCancelBtnElem.addEventListener('click', () => closeModal(confirmModal)); }
    
    if(navLinks) navLinks.forEach(link => { link.addEventListener('click', (e) => { e.preventDefault(); switchView(link.dataset.view); });});
    if (openAddClientModalBtn) { openAddClientModalBtn.addEventListener('click', () => { if(clientModalTitle) clientModalTitle.textContent = 'Add New Client'; if(clientForm) clientForm.reset(); if(clientIdInput) clientIdInput.value = ''; openModal(addEditClientModal); });}
    if (clientForm) clientForm.addEventListener('submit', handleClientFormSubmit);
    if (clientListContainer) { clientListContainer.addEventListener('click', (e) => { if (e.target.classList.contains('edit-client-btn')) openClientModalForEdit(e.target.dataset.id); else if (e.target.classList.contains('delete-client-btn')) handleDeleteClient(e.target.dataset.id); else if (e.target.classList.contains('view-client-plan-btn')) openViewClientPlanModal(e.target.dataset.id); });}
    if (exerciseForm) exerciseForm.addEventListener('submit', handleExerciseFormSubmit);
    if (cancelEditExerciseBtn) { cancelEditExerciseBtn.addEventListener('click', () => { if(exerciseForm) exerciseForm.reset(); if(exerciseIdInput) exerciseIdInput.value = ''; cancelEditExerciseBtn.style.display = 'none'; });}
    if (exerciseListContainer) { exerciseListContainer.addEventListener('click', (e) => { const editButton = e.target.closest('.edit-exercise-btn'); const deleteButton = e.target.closest('.delete-exercise-btn'); if (editButton) { e.stopPropagation(); openExerciseFormForEdit(editButton.dataset.id); } else if (deleteButton) { e.stopPropagation(); handleDeleteExercise(deleteButton.dataset.id); } });}
    if (openCreateTemplateModalBtn) { openCreateTemplateModalBtn.addEventListener('click', () => { if(templateModalTitle) templateModalTitle.textContent = 'Create Workout Template'; if(workoutTemplateForm) workoutTemplateForm.reset(); if(workoutTemplateIdInput) workoutTemplateIdInput.value = ''; currentTemplateExercises = []; renderExercises(); renderSelectedExercisesForTemplate(); openModal(createEditTemplateModal); });}
    if (workoutTemplateForm) workoutTemplateForm.addEventListener('submit', handleWorkoutTemplateFormSubmit);
    if (addExerciseToTemplateBtn) { addExerciseToTemplateBtn.addEventListener('click', () => { if (!templateExerciseSelect) { return; } const exerciseId = templateExerciseSelect.value; if (exerciseId) { if (!currentTemplateExercises.find(ex => ex.exerciseId === exerciseId)) { currentTemplateExercises.push({ exerciseId, sets: '', reps: '', rest: '' }); renderSelectedExercisesForTemplate(); } else { alert("This exercise is already in the template."); }} templateExerciseSelect.value = ""; });}
    if (selectedExercisesForTemplateContainer) { selectedExercisesForTemplateContainer.addEventListener('click', (e) => { if (e.target.classList.contains('remove-exercise-from-template-btn')) { const indexToRemove = parseInt(e.target.dataset.index); if (!isNaN(indexToRemove) && indexToRemove >= 0 && indexToRemove < currentTemplateExercises.length) { currentTemplateExercises.splice(indexToRemove, 1); renderSelectedExercisesForTemplate(); }}}); selectedExercisesForTemplateContainer.addEventListener('input', (e) => { if(e.target.classList.contains('template-exercise-detail')) { const index = parseInt(e.target.dataset.index); const prop = e.target.dataset.prop; if(currentTemplateExercises[index] && prop) { currentTemplateExercises[index][prop] = e.target.value; }}});}
    if (workoutTemplateListContainer) { workoutTemplateListContainer.addEventListener('click', (e) => { if (e.target.classList.contains('edit-template-btn')) openTemplateModalForEdit(e.target.dataset.id); else if (e.target.classList.contains('delete-template-btn')) handleDeleteTemplate(e.target.dataset.id); });}
    if (assignWorkoutForm) assignWorkoutForm.addEventListener('submit', handleAssignWorkoutFormSubmit);
    if (assignedWorkoutsLogContainer) { assignedWorkoutsLogContainer.addEventListener('click', (e) => { if (e.target.classList.contains('delete-assignment-btn')) handleDeleteAssignment(e.target.dataset.id); });}

    renderClients(); 
    renderExercises(); 
    renderWorkoutTemplates(); 
    renderAssignedWorkouts(); 
    const initialViewId = window.location.hash ? window.location.hash.substring(1).toLowerCase() + 'View' : 'dashboardView';
    const validView = document.getElementById(initialViewId) ? initialViewId : 'dashboardView'; 
    switchView(validView);
    // console.log("MVP App Initialized Successfully.");
}

document.addEventListener('DOMContentLoaded', initializeApp);
